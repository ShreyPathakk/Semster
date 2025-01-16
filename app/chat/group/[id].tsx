import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Linking
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

// Define styles first
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 15,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberCount: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
    flexDirection: 'row',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  messageContent: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 4,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  meetingMessageCard: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  meetingMessageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  meetingMessageDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  responseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 14,
    color: '#444',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  addMeetingButton: {
    padding: 4,
  },
  meetingsList: {
    padding: 16,
  },
  meetingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  meetingHeader: {
    marginBottom: 8,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  meetingCreator: {
    fontSize: 14,
    color: '#666',
  },
  meetingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  responseButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedResponseButton: {
    backgroundColor: '#007AFF',
  },
  responseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  scheduleButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
function GroupChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [showMeetings, setShowMeetings] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadGroupInfo();
    loadMessages();
    loadMeetings();
    subscribeToMessages();
    subscribeToMembers();
    subscribeMeetings();
  }, [id]);

  const loadGroupInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          semester_schedules!inner (
            class_name,
            professor_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setGroupInfo(data);

      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles!inner (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', id);

      if (memberError) throw memberError;
      setMembers(memberData);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load group info');
    }
  };

  const loadMeetings = async () => {
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('group_meetings')
        .select(`
          *,
          meeting_responses (
            status,
            user_id,
            profiles!meeting_responses_user_id_fkey (
              display_name
            )
          ),
          profiles!group_meetings_created_by_fkey (
            id,
            display_name
          )
        `)
        .eq('group_id', id)
        .gt('meeting_date', today.toISOString())
        .order('meeting_date', { ascending: true });
  
      if (error) throw error;
      
      if (data) {
        setMeetings(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          *,
          profiles!inner (
            id,
            display_name,
            avatar_url
          ),
          meeting:meeting_id (
            id,
            title,
            meeting_date,
            meeting_responses (
              status,
              user_id,
              profiles: user_id (
                display_name
              )
            )
          )
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('group_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${id}`
      }, (payload) => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const subscribeMeetings = () => {
    const subscription = supabase
      .channel('group_meetings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_meetings',
        filter: `group_id=eq.${id}`
      }, () => {
        loadMeetings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const subscribeToMembers = () => {
    const subscription = supabase
      .channel('group_members')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${id}`
      }, () => {
        loadGroupInfo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };
  const pickDocument = async () => {
    try {
      console.log('Starting document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false // Changed to false to avoid potential memory issues
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('Document picker cancelled');
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return;
      }

      await uploadFile(file);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadFile = async (file) => {
    if (!file || !file.uri) {
      console.error('Invalid file object:', file);
      return;
    }

    try {
      setIsUploading(true);
      console.log('Starting upload process...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const uniqueId = Date.now().toString();
      const filePath = `${user.id}/${uniqueId}.${fileExt}`;

      console.log('Preparing to upload to path:', filePath);

      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array
      const decoded = decode(fileBase64);

      console.log('File converted successfully, uploading...');

      const { error: uploadError } = await supabase.storage
        .from('group_chat_files')
        .upload(filePath, decoded, {
          contentType: file.mimeType || 'application/octet-stream',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully');

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('group_chat_files')
        .getPublicUrl(filePath);

      console.log('Got public URL:', publicUrl);

      // Send message with file attachment
      const { error: messageError } = await supabase
        .from('group_messages')
        .insert({
          group_id: id,
          sender_id: user.id,
          content: `Shared a file: ${file.name}`,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.mimeType || 'application/octet-stream',
          file_size: file.size
        });

      if (messageError) {
        console.error('Message error:', messageError);
        throw messageError;
      }

      console.log('Message sent successfully');

    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload file: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFilePress = async (fileUrl, fileName) => {
    try {
      if (await Linking.canOpenURL(fileUrl)) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Error', 'Cannot open this file type');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: id,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const respondToMeeting = async (meetingId, status) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { error } = await supabase
        .from('meeting_responses')
        .upsert({
          meeting_id: meetingId,
          user_id: user.id,
          status,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      const { error: messageError } = await supabase
        .from('group_messages')
        .insert({
          group_id: id,
          sender_id: user.id,
          content: `${profile.display_name} is ${status === 'accepted' ? 'going to' : 'not going to'} the meeting`,
          is_system_message: true,
          meeting_id: meetingId
        });

      if (messageError) throw messageError;

      loadMeetings();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to update response');
    }
  };

  const renderFileMessage = (item) => (
    <TouchableOpacity 
      style={styles.fileContainer}
      onPress={() => handleFilePress(item.file_url, item.file_name)}
    >
      <View style={styles.fileIconContainer}>
        <Ionicons name="document" size={24} color="#007AFF" />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.file_name}</Text>
        <Text style={styles.fileSize}>
          {(item.file_size / 1024).toFixed(1)} KB
        </Text>
      </View>
      <Ionicons name="download-outline" size={20} color="#666" />
    </TouchableOpacity>
  );
  const renderMeetingMessage = (meeting) => {
    if (!meeting) return null;
    
    const accepted = meeting.meeting_responses.filter(r => r.status === 'accepted').length;
    const declined = meeting.meeting_responses.filter(r => r.status === 'declined').length;
    const pending = meeting.meeting_responses.filter(r => r.status === 'pending').length;

    return (
      <View style={styles.meetingMessageCard}>
        <Text style={styles.meetingMessageTitle}>{meeting.title}</Text>
        <Text style={styles.meetingMessageDate}>
          {new Date(meeting.meeting_date).toLocaleString()}
        </Text>
        <View style={styles.responseStats}>
          <Text style={styles.statText}>✓ {accepted} Going</Text>
          <Text style={styles.statText}>✗ {declined} Not Going</Text>
          <Text style={styles.statText}>? {pending} Pending</Text>
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    // If it's a meeting-related message
    if (item.meeting_id) {
      if (item.is_system_message) {
        return (
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{item.content}</Text>
          </View>
        );
      }
      return renderMeetingMessage(item.meeting);
    }

    // If it's a regular system message
    if (item.is_system_message) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    // If it's a file message
    if (item.file_url) {
      return (
        <View style={styles.messageContainer}>
          <Image 
            source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/36' }}
            style={styles.avatar}
          />
          <View style={styles.messageContent}>
            <Text style={styles.messageSender}>{item.profiles.display_name}</Text>
            {renderFileMessage(item)}
            <Text style={styles.messageTime}>
              {new Date(item.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
      );
    }

    // Regular message
    return (
      <View style={styles.messageContainer}>
        <Image 
          source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/36' }}
          style={styles.avatar}
        />
        <View style={styles.messageContent}>
          <Text style={styles.messageSender}>{item.profiles.display_name}</Text>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderMeeting = ({ item }) => (
    <View style={styles.meetingCard}>
      <View style={styles.meetingHeader}>
        <Text style={styles.meetingTitle}>{item.title}</Text>
        <Text style={styles.meetingCreator}>by {item.profiles.display_name}</Text>
      </View>
      <View style={styles.meetingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.meeting_date).toLocaleString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
      <View style={styles.responseButtons}>
        <TouchableOpacity 
          style={[
            styles.responseButton,
            item.meeting_responses?.some(r => r.status === 'accepted') && styles.selectedResponseButton
          ]}
          onPress={() => respondToMeeting(item.id, 'accepted')}
        >
          <Text style={styles.responseButtonText}>Going</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.responseButton,
            item.meeting_responses?.some(r => r.status === 'declined') && styles.selectedResponseButton
          ]}
          onPress={() => respondToMeeting(item.id, 'declined')}
        >
          <Text style={styles.responseButtonText}>Can't Go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: groupInfo?.name || 'Group Chat',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 10, padding: 5 }}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                onPress={() => setShowMeetings(true)}
                style={styles.headerButton}
              >
                <Ionicons name="calendar" size={24} color="#007AFF" />
                {meetings.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{meetings.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push(`/chat/group/info/${id}`)}
                style={styles.headerButton}
              >
                <Ionicons name="people" size={24} color="#007AFF" />
                <Text style={styles.memberCount}>{members.length}</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isUploading && (
        <View style={styles.uploadProgress}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadText}>Uploading file...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 90}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachButton} 
            onPress={pickDocument}
            disabled={isUploading}
          >
            <Ionicons name="attach" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showMeetings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMeetings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upcoming Meetings</Text>
              <TouchableOpacity 
                style={styles.addMeetingButton}
                onPress={() => {
                  setShowMeetings(false);
                  router.push(`/chat/group/schedule?groupId=${id}`);
                }}
              >
                <Ionicons name="add" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowMeetings(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {meetings.length > 0 ? (
              <FlatList
                data={meetings}
                renderItem={renderMeeting}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.meetingsList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No upcoming meetings</Text>
                <TouchableOpacity 
                  style={styles.scheduleButton}
                  onPress={() => {
                    setShowMeetings(false);
                    router.push(`/chat/group/schedule?groupId=${id}`);
                  }}
                >
                  <Text style={styles.scheduleButtonText}>Schedule Meeting</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default GroupChatScreen;