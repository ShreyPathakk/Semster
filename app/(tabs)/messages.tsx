import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import { decryptMessage } from '../../utilities/encryption';

// Define your color scheme
const COLORS = {
  primary: '#00838F',
  secondary: '#4A6670',
  accent: '#B4A5A5',
  success: '#2E7D72',
  warning: '#8D6E63',
  background: '#FFFFFF',
  surface: '#F5F7F8',
  text: {
    primary: '#2C3A41',
    secondary: '#5C6B73',
    light: '#8E9BA1'
  },
  border: '#E1E8EB'
};

export default function MessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [userData, setUserData] = useState(null);
  const [userKeys, setUserKeys] = useState(null);
  const [publicKeyCache, setPublicKeyCache] = useState({});
  // New state to store decrypted message content
  const [decryptedMessages, setDecryptedMessages] = useState({});

  // Fetch the public key for a user and store it in the cache
  const fetchPublicKey = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_keys')
        .select('public_key')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      if (data) {
        setPublicKeyCache(prev => ({ ...prev, [userId]: data.public_key }));
        return data.public_key;
      }
    } catch (error) {
      console.error('Error fetching public key:', error);
    }
    return null;
  };

  // Decrypt a message and store it in the decryptedMessages state
  const decryptMessageContent = useCallback(async (messageId, content, senderId) => {
    try {
      if (!userKeys) return;

      let senderPublicKey = publicKeyCache[senderId];
      if (!senderPublicKey) {
        senderPublicKey = await fetchPublicKey(senderId);
        if (!senderPublicKey) return;
      }

      const decrypted = decryptMessage(
        content,
        userKeys.secretKey,
        senderPublicKey
      );

      setDecryptedMessages(prev => ({
        ...prev,
        [messageId]: decrypted
      }));
    } catch (err) {
      console.error('Decryption error:', err);
      setDecryptedMessages(prev => ({
        ...prev,
        [messageId]: '[Unable to decrypt]'
      }));
    }
  }, [userKeys, publicKeyCache]);

  // Loads messages (direct and group) and builds the conversation preview list.
  const loadMessages = async (userId) => {
    try {
      // 1) Load direct messages with null check for profiles
      const { data: directMessages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          read,
          sender:profiles!sender_id(id, display_name, avatar_url),
          receiver:profiles!receiver_id(id, display_name, avatar_url)
        `)
        .or(`receiver_id.eq.${userId},sender_id.eq.${userId}`)
        .order('created_at', { ascending: false });
  
      if (messagesError) throw messagesError;
  
      // Filter out messages with missing profiles
      const validDirectMessages = directMessages.filter(message => 
        message.sender && message.receiver
      );
  
      // Process direct messages and build a map of conversations
      const directChats = new Map();
      for (const message of validDirectMessages) {
        const isCurrentUserSender = message.sender_id === userId;
        const otherUser = isCurrentUserSender ? message.receiver : message.sender;
        
        // Add null check for otherUser
        if (!otherUser || !otherUser.id) {
          console.warn('Missing user data for message:', message.id);
          continue;
        }

        const isRead = message.read || isCurrentUserSender;
        const currentLast = directChats.get(otherUser.id);
        
        if (
          !currentLast ||
          new Date(message.created_at) > new Date(currentLast.lastMessage.created_at)
        ) {
          directChats.set(otherUser.id, {
            id: otherUser.id,
            type: 'direct',
            name: otherUser.display_name || 'Unknown User',
            avatar_url: otherUser.avatar_url,
            lastMessage: {
              id: message.id,
              content: message.content || '',
              created_at: message.created_at,
              read: isRead,
              sender_id: message.sender_id,
            },
            unreadCount: isRead ? 0 : 1,
          });

          // Decrypt message if it's from someone else
          if (!isCurrentUserSender && userKeys) {
            decryptMessageContent(message.id, message.content, message.sender_id);
          }
        } else if (!isRead && !isCurrentUserSender) {
          const chat = directChats.get(otherUser.id);
          chat.unreadCount += 1;
          directChats.set(otherUser.id, chat);
        }
      };
  
      // 2) Load groups with null checks
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          study_groups!inner(
            id,
            name,
            class_id,
            semester_schedules (
              class_name
            )
          )
        `)
        .eq('user_id', userId);
  
      if (groupsError) throw groupsError;
  
      // Process groups with null checks
      const groupMessages = [];
      for (const group of userGroups) {
        if (!group.study_groups) {
          console.warn('Missing group data for group_id:', group.group_id);
          continue;
        }

        const { data: latestMessage, error: messageError } = await supabase
          .from('group_messages')
          .select(`
            id,
            content,
            created_at,
            group_id,
            sender_id,
            profiles!sender_id(id, display_name, avatar_url)
          `)
          .eq('group_id', group.group_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
  
        if (messageError && messageError.code !== 'PGRST116') { // Ignore "no rows returned" error
          console.warn('Error fetching group message:', messageError);
          continue;
        }

        groupMessages.push({
          id: group.group_id,
          type: 'group',
          name: group.study_groups.name || 'Unnamed Group',
          classInfo: group.study_groups.semester_schedules?.[0]?.class_name || '',
          lastMessage: latestMessage ? {
            id: latestMessage.id,
            content: latestMessage.content || '',
            created_at: latestMessage.created_at,
            sender_name: latestMessage.profiles?.display_name || 'Unknown User'
          } : {
            id: 'no-messages',
            content: 'No messages yet',
            created_at: new Date().toISOString(),
            sender_name: ''
          }
        });
      }
  
      // Combine and sort conversations
      const allConversations = [
        ...Array.from(directChats.values()),
        ...groupMessages
      ].sort((a, b) =>
        new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
      );
      
      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };
  
  // Loads current user's data and encryption keys, then loads messages.
  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserData(user);
  
      // Get current user's encryption keys from "user_keys" table
      const { data: userKeysRows, error: userKeysError } = await supabase
        .from('user_keys')
        .select('public_key, secret_key')
        .eq('user_id', user.id);
      if (userKeysError) throw userKeysError;
      if (!userKeysRows || userKeysRows.length === 0) {
        throw new Error("User keys not found");
      }
      setUserKeys({
        publicKey: userKeysRows[0].public_key,
        secretKey: userKeysRows[0].secret_key,
      });
  
      await loadMessages(user.id);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadUserData();
  
    // Subscribe to realtime changes so that new messages update the preview.
    const channel = supabase
      .channel('messages_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => loadUserData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_messages',
      }, () => loadUserData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_members',
      }, () => loadUserData())
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // When a conversation is pressed, navigate to its chat screen.
  const handleChatPress = async (conversation) => {
    if (conversation.type === 'direct') {
      try {
        // Mark direct messages as read
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('sender_id', conversation.id)
          .eq('receiver_id', userData.id)
          .eq('read', false);
  
        router.push(`/chat/${conversation.id}`);
      } catch (error) {
        console.error('Error marking as read:', error);
        router.push(`/chat/${conversation.id}`);
      }
    } else {
      router.push(`/chat/group/${conversation.id}`);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  // Render a single conversation card with decrypted preview.
  const renderConversation = ({ item }) => {
    // Get the message display content
    let messageContent = '';
    
    if (item.type === 'direct') {
      if (item.lastMessage.sender_id === userData?.id) {
        // For messages sent by the current user
        messageContent = `You: ${item.lastMessage.content}`;
      } else {
        // For messages received from others, use the decrypted content from state
        const decryptedContent = decryptedMessages[item.lastMessage.id];
        messageContent = decryptedContent || 'Decrypting...';
      }
    } else {
      // For group messages
      messageContent = item.lastMessage.content;
    }
  
    return (
      <TouchableOpacity 
        style={styles.conversationCard}
        onPress={() => handleChatPress(item)}
      >
        {item.type === 'group' ? (
          <View style={styles.groupAvatarContainer}>
            <Ionicons name="people" size={24} color={COLORS.background} />
          </View>
        ) : (
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }} 
              style={styles.avatar}
            />
            {item.unreadCount > 0 && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
        )}
  
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.contactName}>{item.name}</Text>
              {item.type === 'group' && (
                <View style={styles.groupBadge}>
                  <Text style={styles.groupBadgeText}>Group</Text>
                </View>
              )}
            </View>
            <Text style={styles.timeStamp}>
              {new Date(item.lastMessage.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
  
          <View style={styles.messagePreview}>
            <Text 
              style={[
                styles.lastMessage,
                item.type === 'direct' && !item.lastMessage.read && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.type === 'group' && item.lastMessage.sender_name && (
                <Text style={styles.groupSender}>{item.lastMessage.sender_name}: </Text>
              )}
              {messageContent}
            </Text>
            {item.type === 'direct' && item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
  
          {item.type === 'group' && item.classInfo && (
            <Text style={styles.classInfo}>
              <Ionicons name="book-outline" size={12} color={COLORS.text.light} />
              {' '}{item.classInfo}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTextMain}>Messages</Text>
        </View>
        <TouchableOpacity 
          style={styles.composeButton}
          onPress={() => router.push('/chat/new-message')}
        >
          <Ionicons name="create-outline" size={24} color={COLORS.background} />
        </TouchableOpacity>
      </View>
  
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Connect with classmates and start collaborating
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push('/study/find-peers')}
          >
            <Text style={styles.startButtonText}>Find Study Buddies</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
  
// --- Styles ---
const styles = StyleSheet.create({
  // All styles remain the same
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextMain: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  composeButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  listContainer: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.background,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  onlineIndicator: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  groupAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  groupBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  groupBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  timeStamp: {
    fontSize: 12,
    color: COLORS.text.light,
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    marginRight: 8,
  },
  unreadMessage: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  groupSender: {
    fontWeight: '600',
    color: COLORS.secondary,
  },
  classInfo: {
    fontSize: 12,
    color: COLORS.text.light,
    marginTop: 6,
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  startButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});