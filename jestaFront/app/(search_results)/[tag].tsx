import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import SpecialistShowCard from '../components/serviceComponents/specialistShowCard';
import ServiceShowCard from '../components/serviceComponents/serviceShowCard';
import { Ionicons } from '@expo/vector-icons';

const TagResultsScreen = () => {
  const { tag } = useLocalSearchParams();
  const router = useRouter();
  const [specialists, setSpecialists] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialistsError, setSpecialistsError] = useState(null);
  const [servicesError, setServicesError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); // To store the logged-in user's ID

  // Fetch the logged-in user's data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/user`);
        setCurrentUserId(userResponse.data.id); // Set the logged-in user's ID
      } catch (err) {
        //console.error('Failed to fetch user data:', err);
      }
    };

    fetchUserData();
  }, []);

  // Fetch specialists and services for the tag
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) return; // Wait until we have the current user's ID

      setLoading(true);
      setSpecialistsError(null);
      setServicesError(null);

      // Fetch specialists
      try {
        const specialistsResponse = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST}/api/specialists/get_specialist_by_tag/${tag}`
        );
        // Filter out specialists that belong to the logged-in user
        const filteredSpecialists = specialistsResponse.data.filter(
          (specialist) => specialist.user !== currentUserId
        );
        setSpecialists(filteredSpecialists || []);
      } catch (err) {
        setSpecialistsError('Failed to fetch specialists. Please try again later.');
        setSpecialists([]);
      }

      // // Fetch services
      // try {
      //   const servicesResponse = await axios.get(
      //     `${process.env.EXPO_PUBLIC_HOST}/api/services/get_services_by_tag/${tag}`
      //   );
      //   // Filter out services that belong to the logged-in user
      //   const filteredServices = servicesResponse.data.filter(
      //     (service) => service.user_id !== currentUserId
      //   );
      //   setServices(filteredServices || []);
      // } catch (err) {
      //   setServicesError('Failed to fetch services. Please try again later.');
      //   setServices([]);
      // }

      setLoading(false);
    };

    fetchData();
  }, [tag, currentUserId]); // Re-fetch data when `tag` or `currentUserId` changes

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollView}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.replace('/specialists_explore')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#007BFF" />
        <Text style={styles.backButtonText}>Back to Search</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Results for "{tag}"</Text>

      {/* Display Specialists */}
      {!specialistsError && (
        <>
          {specialists.length > 0 ? (
            specialists.map((specialist) => (
              <SpecialistShowCard key={specialist.id} specialist={specialist} />
            ))
          ) : (
            <Text style={styles.noResultsText}>No specialists found.</Text>
          )}
        </>
      )}

      {/* Display Services
      // {!servicesError && (
      //   <>
      //     <Text style={styles.sectionTitle}>Services</Text>
      //     {services.length > 0 ? (
      //       services.map((service) => (
      //         <ServiceShowCard key={service.id} service={service} />
      //       ))
      //     ) : (
      //       <Text style={styles.noResultsText}>No services found.</Text>
      //     )}
      //   </>
      // )}*/}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007BFF',
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#007BFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default TagResultsScreen;