import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';

const EditSpecialist = () => {
  const [description, setDescription] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [locationRange, setLocationRange] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [loading, setLoading] = useState(true);

  // Fetch specialist details when the component mounts
  useEffect(() => {
    const fetchSpecialist = async () => {
      try {
        // Fetch specialist by user ID
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/specialists/get_specialist_by_user_id/`);
        const specialist = response.data;

        // Set the state with the fetched data
        setDescription(specialist.description);
        setPortfolioLink(specialist.portfolio_link);
        setLocationRange(specialist.location_range);
        setPriceRange(specialist.price_range);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch specialist details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialist();
  }, []);

  // Handle saving the updated specialist
  const handleSave = async () => {
    try {
      const payload = {
        description,
        portfolio_link: portfolioLink,
        location_range: locationRange,
        price_range: priceRange,
      };

      // Send the update request to the API using POST
      const response = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/specialists/update_specialist`, payload);

      if (response.status === 200) {
        Alert.alert('Success', 'Specialist updated successfully.');
        router.back(); // Navigate back to the profile screen
      } else {
        Alert.alert('Error', 'Failed to update specialist.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update specialist.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.push('/profile')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#007bff" />
      </TouchableOpacity>
      <Text style={styles.title}>Create Specialist Profile</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
        />

        <Text style={styles.label}>Portfolio Link</Text>
        <TextInput
          style={styles.input}
          value={portfolioLink}
          onChangeText={setPortfolioLink}
          placeholder="Enter portfolio link"
        />

        <Text style={styles.label}>Location Range</Text>
        <TextInput
          style={styles.input}
          value={locationRange}
          onChangeText={setLocationRange}
          placeholder="Enter location range"
        />

        <Text style={styles.label}>Price Range</Text>
        <View style={styles.priceRangeContainer}>
          <TextInput
            style={[styles.input, styles.priceInput]}
            value={priceRange.min?.toString() || ''}
            onChangeText={(text) => setPriceRange({ ...priceRange, min: text })}
            placeholder="Min"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.priceInput]}
            value={priceRange.max?.toString() || ''}
            onChangeText={(text) => setPriceRange({ ...priceRange, max: text })}
            placeholder="Max"
            keyboardType="numeric"
          />
        </View>

        <Button title="Save Changes" onPress={handleSave} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100, // Add padding at the top
  },
  scrollContainer: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInput: {
    width: '48%',
  },
});

export default EditSpecialist;