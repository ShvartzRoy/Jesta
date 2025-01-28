import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const EditService = () => {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams(); // Get the service ID from the URL
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [location, setLocation] = useState('');
  const [offeredPayment, setOfferedPayment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the service data on component mount
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST}/api/get_service/${serviceId}`
        );
        const service = response.data;
        setTitle(service.title);
        setDescription(service.description);
        setTags(service.tags);
        setLocation(service.location);
        setOfferedPayment(service.offered_payment.toString());
        setIsLoading(false);
      } catch (error) {
        //console.error('Error fetching service data:', error);
        Alert.alert('Error', 'Failed to fetch service data.');
        setIsLoading(false);
      }
    };

    fetchServiceData();
  }, [serviceId]);

  const handleUpdateService = async () => {
    if (!title || !description || !location || !offeredPayment) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const payload = {
        title,
        description,
        tags,
        location,
        offered_payment: parseFloat(offeredPayment),
      };

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/update_service/${serviceId}`,
        payload
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Service updated successfully!');
        router.push(`/service/${serviceId}`);
      }
    } catch (error) {
      //console.error('Error updating service:', error);
      Alert.alert('Error', 'Failed to update service.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter title"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description"
        multiline
      />

      <Text style={styles.label}>Tags</Text>
      <TextInput
        style={styles.input}
        value={tags.join(', ')}
        onChangeText={(text) => setTags(text.split(',').map((tag) => tag.trim()))}
        placeholder="Enter tags (comma-separated)"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Enter location"
      />

      <Text style={styles.label}>Offered Payment</Text>
      <TextInput
        style={styles.input}
        value={offeredPayment}
        onChangeText={setOfferedPayment}
        placeholder="Enter offered payment"
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdateService}>
        <Text style={styles.buttonText}>Update Service</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditService;