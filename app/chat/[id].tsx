// app/chat/[id].tsx
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
import { supabase } from '../../supabaseClient';

// Define color scheme
const COLORS = {
  primary: '#00838F',     // Elegant teal
  secondary: '#4A6670',   // Deep slate blue
  accent: '#B4A5A5',      // Muted mauve
  success: '#2E7D72',     // Deep teal green
  warning: '#8D6E63',     // Warm brown
  background: '#FFFFFF',
  surface: '#F5F7F8',     // Light gray-blue
  messageBackground: {
    sent: '#E8F4F5',      // Light teal for sent messages
    received: '#FFFFFF',   // White for received messages
  },
  text: {
    primary: '#2C3A41',   // Dark slate
    secondary: '#5C6B73', // Medium gray
    light: '#8E9BA1',     // Light gray
    inverse: '#FFFFFF'    // White text
  },
  border: '#E1E8EB',      // Light border color
  divider: '#EDF1F2'      // Subtle divider color
};

const MeetingResponseWidget = ({ meetingId }) => {
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [userResponse, setUserResponse] = useState(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    loadMeetingInfo();
    loadUserResponse();
    subscribeMeetingResponses();
  }, [meetingId]);

  const loadMeetingInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('group_meetings')
        .select(`
          *,
          meeting_responses (
            status,
            user_id,
            profiles:user_id (
              display_name
            )
          )
        `)
        .eq('id', meetingId)
        .single();

      if (error) throw error;
      setMeetingInfo(data);
    } catch (error) {
      console.error('Error loading meeting info:', error);
    }
  };

  const loadUserResponse = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('meeting_responses')
        .select('status')
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserResponse(data?.status || null);
    } catch (error) {
      console.error('Error loading user response:', error);
    }
  };

  const respondToMeeting = async (status) => {
    if (responding) return;

    try {
      setResponding(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('meeting_responses')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id);

      if (updateError) {
        const { error: insertError } = await supabase
          .from('meeting_responses')
          .insert({
            meeting_id: meetingId,
            user_id: user.id,
            status: status,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      setUserResponse(status);
      await loadMeetingInfo();
    } catch (error) {
      console.error('Error responding to meeting:', error);
      Alert.alert('Error', 'Failed to update response');
    } finally {
      setResponding(false);
    }
  };

  const subscribeMeetingResponses = () => {
    const channel = supabase
      .channel(`meeting_responses_${meetingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meeting_responses',
        filter: `meeting_id=eq.${meetingId}`
      }, () => {
        loadMeetingInfo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (!meetingInfo) return null;

  const accepted = meetingInfo.meeting_responses.filter(r => r.status === 'accepted').length;
  const declined = meetingInfo.meeting_responses.filter(r => r.status === 'declined').length;
  const pending = meetingInfo.meeting_responses.filter(r => r.status === 'pending').length;

  return (
    <View style={styles.meetingWidget}>
      <View style={styles.meetingHeader}>
        <Ionicons name="calendar" size={20} color={COLORS.primary} />
        <Text style={styles.meetingTitle}>{meetingInfo.title}</Text>
      </View>
      
      <View style={styles.meetingInfo}>
        <View style={styles.meetingDetail}>
          <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
          <Text style={styles.meetingDetailText}>
            {new Date(meetingInfo.meeting_date).toLocaleString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <View style={styles.meetingDetail}>
          <Ionicons name="location-outline" size={16} color={COLORS.text.secondary} />
          <Text style={styles.meetingDetailText}>{meetingInfo.location}</Text>
        </View>
      </View>

      <View style={styles.responseStats}>
        <Text style={styles.statText}>✓ {accepted} Going</Text>
        <Text style={styles.statText}>✗ {declined} Not Going</Text>
        <Text style={styles.statText}>? {pending} Pending</Text>
      </View>

      <View style={styles.responseButtons}>
        <TouchableOpacity 
          style={[
            styles.responseButton,
            userResponse === 'accepted' && styles.selectedButton
          ]}
          onPress={() => respondToMeeting('accepted')}
          disabled={responding}
        >
          <Text style={[
            styles.responseButtonText,
            userResponse === 'accepted' && styles.selectedButtonText
          ]}>Going</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.responseButton,
            userResponse === 'declined' && styles.selectedButton
          ]}
          onPress={() => respondToMeeting('declined')}
          disabled={responding}
        >
          <Text style={[
            styles.responseButtonText,
            userResponse === 'declined' && styles.selectedButtonText
          ]}>Can't Go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const router = useRouter();
  const { id: otherUserId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initializeChat();

    const channel = supabase
      .channel('chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new;
          if (
            (newMessage.sender_id === currentUser?.id && newMessage.receiver_id === otherUserId) ||
            (newMessage.sender_id === otherUserId && newMessage.receiver_id === currentUser?.id)
          ) {
            setMessages(prevMessages => [newMessage, ...prevMessages]);
            
            if (newMessage.sender_id === otherUserId) {
              markMessageAsRead(newMessage.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, otherUserId]);

  const initializeChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      setCurrentUser(user);

      const { data: otherUserData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', otherUserId)
        .single();

      if (profileError) throw profileError;
      setOtherUser(otherUserData);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),` +
          `and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('read', false);

    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const newMessage = {
        sender_id: currentUser.id,
        receiver_id: otherUserId,
        content: messageText.trim(),
        created_at: new Date().toISOString(),
        read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert(newMessage);

      if (error) throw error;
      setMessageText('');

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderMessage = ({ item }) => {
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
          <Text style={[
            styles.messageText,
            isCurrentUser ? { color: COLORS.text.primary } : { color: COLORS.text.primary }
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTimestamp,
            isCurrentUser ? styles.currentUserTimestamp : {}
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

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
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.inverse} />
        </TouchableOpacity>
        <Image
          source={{ uri: otherUser?.avatar_url || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <Text style={styles.headerTitle}>{otherUser?.display_name || 'User'}</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.messagesContainer}
        inverted={true}
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
          style={[
            styles.sendButton,
            !messageText.trim() && styles.sendButtonDisabled
          ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    borderBottomColor: `${COLORS.text.primary}10`,
    borderBottomWidth: 1,
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
    borderWidth: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.messageBackground.sent,
    borderBottomRightRadius: 4,
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.messageBackground.received,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  messageTimestamp: {
    fontSize: 11,
    color: COLORS.text.light,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  currentUserTimestamp: {
    color: COLORS.text.light,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.text.light,
    opacity: 0.6,
  },
  
  // Meeting Widget Styles
  meetingWidget: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
    width: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  meetingInfo: {
    marginBottom: 12,
    backgroundColor: `${COLORS.primary}08`,
    padding: 12,
    borderRadius: 12,
  },
  meetingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingDetailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 10,
  },
  responseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    backgroundColor: COLORS.background,
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  responseButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  responseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  selectedButtonText: {
    color: COLORS.text.inverse,
  },
  statText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  }
});