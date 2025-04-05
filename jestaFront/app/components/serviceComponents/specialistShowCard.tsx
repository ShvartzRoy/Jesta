import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router'; // Import the router

const SpecialistShowCard = ({ specialist, isUser = false }) => {
  // Safely handle missing or invalid fields
  const serviceTags = specialist.service_tags
    ? Array.isArray(specialist.service_tags)
      ? specialist.service_tags.join(', ') // If it's an array, join it into a string
      : typeof specialist.service_tags === 'object'
      ? Object.values(specialist.service_tags).join(', ') // If it's an object, convert values to a string
      : String(specialist.service_tags) // Fallback to string conversion
    : 'No service tags';

  const locationRange = specialist.location_range
    ? typeof specialist.location_range === 'object'
      ? `${specialist.location_range.min} - ${specialist.location_range.max}` // Format object as a range
      : String(specialist.location_range) // Fallback to string conversion
    : 'No location range';

  const priceRange = specialist.price_range
    ? typeof specialist.price_range === 'object'
      ? `$${specialist.price_range.min} - $${specialist.price_range.max}` // Format object as a price range
      : String(specialist.price_range) // Fallback to string conversion
    : 'No price range';

  const portfolioLink = specialist.portfolio_link || 'No portfolio link';
  const createdAt = specialist.created_at
    ? new Date(specialist.created_at).toLocaleDateString()
    : 'No date';

  // Function to handle navigation to the ViewProfileScreen
  const handlePress = () => {
    if (specialist.id && !isUser) {
      router.push(`/service_user_profile/${specialist.user}`);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Text style={styles.title}>{specialist.description || 'No description'}</Text>
      <Text style={styles.text}>Service Tags: {serviceTags}</Text>
      <Text style={styles.text}>Portfolio: {portfolioLink}</Text>
      <Text style={styles.text}>Location Range: {locationRange}</Text>
      <Text style={styles.text}>Price Range: {priceRange}</Text>
      <Text style={styles.text}>Created At: {createdAt}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007bff',
  },
  text: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
});

export default SpecialistShowCard;