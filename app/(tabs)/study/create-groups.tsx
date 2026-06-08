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
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../supabaseClient';

// Import encryption utility functions
import {
  generateUserKeyPair,
  generateGroupKey,
  encryptGroupKey,
  validateKeyPair
} from '../../../utilities/group-encryption';

// Define our elegant color palette
const COLORS = {
  primary: '#00838F',
  accent: '#FF6F61',
  background: '#FFFFFF',
  surface: '#F5F7F8',
  textPrimary: '#2C3A41',
  textSecondary: '#5C6B73',
  error: '#D32F2F',
  border: '#E1E8EB',
};

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
      await checkAndGenerateUserKeys();
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setPageLoading(false);
    }
  };

  const checkAndGenerateUserKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: existingKeys, error: keyCheckError } = await supabase
        .from('user_keys')
        .select('public_key, secret_key')
        .eq('user_id', user.id);

      if (keyCheckError) throw keyCheckError;

      if (!existingKeys || existingKeys.length === 0) {
        const { publicKey, secretKey } = await generateUserKeyPair();
        
        const { error: keyInsertError } = await supabase
          .from('user_keys')
          .insert({
            user_id: user.id,
            public_key: publicKey,
            secret_key: secretKey
          });

        if (keyInsertError) throw keyInsertError;
      }
    } catch (error) {
      console.error('Error checking/generating user keys:', error);
      Alert.alert('Error', 'Failed to setup encryption keys');
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

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
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
      if (!user) {
        Alert.alert('Error', 'User not found or not authenticated');
        return;
      }

      // Check if selected friends have encryption keys
      const keyCheckPromises = selectedFriends.map(friendId =>
        supabase
          .from('user_keys')
          .select('public_key')
          .eq('user_id', friendId)
      );

      const keyResults = await Promise.all(keyCheckPromises);
      const friendsWithoutKeys = selectedFriends.filter((friendId, index) => 
        !keyResults[index].data || keyResults[index].data.length === 0
      );

      if (friendsWithoutKeys.length > 0) {
        const friendsWithKeys = selectedFriends.filter(
          id => !friendsWithoutKeys.includes(id)
        );

        if (friendsWithKeys.length < 2) {
          Alert.alert(
            'Error',
            'Not enough members with encryption keys. Please select different members.'
          );
          setLoading(false);
          return;
        }

        Alert.alert(
          'Warning',
          'Some selected members don\'t have encryption keys set up. They will be removed from the selection.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setLoading(false)
            },
            {
              text: 'Continue',
              onPress: () => createGroupWithValidMembers(user, friendsWithKeys)
            }
          ]
        );
        return;
      }

      await createGroupWithValidMembers(user, selectedFriends);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to create group');
      setLoading(false);
    }
  };

  const createGroupWithValidMembers = async (user, validMembers) => {
    try {
      // First get admin's keys
      const { data: adminKeyData, error: adminKeyError } = await supabase
        .from('user_keys')
        .select('public_key, secret_key')
        .eq('user_id', user.id)
        .single();
  
      if (adminKeyError) throw adminKeyError;
      if (!adminKeyData) throw new Error('Admin user has no encryption keys.');
  
      // Create the study group first
      const { data: groupData, error: groupError } = await supabase
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
      if (!groupData) throw new Error('Failed to create study group');
  
      console.log('Group created:', groupData.id);
  
      // Insert admin as member first
      const { error: adminMemberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin',
          group_public_key: adminKeyData.public_key
        });
  
      if (adminMemberError) {
        console.error('Error adding admin member:', adminMemberError);
        throw new Error('Failed to add admin as member');
      }
  
      console.log('Admin member added');
  
      // Get all member public keys
      const { data: memberKeys, error: memberKeysError } = await supabase
        .from('user_keys')
        .select('user_id, public_key')
        .in('user_id', validMembers);
  
      if (memberKeysError) throw memberKeysError;
      if (!memberKeys || memberKeys.length === 0) {
        throw new Error('Failed to get member public keys');
      }
  
      console.log('Got member keys:', memberKeys.length);
  
      // Add members one by one to better handle potential RLS issues
      for (const memberId of validMembers) {
        const memberKey = memberKeys.find(k => k.user_id === memberId);
        if (!memberKey) {
          console.warn(`No key found for member ${memberId}, skipping`);
          continue;
        }
  
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: groupData.id,
            user_id: memberId,
            role: 'member',
            group_public_key: memberKey.public_key
          });
  
        if (memberError) {
          console.error(`Error adding member ${memberId}:`, memberError);
          // Continue with other members instead of throwing
          continue;
        }
  
        console.log(`Added member ${memberId}`);
      }
  
      // Generate and distribute encryption keys
      const newGroupKey = generateGroupKey();
  
      // First encrypt for admin
      const adminEncryptedKey = encryptGroupKey(
        newGroupKey,
        adminKeyData.secret_key,
        adminKeyData.public_key
      );
  
      const { error: adminKeyInsertError } = await supabase
        .from('group_encryption_keys')
        .insert({
          group_id: groupData.id,
          member_id: user.id,
          encrypted_group_key: adminEncryptedKey
        });
  
      if (adminKeyInsertError) {
        console.error('Error adding admin encryption key:', adminKeyInsertError);
        throw new Error('Failed to set up admin encryption');
      }
  
      // Then encrypt for each member
      for (const memberId of validMembers) {
        const memberKey = memberKeys.find(k => k.user_id === memberId);
        if (!memberKey) continue;
  
        const memberEncryptedKey = encryptGroupKey(
          newGroupKey,
          adminKeyData.secret_key,
          memberKey.public_key
        );
  
        const { error: memberKeyError } = await supabase
          .from('group_encryption_keys')
          .insert({
            group_id: groupData.id,
            member_id: memberId,
            encrypted_group_key: memberEncryptedKey
          });
  
        if (memberKeyError) {
          console.error(`Error adding encryption key for member ${memberId}:`, memberKeyError);
          continue;
        }
  
        console.log(`Added encryption key for member ${memberId}`);
      }
  
      Alert.alert(
        'Success',
        'Study group created successfully!',
        [{ text: 'OK', onPress: () => router.push('/study/my-groups') }]
      );
  
    } catch (error) {
      console.error('Error in group creation:', error);
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
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
          placeholderTextColor="#666"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          placeholderTextColor="#666"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
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
                    onPress={() => router.push(`/(user)/${friend.id}`)}
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
          placeholderTextColor="#666"
          value={formData.maxMembers}
          onChangeText={(text) => {
            const num = parseInt(text) || 3;
            setFormData({ ...formData, maxMembers: Math.min(Math.max(num, 3), 20).toString() })
          }}
          keyboardType="numeric"
        />
        {/* Gradient Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.gradientButton}>
              <Text style={styles.createButtonText}>Create Group</Text>
            </LinearGradient>
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
    textAlign: 'center',
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
    color: '#333',
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
    color: '#333',
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
  addButton: {
    padding: 4,
  },
  createButton: {
    marginTop: 20,
  },
  gradientButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
