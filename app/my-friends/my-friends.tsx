import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ActivityIndicator, 
  SafeAreaView 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

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

export default function MyFriendsScreen() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      setUserData(user);

      // Load friendships where the current user is either the sender or receiver.
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
      
      // Combine and filter out any rows that might have a null profiles value.
      const allFriends = [...(friends1 || []), ...(friends2 || [])].filter(f => f.profiles);
      setFriends(allFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Delete the friendship record(s) where the current user and friendId are paired.
      let { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id1', user.id)
        .eq('user_id2', friendId);
      if (!error) {
        ({ error } = await supabase
          .from('friendships')
          .delete()
          .eq('user_id1', friendId)
          .eq('user_id2', user.id));
      }
      if (error) throw error;
      Alert.alert('Success', 'Friend removed');
      loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
    }
  };

  const renderFriendItem = ({ item }) => {
    const friend = item.profiles;
    return (
      <View style={styles.friendCard}>
        <TouchableOpacity
          style={styles.friendInfo}
          onPress={() => router.push(`/(user)/${friend.id}`)}

        >
          <Image 
            source={{ uri: friend.avatar_url || 'https://via.placeholder.com/40' }} 
            style={styles.avatar} 
          />
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{friend.display_name}</Text>
            <Text style={styles.friendMeta}>
              {friend.year || ''}{friend.major ? ` • ${friend.major}` : ''}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFriend(friend.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Friends</Text>
      </View>
      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Looks a little empty here :/</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  listContent: {
    padding: 20,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  friendMeta: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.danger}15`,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  removeButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
});
export default MyFriendsScreen;
