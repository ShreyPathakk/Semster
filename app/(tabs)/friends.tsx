// app/friends.tsx
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../supabaseClient';

// Define color scheme to match other screens
const COLORS = {
  primary: '#00838F',     // Elegant teal
  secondary: '#4A6670',   // Deep slate blue
  accent: '#B4A5A5',      // Muted mauve
  success: '#2E7D72',     // Deep teal green
  warning: '#8D6E63',     // Warm brown
  danger: '#D32F2F',      // Error red
  background: '#FFFFFF',  
  surface: '#F5F7F8',     // Light gray-blue
  text: {
    primary: '#2C3A41',   // Dark slate
    secondary: '#5C6B73', // Medium gray
    light: '#8E9BA1'      // Light gray
  },
  border: '#E1E8EB'       // Light border color
};

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    loadFriendRequests();
    loadFriends();
    loadCurrentUserInfo();
  }, []);

  const loadCurrentUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('major, year')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCurrentUserInfo(data);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const searchUsers = async (filter = activeFilter) => {
    if (!searchQuery && !filter) {
      setSearchResults([]);
      return;
    }
  
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let query = supabase
        .from('profiles')
        .select('id, display_name, student_id, avatar_url, year, major')
        .neq('id', user.id);
  
      if (filter === 'year' && currentUserInfo?.year) {
        query = query.eq('year', currentUserInfo.year);
      } else if (filter === 'major' && currentUserInfo?.major) {
        query = query.eq('major', currentUserInfo.major);
      }
  
      if (searchQuery.length >= 3) {
        query = query.ilike('display_name', `%${searchQuery}%`);
      }
  
      const { data, error } = await query.limit(20);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterPress = (filter) => {
    setActiveFilter(activeFilter === filter ? null : filter);
    searchUsers(activeFilter === filter ? null : filter);
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('friendship_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending'
        });

      if (error) throw error;
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const loadFriendRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('friendship_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          profiles!friendship_requests_sender_id_fkey(id, display_name, avatar_url, year, major)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: friends1, error: error1 } = await supabase
        .from('friendships')
        .select(`
          id,
          profiles:user_id2 (
            id,
            display_name,
            avatar_url,
            year,
            major
          )
        `)
        .eq('user_id1', user.id);
  
      const { data: friends2, error: error2 } = await supabase
        .from('friendships')
        .select(`
          id,
          profiles:user_id1 (
            id,
            display_name,
            avatar_url,
            year,
            major
          )
        `)
        .eq('user_id2', user.id);
  
      if (error1 || error2) throw error1 || error2;
  
      const allFriends = [
        ...(friends1 || []),
        ...(friends2 || [])
      ];
  
      setFriends(allFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleFriendRequest = async (requestId, status) => {
    try {
      const { error: requestError } = await supabase
        .from('friendship_requests')
        .update({ status })
        .eq('id', requestId);
  
      if (requestError) throw requestError;
  
      if (status === 'accepted') {
        const { data: requestData, error: getRequestError } = await supabase
          .from('friendship_requests')
          .select('sender_id, receiver_id')
          .eq('id', requestId)
          .single();
  
        if (getRequestError) throw getRequestError;
  
        const { error: friendshipError } = await supabase
          .from('friendships')
          .insert({
            user_id1: requestData.sender_id,
            user_id2: requestData.receiver_id
          });
  
        if (friendshipError) throw friendshipError;
      }
  
      loadFriendRequests();
      loadFriends();
      Alert.alert(
        'Success', 
        status === 'accepted' ? 'Friend request accepted!' : 'Friend request declined'
      );
    } catch (error) {
      console.error('Error handling friend request:', error);
      Alert.alert('Error', 'Failed to process friend request');
    }
  };

  const handleMessage = (friendId) => {
    router.push(`/chat/${friendId}`);
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => router.push(`/(user)/${item.id}`)} 
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.display_name}</Text>
          <View style={styles.metaContainer}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.text.light} />
            <Text style={styles.metaText}>{item.year || 'Not specified'}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name="school-outline" size={12} color={COLORS.text.light} />
            <Text style={styles.metaText}>{item.major || 'Not specified'}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={(e) => {
          e.stopPropagation();
          sendFriendRequest(item.id);
        }}
      >
        <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
        <Text style={styles.actionButtonText}>Add</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFriendRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <View style={styles.statusDot} />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.profiles.display_name}</Text>
          <View style={styles.metaContainer}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.text.light} />
            <Text style={styles.metaText}>{item.profiles.year || 'Not specified'}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name="school-outline" size={12} color={COLORS.text.light} />
            <Text style={styles.metaText}>{item.profiles.major || 'Not specified'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleFriendRequest(item.id, 'accepted')}
        >
          <Ionicons name="checkmark" size={20} color={COLORS.background} />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleFriendRequest(item.id, 'declined')}
        >
          <Ionicons name="close" size={20} color={COLORS.danger} />
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => router.push(`/(user)/${item.profiles.id}`)} 
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <View style={styles.statusDot} />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.profiles.display_name}</Text>
          <View style={styles.metaContainer}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.text.light} />
            <Text style={styles.metaText}>{item.profiles.year || 'Not specified'}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name="school-outline" size={12} color={COLORS.text.light} />
            <Text style={styles.metaText}>{item.profiles.major || 'Not specified'}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.actionButton, styles.messageButton]}
        onPress={(e) => {
          e.stopPropagation();
          handleMessage(item.profiles.id);
        }}
      >
        <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Friends</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.text.light} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length >= 3) {
                searchUsers();
              }
            }}
            placeholder="Search by name..."
            placeholderTextColor={COLORS.text.light}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'year' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('year')}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={activeFilter === 'year' ? COLORS.background : COLORS.primary} 
          />
          <Text style={[
            styles.filterButtonText, 
            activeFilter === 'year' && styles.filterButtonTextActive
          ]}>
            Same Year
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'major' && styles.filterButtonActive]}
          onPress={() => handleFilterPress('major')}
        >
          <Ionicons 
            name="school-outline" 
            size={20} 
            color={activeFilter === 'major' ? COLORS.background : COLORS.primary} 
          />
          <Text style={[
            styles.filterButtonText, 
            activeFilter === 'major' && styles.filterButtonTextActive
          ]}>
            Same Major
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {!searchQuery && !activeFilter ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="people-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyStateTitle}>Find Your Study Buddies</Text>
              <Text style={styles.emptyStateText}>
                Search by name or find people in your year and major
              </Text>
            </View>
          ) : (
            <FlatList
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <>
                  {searchResults.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Search Results</Text>
                      <FlatList
                        data={searchResults}
                        renderItem={renderSearchResult}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                      />
                    </View>
                  )}

                  {friendRequests.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Friend Requests</Text>
                      <FlatList
                        data={friendRequests}
                        renderItem={renderFriendRequest}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                      />
                    </View>
                  )}

                  {friends.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>My Friends</Text>
                      <FlatList
                        data={friends}
                        renderItem={renderFriend}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                      />
                    </View>
                  )}
                </>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  filterButtonTextActive: {
    color: COLORS.background,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  requestCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  statusDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  metaDot: {
    color: COLORS.text.light,
    marginHorizontal: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  declineButton: {
    backgroundColor: `${COLORS.danger}15`,
  },
  messageButton: {
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});