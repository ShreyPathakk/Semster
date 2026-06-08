// app/(user)/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../supabaseClient';
import ProfileImage from '../components/Profile/ProfileImage';

// Color scheme (UK–Californian vibe)
const COLORS = {
  primary: '#00838F',      // Teal
  accent: '#FF6F61',       // Pinkish accent
  background: '#FFFFFF',   // Clean white background
  surface: '#F5F7F8',      // Light neutral surface
  textPrimary: '#2C3A41',  // Dark slate for primary text
  textSecondary: '#5C6B73',// Medium gray for secondary text
  error: '#D32F2F',        // Bold red for destructive actions
};

export default function UserProfile() {
  const { id } = useLocalSearchParams();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Friend status can be 'none', 'pending', or 'friends'
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');

  useEffect(() => {
    loadUserProfile();
    checkFriendStatus();
  }, [id]);

  // Fetch the user profile from Supabase
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
      Alert.alert('Error', 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  // Check friend relationship and pending friend requests
  const checkFriendStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Check existing friendships (assuming your "friendships" table contains rows with user_id1 and user_id2)
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);
      if (friendships && friendships.some((f: any) => f.user_id1 === id || f.user_id2 === id)) {
        setFriendStatus('friends');
        return;
      }
      // Check if a friend request is already pending
      const { data: requests } = await supabase
        .from('friendship_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('receiver_id', id)
        .eq('status', 'pending');
      setFriendStatus(requests && requests.length > 0 ? 'pending' : 'none');
    } catch (error) {
      console.error('Error checking friend status:', error);
    }
  };

  // Send a friend request
  const sendFriendRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('friendship_requests')
        .insert({
          sender_id: user.id,
          receiver_id: id,
          status: 'pending',
        });
      if (error) throw error;
      setFriendStatus('pending');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>User not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.accent]}
        style={styles.headerContainer}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.background} />
        </TouchableOpacity>
        <ProfileImage
          url={userProfile.avatar_url}
          onUpload={() => {}}
          userId={id}
          style={styles.profileImage}
        />
        <Text style={styles.displayName}>{userProfile.display_name}</Text>
        {userProfile.username && (
          <Text style={styles.username}>@{userProfile.username}</Text>
        )}
      </LinearGradient>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Row Cards for Year and Major */}
        <View style={styles.rowContainer}>
          <View style={styles.smallCard}>
            <Ionicons name="school" size={20} color={COLORS.primary} />
            <Text style={styles.smallCardText}>
              {userProfile.year || 'Year not set'}
            </Text>
          </View>
          <View style={styles.smallCard}>
            <Ionicons name="book" size={20} color={COLORS.accent} />
            <Text style={styles.smallCardText}>
              {userProfile.major || 'Major not set'}
            </Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status</Text>
          </View>
          <Text style={styles.cardContent}>
            {userProfile.current_status || "No status set"}
          </Text>
        </View>

        {/* About Me Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>About Me</Text>
          </View>
          <Text style={styles.cardContent}>
            {userProfile.about_me ||
              "This user hasn't shared anything about themselves yet."}
          </Text>
        </View>

        {/* Friend Request and Message Buttons */}
        <View style={styles.buttonsContainer}>
          {friendStatus === 'none' && (
            <TouchableOpacity
              style={styles.friendButton}
              onPress={sendFriendRequest}
            >
              <Ionicons name="person-add" size={20} color={COLORS.background} />
              <Text style={styles.buttonText}>Add Friend</Text>
            </TouchableOpacity>
          )}
          {friendStatus === 'pending' && (
            <View style={[styles.friendButton, styles.pendingButton]}>
              <Ionicons name="time" size={20} color={COLORS.background} />
              <Text style={styles.buttonText}>Request Sent</Text>
            </View>
          )}
          {friendStatus === 'friends' && (
            <View style={[styles.friendButton, styles.friendsButton]}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.background} />
              <Text style={styles.buttonText}>Friends</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => router.push(`/chat/${id}`)}
          >
            <Ionicons name="chatbubble" size={20} color={COLORS.background} />
            <Text style={styles.buttonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  // Header styles
  headerContainer: {
    height: 250,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 1,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.background,
    marginBottom: 10,
  },
  displayName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.background,
    marginTop: 10,
  },
  username: {
    fontSize: 16,
    color: COLORS.background,
    opacity: 0.9,
    marginTop: 4,
  },
  // Content styles
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  smallCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  smallCardText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 8,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginVertical: 5,
  },
  pendingButton: {
    backgroundColor: COLORS.surface,
  },
  friendsButton: {
    backgroundColor: COLORS.accent,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginVertical: 5,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
