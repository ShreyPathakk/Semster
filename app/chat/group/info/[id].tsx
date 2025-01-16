import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../supabaseClient';

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadGroupInfo();
  }, []);

  const loadGroupInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch group info directly from `study_groups` table
      const { data, error } = await supabase
        .from('study_groups')
        .select('name, description, created_by')
        .eq('id', id)
        .single();

      if (error) throw error;
      setGroupInfo(data);

      // Fetch group members
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
    } finally {
      setLoading(false);
    }
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberRow}>
      <Image 
        source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/40' }}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.profiles.display_name}</Text>
        {item.profiles.id === groupInfo.created_by && (
          <Text style={styles.adminBadge}>Admin</Text>
        )}
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
      <View style={styles.header}>
        {/* Centered Group Name and Description */}
        <Text style={styles.groupName}>{groupInfo.name}</Text>
        <Text style={styles.groupDescription}>{groupInfo.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{members.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members</Text>
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={item => item.user_id}
          contentContainerStyle={styles.membersList}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center', // Center elements in the header
  },
  groupName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  groupDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    paddingBottom: 10,
  },
  membersList: {
    padding: 20,
    paddingTop: 0,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  adminBadge: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});