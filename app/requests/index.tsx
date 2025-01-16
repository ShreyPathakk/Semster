// app/requests/index.tsx
import { useState, useEffect } from 'react';
import { 
 View, 
 Text, 
 StyleSheet, 
 TouchableOpacity, 
 ScrollView, 
 Alert,
 ActivityIndicator,
 Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../supabaseClient';

export default function RequestsScreen() {
 const router = useRouter();
 const [loading, setLoading] = useState(true);
 const [friendRequests, setFriendRequests] = useState([]);
 const [groupRequests, setGroupRequests] = useState([]);

 useEffect(() => {
   loadRequests();
   const interval = setInterval(loadRequests, 30000); // Refresh every 30 seconds
   return () => clearInterval(interval);
 }, []);

 const loadRequests = async () => {
   try {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error('No user found');

     // Load friend requests with sender profile info
     const { data: friendData, error: friendError } = await supabase
       .from('friendship_requests')
       .select(`
         *,
         sender:profiles!friendship_requests_sender_id_fkey (
           id,
           display_name,
           avatar_url,
           major,
           year
         )
       `)
       .eq('receiver_id', user.id)
       .eq('status', 'pending');

     if (friendError) throw friendError;
     setFriendRequests(friendData || []);

     // Load group requests
     const { data: groupData, error: groupError } = await supabase
       .from('group_join_requests')
       .select(`
         *,
         study_groups (
           id,
           name,
           description
         ),
         sender:profiles!group_join_requests_sender_id_fkey (
           id,
           display_name,
           avatar_url
         )
       `)
       .eq('receiver_id', user.id)
       .eq('status', 'pending');

     if (groupError) throw groupError;
     setGroupRequests(groupData || []);
   } catch (error) {
     console.error('Error:', error);
     Alert.alert('Error', 'Failed to load requests');
   } finally {
     setLoading(false);
   }
 };

 const handleFriendRequest = async (requestId, accept) => {
   try {
     const request = friendRequests.find(r => r.id === requestId);
     if (!request) return;

     // Optimistically update UI
     setFriendRequests(prev => prev.filter(r => r.id !== requestId));

     if (accept) {
       const { error: friendshipError } = await supabase
         .from('friendships')
         .insert({
           user_id1: request.sender_id,
           user_id2: request.receiver_id,
           created_at: new Date().toISOString()
         });

       if (friendshipError) {
         // Revert optimistic update on error
         setFriendRequests(prev => [...prev, request]);
         throw friendshipError;
       }
     }

     // Update request status
     const { error: updateError } = await supabase
       .from('friendship_requests')
       .update({ 
         status: accept ? 'accepted' : 'rejected',
         updated_at: new Date().toISOString()
       })
       .eq('id', requestId);

     if (updateError) {
       // Revert optimistic update on error
       setFriendRequests(prev => [...prev, request]);
       throw updateError;
     }

     Alert.alert('Success', `Friend request ${accept ? 'accepted' : 'declined'}`);
   } catch (error) {
     console.error('Error:', error);
     Alert.alert('Error', 'Failed to process request');
   }
 };

 const handleGroupRequest = async (requestId, accept) => {
   try {
     const request = groupRequests.find(r => r.id === requestId);
     if (!request) return;

     // Optimistically update UI
     setGroupRequests(prev => prev.filter(r => r.id !== requestId));

     if (accept) {
       const { error: memberError } = await supabase
         .from('group_members')
         .insert({
           group_id: request.study_groups.id,
           user_id: request.receiver_id,
           role: 'member',
           joined_at: new Date().toISOString()
         });

       if (memberError) {
         // Revert optimistic update on error
         setGroupRequests(prev => [...prev, request]);
         throw memberError;
       }
     }

     const { error: updateError } = await supabase
       .from('group_join_requests')
       .update({ 
         status: accept ? 'accepted' : 'rejected',
         updated_at: new Date().toISOString()
       })
       .eq('id', requestId);

     if (updateError) {
       // Revert optimistic update on error
       setGroupRequests(prev => [...prev, request]);
       throw updateError;
     }

     Alert.alert('Success', `Group invitation ${accept ? 'accepted' : 'declined'}`);
   } catch (error) {
     console.error('Error:', error);
     Alert.alert('Error', 'Failed to process request');
   }
 };

 if (loading) {
   return (
     <View style={styles.centered}>
       <ActivityIndicator size="large" color="#007AFF" />
     </View>
   );
 }

 return (
   <View style={styles.container}>
     <Stack.Screen 
       options={{
         title: "Requests",
         headerShadowVisible: false,
       }} 
     />

     <ScrollView style={styles.content}>
       {/* Friend Requests */}
       {friendRequests.length > 0 && (
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Friend Requests</Text>
           {friendRequests.map(request => (
             <View key={request.id} style={styles.requestCard}>
               <TouchableOpacity 
                 style={styles.userInfo}
                 onPress={() => router.push(`/(user)/${request.sender.id}`)}
               >
                 <Image 
                   source={{ 
                     uri: request.sender.avatar_url || 'https://via.placeholder.com/40'
                   }} 
                   style={styles.avatar}
                 />
                 <View style={styles.userDetails}>
                   <Text style={styles.name}>{request.sender.display_name}</Text>
                   <Text style={styles.details}>
                     {request.sender.major} • {request.sender.year}
                   </Text>
                 </View>
               </TouchableOpacity>
               <View style={styles.actions}>
                 <TouchableOpacity 
                   style={[styles.actionButton, styles.acceptButton]}
                   onPress={() => handleFriendRequest(request.id, true)}
                 >
                   <Ionicons name="checkmark" size={20} color="#fff" />
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.actionButton, styles.declineButton]}
                   onPress={() => handleFriendRequest(request.id, false)}
                 >
                   <Ionicons name="close" size={20} color="#fff" />
                 </TouchableOpacity>
               </View>
             </View>
           ))}
         </View>
       )}

       {/* Group Invites */}
       {groupRequests.length > 0 && (
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Group Invitations</Text>
           {groupRequests.map(request => (
             <View key={request.id} style={styles.requestCard}>
               <View style={styles.groupInfo}>
                 <Text style={styles.groupName}>{request.study_groups.name}</Text>
                 <Text style={styles.inviteDetails}>
                   Invited by {request.sender.display_name}
                 </Text>
                 {request.study_groups.description && (
                   <Text style={styles.description}>
                     {request.study_groups.description}
                   </Text>
                 )}
               </View>
               <View style={styles.actions}>
                 <TouchableOpacity 
                   style={[styles.actionButton, styles.acceptButton]}
                   onPress={() => handleGroupRequest(request.id, true)}
                 >
                   <Ionicons name="checkmark" size={20} color="#fff" />
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.actionButton, styles.declineButton]}
                   onPress={() => handleGroupRequest(request.id, false)}
                 >
                   <Ionicons name="close" size={20} color="#fff" />
                 </TouchableOpacity>
               </View>
             </View>
           ))}
         </View>
       )}

       {friendRequests.length === 0 && groupRequests.length === 0 && (
         <View style={styles.emptyState}>
           <Ionicons name="notifications" size={48} color="#ccc" />
           <Text style={styles.emptyText}>No pending requests</Text>
         </View>
       )}
     </ScrollView>
   </View>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#fff',
 },
 centered: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
 },
 content: {
   flex: 1,
 },
 section: {
   padding: 20,
 },
 sectionTitle: {
   fontSize: 18,
   fontWeight: '600',
   marginBottom: 15,
   color: '#333',
 },
 requestCard: {
   backgroundColor: '#f8f9fa',
   borderRadius: 12,
   padding: 16,
   marginBottom: 12,
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
 },
 userInfo: {
   flex: 1,
   flexDirection: 'row',
   alignItems: 'center',
   marginRight: 12,
 },
 avatar: {
   width: 50,
   height: 50,
   borderRadius: 25,
   marginRight: 12,
   backgroundColor: '#e1e1e1',
 },
 userDetails: {
   flex: 1,
 },
 name: {
   fontSize: 16,
   fontWeight: '600',
   color: '#333',
   marginBottom: 4,
 },
 details: {
   fontSize: 14,
   color: '#666',
 },
 groupInfo: {
   flex: 1,
   marginRight: 12,
 },
 groupName: {
   fontSize: 16,
   fontWeight: '600',
   color: '#333',
   marginBottom: 4,
 },
 inviteDetails: {
   fontSize: 14,
   color: '#666',
   marginBottom: 4,
 },
 description: {
   fontSize: 14,
   color: '#666',
   marginTop: 4,
 },
 actions: {
   flexDirection: 'row',
   gap: 8,
 },
 actionButton: {
   width: 40,
   height: 40,
   borderRadius: 20,
   justifyContent: 'center',
   alignItems: 'center',
 },
 acceptButton: {
   backgroundColor: '#4CAF50',
 },
 declineButton: {
   backgroundColor: '#FF3B30',
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
 },
});