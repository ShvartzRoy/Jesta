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
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { UserContext } from '../contexts/authContext';

const Edit_profile = () => {
  const { user } = useContext(UserContext);
  const router = useRouter();

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
  const [focusedField, setFocusedField] = useState(null);

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => router.replace('/mainprofile')}
            >
              <Ionicons name="arrow-back" size={24} color="#0000ff" />
            </TouchableOpacity>
            <Text style={styles.header}>Edit Profile</Text>

            {/* Name Input */}
            {/* Name Input */}
            <Text style={styles.inputTitle}>Name</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'name' && styles.focusedInput,
              ]}
              placeholder={name || 'Enter your name'}
              value={name}
              onFocus={() => setFocusedField('name')}
              placeholderTextColor={"#888"}

              onBlur={() => setFocusedField(null)}
              onChangeText={setName}
            />

            {/* Bio Input */}
            <Text style={styles.inputTitle}>Bio</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'bio' && styles.focusedInput,
                { height: 70 }, // Multiline styling
              ]}
              placeholder={bio || 'Enter your bio'}
              placeholderTextColor={"#888"}

              value={bio}
              onFocus={() => setFocusedField('bio')}
              onBlur={() => setFocusedField(null)}
              onChangeText={setBio}
              multiline
            />

            {/* Age Input */}
            <Text style={styles.inputTitle}>Age</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'age' && styles.focusedInput,
              ]}
              placeholder={age || 'Enter your age'}
              placeholderTextColor={"#888"}

              value={age}
              onFocus={() => setFocusedField('age')}
              onBlur={() => setFocusedField(null)}
              onChangeText={setAge}
              keyboardType="numeric"
            />

            {/* Facebook Input */}
            <Text style={styles.inputTitle}>Facebook</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'facebook' && styles.focusedInput,
              ]}
              placeholder={facebook || 'Enter your Facebook profile link'}
              placeholderTextColor={"#888"}

              value={facebook}
              onFocus={() => setFocusedField('facebook')}
              onBlur={() => setFocusedField(null)}
              onChangeText={setFacebook}
            />

            {/* LinkedIn Input */}
            <Text style={styles.inputTitle}>LinkedIn</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'linkedin' && styles.focusedInput,
              ]}
              placeholder={linkedin || 'Enter your LinkedIn profile link'}
              placeholderTextColor={"#888"}

              value={linkedin}
              onFocus={() => setFocusedField('linkedin')}
              onBlur={() => setFocusedField(null)}
              onChangeText={setLinkedin}
            />

            {/* Instagram Input */}
            <Text style={styles.inputTitle}>Instagram</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'instagram' && styles.focusedInput,
              ]}
              placeholder={instagram || 'Enter your Instagram profile link'}
              placeholderTextColor={"#888"}

              value={instagram}
              onFocus={() => setFocusedField('instagram')}
              onBlur={() => setFocusedField(null)}
              onChangeText={setInstagram}
            />


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
            {isError[0] && (
              <Text style={styles.errorMessage}>
                {isError[1].detail || isError[1]}
              </Text>
            )}
            {success && (
              <Text style={styles.successMessage}>
                Profile updated successfully!
              </Text>
            )}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: {   fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',},
  inputTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  input: {
    width: "100%",
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 14,
    backgroundColor: "#fff",
    fontSize: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    textAlign: 'left', 
    writingDirection: 'ltr',
  },
  focusedInput: {
    borderColor: '#5dade2',
    borderWidth: 2,
    backgroundColor: '#f9f9ff',
    shadowColor: '#5dade2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, // For Android
  },
  button: {
    backgroundColor: '#5dade2',
    padding: 12,
    borderRadius: 30,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  successMessage: {
    color: 'green',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  errorMessage: {
    color: 'red',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  returnButton: {
    backgroundColor: '#d6eaf8',
    paddingVertical: 10,
    borderRadius: 100,
    width: 40,
    height: 40,
    marginTop: 30,
    marginBottom: 16,
    alignItems: 'center',
  },
});

export default Edit_profile;
