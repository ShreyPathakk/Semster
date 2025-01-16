import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Image,
  FlatList 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';

export default function CreateGroup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [userClasses, setUserClasses] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: '5'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassmates();
    }
  }, [selectedClass]);

  const loadInitialData = async () => {
    try {
      setPageLoading(true);
      await loadUserClasses();
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setPageLoading(false);
    }
  };

  const loadUserClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('semester_schedules')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      Alert.alert('Error', 'Failed to load classes');
    }
  };

  const loadClassmates = async () => {
    if (!selectedClass) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('semester_schedules')
        .select(`
          user_id,
          profiles!inner (
            id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .eq('class_name', selectedClass.class_name)
        .eq('professor_name', selectedClass.professor_name)
        .eq('term', selectedClass.term)
        .neq('user_id', user.id);

      if (error) throw error;

      const uniqueClassmates = Array.from(
        new Set(data.map(d => d.profiles.id))
      ).map(id => {
        const classmate = data.find(d => d.profiles.id === id);
        return {
          id: classmate.profiles.id,
          display_name: classmate.profiles.display_name,
          avatar_url: classmate.profiles.avatar_url,
          major: classmate.profiles.major,
          year: classmate.profiles.year
        };
      });

      setFriends(uniqueClassmates);
    } catch (error) {
      console.error('Error loading classmates:', error);
      Alert.alert('Error', 'Failed to load classmates');
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!selectedClass) {
      Alert.alert('Error', 'Please select a class');
      return;
    }

    if (selectedFriends.length < 2) {
      Alert.alert('Error', 'Please select at least 2 classmates');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          class_id: selectedClass.id,
          created_by: user.id,
          max_members: parseInt(formData.maxMembers)
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: creatorError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (creatorError) throw creatorError;

      const memberPromises = selectedFriends.map(friendId => 
        supabase
          .from('group_members')
          .insert({
            group_id: group.id,
            user_id: friendId,
            role: 'member'
          })
      );

      await Promise.all(memberPromises);

      Alert.alert(
        'Success',
        'Study group created successfully!',
        [{ text: 'OK', onPress: () => router.push('/study/my-groups') }]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  if (pageLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Study Group</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Group Name"
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
          multiline
          numberOfLines={4}
        />

        <View style={styles.classesSection}>
          <Text style={styles.sectionTitle}>Select Class</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {userClasses.map(classItem => (
              <TouchableOpacity
                key={classItem.id}
                style={[
                  styles.classButton,
                  selectedClass?.id === classItem.id && styles.selectedClass
                ]}
                onPress={() => setSelectedClass(classItem)}
              >
                <Text style={styles.classButtonText}>{classItem.class_name}</Text>
                <Text style={styles.classDetails}>
                  {classItem.professor_name} • {classItem.term}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedClass && (
          <View style={styles.classmatesSection}>
            <Text style={styles.sectionTitle}>
              Select Classmates (Minimum 2)
            </Text>
            {friends.length === 0 ? (
              <Text style={styles.noClassmatesText}>
                No classmates found in this class
              </Text>
            ) : (
              <View>
                {friends.map(friend => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendButton,
                      selectedFriends.includes(friend.id) && styles.selectedFriend
                    ]}
                    onPress={() => router.push(`/(user)/${friend.id}`)} // Fixed navigation path
                  >
                    <View style={styles.friendInfo}>
                      <Image 
                        source={{ uri: friend.avatar_url || 'https://via.placeholder.com/40' }}
                        style={styles.avatar}
                      />
                      <View style={styles.friendDetails}>
                        <Text style={styles.friendName}>{friend.display_name}</Text>
                        <Text style={styles.friendSubInfo}>
                          {friend.year} • {friend.major}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFriendSelection(friend.id);
                      }}
                    >
                      <Ionicons 
                        name={selectedFriends.includes(friend.id) ? "checkmark-circle" : "add-circle-outline"} 
                        size={24} 
                        color={selectedFriends.includes(friend.id) ? "#4CAF50" : "#666"}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Max Members (3-20)"
          value={formData.maxMembers}
          onChangeText={(text) => {
            const num = parseInt(text) || 3;
            setFormData({...formData, maxMembers: Math.min(Math.max(num, 3), 20).toString()})
          }}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.createButtonText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
    color: '#333',
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  classesSection: {
    marginBottom: 20,
  },
  classmatesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  classButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 200,
  },
  selectedClass: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  classButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
  },
  noClassmatesText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },
  friendButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFriend: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  friendSubInfo: {
    fontSize: 14,
    color: '#666',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});