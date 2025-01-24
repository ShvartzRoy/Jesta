import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Button,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { Picker } from "@react-native-picker/picker";


import { UserContext } from "../../contexts/authContext";
import axios from "axios";

interface Service {
  id: number;
  title: string;
  description: string;
  location: string;
  tags: string[];
  date_time_range: string[];
  estimated_duration: string;
  offered_payment: number;
  service_from: "provider" | "publisher";
  is_volunteering: boolean;
}

const parseDuration = (duration) => {
  const regex = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  const match = duration.match(regex);

  if (!match) return "Invalid duration";

  const [_, days, hours, minutes, seconds] = match.map((value) =>
    value ? parseInt(value) : 0
  );

  let result = [];
  if (days) result.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours) result.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes) result.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  if (seconds) result.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

  return result.join(", ");
};

const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
  const serviceType =
    service.service_from === "provider" ? "Offer" : "Request";

  return (
    <TouchableOpacity style={styles.serviceCard}>
      <Text style={styles.serviceTitle}>{service.title}</Text>
      <Text style={styles.serviceDescription}>{service.description}</Text>
      <View style={styles.serviceDetails}>
        <View>
          <Text style={styles.detailLabel}>Tags:</Text>
          <Text>{service.tags.join(", ")}</Text>
        </View>
        <View>
          {/* <Text style={styles.detailLabel}>Location:</Text> */}
          <Image source={require('../../../assets/images/location.png')} style={styles.icon} />
          <Text>{service.location}</Text>
        </View>
        <View>
          {/* <Text style={styles.detailLabel}>Time Period:</Text> */}
          <Image source={require('../../../assets/images/timeperiod.png')} style={styles.icon} />

          <Text>
            {service.date_time_range[0]} - {service.date_time_range[1]}
          </Text>
        </View>
        <View>
            <View style={styles.iconTextContainer}>
              <Image source={require('../../../assets/images/duration.png')} style={styles.icon} />
              {/* <Text style={styles.detailLabel}>Duration:</Text> */}
              <Text>{parseDuration(service.estimated_duration)}</Text>
            </View>
        </View>
        <View>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text>{serviceType}</Text>
        </View>
      </View>
      <Text style={styles.servicePrice}>
        {service.offered_payment > 0
          ? `₪${service.offered_payment}`
          : service.is_volunteering
          ? "Volunteering"
          : "Free"}
      </Text>
    </TouchableOpacity>
  );
};


const Explore_Page = () => {
  const { user } = useContext(UserContext);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [durationCategory, setDurationCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);



  const predefinedTags = [
    'babysitter',
    'photographer',
    'private tutor',
    'hitchhike',
    'handyman',
    'dogwalker',
    'dogsitter',
    'mover',
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
  

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_all_services`
      );
      setServices(response.data);
      setFilteredServices(response.data);
      setError(false);
    } catch (error) {
      console.error('Failed to fetch services', error);
      setError(true);
      Alert.alert('Error', 'Failed to load services. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (event, date) => {
    if (date) {
      setSelectedDate(date); // Update the selected date
    }
    setIsModalVisible(false); // Close the modal
  };
  


  const filterServices = () => {
    let filtered = services;

    if (searchQuery.trim()) {
      filtered = filtered.filter((service) =>
        service.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
    }

    filtered = filtered.filter(
      (service) =>
        service.offered_payment >= priceRange[0] &&
        service.offered_payment <= priceRange[1]
    );

    if (selectedLocation && selectedLocation !== "All Locations") {
      filtered = filtered.filter((service) => service.location.toLowerCase() === selectedLocation.toLowerCase());
    }



    if (durationCategory) {
      filtered = filtered.filter((service) => {
        const serviceDuration = parseISO8601Duration(service.estimated_duration);
        switch (durationCategory) {
          case "short":
            return serviceDuration <= 180; // 0-3 hours
          case "medium":
            return serviceDuration > 180 && serviceDuration <= 1440; // 3 hours - 1 day
          case "long":
            return serviceDuration > 1440 && serviceDuration <= 4320; // 1-3 days
          case "very_long":
            return serviceDuration > 4320; // 3+ days
          default:
            return true;
        }
      });
    }


    if (selectedDate) {
      filtered = filtered.filter((service) => {
        const serviceStartDate = new Date(service.date_time_range[0]);
        return (
          serviceStartDate.toDateString() === selectedDate.toDateString()
        );
      });
    }

    setFilteredServices(filtered);
  };

  const parseISO8601Duration = (duration: string): number => {
    const matches = duration.match(
      /P(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/
    );
    if (!matches) return 0;
  
    const days = parseInt(matches[1] || '0', 10);
    const hours = parseInt(matches[2] || '0', 10);
    const minutes = parseInt(matches[3] || '0', 10);
    return days * 24 * 60 + hours * 60 + minutes;
  };
  


  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredServices(services); 
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_services_by_title/${searchQuery.trim()}`
      );
      setFilteredServices(response.data);
    } catch (error) {
      console.error('Search error', error);
      Alert.alert('Error', 'Failed to search services. Please try again.');
    }
  };

  const handleFilterByTag = (tag: string | null) => {
    setSelectedTag(tag);
    if (!tag) {
      setFilteredServices(services); 
    } else {
      const filtered = services.filter((service) =>
        service.tags.includes(tag)
      );
      setFilteredServices(filtered);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, priceRange, durationCategory, selectedDate, selectedLocation]);
  

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading services...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load services.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (




    <View style={styles.container}>
      <Text style={styles.header}>Explore Services</Text>


      <TouchableOpacity
      style={styles.icon}
      onPress={() => setFiltersVisible(true)} // Show filters
    >
      <Image
        source={require('../../../assets/images/filter.png')}
        style={styles.icon}
      />
    </TouchableOpacity>



      {/* Search by Title */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by title..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
      />
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      Tag Filters
      <View style={styles.tagContainer}>
        <FlatList
          horizontal
          data={predefinedTags}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tagButton,
                selectedTag === item && styles.selectedTag,
              ]}
              onPress={() => handleFilterByTag(item)}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTag === item && styles.selectedTagText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
        {/* Clear Filter Button */}
        {selectedTag && (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={() => handleFilterByTag(null)}
          >
            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </TouchableOpacity>
        )}
      </View>
      

      <View style={styles.sliderContainer}>
      <Text>Price Range: ₪{priceRange[0]} - ₪{priceRange[1]}</Text>
      <MultiSlider
        values={[priceRange[0], priceRange[1]]} // Initial range values
        min={0} // Minimum slider value
        max={10000} // Maximum slider value
        step={10} // Step size
        onValuesChangeFinish={(values) => {
          setPriceRange(values); // Update the state with new range
          filterServices(); // Apply the filter
        }}
        sliderLength={280} // Width of the slider
        selectedStyle={{ backgroundColor: '#007AFF' }} // Active track color
        unselectedStyle={{ backgroundColor: '#d3d3d3' }} // Inactive track color
        markerStyle={{
          height: 20,
          width: 20,
          borderRadius: 10,
          backgroundColor: '#007AFF',
        }} // Styling for the thumb markers
      />


    </View>



    <View style={styles.dropdownContainer}>
    <Text style={styles.filterLabel}>Location:</Text>
    <Picker
    selectedValue={selectedLocation}
    onValueChange={(itemValue) => {
      setSelectedLocation(itemValue); // Update selected location
      filterServices(); // Apply the filter
    }}
    style={styles.picker}
  >
    <Picker.Item label="All Locations" value="All Locations" />
    {israeliCities.map((city) => (
      <Picker.Item key={city} label={city} value={city} />
    ))}
  </Picker>

  </View>

      


    {/* Duration Filter Dropdown */}
    <View style={styles.dropdownContainer}>
        <Text style={styles.filterLabel}>Duration:</Text>
        <Picker
          selectedValue={durationCategory}
          onValueChange={(itemValue) => {
            setDurationCategory(itemValue);
            filterServices();
          }}
          style={styles.picker}
        >
          <Picker.Item label="All Durations" value={null} />
          <Picker.Item label="Short (0-3 hours)" value="short" />
          <Picker.Item label="Medium (3 hours - 1 day)" value="medium" />
          <Picker.Item label="Long (1 day - 3 days)" value="long" />
          <Picker.Item label="Very Long (3+ days)" value="very_long" />
        </Picker>
      </View>


      {/* Date Picker Modal */}
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setIsModalVisible(true)}
        >
        <Text>{selectedDate ? selectedDate.toDateString() : "Choose a date"}</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateSelect}
          />
          <Button title="Close" onPress={() => setIsModalVisible(false)} />
        </View>
      </Modal>

  

      {/* List of Services */}
      <FlatList
        data={filteredServices}
        renderItem={({ item }) => (
          <ServiceCard service={item} />
        )}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
};


const styles = StyleSheet.create({

  sliderContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },

  container: {
    flex: 1,
    backgroundColor: "#e6ebf2",
    paddingHorizontal: 10,
    
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 15,
    textAlign: "center",
  },

  searchInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  dropdownContainer: {
    marginVertical: 10,
  },
  datePickerButton: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  picker: {
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },

  searchButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tagButton: {
    backgroundColor: 'white',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 5,
  },
  selectedTag: {
    backgroundColor: '#007AFF',
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
  },
  selectedTagText: {
    color: 'white',
  },
  clearFilterButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'red',
    marginLeft: 10,
  },
  clearFilterText: {
    color: 'white',
    fontSize: 14,
  },


  filterIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },

  filtersContainer: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  closeFiltersButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ff5c5c',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeFiltersText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  serviceCard: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderColor: "#001f3f", 
    borderWidth: 1,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  serviceDetails: {
    fontSize: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003366",
  },

  detailValue: {
    fontSize: 16, 
    color: "#333",
    marginTop: 2,
  },
  servicePrice: {
    fontWeight: "bold",
    fontSize: 18,
    color: "green",
    marginTop: 10,
  },
  icon: {
    width: 25,
    height: 25,
    marginRight: 5,
  
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6f9",

  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,

  },
  
  retryText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default Explore_Page;