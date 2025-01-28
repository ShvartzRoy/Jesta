import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Switch,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const AddServiceScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [],
    location: '',
    dateTimeRange: ['2023-10-01T10:00:00', '2023-10-01T12:00:00'], // Example timestamps
    estimatedDuration: '',
    offeredPayment: '',
    isVolunteering: false,
    serviceFrom: 'publisher', // New field: 'publisher' or 'provider'
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/tags/get_all_tags`);
        setAvailableTags(response.data.tags);
        setFilteredTags(response.data.tags);
      } catch (err) {
        //console.error('Failed to fetch tags:', err);
      }
    };
    fetchTags();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(availableTags);
    }
  };

  const handleAddTag = (tag) => {
    if (!formData.tags.includes(tag.name)) {
      setFormData({ ...formData, tags: [...formData.tags, tag.name] });
    }
    setSearchQuery('');
    setFilteredTags(availableTags);
    Keyboard.dismiss();
  };

  const handleRemoveTag = (tag) => {
    const updatedTags = formData.tags.filter((t) => t !== tag);
    setFormData({ ...formData, tags: updatedTags });
  };

  const formatDuration = (hours, minutes) => {
    let duration = 'PT';
    if (hours > 0) duration += `${hours}H`;
    if (minutes > 0) duration += `${minutes}M`;
    return duration;
  };

  const handlePaymentChange = (text) => {
    if (text === '') {
      setFormData({ ...formData, offeredPayment: '' });
    } else {
      const numericValue = parseFloat(text);
      if (!isNaN(numericValue)) {
        setFormData({ ...formData, offeredPayment: numericValue });
      }
    }
  };

  const handleSubmit = async () => {
    const estimatedDuration = formatDuration(hours, minutes);

    const payload = {
      title: formData.title,
      description: formData.description,
      tags: formData.tags,
      location: formData.location,
      date_time_range: formData.dateTimeRange,
      estimated_duration: estimatedDuration,
      offered_payment: formData.offeredPayment || null,
      service_from: formData.serviceFrom, // Updated to use the new field
      is_volunteering: formData.isVolunteering || false,
    };

    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/create_service`,
        payload
      );
      alert('Service created successfully!');
    } catch (err) {
      //console.error('Failed to create service:', err);
      alert('Failed to create service. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create a New Service</Text>

        <Text style={styles.fieldTitle}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter service title"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />

        <Text style={styles.fieldTitle}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter service description"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
        />

        <Text style={styles.fieldTitle}>Tags</Text>
        <View style={styles.tagsContainer}>
          <TextInput
            style={styles.input}
            placeholder="Search tags..."
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {(isSearchFocused || searchQuery) && (
            <FlatList
              data={filteredTags}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.tagItem} onPress={() => handleAddTag(item)}>
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.tagsList}
              keyboardShouldPersistTaps="handled"
            />
          )}
          <View style={styles.selectedTagsContainer}>
            {formData.tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedTag}
                onPress={() => handleRemoveTag(tag)}
              >
                <Text style={styles.selectedTagText}>{tag} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.fieldTitle}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter service location"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
        />

        <Text style={styles.fieldTitle}>Estimated Duration</Text>
        <View style={styles.durationInputs}>
          <TextInput
            style={[styles.input, styles.durationInput]}
            placeholder="Hours"
            value={String(hours)}
            onChangeText={(text) => setHours(text)}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.durationInput]}
            placeholder="Minutes"
            value={String(minutes)}
            onChangeText={(text) => setMinutes(text)}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.fieldTitle}>Offered Payment</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter payment amount"
          value={String(formData.offeredPayment)}
          onChangeText={handlePaymentChange}
          keyboardType="numeric"
        />

        {/* Toggle for Is Volunteering */}
        <View style={styles.toggleContainer}>
          <Text style={styles.fieldTitle}>Is Volunteering</Text>
          <Switch
            value={formData.isVolunteering}
            onValueChange={(value) => setFormData({ ...formData, isVolunteering: value })}
          />
        </View>

        {/* Field to choose if the service is from a publisher or provider */}
        <Text style={styles.fieldTitle}>Service From</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setFormData({ ...formData, serviceFrom: 'publisher' })}
          >
            <Text style={styles.radioText}>Publisher</Text>
            <View style={styles.radioCircle}>
              {formData.serviceFrom === 'publisher' && <View style={styles.selectedRadioCircle} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setFormData({ ...formData, serviceFrom: 'provider' })}
          >
            <Text style={styles.radioText}>Provider</Text>
            <View style={styles.radioCircle}>
              {formData.serviceFrom === 'provider' && <View style={styles.selectedRadioCircle} />}
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Create Service</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007BFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 8,
  },
  tagItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  selectedTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagText: {
    fontSize: 14,
  },
  durationInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationInput: {
    width: '48%',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioText: {
    fontSize: 16,
    marginRight: 8,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioCircle: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#007BFF',
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddServiceScreen;