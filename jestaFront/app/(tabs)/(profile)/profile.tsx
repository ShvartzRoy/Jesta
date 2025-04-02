import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import { UserContext } from '../../contexts/authContext';
import Menu from '../../components/profileComponents/menu';
import Ionicons from '@expo/vector-icons/Ionicons';
import SpecialistCard from '../../components/profileComponents/specialistCard';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


const ProfileScreen = () => {
  const { user } = useContext(UserContext);
  const [profile, setProfile] = useState(null);
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchProfileAndSpecialists = async () => {
        try {
          const profileResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user?.id}`);
          const profileData = profileResponse.data;
  
          if (profileData.image) {
            profileData.image = `${process.env.EXPO_PUBLIC_HOST}${profileData.image}`;
          }
  
          setProfile(profileData);
  
          try {
            const specialistsResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/specialists/get_specialist/${user?.id}/`);
            if (specialistsResponse.data && typeof specialistsResponse.data === 'object' && !Array.isArray(specialistsResponse.data)) {
              setSpecialists([specialistsResponse.data]);
            } else {
              setSpecialists([]);
            }
          } catch {
            setSpecialists([]);
          }
        } catch (err) {
          setError('Failed to fetch profile or specialists.');
        } finally {
          setLoading(false);
        }
      };
  
      if (user?.id) {
        fetchProfileAndSpecialists();
      }
    }, [user?.id])
  );
  

  useEffect(() => {
    const fetchProfileAndSpecialists = async () => {
      try {
        // Fetch profile
        const profileResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user?.id}`);
        const profileData = profileResponse.data;

        if (profileData.image) {
          profileData.image = `${process.env.EXPO_PUBLIC_HOST}${profileData.image}`;
        }

        setProfile(profileData);
        try{
          // Fetch specialists
          const specialistsResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/specialists/get_specialist/${user?.id}/`);
          console.log('specialistsResponse', specialistsResponse.data);

          // Process the specialist object
          if (specialistsResponse.data && typeof specialistsResponse.data === 'object' && !Array.isArray(specialistsResponse.data)) {
            setSpecialists([specialistsResponse.data]);
          } else {
            setSpecialists([]);
          }
        } catch(err) {
          setSpecialists([]);
        }
      } catch (err) {
        setError('Failed to fetch profile or specialists.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfileAndSpecialists();
    }
  }, [user]);

  const handleDeleteSpecialist = async () => {
    try {
      // Send the delete request to the API (no parameters needed)
      await axios.delete(`${process.env.EXPO_PUBLIC_HOST}/api/specialists/delete_specialist`);

      // Clear the specialists list after deletion
      setSpecialists([]);

      // Show a success message
      Alert.alert('Success', 'Specialist deleted successfully.');
    } catch (err) {
      // Show an error message if the deletion fails
      Alert.alert('Error', 'Failed to delete specialist.');
    }
  };

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      // Handle error opening the URL
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  const toggelMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  if (error) {
    return (
      <View style={{ flex: 1 }}>
        {/* Menu Button */}
        <TouchableOpacity onPress={toggelMenu} style={styles.menuButton}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>

        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>

        {/* Menu */}
        {isMenuVisible && <Menu onClose={() => setIsMenuVisible(false)} />}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Menu Button */}
      <TouchableOpacity onPress={toggelMenu} style={styles.menuButton}>
        <Text style={styles.menuButtonText}>☰</Text>
      </TouchableOpacity>

      {/* Plus Button (Conditional Rendering) */}
      {specialists.length === 0 && (
        <TouchableOpacity
          onPress={() => router.push('/create_specialist')}
          style={styles.plusButton}
        >
          <Ionicons name="add" size={24} color="#007bff" />
        </TouchableOpacity>
      )}

      {/* Profile Details */}
      <ScrollView contentContainerStyle={styles.container}>
        {profile?.image ? (
          <Image source={{ uri: profile.image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.nameAndAgeContainer}>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.age}>{profile?.age}</Text>
        </View>
        <Text style={styles.bio}>{profile?.bio}</Text>
        <View style={styles.socialLinks}>
          {profile?.facebook && (
            <TouchableOpacity style={styles.linkContainer} onPress={() => openLink(profile.facebook)}>
              <Ionicons style={styles.linkLogo} name="logo-facebook" />
            </TouchableOpacity>
          )}
          {profile?.linkedin && (
            <TouchableOpacity style={styles.linkContainer} onPress={() => openLink(profile.linkedin)}>
              <Ionicons style={styles.linkLogo} name="logo-linkedin" />
            </TouchableOpacity>
          )}
          {profile?.instagram && (
            <TouchableOpacity style={styles.linkContainer} onPress={() => openLink(profile.instagram)}>
              <Ionicons style={styles.linkLogo} name="logo-instagram" />
            </TouchableOpacity>
          )}
        </View>

        {/* Display Specialists */}
        <Text style={styles.sectionTitle}>My Specialty</Text>
        {specialists.length > 0 ? (
          specialists.map((specialist) => (
            <SpecialistCard
              key={specialist.id}
              specialist={specialist}
              onDelete={handleDeleteSpecialist}
            />
          ))
        ) : (
          <Text style={styles.noSpecialistsText}>No specialists found.</Text>
        )}
      </ScrollView>

      {/* Menu */}
      {isMenuVisible && <Menu onClose={() => setIsMenuVisible(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 30,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  plusButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 30,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  container: {
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 100,
    marginBottom: 16,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    color: '#888',
  },
  nameAndAgeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  age: {
    fontSize: 18,
    color: 'rgba(36,36,38,0.8)',
  },
  bio: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
    width: '100%',
  },
  linkContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1 }],
  },
  linkLogo: {
    color: '#007bff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    color: '#333',
  },
  noSpecialistsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ProfileScreen;