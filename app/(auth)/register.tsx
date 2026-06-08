import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../supabaseClient';
import DateTimePicker from '@react-native-community/datetimepicker';

// Import your policy components
import CaliforniaConsumerPrivacyAct from '../components/CaliforniaConsumerPrivacyAct';
import PrivacyPolicy from '../components/PrivacyPolicy';
import TermsAndConditions from '../components/TermsAndConditions';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Policies acceptance
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [visiblePolicy, setVisiblePolicy] = useState<null | 'terms' | 'privacy' | 'california'>(null);

  // Function to calculate age
  const calculateAge = (birthday: Date) => {
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle date picker changes
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // Only hide the picker for Android
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleRegister = async () => {
    // Validate required fields and conditions here...
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!policiesAccepted) {
      Alert.alert('Error', 'You must agree to our policies to register.');
      return;
    }
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      Alert.alert('Error', 'You must be at least 18 years old to register.');
      return;
    }

    try {
      setLoading(true);

      // Format the date of birth as YYYY-MM-DD for storage
      const formattedDOB = dateOfBirth.toISOString().split('T')[0];
  
      // 1. Sign up user with Supabase
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            date_of_birth: formattedDOB
          }
        }
      });
      
      if (error) throw error;
  
      // 2. If signup was successful, set up a login to get a session
      if (data.user) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!signInError && signInData.session) {
          // Now with an active session, update the profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              date_of_birth: formattedDOB,
              agreements_accepted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);
            
          if (updateError) {
            console.error('Profile update error:', updateError);
            Alert.alert('Warning', 'Account created but profile information may be incomplete.');
          }
          
          // Sign out since we're redirecting to login
          await supabase.auth.signOut();
        }
      }
  
      Alert.alert('Success', 'Please login and continue.');
      router.replace('/login'); // Redirect to login
  
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email (@sjsu.edu)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor="#666"
            />

            {/* Date of Birth Picker */}
            <View style={styles.dobContainer}>
              <Text style={styles.dobLabel}>Date of Birth (Must be 18+)</Text>
              <TouchableOpacity 
                style={styles.dobButton} 
                onPress={() => setShowPicker(true)}
              >
                <Text>{formatDate(dateOfBirth)}</Text>
              </TouchableOpacity>
              
              {showPicker && (
                <DateTimePicker
                  value={dateOfBirth}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()} // Can't select future dates
                />
              )}
            </View>

            {/* Policies Agreement Section */}
            <View style={styles.agreementContainer}>
              <Pressable onPress={() => setPoliciesAccepted(!policiesAccepted)} style={styles.checkboxContainer}>
                <View style={[styles.checkbox, policiesAccepted && styles.checkboxChecked]}>
                  {policiesAccepted && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
              </Pressable>
              <Text style={styles.agreementText}>
                I agree to the{' '}
                <Text style={styles.linkText} onPress={() => setVisiblePolicy('terms')}>
                  Terms & Conditions
                </Text>
                {', '}
                <Text style={styles.linkText} onPress={() => setVisiblePolicy('privacy')}>
                  Privacy Policy
                </Text>
                {', and '}
                <Text style={styles.linkText} onPress={() => setVisiblePolicy('california')}>
                  California Consumer Privacy Act
                </Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal to display policy content */}
      {visiblePolicy !== null && (
        <Modal visible={true} animationType="slide" transparent={false}>
          <View style={styles.modalContent}>
            <Pressable onPress={() => setVisiblePolicy(null)} style={styles.modalCloseContainer}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
            {visiblePolicy === 'terms' && <TermsAndConditions />}
            {visiblePolicy === 'privacy' && <PrivacyPolicy />}
            {visiblePolicy === 'california' && <CaliforniaConsumerPrivacyAct />}
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#99c9ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Date of Birth styles
  dobContainer: {
    marginTop: 8,
  },
  dobLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  dobButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  // Agreement section styles
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  checkboxContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxTick: {
    color: '#fff',
    fontWeight: 'bold',
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  // Modal styles
  modalContent: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  modalCloseContainer: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
