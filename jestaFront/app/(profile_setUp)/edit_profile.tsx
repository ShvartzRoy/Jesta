import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { UserContext } from '../contexts/authContext';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const Edit_profile = () => {
  const { user } = useContext(UserContext);
  const router = useRouter();

  // State variables
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [image, setImage] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isError, setError] = useState([false, '']);

  // Handle image upload
  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
      });
    }
  };

  // Handle resume upload
  const handleResumeUpload = async () => {
    try {
      console.log("Picking document...");
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      console.log("Document Picker Result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]; // Extract the first asset

        setResume({
          uri: asset.uri,
          type: asset.mimeType || 'application/pdf', // Fallback to 'application/pdf'
          name: asset.name || `resume_${Date.now()}.pdf`,
        });

        console.log("Resume set successfully:", {
          uri: asset.uri,
          type: asset.mimeType,
          name: asset.name,
        });
      } else if (result.canceled) {
        console.log("Document picking was canceled.");
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };




  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(false);
    setError([false, '']);

    const formData = new FormData();
    formData.append(
      'payload',
      JSON.stringify({
        name,
        bio,
        age: age ? parseInt(age) : null,
        facebook,
        linkedin,
        instagram,
      })
    );

    // Append image
    if (image) {
      formData.append('image', {
        uri: image.uri.startsWith('file://') ? image.uri : `file://${image.uri}`,
        type: image.type,
        name: image.fileName,
      });
    }

    // Append resume
    if (resume) {
      const resolvedUri = resume.uri.startsWith('file://') ? resume.uri : `file://${resume.uri}`;
      formData.append('resume', {
        uri: resolvedUri,
        type: resume.type,
        name: resume.name,
      });
    }


    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/edit_profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      console.log('Profile updated successfully:', response.data);
    } catch (error) {
      setError([true, error.response?.data || error.message]);
      //console.error('Error updating profile:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (user.id) {
        setLoading(true);
        try {
          const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user.id}`, {
            headers: { 'Content-Type': 'application/json' },
          });

          setName(response.data.name);
          setBio(response.data.bio);
          setAge(response.data.age?.toString());
          setFacebook(response.data.facebook);
          setLinkedin(response.data.linkedin);
          setInstagram(response.data.instagram);
        } catch (error) {
          //console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user.id]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.returnButton} onPress={() => router.replace('/profile')}>
          <Ionicons name="arrow-back" size={24} color="blue" />
        </TouchableOpacity>
        <Text style={styles.header}>Edit Profile</Text>

        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Bio" value={bio} onChangeText={setBio} multiline />
        <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Facebook Profile" value={facebook} onChangeText={setFacebook} />
        <TextInput style={styles.input} placeholder="LinkedIn Profile" value={linkedin} onChangeText={setLinkedin} />
        <TextInput style={styles.input} placeholder="Instagram Profile" value={instagram} onChangeText={setInstagram} />

        <TouchableOpacity onPress={handleImageUpload} style={styles.button}>
          <Text style={styles.buttonText}>
            {image ? `Image: ${image.fileName}` : 'Upload Profile Image'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResumeUpload} style={styles.button}>
          <Text style={styles.buttonText}>
            {resume ? `Resume: ${resume.name}` : 'Upload Resume (PDF)'}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button title="Save Changes" onPress={handleSubmit} />
        )}
        {isError[0] && <Text style={styles.errorMessage}>{isError[1].detail || isError[1]}</Text>}
        {success && <Text style={styles.successMessage}>Profile updated successfully!</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100, paddingHorizontal: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  successMessage: { color: 'green', marginTop: 16, textAlign: 'center', fontSize: 16 },
  errorMessage: { color: 'red', marginTop: 16, textAlign: 'center', fontSize: 16 },
  returnButton: { backgroundColor: 'rgba(142,142,147,0.2)', paddingVertical: 10, borderRadius: 100, width: 40, height: 40, marginBottom: 16, alignItems: 'center' },
  returnButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default Edit_profile;
