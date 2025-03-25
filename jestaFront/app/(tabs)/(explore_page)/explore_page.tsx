import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { Ionicons } from '@expo/vector-icons';
import ServiceCard from '../../components/serviceComponents/serviceCard';
import axios from 'axios';
import { UserContext } from '../../contexts/authContext';
import {useRouter} from 'expo-router';

const Explore_Page = () => {
  const { user } = useContext(UserContext);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [durationCategory, setDurationCategory] = useState('all');
  const [sortOption, setSortOption] = useState('price');
  const [serviceType, setServiceType] = useState('publisher');
  const [ownership, setOwnership] = useState('others');
  const router = useRouter();

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

  const israeliCities = [
    "Tel Aviv",
    "Jerusalem",
    "Haifa",
    "Beer Sheva",
    "Netanya",
    "Ashdod",
    "Rishon LeZion",
    "Petah Tikva",
    "Eilat",
    "Holon",
    "Bat Yam",
    "Rehovot",
    "Hadera",
    "Herzliya",
    "Ramat Gan",
    "Kfar Saba",
    "Modiin",
    "Givatayim",
    "Raanana",
  ];

  useEffect(() => {
    fetchServices();
  }, [serviceType, ownership]);

  useEffect(() => {
    handleSortAndFilter();
  }, [searchQuery, selectedTags, selectedLocation, priceRange, durationCategory, sortOption]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpointMap = {
        publisherMine: '/api/services/get_requested_user_services',
        publisherOthers: '/api/services/get_requested_other_user_services',
        providerMine: '/api/services/get_offered_user_services',
        providerOthers: '/api/services/get_offered_other_user_services',
      };

      const key = `${serviceType}${ownership === 'mine' ? 'Mine' : 'Others'}`;
      const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}${endpointMap[key]}`);

      setServices(response.data);
      setFilteredServices(response.data);
    } catch (err) {
      setError('Failed to fetch services. Please try again later.');
      //console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSortAndFilter = () => {
    let updatedServices = [...services];

    if (searchQuery) {
      updatedServices = updatedServices.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTags.length > 0) {
      updatedServices = updatedServices.filter(service =>
        service.tags.some(tag => selectedTags.includes(tag))
      );
    }

    if (selectedLocation !== 'All Locations') {
      updatedServices = updatedServices.filter(service =>
        service.location.toLowerCase() === selectedLocation.toLowerCase()
      );
    }

    updatedServices = updatedServices.filter(service =>
      service.offered_payment >= priceRange[0] && service.offered_payment <= priceRange[1]
    );

    if (durationCategory !== 'all') {
      updatedServices = updatedServices.filter(service => {
        const serviceDuration = parseISO8601Duration(service.estimated_duration);
        switch (durationCategory) {
          case 'short':
            return serviceDuration <= 180; // 0-3 hours
          case 'medium':
            return serviceDuration > 180 && serviceDuration <= 1440; // 3 hours - 1 day
          case 'long':
            return serviceDuration > 1440 && serviceDuration <= 4320; // 1-3 days
          case 'very_long':
            return serviceDuration > 4320; // 3+ days
          default:
            return true;
        }
      });
    }

    if (sortOption) {
      updatedServices.sort((a, b) => {
        if (sortOption === 'price') return a.offered_payment - b.offered_payment;
        if (sortOption === 'price_desc') return b.offered_payment - a.offered_payment;
        if (sortOption === 'name') return a.title.localeCompare(b.title);
        if (sortOption === 'date') return new Date(a.date_time_range[0]).getTime() - new Date(b.date_time_range[0]).getTime();
        if (sortOption === 'date_desc') return new Date(b.date_time_range[0]).getTime() - new Date(a.date_time_range[0]).getTime();
        return 0;
      });
    }

    setFilteredServices(updatedServices);
  };

  const parseISO8601Duration = (duration) => {
    const matches = duration.match(/P(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/);
    if (!matches) return 0;

    const days = parseInt(matches[1] || '0', 10);
    const hours = parseInt(matches[2] || '0', 10);
    const minutes = parseInt(matches[3] || '0', 10);
    return days * 24 * 60 + hours * 60 + minutes;
  };

  const handleTagSelection = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search services..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFiltersVisible(!filtersVisible)}
        >
          <Ionicons name="filter" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addServiceButton}
          onPress={() => router.push('/addService')} // Navigate to the "Add Service" screen
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {filtersVisible && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Price Range:</Text>
          <Text>{`₪${priceRange[0]} - ₪${priceRange[1]}`}</Text>
          <MultiSlider
            values={priceRange}
            min={0}
            max={1000}
            step={50}
            onValuesChangeFinish={(values) => setPriceRange(values)}
          />

          <Text style={styles.filterLabel}>Location:</Text>
          <Picker
            selectedValue={selectedLocation}
            style={styles.picker}
            onValueChange={(value) => setSelectedLocation(value)}
          >
            <Picker.Item label="All Locations" value="All Locations" />
            {israeliCities.map((city) => (
              <Picker.Item key={city} label={city} value={city} />
            ))}
          </Picker>

          <Text style={styles.filterLabel}>Duration:</Text>
          <Picker
            selectedValue={durationCategory}
            style={styles.picker}
            onValueChange={(value) => setDurationCategory(value)}
          >
            <Picker.Item label="All Durations" value="all" />
            <Picker.Item label="Short (0-3 hours)" value="short" />
            <Picker.Item label="Medium (3 hours - 1 day)" value="medium" />
            <Picker.Item label="Long (1 day - 3 days)" value="long" />
            <Picker.Item label="Very Long (3+ days)" value="very_long" />
          </Picker>

          <Text style={styles.filterLabel}>Tags:</Text>
          <View style={styles.tagBar}>
            {predefinedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTags.includes(tag) && styles.selectedTag,
                ]}
                onPress={() => handleTagSelection(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.selectedTagText,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.navItem, serviceType === 'publisher' && styles.activeToggle]}
          onPress={() => setServiceType('publisher')}
        >
          <Text>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, serviceType === 'provider' && styles.activeToggle]}
          onPress={() => setServiceType('provider')}
        >
          <Text>Offers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, ownership === 'mine' && styles.activeToggle]}
          onPress={() => setOwnership('mine')}
        >
          <Text>Mine</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, ownership === 'others' && styles.activeToggle]}
          onPress={() => setOwnership('others')}
        >
          <Text>Others</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <ServiceCard service={service} currentUserId={user.id} />
          ))
        ) : (
          <Text style={styles.noResultsText}>No services found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
  },
  filterButton: {
    padding: 10,
    marginLeft: 10,
  },
  filterContainer: {
    marginBottom: 10,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
  },
  navTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  navItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  activeToggle: {
    backgroundColor: '#0056b3',
  },
  contentContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
  filterLabel: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  tagBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  tagButton: {
    backgroundColor: '#e6e6e6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  addServiceButton: {
    padding: 20,
    marginLeft: 10,
  },
  selectedTag: {
    backgroundColor: '#007AFF',
  },
  tagText: {
    color: '#333',
    fontSize: 14,
  },
  selectedTagText: {
    color: '#fff',
  },
});

export default Explore_Page;