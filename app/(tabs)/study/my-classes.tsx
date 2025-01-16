import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';

export default function MyClasses() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [currentClass, setCurrentClass] = useState({
    className: '',
    professorName: '',
    section: ''
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
        professor_name: currentClass.professorName.trim(),
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
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Classes</Text>

        {/* Term Selection */}
        <View style={styles.termsContainer}>
          <Text style={styles.sectionTitle}>Select a Term</Text>
          {terms.map((term) => (
            <TouchableOpacity
              key={term}
              style={[
                styles.termButton,
                selectedTerm === term && styles.selectedTermButton
              ]}
              onPress={() => setSelectedTerm(term)}
            >
              <Text
                style={[
                  styles.termButtonText,
                  selectedTerm === term && styles.selectedTermButtonText
                ]}
              >
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
              <TextInput
                style={styles.input}
                placeholder="Class Name (e.g., COMM-20)"
                value={currentClass.className}
                onChangeText={(text) => setCurrentClass({ ...currentClass, className: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Professor Name"
                value={currentClass.professorName}
                onChangeText={(text) => setCurrentClass({ ...currentClass, professorName: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Section (e.g., A1)"
                value={currentClass.section}
                onChangeText={(text) => setCurrentClass({ ...currentClass, section: text })}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleAddClass}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Class</Text>}
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
                      <Ionicons name="trash" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  termsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  termButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedTermButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  termButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTermButtonText: {
    color: '#fff',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  classesContainer: {
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  classCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  professorName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
});
