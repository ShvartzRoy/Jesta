import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Linking } from 'react-native';
import axios from 'axios';
import { UserContext } from '../../contexts/authContext';
import Menu from '../../components/profileComponents/menu'; // Import the Menu component

const ProfileScreen = () => {
  const { user } = useContext(UserContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user?.id}`);
        const profileData = response.data;

        // Add full URL to the image field
        if (profileData.image) {
          profileData.image = `${process.env.EXPO_PUBLIC_HOST}${profileData.image}`;
        }

        setProfile(profileData);
      } catch (err) {
        setError('Failed to fetch profile.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

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
  }

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
              <Text style={styles.linkText}>Facebook</Text>
            </TouchableOpacity>
          )}
          {profile?.linkedin && (
            <TouchableOpacity style={styles.linkContainer} onPress={() => openLink(profile.linkedin)}>
              <Text style={styles.linkText}>LinkedIn</Text>
            </TouchableOpacity>
          )}
          {profile?.instagram && (
            <TouchableOpacity style={styles.linkContainer} onPress={() => openLink(profile.instagram)}>
              <Text style={styles.linkText}>Instagram</Text>
            </TouchableOpacity>
          )}
        </View>
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
    backgroundColor: '#f4f4f4',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  linkText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
