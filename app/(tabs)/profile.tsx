// app/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../supabaseClient';
import ProfileImage from '../components/Profile/ProfileImage';
// If available, import policy components:
import PrivacyPolicy from '../components/PrivacyPolicy';
import TermsAndConditions from '../components/TermsAndConditions';
import CaliforniaConsumerPrivacyAct from '../components/CaliforniaConsumerPrivacyAct';

// Define our elegant color scheme (UK–Californian vibe)
const COLORS = {
  primary: '#00838F',      // Teal
  accent: '#FF6F61',       // Pinkish accent
  background: '#FFFFFF',   // Clean white background
  surface: '#F5F7F8',      // Light neutral surface
  textPrimary: '#2C3A41',  // Dark slate for primary text
  textSecondary: '#5C6B73',// Medium gray for secondary text
  error: '#D32F2F',        // Bold red for destructive actions
};

export default function ProfileScreen() {
  // Profile states
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [major, setMajor] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Editing modal states
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingMajor, setIsEditingMajor] = useState(false);
  const [isEditingYear, setIsEditingYear] = useState(false);

  // Settings & Policy modal states
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showCCPA, setShowCCPA] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  // Load profile information from Supabase
  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        if (profile) {
          setUserProfile(profile);
          setAvatarUrl(profile.avatar_url);
          setDisplayName(profile.display_name || '');
          setUsername(profile.username || '');
          setCurrentStatus(profile.current_status || '');
          setAboutMe(profile.about_me || '');
          setMajor(profile.major || '');
          setSelectedYear(profile.year || '');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  // Update functions using Supabase
  const updateAvatar = async (url: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);
      if (error) throw error;
      setAvatarUrl(url);
      loadProfile();
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update profile picture.');
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
      loadProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during sign out.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      // Update profile with minimal information instead of deleting
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          display_name: '[Deleted User]',
          username: `deleted_${Date.now()}`,
          about_me: '',
          current_status: '',
          major: '',
          year: '',
          avatar_url: null
        })
        .eq('id', user.id);
  
      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error('Unable to process account deletion. Please contact support.');
      }
  
      // Sign out the user
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
      
      Alert.alert(
        'Account Deactivated',
        'Your account has been deactivated. Please contact support if you need to permanently delete your account.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to deactivate account.');
    }
  };

  // Handle update functions for editing modals
  const handleDisplayNameUpdate = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty.');
      return;
    }
    await updateProfile({ display_name: displayName.trim() });
    setIsEditingDisplayName(false);
  };

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    // Optional: add username validation logic here
    try {
      // Check if username is taken (excluding the current user)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', userProfile.id)
        .single();
      if (existingUser) {
        Alert.alert('Error', 'This username is already taken.');
        return;
      }
      await updateProfile({ username: username.toLowerCase() });
      setIsEditingUsername(false);
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', 'Failed to update username.');
    }
  };

  const handleStatusUpdate = async () => {
    await updateProfile({ current_status: currentStatus });
    setIsEditingStatus(false);  
  };

  const handleAboutUpdate = async () => {
    await updateProfile({ about_me: aboutMe });
    setIsEditingAbout(false);
  };

  const handleMajorUpdate = async () => {
    await updateProfile({ major });
    setIsEditingMajor(false);
  };

  const handleYearUpdate = async () => {
    await updateProfile({ year: selectedYear });
    setIsEditingYear(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* HEADER SECTION WITH GRADIENT */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.accent]}
        style={styles.headerContainer}
      >
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setIsSettingsVisible(true)}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <ProfileImage
          url={avatarUrl}
          onUpload={updateAvatar}
          userId={userProfile?.id}
          style={styles.profileImage}
          editButtonColor="#000"
        />
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{displayName}</Text>
          <TouchableOpacity onPress={() => setIsEditingDisplayName(true)}>
            <Ionicons name="pencil" size={18} color={COLORS.surface} style={styles.editIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.username}>@{username}</Text>
          <TouchableOpacity onPress={() => setIsEditingUsername(true)}>
            <Ionicons name="pencil" size={18} color={COLORS.surface} style={styles.editIcon} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* CONTENT SECTION */}
      <View style={styles.content}>
        {/* "About Me" Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>About Me</Text>
            <TouchableOpacity onPress={() => setIsEditingAbout(true)}>
              <Ionicons name="pencil" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardContent}>
            {userProfile?.about_me || 'Tell others about yourself...'}
          </Text>
        </View>

        {/* Status (Mood) Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status</Text>
            <TouchableOpacity onPress={() => setIsEditingStatus(true)}>
              <Ionicons name="pencil" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardContent}>
            {userProfile?.current_status || 'What\'s on your mind?'}
          </Text>
        </View>

        {/* Row Cards for Year & Major */}
        <View style={styles.rowContainer}>
          <TouchableOpacity style={styles.smallCard} onPress={() => setIsEditingYear(true)}>
            <Ionicons name="school" size={20} color={COLORS.primary} />
            <Text style={styles.smallCardText}>
              {userProfile?.year || 'Year'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallCard} onPress={() => setIsEditingMajor(true)}>
            <Ionicons name="book" size={20} color={COLORS.accent} />
            <Text style={styles.smallCardText}>
              {userProfile?.major || 'Major'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.card, styles.signOutCard]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={[styles.cardContent, { color: COLORS.error, fontWeight: '700' }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODALS SECTION */}
      {/* Settings Modal */}
      <Modal
        visible={isSettingsVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsSettingsVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setIsSettingsVisible(false);
                setShowPrivacyPolicy(true);
              }}
            >
              <Ionicons name="shield-outline" size={24} color={COLORS.textPrimary} />
              <Text style={styles.settingsOptionText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setIsSettingsVisible(false);
                setShowTerms(true);
              }}
            >
              <Ionicons name="document-text-outline" size={24} color={COLORS.textPrimary} />
              <Text style={styles.settingsOptionText}>Terms & Conditions</Text>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setIsSettingsVisible(false);
                setShowCCPA(true);
              }}
            >
              <Ionicons name="document-text-outline" size={24} color={COLORS.textPrimary} />
              <Text style={styles.settingsOptionText}>CCPA</Text>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingsOption, styles.deleteOption]}
              onPress={() => {
                setIsSettingsVisible(false);
                setShowDeleteConfirm(true);
              }}
            >
              <Ionicons name="trash-outline" size={24} color={COLORS.error} />
              <Text style={[styles.settingsOptionText, styles.deleteText]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyPolicy}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPrivacyPolicy(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.policyContent}>
              <PrivacyPolicy />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTerms}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTerms(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.policyContent}>
              <TermsAndConditions />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CCPA Modal */}
      <Modal
        visible={showCCPA}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowCCPA(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CCPA</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCCPA(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.policyContent}>
              <CaliforniaConsumerPrivacyAct />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.deleteWarningText}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={[styles.modalButtonText, styles.deleteButtonText]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Year Modal */}
      <Modal
        visible={isEditingYear}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsEditingYear(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsEditingYear(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.yearOptions}>
              {['Freshman', 'Sophomore', 'Junior', 'Senior'].map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearOption,
                    selectedYear === year && styles.selectedYearOption,
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text
                    style={[
                      styles.yearOptionText,
                      selectedYear === year && styles.selectedYearOptionText,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsEditingYear(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleYearUpdate}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Display Name Modal */}
      <Modal
        visible={isEditingDisplayName}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsEditingDisplayName(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Display Name</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsEditingDisplayName(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={50}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsEditingDisplayName(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleDisplayNameUpdate}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Username Modal */}
      <Modal
        visible={isEditingUsername}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsEditingUsername(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Username</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsEditingUsername(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Username must start with a letter and can only contain letters, numbers, and underscores.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter new username"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsEditingUsername(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleUsernameUpdate}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Status Modal */}
      <Modal
        visible={isEditingStatus}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsEditingStatus(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsEditingStatus(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={currentStatus}
              onChangeText={setCurrentStatus}
              placeholder="What's on your mind?"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={50}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsEditingStatus(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleStatusUpdate}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit About Me Modal */}
      <Modal
        visible={isEditingAbout}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsEditingAbout(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Me</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsEditingAbout(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.modalInput, styles.modalAboutInput]}
              value={aboutMe}
              onChangeText={setAboutMe}
              placeholder="Tell others about yourself..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={200}
              autoFocus={true}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsEditingAbout(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleAboutUpdate}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Major Modal */}
      <Modal
        visible={isEditingMajor}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsEditingMajor(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Major</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsEditingMajor(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={major}
              onChangeText={setMajor}
              placeholder="Your major (e.g. Computer Science)"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={50}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsEditingMajor(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleMajorUpdate}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Base container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header styles
  headerContainer: {
    height: 250,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 1,
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.background,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.background,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  username: {
    fontSize: 16,
    color: COLORS.background,
    opacity: 0.9,
    marginTop: 4,
  },
  editIcon: {
    marginLeft: 8,
  },
  // Content section
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  smallCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  smallCardText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 8,
    fontWeight: '600',
  },
  signOutCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.surface,
    color: COLORS.textPrimary,
  },
  modalAboutInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surface,
    marginHorizontal: 5,
  },
  modalSaveButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveButtonText: {
    color: COLORS.background,
  },
  policyContent: {
    flex: 1,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingsOptionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  deleteOption: {
    backgroundColor: COLORS.surface,
    marginTop: 24,
  },
  deleteText: {
    color: COLORS.error,
  },
  deleteWarningText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  yearOptions: {
    marginBottom: 24,
  },
  yearOption: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  selectedYearOption: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  yearOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedYearOptionText: {
    color: COLORS.background,
    fontWeight: '600',
  },
});

