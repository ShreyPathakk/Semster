import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../supabaseClient';


const GroupManagement = ({ group, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentMembers, setCurrentMembers] = useState([]);

  useEffect(() => {
    loadCurrentMembers();
  }, []);

  const loadCurrentMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          user_id,
          role,
          joined_at,
          profiles!inner (
            id,
            display_name,
            email
          )
        `)
        .eq('group_id', group.group_id);

      if (error) throw error;
      setCurrentMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load group members');
    }
  };

  const searchUsers = async (text) => {
    if (!text) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .ilike('name', `%${text}%`)
        .limit(5);

      if (error) throw error;
      
      // Filter out users who are already members or have pending invites
      const { data: pendingInvites } = await supabase
        .from('group_join_requests')
        .select('receiver_id')
        .eq('group_id', group.group_id)
        .eq('status', 'pending');

      const pendingIds = pendingInvites?.map(invite => invite.receiver_id) || [];
      const memberIds = currentMembers.map(member => member.profiles.id);
      const filteredResults = data.filter(user => 
        !memberIds.includes(user.id) && !pendingIds.includes(user.id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const inviteUser = async (userId) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check current member count
      const { data: groupData } = await supabase
        .from('study_groups')
        .select('max_members')
        .eq('id', group.group_id)
        .single();

      if (currentMembers.length >= groupData.max_members) {
        Alert.alert('Error', 'Group has reached maximum member limit');
        return;
      }

      // Create invite
      const { error: inviteError } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: group.group_id,
          sender_id: user.id,
          receiver_id: userId,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (inviteError) throw inviteError;

      setSearchResults([]);
      setSearchText('');
      Alert.alert('Success', 'Invitation sent!');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error inviting user:', error);
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId) => {
    try {
      // Check if removing this member would make group too small
      if (currentMembers.length <= 3) {
        Alert.alert('Error', 'Cannot remove member. Groups must have at least 3 members.');
        return;
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.group_id)
        .eq('user_id', userId);

      if (error) throw error;
      await loadCurrentMembers();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Error', 'Failed to remove member');
    }
  };
  const GroupCard = ({ group }) => (
    <View style={styles.groupCard}>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupDetails}>
          {group.semester_schedules.class_name} • {group.member_count} members
        </Text>
      </View>
      
      <View style={styles.groupActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => router.push(`/chat/group/${group.id}`)}
        >
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Chat</Text>
        </TouchableOpacity>
  
        <TouchableOpacity 
          style={[styles.actionButton, styles.infoButton]}
          onPress={() => handleViewDetails(group.id)}
        >
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Manage Group Members</Text>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search users to invite"
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          searchUsers(text);
        }}
      />

      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          {searchResults.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.searchResultItem}
              onPress={() => inviteUser(user.id)}
              disabled={loading}
            >
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Current Members ({currentMembers.length})
      </Text>
      <ScrollView style={styles.membersList}>
        {currentMembers.map((member) => (
          <View key={member.user_id} style={styles.memberItem}>
            <View>
              <Text style={styles.memberName}>{member.profiles.display_name}</Text>
              <Text style={styles.memberRole}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </Text>
            </View>
            {member.role !== 'admin' && (
              <TouchableOpacity
                onPress={() => removeMember(member.user_id)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};
export default function MyGroupsScreen() {
  const [loading, setLoading] = useState(true);
  const [myGroups, setMyGroups] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load groups user is a member of
      const { data: groupsData, error: groupsError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          joined_at,
          study_groups!inner (
            id,
            name,
            description,
            max_members,
            created_by,
            class_id,
            semester_schedules!inner (
              class_name,
              professor_name,
              term
            )
          )
        `)
        .eq('user_id', user.id);

      if (groupsError) throw groupsError;
      setMyGroups(groupsData || []);

      // Load invites sent TO this user
      const { data: invites, error: invitesError } = await supabase
        .from('group_join_requests')
        .select(`
          id,
          group_id,
          sender_id,
          receiver_id,
          status,
          created_at,
          study_groups!inner (
            id,
            name,
            description,
            max_members,
            semester_schedules!inner (
              class_name,
              professor_name,
              term
            )
          ),
          profiles!group_join_requests_sender_id_fkey (
            id,
            display_name,
            email
          )
        `)
        .eq('status', 'pending')
        .eq('receiver_id', user.id);

      if (invitesError) throw invitesError;
      setPendingInvites(invites || []);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load groups and invites');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (requestId, status) => {
    try {
      // Get the full request details
      const { data: request, error: requestError } = await supabase
        .from('group_join_requests')
        .select(`
          *,
          study_groups!inner (
            max_members,
            created_by
          )
        `)
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // If accepting, check member count
      if (status === 'accepted') {
        const { data: currentMembers, error: memberCountError } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', request.group_id);

        if (memberCountError) throw memberCountError;

        if (currentMembers.length >= request.study_groups.max_members) {
          Alert.alert('Error', 'This group has reached its maximum member limit');
          return;
        }
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('group_join_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If accepted, add to group members
      if (status === 'accepted') {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: request.group_id,
            user_id: request.receiver_id,
            role: 'member',
            joined_at: new Date().toISOString()
          });

        if (memberError) throw memberError;
      }

      loadData(); // Reload data
      Alert.alert(
        'Success', 
        status === 'accepted' ? 'You have joined the group!' : 'Invite declined'
      );
    } catch (error) {
      console.error('Error handling invite:', error);
      Alert.alert('Error', 'Failed to process invite');
    }
  };
  const renderGroupCard = (group) => (
    <View key={group.group_id} style={styles.groupCard}>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.study_groups.name}</Text>
        <Text style={styles.classInfo}>
          {group.study_groups.semester_schedules.class_name}
        </Text>
        <Text style={styles.termInfo}>
          {group.study_groups.semester_schedules.term}
        </Text>
        <Text style={styles.roleText}>
          Role: {group.role.charAt(0).toUpperCase() + group.role.slice(1)}
        </Text>
      </View>
      
      <View style={styles.groupActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.chatButton]}
          onPress={() => router.push(`/chat/group/${group.group_id}`)}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Chat</Text>
        </TouchableOpacity>
        
        {group.role === 'admin' && (
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={() => setSelectedGroup(group)}
          >
            <Ionicons name="people" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        {group.role !== 'admin' && (
          <TouchableOpacity 
            style={styles.leaveButton}
            onPress={() => leaveGroup(group.group_id)}
          >
            <Ionicons name="exit-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  const leaveGroup = async (groupId) => {
    try {
      // Check current member count
      const { data: members, error: memberError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId);

      if (memberError) throw memberError;

      if (members.length <= 3) {
        Alert.alert('Error', 'Cannot leave group. Groups must maintain at least 3 members.');
        return;
      }

      Alert.alert(
        'Leave Group',
        'Are you sure you want to leave this study group?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('group_members')
                  .delete()
                  .eq('group_id', groupId)
                  .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

                if (error) throw error;
                loadData();
              } catch (error) {
                console.error('Error leaving group:', error);
                Alert.alert('Error', 'Failed to leave group');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error checking member count:', error);
      Alert.alert('Error', 'Failed to process request');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {pendingInvites.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Invites</Text>
          {pendingInvites.map((invite) => (
            <View key={invite.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestText}>
                  <Text style={styles.boldText}>{invite.profiles.display_name}</Text> has invited you to join{' '}
                  <Text style={styles.boldText}>{invite.study_groups.name}</Text>
                </Text>
                <Text style={styles.classInfo}>
                  Class: {invite.study_groups.semester_schedules.class_name}
                </Text>
              </View>
              <View style={styles.requestButtons}>
                <TouchableOpacity 
                  style={[styles.requestButton, styles.acceptButton]}
                  onPress={() => handleInvite(invite.id, 'accepted')}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.requestButton, styles.declineButton]}
                  onPress={() => handleInvite(invite.id, 'rejected')}
                >
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Groups</Text>
        {myGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>You haven't joined any groups yet</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/study/create-groups')}
            >
              <Text style={styles.createButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myGroups.map((group) => (
            <View key={group.group_id} style={styles.groupCard}>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.study_groups.name}</Text>
                <Text style={styles.classInfo}>
                  {group.study_groups.semester_schedules.class_name}
                </Text>
                <Text style={styles.termInfo}>
                  {group.study_groups.semester_schedules.term}
                </Text>
                <Text style={styles.roleText}>
                  Role: {group.role.charAt(0).toUpperCase() + group.role.slice(1)}
                </Text>
              </View>
              
              <View style={styles.groupActions}>
                {group.role === 'admin' && (
                  <TouchableOpacity 
                    style={styles.manageButton}
                    onPress={() => setSelectedGroup(group)}
                  >
                    <Ionicons name="people" size={24} color="#007AFF" />
                  </TouchableOpacity>
                )}
                {group.role !== 'admin' && (
                  <TouchableOpacity 
                    style={styles.leaveButton}
                    onPress={() => leaveGroup(group.group_id)}
                  >
                    <Ionicons name="exit-outline" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <Modal
        visible={selectedGroup !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedGroup(null)}
      >
        {selectedGroup && (
          <GroupManagement
            group={selectedGroup}
            onClose={() => setSelectedGroup(null)}
            onUpdate={loadData}
          />
        )}
      </Modal>
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  requestCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestInfo: {
    marginBottom: 12,
  },
  requestText: {
    fontSize: 16,
    color: '#333',
  },
  boldText: {
    fontWeight: '600',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  requestButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  groupCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  classInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  termInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  groupActions: {
    flexDirection: 'row'
  },
  groupActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    manageButton: {
      marginRight: 8,
      padding: 4,
    },
    leaveButton: {
      justifyContent: 'center',
      padding: 4,
    },
    emptyState: {
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: '#666',
      marginTop: 12,
      marginBottom: 16,
      textAlign: 'center',
    },
    createButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    createButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
    },
    modalContent: {
      backgroundColor: '#fff',
      margin: 20,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#333',
    },
    searchInput: {
      backgroundColor: '#f5f5f5',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      fontSize: 16,
    },
    searchResults: {
      marginBottom: 16,
      maxHeight: 200,
    },
    searchResultItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
    },
    userEmail: {
      fontSize: 14,
      color: '#666',
    },
    membersList: {
      maxHeight: 300,
    },
    memberItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    memberName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
    },
    memberRole: {
      fontSize: 14,
      color: '#666',
    },
    removeButton: {
      padding: 4,
    },
    closeButton: {
      marginTop: 16,
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
    },
      groupCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
      },
      groupInfo: {
        marginBottom: 12,
      },
      groupName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
      },
      groupDetails: {
        fontSize: 14,
        color: '#7F8C8D',
      },
      groupActions: {
        flexDirection: 'row',
        gap: 8,
      },
      actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
      },
      messageButton: {
        backgroundColor: '#007AFF',
      },
      infoButton: {
        backgroundColor: '#E3F2FD',
      },
      actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
      },
      groupActions: {
        flexDirection: 'column',
        gap: 8,
        justifyContent: 'center',
      },
      actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
      },
      chatButton: {
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
      },
      actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
      },
    });
  