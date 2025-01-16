// app/chat/group/schedule.tsx
import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';

export default function ScheduleMeeting() {
  const { groupId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSchedule = async () => {
    if (!title || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create meeting
      const { data: meeting, error: meetingError } = await supabase
        .from('group_meetings')
        .insert({
          group_id: groupId,
          created_by: user.id,
          title,
          description,
          location,
          meeting_date: date.toISOString()
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Get group members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          profiles (
            display_name
          )
        `)
        .eq('group_id', groupId)
        .neq('user_id', user.id);

      if (membersError) throw membersError;

      // Create meeting responses for all members
      const responses = members.map(member => ({
        meeting_id: meeting.id,
        user_id: member.user_id,
        status: 'pending'
      }));

      const { error: responsesError } = await supabase
        .from('meeting_responses')
        .insert(responses);

      if (responsesError) throw responsesError;

      // Add your own response
      const { error: ownResponseError } = await supabase
        .from('meeting_responses')
        .insert({
          meeting_id: meeting.id,
          user_id: user.id,
          status: 'accepted' // Creator automatically accepts
        });

      if (ownResponseError) throw ownResponseError;

      // Create a group message about the meeting
      const { error: messageError } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: `📅 New Meeting: ${title}`,
          is_system_message: true,
          meeting_id: meeting.id
        });

      if (messageError) throw messageError;

      // Get creator's name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create a system message showing response widget
      const { error: responseMessageError } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: `${profile.display_name} created a meeting: ${title}`,
          is_system_message: true,
          meeting_id: meeting.id
        });

      if (responseMessageError) throw responseMessageError;

      Alert.alert('Success', 'Meeting scheduled successfully');
      router.back();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Schedule Meeting',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSchedule}
              disabled={loading}
            >
              <Text style={[
                styles.headerButton, 
                loading && styles.headerButtonDisabled
              ]}>
                Schedule
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Meeting Title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />

        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={24} color="#007AFF" />
          <Text style={styles.dateButtonText}>
            {date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time" size={24} color="#007AFF" />
          <Text style={styles.dateButtonText}>
            {date.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </Text>
        </TouchableOpacity>

        {(showDatePicker || showTimePicker) && (
          <DateTimePicker
            value={date}
            mode={showDatePicker ? 'date' : 'time'}
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              const currentDate = selectedDate || date;
              setShowDatePicker(false);
              setShowTimePicker(false);
              setDate(currentDate);
            }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  headerButton: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 16,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
});