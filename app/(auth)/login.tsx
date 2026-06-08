import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
  
      // Validate inputs before attempting login
      if (!validateEmail(email) || !validatePassword(password)) {
        setLoading(false);
        return;
      }
  
      // Sign in user
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
  
      if (signInError) throw signInError;
  
      if (!authData.user) {
        Alert.alert("Login Failed", "No user returned from Supabase.");
        return;
      }
  
      // First check if basic profile exists and is complete
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
  
      if (profileError) {
        // If profile doesn't exist, send to profile setup
        if (profileError.code === 'PGRST116') {
          router.replace('/profile-setup');
          return;
        }
        throw profileError;
      }
  
      // If profile isn't complete, send to profile setup
      if (!profile.has_completed_setup) {
        router.replace('/profile-setup');
        return;
      }
  
      // Since user has completed profile setup, go to main app
      router.replace('/(tabs)');
  
    } catch (error: any) {
      console.error("Login Error:", error);
      Alert.alert(
        "Login Failed", 
        error.message || "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Ensure a valid email is provided
    if (!validateEmail(email)) {
      Alert.alert("Forgot Password", "Please enter a valid email address first.");
      return;
    }
    try {
      setLoading(true);
      // Call Supabase's resetPasswordForEmail function.
      // Replace the redirectTo URL with your actual reset password page URL or deep link.
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'studify://update-password' // For example, if using a custom scheme
        // OR, if using a web URL: 'https://your-app-url.com/update-password'
      });
      if (error) throw error;
      Alert.alert("Success", "Check your email for password reset instructions.");
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      Alert.alert("Error", error.message || "Failed to send reset password email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Welcome to Semster</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              validateEmail(text);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
            placeholderTextColor="#666"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TextInput
            style={[styles.input, passwordError && styles.inputError]}
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              validatePassword(text);
            }}
            secureTextEntry
            editable={!loading}
            autoComplete="password"
            placeholderTextColor="#666"
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Forgot Password Link */}
        <TouchableOpacity style={styles.linkButton} onPress={handleForgotPassword}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
    gap: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -12,
    marginLeft: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    height: 56,
  },
  buttonDisabled: {
    backgroundColor: '#99c9ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 10,
    alignItems: 'center',
    padding: 12,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  }
});
