import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import TagBar from './TagBar';
import Autocomplete from 'react-native-autocomplete-input';
import { Keyboard } from 'react-native';



interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onAddService: (serviceData: any) => void;
}


const cities = [
  "Ashdod", "Ashkelon", "Bat Yam", "Beer Sheva", "Bnei Brak", "Eilat", "Haifa",
  "Herzliya", "Holon", "Jerusalem", "Kfar Saba", "Netanya", "Nazareth", 
  "Petah Tikva", "Ramat Gan", "Rehovot", "Rishon LeZion", "Tel Aviv", "Tiberias", "Yokneam"
].sort((a, b) => a.localeCompare(b));



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

export default function AddServiceModal({
  visible,
  onClose,
  onAddService,
}: AddServiceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');


  const [location, setLocation] = useState('');
  const [locationQuery, setLocationQuery] = useState('');


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

    if (offeredPayment.trim() === '' || isNaN(parseFloat(offeredPayment))) {
      Alert.alert('Error', 'Please enter a valid payment (even 0)');
      return;
    }

    if (parseFloat(offeredPayment) < 0) {
      Alert.alert('Error', 'Offered payment cannot be negative!');
      return;
    }

    if (parseFloat(offeredPayment) > 0 && isVolunteering) {
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
      offered_payment: parseFloat(offeredPayment),
      service_from: serviceFrom,
      is_volunteering: isVolunteering,
    };

    console.log('Submitting:', payload);
    onAddService(payload);
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Add New Service</Text>

          <TextInput placeholder="Title" placeholderTextColor="black" value={title} onChangeText={setTitle} style={styles.input} />
          <TextInput placeholder="Description" placeholderTextColor="black" value={description} onChangeText={setDescription} style={styles.input} />


          <Text style={{ marginTop: 10 }}>Location:</Text>
          <Autocomplete
          data={
            locationQuery.length > 0
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
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
