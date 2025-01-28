import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';

const ServiceCard = ({ service, currentUserId }) => {
  const router = useRouter();
  const [isPublisher, setIsPublisher] = useState(false);
  const [applicantState, setApplicantState] = useState(null); // null, 'pending', 'accepted', 'rejected'

  useEffect(() => {
    if (service.user_id === currentUserId) {
      setIsPublisher(true);
    } else {
      fetchApplicantState();
      console.log(applicantState);
    }
  }, [service, currentUserId]);

  const fetchApplicantState = async () => {
    try {
        console.log('service.id:');
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_applicant_state/${service.id}`
      );
      setApplicantState(response.data.state); // Update with the state ('pending', 'accepted', or 'rejected')
      console.log('Applicant state:', response.data.state);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // User has not applied, set state to null
        setApplicantState(null);
      } else {
      }
    }
  };

  const handleApply = async () => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/apply_to_service/${service.id}`
      );
      if (response.status === 200) {
        setApplicantState('pending'); // User application is now in "pending" state
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to apply for this service. Please try again later.');
    }
  };

  const handleUnapply = async () => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/remove_from_service/${service.id}`
      );
      if (response.status === 200) {
        setApplicantState(null); // Reset the application state
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel application. Please try again later.');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/delete_service/${service.id}`
      );
      if (response.status === 200) {
        Alert.alert('Service deleted successfully');
        router.push('/');
      }
    } catch (error) {
      //console.error('Error deleting service:', error);
      Alert.alert('Error', 'Failed to delete the service. Please try again later.');
    }
  };

  const handleEdit = () => {
    router.push(`/edit_service/${service.id}`);
  };

  const handleCheckApplicants = () => {
    router.push(`/check_applicants/${service.id}`);
  };

  return (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.title}>{service.title}</Text>
      <Text style={styles.description}>{service.description}</Text>
      <Text style={styles.location}>{service.location}</Text>
      <Text style={styles.tags}>{service.tags.join(', ')}</Text>
      <Text style={styles.price}>${service.offered_payment}</Text>

      {isPublisher ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleCheckApplicants}>
            <Text style={styles.buttonText}>Check Applicants</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleEdit}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : applicantState === 'accepted' || applicantState === 'rejected' ? (
        <Text style={[styles.statusText, applicantState === 'accepted' ? styles.accepted : styles.rejected]}>
          {applicantState.toUpperCase()}
        </Text>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={applicantState === 'pending' ? handleUnapply : handleApply}
        >
          <Text style={styles.buttonText}>
            {applicantState === 'pending' ? 'Unapply' : 'Apply'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#007BFF',
    marginBottom: 8,
  },
  tags: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  accepted: {
    color: '#28a745', // Green for accepted
  },
  rejected: {
    color: '#dc3545', // Red for rejected
  },
});

export default ServiceCard;