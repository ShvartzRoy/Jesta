import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router'; // Use expo-router for navigation
import Ionicons from '@expo/vector-icons/Ionicons'; // For icons
import SpecialistTagSearch from '../components/searchComponents/searchSpecialistComponent'; // Import the new component

const CreateSpecialistScreen = () => {
  const [serviceTags, setServiceTags] = useState('');
  const [description, setDescription] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [locationRange, setLocationRange] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [loading, setLoading] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false); // To show/hide search popup

  // Handle tag selection
  const handleTagSelect = (tag) => {
    setServiceTags(tag.name); // Allow only one tag to be selected
    setIsSearchVisible(false); // Hide the search popup after selection
  };

  // Handle form submission
  const handleCreateSpecialist = async () => {
    if (!serviceTags || !description || !locationRange || !priceRange.min || !priceRange.max) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        service_tags: [serviceTags.trim()], // Use the selected tag
        description,
        portfolio_link: portfolioLink,
        location_range: locationRange,
        price_range: { min: parseInt(priceRange.min), max: parseInt(priceRange.max) },
      };

      const response = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/specialists/create_specialist`, payload);
      Alert.alert('Success', 'Specialist profile created successfully!');
      router.back(); // Navigate back to the previous screen
    } catch (error) {
      //console.error('Error creating specialist:', error);
      Alert.alert('Error', 'Failed to create specialist profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.push('/profile')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#007bff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Specialist Profile</Text>

        {/* Service Tags Input */}
        <TouchableOpacity onPress={() => setIsSearchVisible(true)} style={styles.input}>
          <Text style={serviceTags ? styles.inputText : styles.placeholderText}>
            {serviceTags || 'Select Service Tag'}
          </Text>
        </TouchableOpacity>

        {/* Description Input */}
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Portfolio Link Input */}
        <TextInput
          style={styles.input}
          placeholder="Portfolio Link"
          value={portfolioLink}
          onChangeText={setPortfolioLink}
        />

        {/* Location Range Input */}
        <TextInput
          style={styles.input}
          placeholder="Location Range"
          value={locationRange}
          onChangeText={setLocationRange}
        />

        {/* Price Range Inputs */}
        <View style={styles.priceRangeContainer}>
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="Min Price"
            value={priceRange.min}
            onChangeText={(text) => setPriceRange({ ...priceRange, min: text })}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="Max Price"
            value={priceRange.max}
            onChangeText={(text) => setPriceRange({ ...priceRange, max: text })}
            keyboardType="numeric"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCreateSpecialist}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Specialist'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Specialist Tag Search Popup */}
      {isSearchVisible && (
        <SpecialistTagSearch
          onSelectTag={handleTagSelect}
          onClose={() => setIsSearchVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 100, // Add top margin to make the back button accessible
  },
  backButton: {
    position: 'absolute',
    top: 80, // Adjusted position
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputText: {
    color: '#333',
  },
  placeholderText: {
    color: '#888',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateSpecialistScreen;