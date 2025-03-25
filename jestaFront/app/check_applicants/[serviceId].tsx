import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';

const CheckApplicantsScreen = () => {
  const { serviceId } = useLocalSearchParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST}/api/services/get_applicants/${serviceId}`
        );
        setApplicants(response.data);
      } catch (err) {
        setError('Failed to fetch applicants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchApplicants();
    }
  }, [serviceId]);

  const handleAccept = async (userId) => {
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/accept_applicant/${serviceId}/${userId}`
      );
      setApplicants((prevApplicants) =>
        prevApplicants.map((applicant) =>
          applicant.user_id === userId
            ? { ...applicant, applicant_state: 'accepted' }
            : applicant
        )
      );
    } catch (error) {
      //console.error('Error accepting applicant:', error);
    }
  };

  const handleReject = async (userId) => {
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/reject_applicant/${serviceId}/${userId}`
      );
      setApplicants((prevApplicants) =>
        prevApplicants.map((applicant) =>
          applicant.user_id === userId
            ? { ...applicant, applicant_state: 'rejected' }
            : applicant
        )
      );
    } catch (error) {
      console.error('Error rejecting applicant:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading applicants...</Text>
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
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#007bff" />
      </TouchableOpacity>

      <FlatList
        data={applicants}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.applicantCard}>
            <Text style={styles.applicantText}>User ID: {item.user_id}</Text>
            <Text style={styles.applicantText}>State: {item.applicant_state}</Text>
            <View style={styles.buttonContainer}>
              {item.applicant_state !== 'accepted' && item.applicant_state !== 'rejected' && (
                <>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(item.user_id)}
                  >
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(item.user_id)}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.userButton}
                onPress={() => router.push(`/viewProfile/${item.user_id}`)}
              >
                <Text style={styles.buttonText}>Go to user</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 120,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 70,
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
    marginTop: 20,
  },
  applicantCard: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  applicantText: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  userButton: {
    backgroundColor: '#2f83eb',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CheckApplicantsScreen;
