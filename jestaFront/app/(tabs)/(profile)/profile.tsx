import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
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
        setProfile(response.data);
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
      <View style={{ flex: 1 }}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
        </View>
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
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.menuButton}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Details */}
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: profile?.image }} style={styles.image} />
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.bio}>{profile?.bio}</Text>
        <Text style={styles.details}>Age: {profile?.age}</Text>
        <Text style={styles.details}>Resume: {profile?.resume}</Text>
        <Text style={styles.links}>Facebook: {profile?.facebook}</Text>
        <Text style={styles.links}>LinkedIn: {profile?.linkedin}</Text>
        <Text style={styles.links}>Instagram: {profile?.instagram}</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  menuButton: {
    padding: 8,
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
    borderRadius: 75,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  details: {
    fontSize: 16,
    marginBottom: 8,
  },
  links: {
    fontSize: 16,
    color: 'blue',
    marginBottom: 8,
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});

export default ProfileScreen;
