import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ServiceShowCard = ({ service }) => {
  // Convert tags to a string if it's an object
  const tags = typeof service.tags === 'object' ? Object.values(service.tags).join(', ') : service.tags;

  // Convert date_time_range to a string if it's an object
  const dateTimeRange = typeof service.date_time_range === 'object' ? Object.values(service.date_time_range).join(', ') : service.date_time_range;

  return (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.title}>{service.title}</Text>
      <Text style={styles.text}>Description: {service.description}</Text>
      <Text style={styles.text}>Tags: {tags}</Text>
      <Text style={styles.text}>Location: {service.location}</Text>
      <Text style={styles.text}>Date/Time Range: {dateTimeRange}</Text>
      <Text style={styles.text}>Estimated Duration: {service.estimated_duration}</Text>
      <Text style={styles.text}>State: {service.state}</Text>
      <Text style={styles.text}>Offered Payment: ${service.offered_payment}</Text>
      <Text style={styles.text}>Job: {service.is_job ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Volunteering: {service.is_volunteering ? 'Yes' : 'No'}</Text>
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

export default ServiceShowCard;