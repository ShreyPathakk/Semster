import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../supabaseClient';

export default function ProfileImage({ url, onUpload, userId }) {
  const [isCurrentUser, setIsCurrentUser] = React.useState(false);

  React.useEffect(() => {
    checkCurrentUser();
  }, [userId]);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsCurrentUser(user?.id === userId);
  };

  const handleUpload = async () => {
    if (!isCurrentUser) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || [ImagePicker.MediaType.IMAGE],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        onUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        {url ? (
          <Image source={{ uri: url }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {isCurrentUser ? 'Upload Photo' : 'No Photo'}
            </Text>
          </View>
        )}
      </View>
      {isCurrentUser && (
        <TouchableOpacity onPress={handleUpload} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  editButton: {
    marginTop: 8,
    padding: 8,
  },
  editButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});