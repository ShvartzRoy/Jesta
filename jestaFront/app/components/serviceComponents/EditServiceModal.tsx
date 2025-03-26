import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import TagBar from './TagBar';
import Autocomplete from 'react-native-autocomplete-input';
import { Keyboard } from 'react-native';



interface EditServiceModalProps {
  visible: boolean;
  onClose: () => void;
  service: any;
  user: any;
  onSave: (updatedService: any) => void;
}

const cities = [
  "Ashdod", "Ashkelon", "Bat Yam", "Beer Sheva", "Bnei Brak", "Eilat", "Haifa",
  "Herzliya", "Holon", "Jerusalem", "Kfar Saba", "Netanya", "Nazareth", 
  "Petah Tikva", "Ramat Gan", "Rehovot", "Rishon LeZion", "Tel Aviv", "Tiberias", "Yokneam"
].sort();


const predefinedTags = [
  "babysitter",
  "photographer",
  "private tutor",
  "hitchhike",
  "handyman",
  "dogwalker",
  "dogsitter",
  "mover",
];

export default function EditServiceModal({
  visible,
  onClose,
  service,
  user,
  onSave,
}: EditServiceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [offeredPayment, setOfferedPayment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [durationDays, setDurationDays] = useState('');
  const [durationHours, setDurationHours] = useState('');

  //Reset fields when modal opens
  useEffect(() => {
    if (visible && service) {
      setTitle(service.title);
      setDescription(service.description);
      setLocation(service.location);
      setLocationQuery(''); 
      setOfferedPayment(service.offered_payment.toString());
      setSelectedTags(service.tags);
      setStartDate(new Date(service.date_time_range[0]));
      setEndDate(new Date(service.date_time_range[1]));
      setDurationDays('');
      setDurationHours('');
    }
  }, [visible, service]);

  const formatDateTime = (date: Date) => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const convertToISO8601 = () => {
    const days = parseInt(durationDays) || 0;
    const hours = parseInt(durationHours) || 0;
    return `P${days}DT${hours}H00M00S`;
  };

  const handleClose = () => {
    setLocation('');
    setSelectedTags([]);
    setLocationQuery('');
    onClose(); 
  };

  const handleSave = async () => {
    try {
      const id = service.id;
      const headers = { Authorization: `Bearer ${user.token}` };

      const postWithQueryParam = async (endpoint: string, data: any) => {
        return await axios.post(
          `${process.env.EXPO_PUBLIC_HOST}/api/services/${endpoint}/${id}?new_data=${encodeURIComponent(data)}`,
          {},
          { headers }
        );
      };

      //1. Title
      if (title !== service.title) {
        await postWithQueryParam("update_name", title);
      }

      //2. Description
      if (description !== service.description) {
        await postWithQueryParam("update_description", description);
      }

      //3. Location
      if (location !== service.location) {
        await postWithQueryParam("update_location", location);
      }

      //4. Tags
      if (JSON.stringify(selectedTags) !== JSON.stringify(service.tags)) {
        console.log('Sending tags update:', selectedTags);
        await axios.post(
          `${process.env.EXPO_PUBLIC_HOST}/api/services/update_tags/${id}`,
          selectedTags,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      

      //5. Date Range
      const formattedDateRange = [startDate.toISOString(), endDate.toISOString()];
      console.log('Sending date_time_range update:', formattedDateRange);

      if (
        formattedDateRange[0] !== service.date_time_range[0] ||
        formattedDateRange[1] !== service.date_time_range[1]
      ) {
        await axios.post(
          `${process.env.EXPO_PUBLIC_HOST}/api/services/update_date_time_range/${id}`,
          formattedDateRange,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      //6. Duration
      if (durationDays || durationHours) {
        const isoDuration = convertToISO8601();
        await postWithQueryParam("update_estimated_duration", isoDuration);
      }

      //7. Payment
      const payment = parseFloat(offeredPayment);
      if (payment !== service.offered_payment) {
        await postWithQueryParam("update_offered_payment", payment);
      }

      Alert.alert('Success', 'Service updated!');
      const updatedService = {
        ...service,
        title,
        description,
        location,
        tags: selectedTags,
        date_time_range: formattedDateRange,
        estimated_duration: convertToISO8601(),
        offered_payment: payment,
      };
      onSave(updatedService);
      handleClose();
    } catch (error: any) {
      console.error('Error updating service:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to update service. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Edit Service</Text>

          <TextInput placeholder="Title" placeholderTextColor="black" value={title} onChangeText={setTitle} style={styles.input} />
          <TextInput placeholder="Description" placeholderTextColor="black" value={description} onChangeText={setDescription} style={styles.input} />

          <Autocomplete
  data={
    locationQuery.length > 0 && locationQuery !== location
      ? cities.filter(city =>
          city.toLowerCase().startsWith(locationQuery.toLowerCase())
        )
      : []
  }
  value={locationQuery || location}
  onChangeText={(text) => {
    setLocationQuery(text);
    setLocation('');
  }}
  flatListProps={{
    keyExtractor: (_, idx) => idx.toString(),
    renderItem: ({ item }) => (
      <TouchableOpacity
        onPress={() => {
          setLocation(item);
          setLocationQuery(''); 
          Keyboard.dismiss();
        }}
      >
        <Text style={styles.itemText}>{item}</Text>
      </TouchableOpacity>
    ),
  }}
  inputContainerStyle={styles.input}
  containerStyle={{ marginBottom: 10, zIndex: 1 }}
  listContainerStyle={{
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  }}
  placeholder="Select City"
/>




          <TextInput placeholder="Offered Payment" placeholderTextColor="black" value={offeredPayment} onChangeText={setOfferedPayment} keyboardType="numeric" style={styles.input} />

          <TagBar
            predefinedTags={predefinedTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />


          <Text style={{ marginTop: 10 }}>Start: {formatDateTime(startDate)}</Text>
          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
            <Text>Select Start Date & Time</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}

          <Text style={{ marginTop: 10 }}>End: {formatDateTime(endDate)}</Text>
          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
            <Text>Select End Date & Time</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}

          <TextInput
            placeholder="Duration Days"
            placeholderTextColor="black"
            value={durationDays}
            onChangeText={setDurationDays}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            placeholder="Duration Hours"
            placeholderTextColor="black"
            value={durationHours}
            onChangeText={setDurationHours}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSave} style={styles.addButton}>
              <Text style={{ color: 'white' }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
              <Text style={{ color: 'white' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    width: '90%',
    borderRadius: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  itemText: {
    padding: 10,
    fontSize: 16,
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 5,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#d9534f',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  dateButton: {
    backgroundColor: '#e8e8e8',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    alignItems: 'center',
  },
});