import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';

export default function FindPeersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userClasses, setUserClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classmates, setClassmates] = useState([]);

  useEffect(() => {
    loadUserClasses();
  }, []);

  const loadUserClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('semester_schedules')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const findClassmates = async (classItem) => {
    setSelectedClass(classItem);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get friendships first
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

      // Then get classmates
      const { data, error } = await supabase
        .from('semester_schedules')
        .select(`
          id,
          class_name,
          professor_name,
          section,
          term,
          user_id,
          profiles:user_id (
            id,
            display_name,
            year,
            avatar_url
          )
        `)
        .eq('class_name', classItem.class_name)
        .eq('professor_name', classItem.professor_name)
        .eq('term', classItem.term)
        .neq('user_id', user.id);

      if (error) throw error;

      // Add isConnected flag to each classmate
      const classmatesWithConnection = data?.map(classmate => ({
        ...classmate,
        isConnected: friendships?.some(f => 
          (f.user_id1 === user.id && f.user_id2 === classmate.profiles.id) ||
          (f.user_id2 === user.id && f.user_id1 === classmate.profiles.id)
        )
      }));

      setClassmates(classmatesWithConnection || []);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error finding classmates');
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('friendship_requests')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          status: 'pending'
        });

      if (error) throw error;
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error sending request');
    }
  };

  const renderClassCard = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.classCard,
        selectedClass?.id === item.id && styles.selectedClass
      ]}
      onPress={() => findClassmates(item)}
    >
      <Text style={styles.className}>{item.class_name}</Text>
      <Text style={styles.classDetails}>
        Professor: {item.professor_name}
      </Text>
      <Text style={styles.classDetails}>
        Section: {item.section} • {item.term}
      </Text>
    </TouchableOpacity>
  );

  const renderClassmate = ({ item }) => (
    <TouchableOpacity 
      style={styles.classmateCard}
      onPress={() => router.push(`/(user)/${item.profiles.id}`)}
    >
      <Image 
        source={{ uri: item.profiles.avatar_url || 'https://via.placeholder.com/40' }}
        style={styles.avatar}
      />
      <View style={styles.classmateInfo}>
        <Text style={styles.classmateName}>{item.profiles.display_name}</Text>
        <Text style={styles.classmateDetails}>
          Year: {item.profiles.year}
        </Text>
        <Text style={styles.classmateDetails}>
          Section: {item.section}
        </Text>
      </View>
      {item.isConnected ? (
        <View style={styles.connectedButton}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.connectedButtonText}>Connected</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            sendFriendRequest(item.profiles.id);
          }}
        >
          <Ionicons name="person-add" size={24} color="#007AFF" />
          <Text style={styles.addButtonText}>Connect</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
      <Text style={styles.title}>Find Study Buddies</Text>

      <View style={styles.classesSection}>
        <Text style={styles.sectionTitle}>Your Classes</Text>
        <FlatList
          horizontal
          data={userClasses}
          renderItem={renderClassCard}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classesContainer}
        />
      </View>

      <View style={styles.classmatesSection}>
        <Text style={styles.sectionTitle}>
          {selectedClass 
            ? `Classmates in ${selectedClass.class_name}`
            : 'Select a class to find classmates'}
        </Text>
        {selectedClass ? (
          classmates.length > 0 ? (
            <FlatList
              data={classmates}
              renderItem={renderClassmate}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.classmatesContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No classmates found</Text>
            </View>
          )
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Choose a class to find study buddies</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  classesSection: {
    marginBottom: 24,
  },
  classmatesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  classesContainer: {
    paddingVertical: 8,
  },
  classCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedClass: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  classmatesContainer: {
    paddingVertical: 8,
  },
  classmateCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  classmateInfo: {
    flex: 1,
  },
  classmateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  classmateDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    padding: 12,
    borderRadius: 20,
    marginLeft: 12,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  connectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 20,
    marginLeft: 12,
  },
  connectedButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  }
});