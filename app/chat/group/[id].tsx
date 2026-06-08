// app/(tabs)/GroupChatScreen.tsx
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

// Import group encryption functions from your utility file
import {
  decryptGroupKey,
  encryptGroupKey,
  generateGroupKey,
  generateKeyPair,
  encryptGroupMessage,
  decryptGroupMessage,
} from '../../../utilities/group-encryption';

/* ================= Helper Functions ================= 


// A placeholder for your encryption logic for messages.
// Replace this with your actual implementation.
const encryptWithKey = (text: string, key: string): { encrypted: string; nonce: string } => {
  try {
    // Use the existing encryptGroupMessage utility
    return encryptGroupMessage(text, key);
  } catch (error) {
    console.error('Error in encryptWithKey:', error);
    throw new Error('Failed to encrypt message');
  }
};

/* ================= End Helpers ================= */

// ********************
// Styles
// ********************


// ********************
// GroupChatScreen Component
// ********************
function GroupChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showMeetings, setShowMeetings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<any>(null);

  // Encryption states for the group
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [encryptionInitialized, setEncryptionInitialized] = useState(false);

  useEffect(() => {
    loadGroupInfo();
    initializeEncryption();
    loadMeetings();
    subscribeToMessages();
    subscribeToMembers();
    subscribeMeetings();
  }, [id]);

  // Once encryption is initialized, load (and decrypt) messages.
  useEffect(() => {
    if (encryptionInitialized) {
      loadMessages();
    }
  }, [encryptionInitialized]);

  // ********************
  // Encryption Initialization
  // ********************
  const ensureUserKeys = async (userId: string) => {
    // This helper should either fetch or generate the current user's keypair.
    // (For simplicity, here we assume the keys already exist in a "user_keys" table.)
    const { data: rows, error } = await supabase
      .from('user_keys')
      .select('public_key, secret_key')
      .eq('user_id', userId);
    if (error || !rows || rows.length === 0) {
      throw new Error('User keys not found');
    }
    return {
      public_key: rows[0].public_key,
      secret_key: rows[0].secret_key,
    };
  };
  const verifyGroupKey = (key: string): boolean => {
    try {
      // Check if key exists
      if (!key) return false;
  
      // Check if key is a string
      if (typeof key !== 'string') return false;
  
      // Check minimum length requirement (adjust based on your security requirements)
      if (key.length < 32) return false;
  
      // Check if key contains valid base64 characters
      const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
      if (!base64Regex.test(key)) return false;
  
      // Check if key can be decoded from base64
      try {
        const decoded = atob(key);
        // Check if decoded length matches expected length
        if (decoded.length !== 32) return false;
      } catch (e) {
        return false;
      }
  
      return true;
    } catch (error) {
      console.error('Error in verifyGroupKey:', error);
      return false;
    }
  };

  const encryptWithKey = (text: string, key: string): { encrypted: string; nonce: string } => {
    try {
      // Validate inputs
      if (!text || !key) {
        throw new Error('Missing required parameters');
      }
  
      // Verify the group key
      if (!verifyGroupKey(key)) {
        throw new Error('Invalid group key');
      }
  
      // Use the existing encryptGroupMessage utility
      return encryptGroupMessage(text, key);
    } catch (error) {
      console.error('Error in encryptWithKey:', error);
      throw new Error('Failed to encrypt message');
    }
  };
  const initializeEncryption = async () => {
    try {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
  
      // 2. Get user's encryption keys
      let userKeys: any;
      const { data: existingKeys, error: keyError } = await supabase
        .from('user_keys')
        .select('public_key, secret_key')
        .eq('user_id', user.id)
        .single();
  
      if (keyError || !existingKeys) {
        // Generate new keys if none exist
        const newKeyPair = generateKeyPair();
        const { error: insertError } = await supabase
          .from('user_keys')
          .insert({
            user_id: user.id,
            public_key: newKeyPair.publicKey,
            secret_key: newKeyPair.secretKey
          });
        if (insertError) throw new Error('Failed to create user keys');
        userKeys = newKeyPair;
      } else {
        userKeys = existingKeys;
      }
  
      // 3. Get all group members
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', id);
  
      if (membersError) throw new Error('Failed to fetch group members');
  
      // 4. Get all members' public keys
      const memberIds = groupMembers.map(member => member.user_id);
      const { data: memberKeys, error: memberKeysError } = await supabase
        .from('user_keys')
        .select('user_id, public_key')
        .in('user_id', memberIds);
  
      if (memberKeysError) throw new Error('Failed to fetch member keys');
  
      // 5. Find the admin
      const admin = groupMembers.find(member => member.role === 'admin');
      if (!admin) throw new Error('Could not find group admin');
  
      const adminKeys = memberKeys.find(key => key.user_id === admin.user_id);
      if (!adminKeys) throw new Error('Could not find admin keys');
  
      // 6. Get or create group encryption key
      const { data: existingGroupKey, error: groupKeyError } = await supabase
        .from('group_encryption_keys')
        .select('encrypted_group_key')
        .eq('group_id', id)
        .eq('member_id', user.id)
        .single();
  
      let currentGroupKey;
  
      if (!existingGroupKey || groupKeyError) {
        // Create new group key if none exists
        currentGroupKey = generateGroupKey();
        
        // Create encrypted keys for all members
        const encryptedKeys = memberKeys.map(memberKey => ({
          group_id: id,
          member_id: memberKey.user_id,
          encrypted_group_key: encryptGroupKey(
            currentGroupKey,
            userKeys.secret_key,
            memberKey.public_key
          )
        }));
  
        // Insert all encrypted keys
        const { error: saveKeysError } = await supabase
          .from('group_encryption_keys')
          .insert(encryptedKeys);
  
        if (saveKeysError) throw new Error('Failed to save group encryption keys');
      } else {
        // Decrypt existing group key
        try {
          currentGroupKey = decryptGroupKey(
            existingGroupKey.encrypted_group_key,
            adminKeys.public_key,
            userKeys.secret_key
          );
  
          if (!verifyGroupKey(currentGroupKey)) {
            throw new Error('Invalid group key');
          }
        } catch (decryptError) {
          console.error('Decryption error:', decryptError);
          throw new Error('Failed to decrypt group key');
        }
      }
  
      setGroupKey(currentGroupKey);
      setEncryptionInitialized(true);
  
    } catch (error: any) {
      console.error('Encryption initialization error:', error);
      Alert.alert('Encryption Error', error.message || 'Failed to initialize encryption');
    }
  };
  
  // ********************
  // Group Info and Meetings
  // ********************
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
      console.error('Error loading group info:', error);
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
      console.error('Error loading meetings:', error);
    }
  };
  
  // ********************
  // Load and Decrypt Group Messages
  // ********************
  const loadMessages = async () => {
    if (!encryptionInitialized || !groupKey) return;
    
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
      
  
      // Decrypt each message
      const decryptedMessages = await Promise.all(
        data.map(async (message: any) => {
          if (message.is_encrypted && !message.is_system_message) {
            try {
              const decryptedContent = decryptGroupMessage(
                message.content,
                message.encryption_nonce,
                groupKey
              );
              return { ...message, content: decryptedContent };
            } catch (error) {
              console.error('Failed to decrypt message:', error);
              return { ...message, content: '[Encrypted message]' };
            }
          }
          return message;
        })
      );
  
      setMessages(decryptedMessages || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    }
  };
  
  // ********************
  // Subscriptions
  // ********************
  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('group_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${id}`
      }, async (payload) => {
        if (!encryptionInitialized || !groupKey) return;
  
        try {
          const { data: message, error } = await supabase
            .from('group_messages')
            .select(`
              *,
              profiles!inner (
                id,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();
  
          if (error) throw error;
  
          if (message.is_encrypted && !message.is_system_message) {
            try {
              const decryptedContent = decryptGroupMessage(
                message.content,
                message.encryption_nonce,
                groupKey
              );
              message.content = decryptedContent;
            } catch (error) {
              console.error('Failed to decrypt new message:', error);
              message.content = '[Encrypted message]';
            }
          }
  
          setMessages(prevMessages => [...prevMessages, message]);
          flatListRef.current?.scrollToEnd();
        } catch (error) {
          console.error('Error processing new message:', error);
        }
      })
      .subscribe();
  
    return () => supabase.removeChannel(subscription);
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
    return () => supabase.removeChannel(subscription);
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
    return () => supabase.removeChannel(subscription);
  };
  
  // ********************
  // File Upload / Download
  // ********************
  const pickDocument = async () => {
    try {
      console.log('Starting document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      console.log('Document picker result:', result);
      if (result.canceled) {
        console.log('Document picker cancelled');
        return;
      }
      const file = result.assets[0];
      console.log('Selected file:', file);
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
  
  const uploadFile = async (file: any) => {
    if (!file || !file.uri) return;
    try {
      setIsUploading(true);
      console.log('Starting file upload...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const fileExt = file.name.split('.').pop();
      const uniqueId = Date.now().toString();
      const filePath = `${user.id}/${uniqueId}.${fileExt}`;
      console.log('Uploading file to path:', filePath);
      const fileBase64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const decoded = decode(fileBase64);
      console.log('File decoded, uploading...');
      const { error: uploadError } = await supabase.storage
        .from('group_chat_files')
        .upload(filePath, decoded, {
          contentType: file.mimeType || 'application/octet-stream',
          upsert: true,
        });
      if (uploadError) throw uploadError;
      console.log('File uploaded successfully');
      const { data: { publicUrl } } = supabase.storage
        .from('group_chat_files')
        .getPublicUrl(filePath);
      console.log('Public URL:', publicUrl);
      const { error: messageError } = await supabase
        .from('group_messages')
        .insert({
          group_id: id,
          sender_id: user.id,
          content: `Shared a file: ${file.name}`,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.mimeType || 'application/octet-stream',
          file_size: file.size,
        });
      if (messageError) throw messageError;
      console.log('File message sent successfully');
    } catch (error: any) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload file: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFilePress = async (fileUrl: string, fileName: string) => {
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
  
  // ********************
  // Send Encrypted Group Message
  // ********************
  const sendMessage = async (text: string) => {
    if (!encryptionInitialized || !groupKey) {
      Alert.alert('Error', 'Encryption not initialized');
      return;
    }
  
    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
  
      // Get user profile for immediate UI update
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
  
      // Encrypt the message content with error handling
      let encryptedData;
      try {
        encryptedData = encryptWithKey(text, groupKey);
      } catch (encryptError) {
        console.error('Error encrypting message:', encryptError);
        throw new Error('Failed to encrypt message');
      }
  
      const newMessageObj = {
        group_id: id,
        sender_id: user.id,
        content: encryptedData.encrypted,
        encryption_nonce: encryptedData.nonce,
        is_encrypted: true,
        is_system_message: false,
        created_at: new Date().toISOString()
      };
  
      const { data: insertedMessage, error } = await supabase
        .from('group_messages')
        .insert(newMessageObj)
        .select(`
          *,
          profiles!inner (
            id,
            display_name,
            avatar_url
          )
        `)
        .single();
  
      if (error) throw error;
  
      // Create a complete message object for immediate UI update
      const completeMessage = {
        ...insertedMessage,
        content: text, // Use original text for UI
        profiles: profile
      };
  
      // Update the UI immediately
      setMessages(prevMessages => [...prevMessages, completeMessage]);
      setNewMessage('');
      
      // Scroll to the new message
      flatListRef.current?.scrollToEnd();
  
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };
  
  // ********************
  // Meeting Response
  // ********************
  const respondToMeeting = async (meetingId: string, status: string) => {
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
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      const { error: messageError } = await supabase
        .from('group_messages')
        .insert({
          group_id: id,
          sender_id: user.id,
          content: `${profile.display_name} is ${status === 'accepted' ? 'going to' : 'not going to'} the meeting`,
          is_system_message: true,
          meeting_id: meetingId,
        });
      if (messageError) throw messageError;
      loadMeetings();
    } catch (error: any) {
      console.error('Error responding to meeting:', error);
      Alert.alert('Error', 'Failed to update response');
    }
  };
  
  // ********************
  // Renderers
  // ********************
  const renderFileMessage = (item: any) => (
    <TouchableOpacity 
      style={styles.fileContainer}
      onPress={() => handleFilePress(item.file_url, item.file_name)}
    >
      <View style={styles.fileIconContainer}>
        <Ionicons name="document" size={24} color="#007AFF" />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.file_name}</Text>
        <Text style={styles.fileSize}>{(item.file_size / 1024).toFixed(1)} KB</Text>
      </View>
      <Ionicons name="download-outline" size={20} color="#666" />
    </TouchableOpacity>
  );
  
  const renderMeetingMessage = (meeting: any) => {
    if (!meeting) return null;
    const accepted = meeting.meeting_responses.filter((r: any) => r.status === 'accepted').length;
    const declined = meeting.meeting_responses.filter((r: any) => r.status === 'declined').length;
    const pending = meeting.meeting_responses.filter((r: any) => r.status === 'pending').length;
    return (
      <View style={styles.meetingMessageCard}>
        <Text style={styles.meetingMessageTitle}>{meeting.title}</Text>
        <Text style={styles.meetingMessageDate}>{new Date(meeting.meeting_date).toLocaleString()}</Text>
        <View style={styles.responseStats}>
          <Text style={styles.statText}>✓ {accepted} Going</Text>
          <Text style={styles.statText}>✗ {declined} Not Going</Text>
          <Text style={styles.statText}>? {pending} Pending</Text>
        </View>
      </View>
    );
  };
  
  // Render individual group messages (both encrypted and non-encrypted)
  const renderMessage = ({ item }: any) => {
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
    if (item.is_system_message) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }
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
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }
    // Regular text message
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
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };
  
  const renderMeeting = ({ item }: any) => (
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
          style={[styles.responseButton, item.meeting_responses?.some((r: any) => r.status === 'accepted') && styles.selectedResponseButton]}
          onPress={() => respondToMeeting(item.id, 'accepted')}
        >
          <Text style={styles.responseButtonText}>Going</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.responseButton, item.meeting_responses?.some((r: any) => r.status === 'declined') && styles.selectedResponseButton]}
          onPress={() => respondToMeeting(item.id, 'declined')}
        >
          <Text style={styles.responseButtonText}>Can't Go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // ********************
  // Main Render
  // ********************
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
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10, padding: 5 }}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => setShowMeetings(true)} style={styles.headerButton}>
                <Ionicons name="calendar" size={24} color="#007AFF" />
                {meetings.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{meetings.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/chat/group/info/${id}`)} style={styles.headerButton}>
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
        keyExtractor={item => String(item.id || Math.random())}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      {isUploading && (
        <View style={styles.uploadProgress}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.uploadText}>Uploading file...</Text>
        </View>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 90}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={pickDocument} disabled={isUploading}>
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
          <TouchableOpacity style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} onPress={() => sendMessage(newMessage)} disabled={!newMessage.trim() || sending}>
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
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowMeetings(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {meetings.length > 0 ? (
              <FlatList data={meetings} renderItem={renderMeeting} keyExtractor={item => item.id} contentContainerStyle={styles.meetingsList} />
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
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center'
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
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: COLORS.text.inverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberCount: {
    fontSize: 16,
    color: COLORS.primary,
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
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageContent: {
    flex: 1,
    backgroundColor: COLORS.messageBackground.received,
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.messageBackground.sent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  meetingMessageCard: {
    backgroundColor: COLORS.messageBackground.sent,
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  meetingMessageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  meetingMessageDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  responseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
  },
  statText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    alignItems: 'flex-end',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: COLORS.messageBackground.sent,
    borderRadius: 20,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.text.secondary,
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  meetingsList: {
    padding: 16,
  },
  meetingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  meetingHeader: {
    marginBottom: 12,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  meetingCreator: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  meetingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  responseButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedResponseButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  responseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  selectedResponseButtonText: {
    color: COLORS.text.inverse,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  scheduleButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleButtonText: {
    color: COLORS.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
export default GroupChatScreen;
