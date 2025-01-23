import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { UserContext } from '../contexts/authContext';

const Edit_profile = () => {
  const { user } = useContext(UserContext);
  const router = useRouter();
  // State variables for form inputs
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

  const handleImageUpload = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });
    if (!result.didCancel && result.assets?.[0]) {
      setImage(result.assets[0]);
    }
  };

  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.pdf,
      });
      setResume(result);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('Resume upload canceled');
      } else {
        console.error(err);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(false);
    setError([false, '']);
    const formData = new FormData();

    // Wrap all fields in a 'payload' key
    formData.append(
      'payload',
      JSON.stringify({
        name,
        bio,
        age: age ? parseInt(age) : null, // Ensure age is sent as a number
        facebook,
        linkedin,
        instagram,
      })
    );

    if (image) {
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'profile.jpg',
      });
    }

    if (resume) {
      formData.append('resume', {
        uri: resume.uri,
        type: resume.type || 'application/pdf',
        name: resume.name || 'resume.pdf',
      });
    }

    try {
      await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/edit_profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
    } catch (error) {
      setError([true, error.response?.data]);
      console.log(isError[1]);
      console.log('Error updating profile:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (user.id) {
        setLoading(true);
        try {
          const response = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user.id}`,
            {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true,
            }
          );
          console.log('Profile data:', response.data);

          setName(response.data.name);
          setBio(response.data.bio);
          setAge(response.data.age?.toString()); // Convert age to string for input
          setFacebook(response.data.facebook);
          setLinkedin(response.data.linkedin);
          setInstagram(response.data.instagram); 
        } catch (error) {
          console.error("Error fetching profile:", error);
          setLoading(false); 
        } finally {
          setLoading(false); 
        }
      }
    };

    fetchProfile();
  }, [user.id]); 


  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.returnButton} onPress={() => router.replace('/profile')}>
        <Text style={styles.returnButtonText}>{'<'}</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Edit Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Facebook Profile"
        value={facebook}
        onChangeText={setFacebook}
      />
      <TextInput
        style={styles.input}
        placeholder="LinkedIn Profile"
        value={linkedin}
        onChangeText={setLinkedin}
      />
      <TextInput
        style={styles.input}
        placeholder="Instagram Profile"
        value={instagram}
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
          {`${isError[1]["detail"]}`}
        </Text>
      )}

      {success && <Text style={styles.successMessage}>Profile updated successfully!</Text>}
      {success &&
      <TouchableOpacity style={styles.homepageBtn} onPress={() => router.replace('/explore_page')}>
        <Text style={styles.buttonText}>Go To Homepage</Text>
      </TouchableOpacity>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {

    flex: 1,
    paddingTop: 100, 
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  homepageBtn: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    width:40,
    marginBottom: 16,
    justifyContent: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Edit_profile;
