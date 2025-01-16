import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import ProfileImage from '../components/Profile/ProfileImage';
import { supabase } from '../../supabaseClient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  major: string | null;
  year: string | null;
  student_id: string | null;
  current_status: string | null;
  about_me: string | null;
  has_completed_setup: boolean;
}

export default function ProfileSetup() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState<string | null>(null);
  const [yearOpen, setYearOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [major, setMajor] = useState('');

  const yearItems = [
    { label: 'Freshman', value: 'freshman' },
    { label: 'Sophomore', value: 'sophomore' },
    { label: 'Junior', value: 'junior' },
    { label: 'Senior', value: 'senior' },
  ];

  const isValidUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
    return usernameRegex.test(username);
  };

  const checkUsername = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !data;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleComplete = async () => {
    if (!username || !displayName || !studentId || !year || !major) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!isValidUsername(username)) {
      Alert.alert(
        'Invalid Username', 
        'Username must be 3-20 characters long, start with a letter, and contain only letters, numbers, and underscores.'
      );
      return;
    }

    setLoading(true);

    try {
      const isAvailable = await checkUsername(username);
      if (!isAvailable) {
        Alert.alert('Username Taken', 'Please choose a different username.');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found.');

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username.toLowerCase(),
          display_name: displayName,
          student_id: studentId,
          year,
          major,
          avatar_url: avatarUrl,
          has_completed_setup: true,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      router.replace('/semester-setup');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>Let others know who you are</Text>
            </View>

            <View style={styles.imageContainer}>
              <ProfileImage 
                url={avatarUrl}
                onUpload={setAvatarUrl}
                userId={null}
              />
              <Text style={styles.imageHint}>Tap to add profile picture</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="at" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username (unique)"
                  value={username}
                  onChangeText={text => setUsername(text.trim())}
                  editable={!loading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Display Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  editable={!loading}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Student ID"
                  value={studentId}
                  onChangeText={setStudentId}
                  keyboardType="numeric"
                  editable={!loading}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="book-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Major (e.g. Computer Science)"
                  value={major}
                  onChangeText={setMajor}
                  editable={!loading}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.dropdownContainer}>
                <DropDownPicker
                  open={yearOpen}
                  value={year}
                  items={yearItems}
                  setOpen={setYearOpen}
                  setValue={setYear}
                  placeholder="Select Year"
                  style={styles.dropdown}
                  textStyle={styles.dropdownText}
                  disabled={loading}
                  placeholderStyle={styles.dropdownPlaceholder}
                  dropDownContainerStyle={styles.dropdownList}
                  zIndex={1000}
                />
              </View>

              <Text style={styles.usernameInfo}>
                Username must be 3-20 characters long and can contain letters, numbers, and underscores.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue to Schedule Setup</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 20,
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    height: '100%',
  },
  dropdownContainer: {
    marginBottom: 120, // Fixed height instead of dynamic
  },
  dropdown: {
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  dropdownPlaceholder: {
    color: '#666',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  usernameInfo: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginTop: -8,
  }
});