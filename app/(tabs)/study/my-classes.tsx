import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';

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

export default function MyClasses() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [currentClass, setCurrentClass] = useState({
    className: '',
    professorName: '',
    section: '',
  });

  const terms = ['Spring 2025', 'Fall 2025'];

  useEffect(() => {
    if (selectedTerm) {
      loadClasses();
    }
  }, [selectedTerm]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('semester_schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('term', selectedTerm)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      Alert.alert('Error', 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!currentClass.className || !currentClass.professorName || !currentClass.section) {
      Alert.alert('Incomplete Information', 'Please fill in all class details.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const classData = {
        user_id: user.id,
        term: selectedTerm,
        class_name: currentClass.className.trim().toUpperCase(),
        professor_name: currentClass.professorName.trim().toLowerCase(),
        section: currentClass.section.trim().toUpperCase(),
      };

      const { error } = await supabase.from('semester_schedules').insert([classData]);
      if (error) throw error;

      Alert.alert('Success', 'Class added successfully!');
      setCurrentClass({ className: '', professorName: '', section: '' });
      loadClasses();
    } catch (error) {
      console.error('Error adding class:', error);
      Alert.alert('Error', 'Failed to add class.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.from('semester_schedules').delete().eq('id', classId);
              if (error) throw error;

              Alert.alert('Success', 'Class deleted successfully!');
              loadClasses();
            } catch (error) {
              console.error('Error deleting class:', error);
              Alert.alert('Error', 'Failed to delete class.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Simple Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Classes</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Term Selection */}
        <View style={styles.termsContainer}>
          <Text style={styles.sectionTitle}>Select a Term</Text>
          {terms.map((term) => (
            <TouchableOpacity
              key={term}
              style={[styles.termButton, selectedTerm === term && styles.selectedTermButton]}
              onPress={() => setSelectedTerm(term)}
            >
              <Text style={[styles.termButtonText, selectedTerm === term && styles.selectedTermButtonText]}>
                {term}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTerm && (
          <>
            {/* Add Class Form */}
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Add a New Class</Text>
              <Text style={styles.subText}>
                Please write the class name according to the Canvas portal.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Class Name (e.g., COMM-20)"
                placeholderTextColor={COLORS.textSecondary}
                value={currentClass.className}
                onChangeText={(text) => setCurrentClass({ ...currentClass, className: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Professor Name (No Prefixes)"
                placeholderTextColor={COLORS.textSecondary}
                value={currentClass.professorName}
                onChangeText={(text) => setCurrentClass({ ...currentClass, professorName: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Section (e.g., A1)"
                placeholderTextColor={COLORS.textSecondary}
                value={currentClass.section}
                onChangeText={(text) => setCurrentClass({ ...currentClass, section: text })}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleAddClass}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  // Gradient hint on button
                  <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.gradientButton}>
                    <Text style={styles.buttonText}>Add Class</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>

            {/* Classes List */}
            <View style={styles.classesContainer}>
              <Text style={styles.sectionTitle}>Classes for {selectedTerm}</Text>
              {classes.length === 0 ? (
                <Text style={styles.emptyText}>No classes added yet.</Text>
              ) : (
                classes.map((cls) => (
                  <View key={cls.id} style={styles.classCard}>
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>{cls.class_name}</Text>
                      <Text style={styles.professorName}>{cls.professor_name}</Text>
                      <Text style={styles.sectionText}>Section {cls.section}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteClass(cls.id)}
                      disabled={loading}
                    >
                      <Ionicons name="trash" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Simple header (no large gradient)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  profileButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  termsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  termButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedTermButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  selectedTermButtonText: {
    color: COLORS.background,
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  button: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradientButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  classesContainer: {
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  classCard: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.textPrimary,
  },
  professorName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
});
