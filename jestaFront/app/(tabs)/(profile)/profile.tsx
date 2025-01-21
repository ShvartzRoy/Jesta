import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';
import { UserContext } from '../../authContext';

const ProfileScreen = () => {
  const { user } = useContext(UserContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log(user);
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user?.id}`);
        setProfile(response.data);
      } catch (err) {
        setError("Failed to fetch profile data");
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
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
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
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
