import { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../supabaseClient';

export default function SemesterSetup() {
  const [selectedTerm, setSelectedTerm] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentClass, setCurrentClass] = useState({
    id: '',
    className: '',
    professorName: '',
    section: '',
  });

  const generateTerms = () => {
    const terms = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year <= currentYear + 2; year++) {
      terms.push(`Spring ${year}`, `Fall ${year}`);
    }
    return terms;
  };

  const addClass = () => {
    if (classes.length >= 5) {
      Alert.alert('Maximum Classes Reached', 'You can only add up to 5 classes.');
      return;
    }

    if (!currentClass.className || !currentClass.professorName || !currentClass.section) {
      Alert.alert('Incomplete Information', 'Please fill in all class details.');
      return;
    }

    setClasses([...classes, { ...currentClass, id: Date.now().toString() }]);
    setCurrentClass({
      id: '',
      className: '',
      professorName: '',
      section: '',
    });
  };

  const removeClass = (id) => {
    setClasses(classes.filter((cls) => cls.id !== id));
  };

  const handleComplete = async () => {
    if (!selectedTerm) {
      Alert.alert('Missing Information', 'Please select a term before continuing.');
      return;
    }

    if (classes.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one class.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found.');

      for (const cls of classes) {
        const { error } = await supabase
          .from('semester_schedules')
          .insert({
            user_id: user.id,
            term: selectedTerm,
            class_name: cls.className.trim(),
            professor_name: cls.professorName.trim(),
            section: cls.section.trim(),
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_schedule: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      Alert.alert(
        'Success',
        'Semester setup completed!',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)/'), // Navigate to main tabs
          },
        ]
      );
    } catch (error) {
      console.error('Error completing semester setup:', error);
      Alert.alert('Error', 'Failed to save your schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadExistingSchedule = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('semester_schedules')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const term = data[0].term;
          setSelectedTerm(term);
          setClasses(data.map((cls) => ({
            id: cls.id,
            className: cls.class_name,
            professorName: cls.professor_name,
            section: cls.section,
          })));
        }
      } catch (error) {
        console.error('Error loading existing schedule:', error);
      }
    };

    loadExistingSchedule();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Class Schedule Setup</Text>

        {/* Term Picker */}
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Select Term</Text>
          <Picker
            selectedValue={selectedTerm}
            onValueChange={(itemValue) => setSelectedTerm(itemValue)}
            style={styles.picker}
            enabled={!loading}
          >
            <Picker.Item label="Select a term" value="" />
            {generateTerms().map((term) => (
              <Picker.Item key={term} label={term} value={term} />
            ))}
          </Picker>
        </View>

        {/* Class Form */}
        <View style={styles.classForm}>
          <Text style={styles.subtitle}>Add Class ({classes.length}/5)</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Class Name"
            value={currentClass.className}
            onChangeText={(text) => setCurrentClass({ ...currentClass, className: text })}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Professor Name"
            value={currentClass.professorName}
            onChangeText={(text) => setCurrentClass({ ...currentClass, professorName: text })}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Section"
            value={currentClass.section}
            onChangeText={(text) => setCurrentClass({ ...currentClass, section: text })}
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.button, styles.addButton]} 
            onPress={addClass}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Add Class</Text>
          </TouchableOpacity>
        </View>

        {/* Class List */}
        {classes.map((cls) => (
          <View key={cls.id} style={styles.classCard}>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{cls.className}</Text>
              <Text>Professor: {cls.professorName}</Text>
              <Text>Section: {cls.section}</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeClass(cls.id)}
              disabled={loading}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Complete Button */}
        <TouchableOpacity 
          style={[styles.button, styles.completeButton, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
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
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
  },
  classForm: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  classCard: {
    backgroundColor: '#f5f5f5',
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  removeButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});
