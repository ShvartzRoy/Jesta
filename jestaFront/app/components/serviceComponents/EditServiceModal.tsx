import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import TagBar from './TagBar';

const cities = [
  "Ashdod", "Ashkelon", "Bat Yam", "Beer Sheva", "Bnei Brak", "Eilat", "Haifa",
  "Herzliya", "Holon", "Jerusalem", "Kfar Saba", "Netanya", "Nazareth",
  "Petah Tikva", "Ramat Gan", "Rehovot", "Rishon LeZion", "Tel Aviv", "Tiberias", "Yokneam"
].sort();

const predefinedTags = [
  "babysitter", "photographer", "private tutor", "hitchhike",
  "handyman", "dogwalker", "dogsitter", "mover"
];

export default function EditServiceModal({ visible, onClose, service, user, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [offeredPayment, setOfferedPayment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [durationDays, setDurationDays] = useState('');
  const [durationHours, setDurationHours] = useState('');

  useEffect(() => {
    if (visible && service) {
      setTitle(service.title);
      setDescription(service.description);
      setLocation(service.location);
      setLocationQuery(service.location);
      setOfferedPayment(service.offered_payment.toString());
      setSelectedTags(service.tags);
      setStartDate(new Date(service.date_time_range[0]));
      setEndDate(new Date(service.date_time_range[1]));
    }
  }, [visible, service]);

  const formatDateTime = (date) => `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const convertToISO8601 = () => {
    const days = durationDays.trim() === '' ? 0 : parseInt(durationDays);
    const hours = durationHours.trim() === '' ? 0 : parseInt(durationHours);
    return `P${days}DT${hours}H00M00S`;
  };
  
  const filteredCities = locationQuery ? cities.filter(c => c.toLowerCase().startsWith(locationQuery.toLowerCase())) : [];

  const handleClose = () => {
    setLocation('');
    setSelectedTags([]);
    setLocationQuery('');
    onClose();
  };

  const handleSave = async () => {
    const inputDays = parseInt(durationDays.trim() || '0');
    const inputHours = parseInt(durationHours.trim() || '0');
    
    const durationInMs = (inputDays * 24 * 60 * 60 * 1000) +
                         (inputHours * 60 * 60 * 1000);
    
    const rangeInMs = endDate.getTime() - startDate.getTime();
    
    if (durationInMs > rangeInMs + 60 * 1000) {
      Alert.alert(
        "Invalid Duration",
        `The estimated duration (${inputDays}d ${inputHours}h) is longer than the time between start and end.`
      );
      return;
    }
    

    try {
      const id = service.id;
      const headers = { Authorization: `Bearer ${user.token}` };
      const postWithQueryParam = async (endpoint, data) => axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/services/${endpoint}/${id}?new_data=${encodeURIComponent(data)}`, {}, { headers });

      if (title !== service.title) await postWithQueryParam("update_name", title);
      if (description !== service.description) await postWithQueryParam("update_description", description);
      if (location !== service.location) await postWithQueryParam("update_location", location);

      if (JSON.stringify(selectedTags) !== JSON.stringify(service.tags)) {
        await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/services/update_tags/${id}`, selectedTags, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      const formattedDateRange = [startDate.toISOString(), endDate.toISOString()];
      if (formattedDateRange[0] !== service.date_time_range[0] || formattedDateRange[1] !== service.date_time_range[1]) {
        await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/services/update_date_time_range/${id}`, formattedDateRange, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      await postWithQueryParam("update_estimated_duration", convertToISO8601());
      

      const payment = parseFloat(offeredPayment);
      if (payment !== service.offered_payment) await postWithQueryParam("update_offered_payment", payment);

      Alert.alert('Success', 'Service updated!');
      onSave({ ...service, title, description, location, tags: selectedTags, date_time_range: formattedDateRange, estimated_duration: convertToISO8601(), offered_payment: payment });
      handleClose();
    } catch (error) {
      console.error('Error updating service:', error);
      Alert.alert('Error', 'Failed to update service. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
            <Text style={styles.header}>Edit Service</Text>
            <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input}  placeholderTextColor="black" />
            <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} placeholderTextColor="black" />
            <TextInput
              placeholder="City"
              placeholderTextColor="black"
              value={locationQuery}
              onChangeText={(text) => {
                setLocationQuery(text);
                setLocation('');
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              style={styles.input}
            />
            {showDropdown && filteredCities.length > 0 && (
              <View style={styles.dropdown}>
                {filteredCities.map((city, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setLocation(city);
                      setLocationQuery(city);
                      setShowDropdown(false);
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={styles.dropdownItem}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {!service?.is_volunteering && (
              <TextInput
                placeholder="Offered Payment"
                placeholderTextColor="black"
                value={offeredPayment}
                onChangeText={setOfferedPayment}
                keyboardType="numeric"
                style={styles.input}
              />
            )}

            <TagBar predefinedTags={predefinedTags} selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
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
            <TextInput placeholder="Duration Days" placeholderTextColor="black" value={durationDays} onChangeText={setDurationDays} keyboardType="numeric" style={styles.input} />
            <TextInput placeholder="Duration Hours" placeholderTextColor="black" value={durationHours} onChangeText={setDurationHours} keyboardType="numeric" style={styles.input} />
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={handleSave} style={styles.addButton}>
                <Text style={{ color: 'white' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                <Text style={{ color: 'white' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    paddingTop: 50,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 6,
    borderRadius: 6,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: -6,
    marginBottom: 8,
    zIndex: 99,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#d9534f',
    padding: 10,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  dateButton: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
    alignItems: 'center',
  },
});
