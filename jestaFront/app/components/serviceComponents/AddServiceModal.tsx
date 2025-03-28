import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  Switch, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import TagBar from './TagBar';

interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onAddService: (serviceData: any) => void;
}

const cities = [
  "Ashdod", "Ashkelon", "Bat Yam", "Beer Sheva", "Bnei Brak", "Eilat", "Haifa",
  "Herzliya", "Holon", "Jerusalem", "Kfar Saba", "Netanya", "Nazareth",
  "Petah Tikva", "Ramat Gan", "Rehovot", "Rishon LeZion", "Tel Aviv", "Tiberias", "Yokneam"
].sort();

const predefinedTags = [
  "babysitter", "photographer", "private tutor", "hitchhike",
  "handyman", "dogwalker", "dogsitter", "mover"
];

export default function AddServiceModal({ visible, onClose, onAddService }: AddServiceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [offeredPayment, setOfferedPayment] = useState('');
  const [isVolunteering, setIsVolunteering] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [durationDays, setDurationDays] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [serviceFrom, setServiceFrom] = useState<'provider' | 'publisher'>('publisher');

  const formatDateTime = (date: Date) =>
    `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const convertToISO8601 = () => {
    const days = parseInt(durationDays) || 0;
    const hours = parseInt(durationHours) || 0;
    return `P${days}DT${hours}H00M00S`;
  };

  const filteredCities = locationQuery
    ? cities.filter(c => c.toLowerCase().startsWith(locationQuery.toLowerCase()))
    : [];

  const resetFields = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setLocationQuery('');
    setOfferedPayment('');
    setIsVolunteering(false);
    setSelectedTags([]);
    setDurationDays('');
    setDurationHours('');
    setStartDate(new Date());
    setEndDate(new Date());
    setServiceFrom('publisher');
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleAdd = () => {
    if (!title || !description || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
  
    if (startDate > endDate) {
      Alert.alert('Error', 'End date cannot be before start date!');
      return;
    }
  
    //If volunteering and no payment entered, default it to "0"
    let paymentValue = offeredPayment.trim();
    if (isVolunteering && paymentValue === '') {
      paymentValue = '0';
    }
  
    if (paymentValue === '' || isNaN(parseFloat(paymentValue))) {
      Alert.alert('Error', 'Please enter a valid payment (even 0)');
      return;
    }
  
    if (parseFloat(paymentValue) < 0) {
      Alert.alert('Error', 'Offered payment cannot be negative!');
      return;
    }
  
    if (parseFloat(paymentValue) > 0 && isVolunteering) {
      Alert.alert('Error', 'Service cannot be both paid and volunteering!');
      return;
    }
  
    const payload = {
      title,
      description,
      location,
      tags: selectedTags,
      date_time_range: [startDate.toISOString(), endDate.toISOString()],
      estimated_duration: convertToISO8601(),
      offered_payment: parseFloat(paymentValue),
      service_from: serviceFrom,
      is_volunteering: isVolunteering,
    };
  
    console.log("Sending payload:", JSON.stringify(payload));
    onAddService(payload);
    handleClose();
  };
  

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
            <Text style={styles.header}>Add New Service</Text>

            <TextInput placeholder="Title" placeholderTextColor="black" value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput placeholder="Description" placeholderTextColor="black" value={description} onChangeText={setDescription} style={styles.input} />

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
                    <Text style={styles.dropdownItem}>{city}
                      
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              placeholder="Offered Payment"
              placeholderTextColor="black"
              value={offeredPayment}
              onChangeText={setOfferedPayment}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text>Volunteering</Text>
              <Switch value={isVolunteering} onValueChange={setIsVolunteering} />
            </View>

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

            <View style={styles.switchRow}>
              <Text>Service Type: {serviceFrom === 'provider' ? 'Offer' : 'Request'}</Text>
              <Switch
                value={serviceFrom === 'provider'}
                onValueChange={(val) => setServiceFrom(val ? 'provider' : 'publisher')}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
                <Text style={{ color: 'white' }}>Add</Text>
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
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
