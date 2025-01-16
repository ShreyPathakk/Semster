// app/(user)/[id].tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import ProfileImage from '../components/Profile/ProfileImage';

export default function UserProfile() {
  const { id } = useLocalSearchParams();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState(null); // 'none', 'pending', 'friends'

  useEffect(() => {
    loadUserProfile();
    checkFriendStatus();
  }, [id]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFriendStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if already friends
      const { data: friends } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`)
        .or(`user_id1.eq.${id},user_id2.eq.${id}`);

      if (friends?.length > 0) {
        setFriendStatus('friends');
        return;
      }

      // Check if request pending
      const { data: requests } = await supabase
        .from('friendship_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('receiver_id', id)
        .eq('status', 'pending');

      setFriendStatus(requests?.length > 0 ? 'pending' : 'none');
    } catch (error) {
      console.error('Error checking friend status:', error);
    }
  };

  const sendFriendRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('friendship_requests')
        .insert({
          sender_id: user.id,
          receiver_id: id,
          status: 'pending'
        });

      if (error) throw error;
      setFriendStatus('pending');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  if (loading || !userProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <ProfileImage 
            url={userProfile.avatar_url}
            onUpload={() => {}}
            userId={id}
          />
          
          <Text style={styles.name}>{userProfile.display_name}</Text>
          
          <View style={styles.yearBadge}>
            <Ionicons name="school" size={20} color="#007AFF" />
            <Text style={styles.yearText}>{userProfile.year}</Text>
          </View>

          <View style={styles.majorBadge}>
            <Ionicons name="book" size={20} color="#4CAF50" />
            <Text style={styles.majorText}>
              {userProfile.major || "Major not set"}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <Ionicons name="ellipse" size={12} color="#4CAF50" />
            <Text style={styles.status}>
              {userProfile.current_status || "No status set"}
            </Text>
          </View>

          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About Me</Text>
            <Text style={styles.aboutText}>
              {userProfile.about_me || "No bio added yet"}
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            {friendStatus === 'none' && (
              <TouchableOpacity 
                style={styles.addFriendButton}
                onPress={sendFriendRequest}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.buttonText}>Add Friend</Text>
              </TouchableOpacity>
            )}

            {friendStatus === 'pending' && (
              <View style={styles.pendingButton}>
                <Ionicons name="time" size={20} color="#666" />
                <Text style={styles.pendingText}>Request Sent</Text>
              </View>
            )}

            {friendStatus === 'friends' && (
              <View style={styles.friendsButton}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.friendsText}>Friends</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => router.push(`/chat/${id}`)}
            >
              <Ionicons name="chatbubble" size={20} color="#fff" />
              <Text style={styles.buttonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  yearText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  majorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  majorText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    width: '80%',
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  aboutSection: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 16,
    marginTop: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  pendingText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 8,
  },
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  friendsText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
});