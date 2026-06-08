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
import { useState, useEffect } from 'react';

export default function ProfileSetup() {
  // Basic fields
  const [username, setUsername]     = useState('');
  const [displayName, setDisplayName] = useState('');
  const [year, setYear]             = useState<string | null>(null);
  const [major, setMajor]           = useState('');
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);

  // UI states
  const [yearOpen, setYearOpen]     = useState(false);
  const [loading, setLoading]       = useState(false);

  // So we can pass to ProfileImage
  const [userId, setUserId]         = useState<string | null>(null);

  const yearItems = [
    { label: 'Freshman', value: 'Freshman' },
    { label: 'Sophomore', value: 'Sophomore' },
    { label: 'Junior',   value: 'Junior' },
    { label: 'Senior',   value: 'Senior' },
  ];

  useEffect(() => {
    checkFirstTimeSetup();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkFirstTimeSetup = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        console.error('No valid session or error:', sessionError);
        router.replace('/login');
        return;
      }

      setUserId(session.user.id);

      // Refresh session just like your code
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
        router.replace('/login');
        return;
      }

      // Fetch the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError || profileError.code === 'PGRST116') {
        // If we got a profile, populate
        if (profile) {
          if (profile.has_completed_setup) {
            router.replace('/home');
            return;
          }
          setUsername(profile.username || '');
          setDisplayName(profile.display_name || '');
          setYear(profile.year || null);
          setMajor(profile.major || '');
          setAvatarUrl(profile.avatar_url || null);
        }
      } else {
        console.error('Profile fetch error:', profileError);
      }
    } catch (error) {
      console.error('Setup check error:', error);
      Alert.alert(
        'Authentication Error',
        'Please try logging in again.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    }
  };

  const isValidUsername = (value: string) => {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
    return usernameRegex.test(value);
  };

  // Check if username is taken
  const checkUsername = async (desiredUsername: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', desiredUsername.toLowerCase())
        .neq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      // If data exists, that means username is taken
      return !data;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await supabase.auth.refreshSession();
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        Alert.alert('Session Expired', 'Please log in again.');
        router.replace('/login');
        return;
      }

      // Validate username
      if (!isValidUsername(username)) {
        Alert.alert('Invalid Username', 'Must start with a letter and be 3-20 chars (letters, numbers, underscores).');
        return;
      }

      // Check if available
      const isAvailable = await checkUsername(username);
      if (!isAvailable) {
        Alert.alert('Username Taken', 'Please pick a different username.');
        return;
      }

      // Upsert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          username: username.toLowerCase(),
          display_name: displayName,
          year,
          major,
          avatar_url: avatarUrl,
          has_completed_setup: true,
          updated_at: new Date().toISOString(),
        });
      if (profileError) throw profileError;

      router.replace('/semester-setup');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', err.message || 'Failed to save your profile.');
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
        <ScrollView
          style={styles.container}
          nestedScrollEnabled
        >
          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>Let others know who you are</Text>
            </View>

            <View style={styles.imageContainer}>
              {/* Pass the actual userId here */}
              <ProfileImage 
                url={avatarUrl}
                onUpload={setAvatarUrl}
                userId={userId}
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
                <Ionicons name="book-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Major"
                  value={major}
                  onChangeText={setMajor}
                  editable={!loading}
                  placeholderTextColor="#666"
                />
              </View>

              <DropDownPicker
                open={yearOpen}
                value={year}
                items={yearItems}
                setOpen={setYearOpen}
                setValue={setYear}
                placeholder="Select Year"
                listMode="MODAL"              // Avoid nested VirtualizedList
                style={styles.dropdown}
                textStyle={styles.dropdownText}
                disabled={loading}
                placeholderStyle={styles.dropdownPlaceholder}
                dropDownContainerStyle={styles.dropdownList}
                zIndex={1000}
              />

              <Text style={styles.usernameInfo}>
                Username must be 3-20 characters, start with a letter, 
                and can contain letters, numbers, and underscores.
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

// ---------- Styles ----------
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
  },
});
