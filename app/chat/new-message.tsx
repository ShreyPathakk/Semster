// app/chat/new-message.tsx
import 'react-native-get-random-values';
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Image,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

const COLORS = {
  primary: '#00838F',
  secondary: '#4A6670',
  background: '#FFFFFF',
  surface: '#F5F7F8',
  text: {
    primary: '#2C3A41',
    secondary: '#5C6B73',
    light: '#8E9BA1'
  },
  border: '#E1E8EB'
};

export default function NewMessageScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Error fetching user:", authError);
        return;
      }
  
      const { data: friends1 } = await supabase
        .from('friendships')
        .select(`
          profiles:user_id2 (
            id,
            display_name,
            avatar_url,
            year,
            major
          )
        `)
        .eq('user_id1', user.id);
  
      const { data: friends2 } = await supabase
        .from('friendships')
        .select(`
          profiles:user_id1 (
            id,
            display_name,
            avatar_url,
            year,
            major
          )
        `)
        .eq('user_id2', user.id);
  
      // Ensure valid profiles
      const allFriends = [
        ...(friends1?.map(f => ({
          ...f.profiles,
          display_name: f.profiles?.display_name || 'Anonymous',
          avatar_url: f.profiles?.avatar_url || 'https://via.placeholder.com/40',
        })) || []),
        ...(friends2?.map(f => ({
          ...f.profiles,
          display_name: f.profiles?.display_name || 'Anonymous',
          avatar_url: f.profiles?.avatar_url || 'https://via.placeholder.com/40',
        })) || [])
      ];
  
      setFriends(allFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const getFilteredFriends = () => {
    if (!searchQuery) return friends;
    return friends.filter(friend => 
      friend.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSelectFriend = (friendId) => {
    router.push(`/chat/${friendId}`);
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendCard}
      onPress={() => handleSelectFriend(item.id)}
    >
      <Image 
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }}
        style={styles.avatar}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.display_name}</Text>
        <Text style={styles.friendDetails}>
          {item.year || 'Year not specified'} • {item.major || 'Major not specified'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.text.light} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.text.light} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search friends..."
          placeholderTextColor={COLORS.text.light}
        />
      </View>

      {/* Friends List */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} />
      ) : (
        <FlatList
          data={getFilteredFriends()}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name="people-outline" 
                size={48} 
                color={COLORS.text.light} 
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching friends found' : 'No friends yet'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={styles.findFriendsButton}
                  onPress={() => router.push('/friends')}
                >
                  <Text style={styles.findFriendsButtonText}>Find Friends</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  friendDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 20,
  },
  findFriendsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  findFriendsButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});