import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onAddService: (serviceData: any) => void;
}

export default function AddServiceModal({
  visible,
  onClose,
  onAddService,
}: AddServiceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [offeredPayment, setOfferedPayment] = useState('');
  const [isVolunteering, setIsVolunteering] = useState(false);
  const [tags, setTags] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [durationDays, setDurationDays] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [serviceFrom, setServiceFrom] = useState<'provider' | 'publisher'>('publisher');

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; //YYYY-MM-DD
  };

  const convertToISO8601 = () => {
    const days = parseInt(durationDays) || 0;
    const hours = parseInt(durationHours) || 0;
    return `P${days}DT${hours}H00M00S`; //P2DT3H00M00S
  };

  const handleAdd = () => {
    if (!title || !description || !location || !offeredPayment || tags.trim() === '') {
      Alert.alert('Error', 'Please fill in all required fields');
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
      tags: tags.split(',').map((tag) => tag.trim()),
      date_time_range: [formatDate(startDate), formatDate(endDate)],
      estimated_duration: convertToISO8601(),
      offered_payment: parseFloat(offeredPayment),
      service_from: serviceFrom,
      is_volunteering: isVolunteering,
    };

    console.log('Submitting:', payload);

    onAddService(payload);

    //Reset fields
    setTitle('');
    setDescription('');
    setLocation('');
    setOfferedPayment('');
    setIsVolunteering(false);
    setTags('');
    setDurationDays('');
    setDurationHours('');
    setStartDate(new Date());
    setEndDate(new Date());
    setServiceFrom('publisher');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Add New Service</Text>

          <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
          <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
          <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input} />
          <TextInput placeholder="Offered Payment" value={offeredPayment} onChangeText={setOfferedPayment} keyboardType="numeric" style={styles.input} />

          <View style={styles.switchRow}>
            <Text>Volunteering</Text>
            <Switch value={isVolunteering} onValueChange={setIsVolunteering} />
          </View>

          <TextInput
            placeholder="Tags (comma separated)"
            value={tags}
            onChangeText={setTags}
            style={styles.input}
          />

          <Text style={{ marginTop: 10 }}>Start Date: {formatDate(startDate)}</Text>
          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
            <Text>Select Start Date</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}

          <Text style={{ marginTop: 10 }}>End Date: {formatDate(endDate)}</Text>
          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
            <Text>Select End Date</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}

          <TextInput
            placeholder="Duration Days"
            value={durationDays}
            onChangeText={setDurationDays}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            placeholder="Duration Hours"
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
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
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
