import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

const SpecialistCard = ({ specialist, onDelete }) => {
  const handleEdit = () => {
    // Navigate to the edit screen with the specialist's ID
    router.push(`/edit_specialist`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Specialist',
      'Are you sure you want to delete this specialist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: onDelete }, // Call onDelete without parameters
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{specialist.service_tags.join(', ')}</Text>
      <Text style={styles.text}>Description: {specialist.description}</Text>
      <Text style={styles.text}>Portfolio: {specialist.portfolio_link}</Text>
      <Text style={styles.text}>Location Range: {specialist.location_range}</Text>
      <Text style={styles.text}>Price Range: ${specialist.price_range.min} - ${specialist.price_range.max}</Text>
      <Text style={styles.text}>Created At: {new Date(specialist.created_at).toLocaleDateString()}</Text>

      {/* Edit and Delete Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#007bff" />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash" size={20} color="#ff4444" />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    marginLeft: 4,
    color: '#007bff',
    fontSize: 16,
  },
});

export default SpecialistCard;