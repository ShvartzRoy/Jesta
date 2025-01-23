import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { UserContext } from '../../contexts/authContext';
import axios from 'axios';

interface Service {
  id: number;
  title: string;
  description: string;
  location: string;
  offered_payment: number;
  is_volunteering: boolean;
  date_time_range: string[];
  estimated_duration: string;
}

const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
  return (
    <TouchableOpacity style={styles.serviceCard}>
      <Text style={styles.serviceTitle}>{service.title}</Text>
      <Text style={styles.serviceDescription}>{service.description}</Text>
      <View style={styles.serviceDetails}>
        <View>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.serviceLocation}>{service.location}</Text>
        </View>
        <View>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.serviceDate}>{service.date_time_range[0]} - {service.date_time_range[1]}</Text>
        </View>
        <View>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.serviceDuration}>{service.estimated_duration}</Text>
        </View>
        <Text style={styles.servicePrice}>
          {service.offered_payment > 0 
            ? `$${service.offered_payment}` 
            : service.is_volunteering 
              ? 'Volunteering' 
              : 'Free'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const Explore_Page = () => {
  const { user } = useContext(UserContext);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/get_all_services`);
        setServices(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch services', error);
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return <Text>Loading services...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Services for You</Text>
      <FlatList
        data={services}
        renderItem={({ item }) => <ServiceCard service={item} />}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  serviceDescription: {
    marginBottom: 10,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 10,
    color: 'gray',
  },
  serviceLocation: {
    color: '#333',
  },
  serviceDate: {
    color: '#333',
  },
  serviceDuration: {
    color: '#333',
  },
  servicePrice: {
    fontWeight: 'bold',
    color: 'green',
  },
});

export default Explore_Page;