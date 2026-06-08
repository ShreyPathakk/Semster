import '../../utilities/encryption';
import 'react-native-get-random-values';
import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Your Supabase client
import { supabase } from '../../supabaseClient';

// Encryption helpers
import { generateKeyPair, encryptMessage, decryptMessage } from '../../utilities/encryption';

const COLORS = {
  primary: '#7C5DFA',
  primaryLight: '#9277FF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  messageBackground: {
    sent: '#EEF2FF',
    received: '#FFFFFF',
  },
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    inverse: '#FFFFFF'
  },
  border: '#E2E8F0',
  divider: '#F1F5F9',
  shadow: '#7C5DFA20'
};

// Meeting widget (unchanged, or remove if not needed)
const MeetingResponseWidget = ({ meetingId }) => {
  // ...
  return null; // or your existing code
};

export default function ChatScreen() {
  const router = useRouter();
  const { id: otherUserId } = useLocalSearchParams(); // The other user's ID from route

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Encryption keys
  const [userKeys, setUserKeys] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [otherUserPublicKey, setOtherUserPublicKey] = useState<string | null>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  // Subscribe to new messages once we have both sets of keys
  useEffect(() => {
    if (!currentUser || !userKeys || !otherUserPublicKey) return;

    const channel = supabase
      .channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMessage = payload.new;

        // Only handle if it matches our current conversation
        if (
          (newMessage.sender_id === currentUser.id && newMessage.receiver_id === otherUserId) ||
          (newMessage.sender_id === otherUserId && newMessage.receiver_id === currentUser.id)
        ) {
          // Guard: if no otherUserPublicKey, skip
          if (!otherUserPublicKey) {
            console.warn("Can't decrypt message. Other user has no public key.");
            return;
          }
          // Decrypt the ciphertext
          try {
            newMessage.content = decryptMessage(
              newMessage.content,
              userKeys.secretKey,
              otherUserPublicKey
            );
          } catch (err) {
            console.error('Failed to decrypt new message:', err);
          }
          setMessages(prev => [newMessage, ...prev]);

          // Mark as read if I'm the receiver
          if (newMessage.sender_id === otherUserId) {
            markMessageAsRead(newMessage.id);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, otherUserId, userKeys, otherUserPublicKey]);

  async function initializeChat() {
    try {
      // 1) Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      setCurrentUser(user);
  
      // 2) Get or generate user's own keys
      const { data: userKeysRows, error: userKeysError } = await supabase
        .from('user_keys')
        .select('public_key, secret_key')
        .eq('user_id', user.id);
  
      if (userKeysError) throw userKeysError;
  
      let currentUserKeys;
      if (!userKeysRows || userKeysRows.length === 0) {
        // No keys => generate
        const newKeys = generateKeyPair();
        const { error: insertError } = await supabase
          .from('user_keys')
          .insert({
            user_id: user.id,
            public_key: newKeys.publicKey,
            secret_key: newKeys.secretKey
          });
        if (insertError) throw insertError;
        currentUserKeys = newKeys;
        setUserKeys(newKeys);
      } else {
        // Use existing row
        currentUserKeys = {
          publicKey: userKeysRows[0].public_key,
          secretKey: userKeysRows[0].secret_key
        };
        setUserKeys(currentUserKeys);
      }
  
      // 3) Get other user's public key
      const { data: otherKeysRows, error: otherKeyError } = await supabase
        .from('user_keys')
        .select('public_key')
        .eq('user_id', otherUserId);
  
      if (otherKeyError) throw otherKeyError;
  
      // If other user has no row => short-circuit
      if (!otherKeysRows || otherKeysRows.length === 0) {
        Alert.alert('Encryption Error', 'Other user has no key. They must set up encryption first.');
        return;
      }
  
      const otherUserKey = otherKeysRows[0].public_key;
      setOtherUserPublicKey(otherUserKey);
  
      // 4) Load other user's profile
      const { data: otherUserData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', otherUserId);
  
      if (profileError) throw profileError;
  
      if (otherUserData && otherUserData.length > 0) {
        setOtherUser(otherUserData[0]);
      }
  
      // 5) Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false });
  
      if (messagesError) throw messagesError;
  
      // 6) Decrypt each message
      const decrypted = messagesData.map(msg => {
        try {
          const decryptedContent = decryptMessage(
            msg.content,
            currentUserKeys.secretKey,
            msg.sender_id === user.id ? otherUserKey : otherUserKey
          );
          return {
            ...msg,
            content: decryptedContent
          };
        } catch (err) {
          console.error('Decrypt error:', err);
          return {
            ...msg,
            content: '[Unable to decrypt message]'
          };
        }
      });
      
      setMessages(decrypted);
  
      // 7) Mark unread messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('read', false);
  
    } catch (err) {
      console.error('Error initializing chat:', err);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }

  async function markMessageAsRead(messageId) {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }

  async function sendMessage() {
    if (!messageText.trim()) return;
    if (!userKeys?.secretKey || !otherUserPublicKey) {
      Alert.alert('Encryption Error', 'Keys not loaded yet. Try again.');
      return;
    }

    try {
      const encryptedContent = encryptMessage(
        messageText.trim(),
        userKeys.secretKey,
        otherUserPublicKey
      );

      const newMsg = {
        sender_id: currentUser.id,
        receiver_id: otherUserId,
        content: encryptedContent,
        created_at: new Date().toISOString(),
        read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert(newMsg);
      if (error) throw error;

      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message');
    }
  }

  function renderMessage({ item }) {
    // If you have a MeetingResponseWidget
    if (item.meeting_id) {
      return <MeetingResponseWidget meetingId={item.meeting_id} />;
    }

    const isCurrentUser = item.sender_id === currentUser?.id;
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
      ]}>
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
        ]}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.messageTimestamp}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.inverse} />
        </TouchableOpacity>
        <Image
          source={{ uri: otherUser?.avatar_url || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <Text style={styles.headerTitle}>
          {otherUser?.display_name || 'User'}
        </Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => String(item.id || Math.random())}
        contentContainerStyle={styles.messagesContainer}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.text.light}
          multiline
          maxHeight={100}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={messageText.trim() ? COLORS.text.inverse : COLORS.text.light}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0001',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.text.inverse,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.inverse,
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 2,
  },
  currentUserMessage: {
    backgroundColor: COLORS.messageBackground.sent,
    borderBottomRightRadius: 4,
  },
  otherUserMessage: {
    backgroundColor: COLORS.messageBackground.received,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  messageTimestamp: {
    fontSize: 11,
    color: COLORS.text.light,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingRight: 48,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 48,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.text.light,
    opacity: 0.6,
  },
});
