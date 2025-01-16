// app/profile.tsx
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../supabaseClient';
import { useState, useEffect } from 'react';
import ProfileImage from '../components/Profile/ProfileImage';
import { Ionicons } from '@expo/vector-icons';

// Define color scheme
const COLORS = {
  primary: '#00838F',     // Elegant teal
  secondary: '#4A6670',   // Deep slate blue
  accent: '#B4A5A5',      // Muted mauve
  success: '#2E7D72',     // Deep teal green
  warning: '#8D6E63',     // Warm brown
  error: '#D32F2F',       // Elegant red
  background: '#FFFFFF',
  surface: '#F5F7F8',     // Light gray-blue
  card: {
    primary: '#E3F2FD',   // Light blue
    success: '#E8F5E9',   // Light green
    neutral: '#F8F9FA',   // Light gray
  },
  text: {
    primary: '#2C3A41',   // Dark slate
    secondary: '#5C6B73', // Medium gray
    light: '#8E9BA1',     // Light gray
    inverse: '#FFFFFF'    // White text
  },
  border: '#E1E8EB',      // Light border color
  divider: '#EDF1F2'      // Subtle divider color
};

export default function ProfileScreen() {
  // State declarations
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingMajor, setIsEditingMajor] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [major, setMajor] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Username validation function
  const isValidUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
    return usernameRegex.test(username);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setUserProfile(profile);
          setAvatarUrl(profile.avatar_url);
          setCurrentStatus(profile.current_status || '');
          setAboutMe(profile.about_me || '');
          setMajor(profile.major || '');
          setDisplayName(profile.display_name || '');
          setUsername(profile.username || '');
          setSelectedYear(profile.year || '');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvatar = async (url) => {
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
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  const updateProfile = async (updates) => {
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
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Delete user profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      // Delete user authentication
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) throw authError;

      // Sign out and redirect
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete account');
    }
  };

  // Handle update functions
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

  const handleDisplayNameUpdate = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }
    await updateProfile({ display_name: displayName.trim() });
    setIsEditingDisplayName(false);
  };

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (!isValidUsername(username)) {
      Alert.alert(
        'Invalid Username',
        'Username must start with a letter and can only contain letters, numbers, and underscores'
      );
      return;
    }

    try {
      // Check if username is taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', userProfile.id)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'This username is already taken');
        return;
      }

      await updateProfile({ username: username.toLowerCase() });
      setIsEditingUsername(false);
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', 'Failed to update username');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during sign out');
    }
  };
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={() => setIsSettingsVisible(true)}
      >
        <Ionicons name="settings-outline" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <ProfileImage 
            url={avatarUrl}
            onUpload={updateAvatar}
            userId={userProfile?.id}
          />
          
          {/* Display Name Section */}
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{displayName}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditingDisplayName(true)}
            >
              <Ionicons name="pencil" size={16} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
          
          {/* Username Section */}
          <View style={styles.usernameContainer}>
            <Text style={styles.username}>@{username}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditingUsername(true)}
            >
              <Ionicons name="pencil" size={16} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
          
          {/* Year Badge */}
          <TouchableOpacity 
            style={styles.yearBadge}
            onPress={() => setIsEditingYear(true)}
          >
            <Ionicons name="school" size={20} color={COLORS.primary} />
            <Text style={styles.yearText}>{selectedYear || "Add year"}</Text>
            <Ionicons 
              name="pencil" 
              size={16} 
              color={COLORS.primary} 
              style={styles.editIcon} 
            />
          </TouchableOpacity>

          {/* Major Badge */}
          <View style={styles.majorBadge}>
            <Ionicons name="book" size={20} color={COLORS.success} />
            <Text style={styles.majorText}>{major || "Add your major"}</Text>
            <TouchableOpacity onPress={() => setIsEditingMajor(true)}>
              <Ionicons 
                name="pencil" 
                size={16} 
                color={COLORS.success} 
                style={styles.editIcon} 
              />
            </TouchableOpacity>
          </View>

          {/* Status Bar */}
          <TouchableOpacity 
            style={styles.statusBar}
            onPress={() => setIsEditingStatus(true)}
          >
            <Ionicons 
              name="ellipse" 
              size={12} 
              color={currentStatus ? COLORS.success : COLORS.text.light} 
            />
            <Text style={styles.statusText}>
              {currentStatus || "Set your status..."}
            </Text>
            <Ionicons 
              name="pencil" 
              size={16} 
              color={COLORS.text.secondary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          {/* Student ID Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Student ID</Text>
            <Text style={styles.infoValue}>{userProfile?.student_id}</Text>
            <Text style={styles.privateNote}>Only visible to you</Text>
          </View>

          {/* About Me Card */}
          <View style={styles.aboutMeCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditingAbout(true)}
              >
                <Ionicons name="pencil" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.aboutMeText}>
              {aboutMe || "Tell others about yourself..."}
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons 
            name="log-out-outline" 
            size={20} 
            color={COLORS.text.inverse} 
          />
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Settings Modal */}
        <Modal
          visible={isSettingsVisible}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setIsSettingsVisible(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.settingsOption}
                onPress={() => {
                  setIsSettingsVisible(false);
                  setShowPrivacyPolicy(true);
                }}
              >
                <Ionicons name="shield-outline" size={24} color={COLORS.text.primary} />
                <Text style={styles.settingsOptionText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingsOption}
                onPress={() => {
                  setIsSettingsVisible(false);
                  setShowTerms(true);
                }}
              >
                <Ionicons name="document-text-outline" size={24} color={COLORS.text.primary} />
                <Text style={styles.settingsOptionText}>Terms & Conditions</Text>
                <Ionicons name="chevron-forward" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.settingsOption, styles.deleteOption]}
                onPress={() => {
                  setIsSettingsVisible(false);
                  setShowDeleteConfirm(true);
                }}
              >
                <Ionicons name="trash-outline" size={24} color={COLORS.error} />
                <Text style={[styles.settingsOptionText, styles.deleteText]}>Delete Account</Text>
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
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Privacy Policy</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowPrivacyPolicy(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.policyContent}>
                <Text style={styles.policyText}>
                  [Your Privacy Policy content here]
                </Text>
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
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Terms & Conditions</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowTerms(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.policyContent}>
                <Text style={styles.policyText}>
                  [Your Terms & Conditions content here]
                </Text>
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
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Delete Account</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
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
                  <Text style={[styles.modalButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Year Edit Modal */}
        <Modal
          visible={isEditingYear}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Year</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setIsEditingYear(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.yearOptions}>
                {['Freshman', 'Sophomore', 'Junior', 'Senior'].map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      selectedYear === year && styles.selectedYearOption
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[
                      styles.yearOptionText,
                      selectedYear === year && styles.selectedYearOptionText
                    ]}>
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
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Display Name Edit Modal */}
        <Modal
          visible={isEditingDisplayName}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Display Name</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setIsEditingDisplayName(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your display name"
                placeholderTextColor={COLORS.text.light}
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
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Username Edit Modal */}
        <Modal
          visible={isEditingUsername}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Username</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setIsEditingUsername(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Username must start with a letter and can only contain letters, numbers, and underscores
              </Text>

              <TextInput
                style={styles.modalInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter new username"
                placeholderTextColor={COLORS.text.light}
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
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Status Modal */}
        <Modal
          visible={isEditingStatus}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Status</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setIsEditingStatus(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                value={currentStatus}
                onChangeText={setCurrentStatus}
                placeholder="What's on your mind?"
                placeholderTextColor={COLORS.text.light}
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
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* About Modal */}
        <Modal
          visible={isEditingAbout}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>About Me</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setIsEditingAbout(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.modalInput, styles.modalAboutInput]}
                value={aboutMe}
                onChangeText={setAboutMe}
                placeholder="Tell others about yourself..."
                placeholderTextColor={COLORS.text.light}
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
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Major Modal */}
        <Modal
          visible={isEditingMajor}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Major</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setIsEditingMajor(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                value={major}
                onChangeText={setMajor}
                placeholder="Your major (e.g. Computer Science)"
                placeholderTextColor={COLORS.text.light}
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
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginRight: 8,
    letterSpacing: 0.5,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: COLORS.card.neutral,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  username: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: '500',
    marginRight: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  yearText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  majorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  majorText: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  editIcon: {
    marginLeft: 4,
    padding: 4,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card.neutral,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
    width: '90%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.secondary,
    marginLeft: 8,
    marginRight: 8,
  },
  infoSection: {
    marginTop: 24,
  },
  infoCard: {
    backgroundColor: COLORS.card.neutral,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 20,
    color: COLORS.text.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  privateNote: {
    fontSize: 12,
    color: COLORS.text.light,
    fontStyle: 'italic',
    marginTop: 8,
  },
  aboutMeCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  aboutMeText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    lineHeight: 24,
  },
  signOutButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 32,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: COLORS.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
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
    borderColor: COLORS.border,
    color: COLORS.text.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalSaveButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  saveButtonText: {
    color: COLORS.text.inverse,
  },
  modalAboutInput: {
    height: 120,
    textAlignVertical: 'top',
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
    borderColor: COLORS.border,
  },
  selectedYearOption: {
    backgroundColor: COLORS.card.primary,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  yearOptionText: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedYearOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
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
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  deleteOption: {
    marginTop: 24,
    backgroundColor: COLORS.card.neutral,
  },
  deleteText: {
    color: COLORS.error,
  },
  policyContent: {
    maxHeight: '80%',
  },
  policyText: {
    fontSize: 16,
    color: COLORS.text.primary,
    lineHeight: 24,
  },
  deleteWarningText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.text.inverse,
  },
});

