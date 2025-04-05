import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';
import SpecialistShowCard from '../components/serviceComponents/specialistShowCard'; // Import the SpecialistShowCard component

const ViewProfileScreen = () => {
  const { userId } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileAndSpecialists = async () => {
      try {
        // Fetch profile
        const profileResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${userId}`);
        const profileData = profileResponse.data;

        if (profileData.image) {
          profileData.image = `${process.env.EXPO_PUBLIC_HOST}${profileData.image}`;
        }

        setProfile(profileData);

        // Fetch specialists
        try{
          const specialistsResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/specialists/get_specialist/${userId}/`);
          console.log('specialistsResponse', specialistsResponse.data);

          // Process the specialist object
          if (specialistsResponse.data && typeof specialistsResponse.data === 'object' && !Array.isArray(specialistsResponse.data)) {
            setSpecialists([specialistsResponse.data]);
          } else {
            setSpecialists([]);
          }
        } catch (err) {
          setSpecialists([]);
        }
      } catch (err) {
        setError('Failed to fetch profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfileAndSpecialists();
    }
  }, [userId]);

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

  if (error) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#007bff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Image */}
        {profile?.image ? (
          <Image source={{ uri: profile.image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Name and Age */}
        <View style={styles.nameAndAgeContainer}>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.age}>{profile?.age}</Text>
        </View>

        {/* Bio */}
        <Text style={styles.bio}>{profile?.bio}</Text>

        {/* Social Links */}
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
        <Text style={styles.sectionTitle}>Specialty</Text>
        {specialists.length > 0 ? (
          specialists.map((specialist) => (
            <SpecialistShowCard key={specialist.id} specialist={specialist} />
          ))
        ) : (
          <Text style={styles.noSpecialistsText}>No specialists found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingTop: 80, // Add padding to avoid overlap with the back button
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
  backButton: {
    position: 'absolute',
    top: 100, // Adjusted to avoid overlap with system UI
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
  error: {
    color: 'red',
    fontSize: 16,
  },
});

export default ViewProfileScreen;