import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { Picker } from "@react-native-picker/picker";
import { UserContext } from "../../contexts/authContext";
import axios from "axios";

interface Service {
  id: number;
  user_id: number;
  title: string;
  description: string;
  location: string;
  tags: string[];
  state: string;
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


const ServiceCard: React.FC<{ service: Service; user: any; openServiceModal: (service: Service) => void }> = ({
  service,
  user,
  openServiceModal,
}) => {
  const serviceType = service.service_from === "provider" ? "Offer" : "Request";

 
    const handleApply = async () => {
      try {
        console.log("Applying to service with ID:", service.id);
    
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_HOST}/api/services/apply_to_service/${service.id}`,
          {}, 
          {
            headers: {
              Authorization: `Bearer ${user.token}`, 
            },
          }
        );
    
        if (response.status === 200) {
          Alert.alert("Success", response.data.message); 
        } else {
          Alert.alert("Error", "Something went wrong. Please try again.");
        }
      } catch (error) {
        console.error("Failed to apply to the service:", error.response?.data || error.message);
    
        const errorMessage =
          error.response?.data?.message ||
          "Failed to apply to the service. Please try again.";
    
        Alert.alert("Error", errorMessage);
      }
    };
    

 
    const shouldShowApplyButton =
    service.service_from === "publisher" && service.user_id && service.user_id !== user.id;

    

    

  return (
    <TouchableOpacity style={styles.serviceCard} onPress={() => openServiceModal(service)}>
      <Text style={styles.serviceTitle}>{service.title}</Text>
      <Text style={styles.serviceDescription}>{service.description}</Text>
      <View style={styles.serviceDetails}>
        <View style={styles.iconTextContainer}>
          <Image
            source={require("../../../assets/images/location.png")}
            style={styles.icon}
          />
          <Text>{service.location}</Text>
        </View>
        <View style={styles.iconTextContainer}>
          <Image
            source={require("../../../assets/images/timeperiod.png")}
            style={styles.icon}
          />
          <Text>
            {service.date_time_range[0]} - {service.date_time_range[1]}
          </Text>
        </View>
        <View style={styles.iconTextContainer}>
          <Image
            source={require("../../../assets/images/duration.png")}
            style={styles.icon}
          />
          <Text>{parseDuration(service.estimated_duration)}</Text>
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

      {shouldShowApplyButton && (
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      )}

    </TouchableOpacity>
  );
};

const Explore_Page = () => {
  const { user } = useContext(UserContext);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [durationCategory, setDurationCategory] = useState<string | null>("all");
  const [sortOption, setSortOption] = useState("price");
  const [serviceType, setServiceType] = useState<"provider" | "publisher">(
    "publisher"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ownership, setOwnership] = useState<"mine" | "others">("mine");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service & { publisherOrProviderName?: string } | null>(null);
  const [showModal, setShowModal] = useState(false);



  const openServiceModal = async (service: Service) => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_owner_name/${service.id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
  
      const ownerName = response.data.name || "Unknown";
  
      setSelectedService({
        ...service,
        publisherOrProviderName: ownerName,
      });
      setModalVisible(true);
    } catch (error) {
      console.error("Failed to fetch owner's name:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to fetch the owner's name.");
    }
  };
  
  

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

 
  
  const closeServiceModal = () => {
    setSelectedService(null);
    setModalVisible(false);
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
  const fetchRequestedUserServices = async () => {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_HOST}/api/services/get_requested_user_services`
    );
    return response.data;
  };

  const fetchRequestedOtherUserServices = async () => {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_HOST}/api/services/get_requested_other_user_services`
    );
    return response.data;
  };

  const fetchOfferedUserServices = async () => {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_HOST}/api/services/get_offered_user_services`
    );
    return response.data;
  };

  const fetchOfferedOtherUserServices = async () => {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_HOST}/api/services/get_offered_other_user_services`
    );
    return response.data;
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      let fetchedServices = [];

      switch (serviceType) {
        case "publisher":
          fetchedServices =
            ownership === "mine"
              ? await fetchRequestedUserServices()
              : await fetchRequestedOtherUserServices();
          break;
        case "provider":
          fetchedServices =
            ownership === "mine"
              ? await fetchOfferedUserServices()
              : await fetchOfferedOtherUserServices();
          break;
        default:
          throw new Error("Invalid toggle configuration.");
      }

      setServices(fetchedServices);
      handleSortAndFilter(fetchedServices);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      Alert.alert("Error", "Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelection = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDeleteService = async (serviceId: number) => {
    try {
      const response = await axios.delete(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/delete_service/${serviceId}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      if (response.status === 200) {
        Alert.alert("Success", "Service deleted successfully!");
        closeServiceModal();
        fetchServices(); 
      }
    } catch (error) {
      console.error("Failed to delete service:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to delete service. Please try again.");
    }
  };

  const handleSortAndFilter = (servicesToFilter = services) => {
    let filtered = [...servicesToFilter];

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

    if (selectedTags.length > 0) {
      filtered = filtered.filter((service) =>
        service.tags.some((tag) => selectedTags.includes(tag))
      );
    }

    if (selectedLocation !== "All Locations") {
      filtered = filtered.filter(
        (service) =>
          service.location &&
          service.location.toLowerCase() === selectedLocation.toLowerCase()
      );
    }

    if (durationCategory !== "all") {
      filtered = filtered.filter((service) => {
        const serviceDuration = parseISO8601Duration(
          service.estimated_duration
        );
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

    if (sortOption) {
      filtered.sort((a, b) => {
        if (sortOption === "price") return a.offered_payment - b.offered_payment;
        if (sortOption === "price_desc")
          return b.offered_payment - a.offered_payment;
        if (sortOption === "name") return a.title.localeCompare(b.title);
        if (sortOption === "date")
          return (
            new Date(a.date_time_range[0]).getTime() -
            new Date(b.date_time_range[0]).getTime()
          );
        if (sortOption === "date_desc")
          return (
            new Date(b.date_time_range[0]).getTime() -
            new Date(a.date_time_range[0]).getTime()
          );
        return 0;
      });
    }

    setFilteredServices(filtered);
  };

  useEffect(() => {
    fetchServices();
  }, [serviceType, ownership]);

  useEffect(() => {
    handleSortAndFilter();
  }, [searchQuery, sortOption, priceRange, selectedLocation, durationCategory, selectedTags]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const renderServiceModal = () => {
    if (!selectedService) return null;
  
    const isOwnService = selectedService.user_id === user.id;
    const serviceType = selectedService.service_from === "provider" ? "Offer" : "Request";
  
    return (
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedService.title}</Text>
            <Text style={styles.modalField}>Tags: {selectedService.tags.join(", ")}</Text>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>
              {selectedService.service_from === "publisher"
                ? `Publisher's Name: ${selectedService.publisherOrProviderName}`
                : `Provider's Name: ${selectedService.publisherOrProviderName}`}
            </Text>


            <Text style={styles.modalField}>State: {selectedService.state}</Text>
            <Text style={styles.modalField}>Type: {serviceType}</Text>
  
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => Alert.alert("Chat feature coming soon!")}
              >
                <Text style={styles.modalButtonText}>Open Chat</Text>
              </TouchableOpacity>
  
              {isOwnService && (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "red" }]}
                    onPress={() => handleDeleteService(selectedService.id)}
                  >
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalButton}>
                    <Text style={styles.modalButtonText}>Edit</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
  

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
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
        style={[styles.picker, { width: "50%" }]}
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
        style={[styles.picker, { width: "50%" }]}
        onValueChange={(value) => setDurationCategory(value)}
      >
        <Picker.Item label="All Durations" value={"all"} />
        <Picker.Item label="Short (0-3 hours)" value="short" />
        <Picker.Item label="Medium (3 hours - 1 day)" value="medium" />
        <Picker.Item label="Long (1 day - 3 days)" value="long" />
        <Picker.Item label="Very Long (3+ days)" value="very_long" />
      </Picker>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchBar}>
      <TouchableOpacity
        onPress={() => setFiltersVisible(!filtersVisible)}
        style={styles.filterIcon}
      >
        <Image
          source={require("../../../assets/images/filter.png")}
          style={styles.icon}
        />
      </TouchableOpacity>
      <View style={styles.searchInputContainer}>
        <Image
          source={require("../../../assets/images/search.png")}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <Picker
        selectedValue={sortOption}
        style={styles.picker}
        onValueChange={(value) => setSortOption(value)}
      >
        <Picker.Item label="Sort by Price (Low)" value="price" />
        <Picker.Item label="Sort by Price (High)" value="price_desc" />
        <Picker.Item label="Sort by Name (A-Z)" value="name" />
        <Picker.Item label="Sort by Date (Earliest)" value="date" />
        <Picker.Item label="Sort by Date (Latest)" value="date_desc" />
      </Picker>
      <View style={styles.toggleGroup}>
        <TouchableOpacity
          style={[styles.toggleButton, serviceType === "publisher" && styles.activeToggle]}
          onPress={() => setServiceType("publisher")}
        >
          <Text>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, serviceType === "provider" && styles.activeToggle]}
          onPress={() => setServiceType("provider")}
        >
          <Text>Offers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, ownership === "mine" && styles.activeToggle]}
          onPress={() => setOwnership("mine")}
        >
          <Text>Mine</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, ownership === "others" && styles.activeToggle]}
          onPress={() => setOwnership("others")}
        >
          <Text>Others</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  const renderTagBar = () => (
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
  );

  return (
    <View style={styles.container}>
      {renderSearchBar()}
      {filtersVisible && renderFilters()}
      {renderTagBar()}
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text>Loading services...</Text>
          </View>
        ) : (
          filteredServices.map((service) => (
          <ServiceCard
          key={service.id}
          service={service}
          user={user}
          openServiceModal={openServiceModal} 
        /> ))
        )}
      </ScrollView>
      {renderServiceModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  tagBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
  },
  tagButton: {
    backgroundColor: "#e6e6e6",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },

  applyButton: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  applyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  
  selectedTag: {
    backgroundColor: "#007AFF",
  },
  tagText: {
    color: "#333",
    fontSize: 14,
  },
  selectedTagText: {
    color: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#e6ebf2",
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "black",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 5,
    paddingHorizontal: 8,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 8,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    opacity: 0.5,
  },
  picker: { height: 40, marginHorizontal: 5 },
  filterIcon: { marginRight: 10 },
  toggleGroup: { flexDirection: "row", justifyContent: "space-between", marginLeft: 10 },
  toggleButton: { padding: 10, borderRadius: 5, borderColor: "#ddd", borderWidth: 1, marginHorizontal: 5 },
  activeToggle: { backgroundColor: "#007AFF", color: "#fff" },
  filtersContainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "black",
  },
  filterLabel: { fontWeight: "bold", marginVertical: 5 },
  iconTextContainer: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  container: { flex: 1, backgroundColor: "#e6ebf2", paddingHorizontal: 10 },
  scrollView: { marginTop: 10 },

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

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalField: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalCloseButton: {
    marginTop: 15,
    alignSelf: "center",
  },
  modalCloseButtonText: {
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
  },

});

export default Explore_Page;


// import React, { useState, useEffect, useContext } from "react";
// import {
//   Modal,
//   Button,
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   RefreshControl,
//   Image,
// } from "react-native";
// import Slider from '@react-native-community/slider';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import MultiSlider from '@ptomasroos/react-native-multi-slider';
// import { Picker } from "@react-native-picker/picker";


// import { UserContext } from "../../contexts/authContext";
// import axios from "axios";

// interface Service {
//   id: number;
//   title: string;
//   description: string;
//   location: string;
//   tags: string[];
//   date_time_range: string[];
//   estimated_duration: string;
//   offered_payment: number;
//   service_from: "provider" | "publisher";
//   is_volunteering: boolean;
// }

// const parseDuration = (duration) => {
//   const regex = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
//   const match = duration.match(regex);

//   if (!match) return "Invalid duration";

//   const [_, days, hours, minutes, seconds] = match.map((value) =>
//     value ? parseInt(value) : 0
//   );

//   let result = [];
//   if (days) result.push(`${days} day${days > 1 ? "s" : ""}`);
//   if (hours) result.push(`${hours} hour${hours > 1 ? "s" : ""}`);
//   if (minutes) result.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
//   if (seconds) result.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

//   return result.join(", ");
// };

// const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
//   const serviceType =
//     service.service_from === "provider" ? "Offer" : "Request";

//   return (
//     <TouchableOpacity style={styles.serviceCard}>
//       <Text style={styles.serviceTitle}>{service.title}</Text>
//       <Text style={styles.serviceDescription}>{service.description}</Text>
//       <View style={styles.serviceDetails}>
//         <View>
//           <Text style={styles.detailLabel}>Tags:</Text>
//           <Text>{service.tags.join(", ")}</Text>
//         </View>
//         <View>
//           {/* <Text style={styles.detailLabel}>Location:</Text> */}
//           <Image source={require('../../../assets/images/location.png')} style={styles.icon} />
//           <Text>{service.location}</Text>
//         </View>
//         <View>
//           {/* <Text style={styles.detailLabel}>Time Period:</Text> */}
//           <Image source={require('../../../assets/images/timeperiod.png')} style={styles.icon} />

//           <Text>
//             {service.date_time_range[0]} - {service.date_time_range[1]}
//           </Text>
//         </View>
//         <View>
//             <View style={styles.iconTextContainer}>
//               <Image source={require('../../../assets/images/duration.png')} style={styles.icon} />
//               {/* <Text style={styles.detailLabel}>Duration:</Text> */}
//               <Text>{parseDuration(service.estimated_duration)}</Text>
//             </View>
//         </View>
//         <View>
//           <Text style={styles.detailLabel}>Type:</Text>
//           <Text>{serviceType}</Text>
//         </View>
//       </View>
//       <Text style={styles.servicePrice}>
//         {service.offered_payment > 0
//           ? `₪${service.offered_payment}`
//           : service.is_volunteering
//           ? "Volunteering"
//           : "Free"}
//       </Text>
//     </TouchableOpacity>
//   );
// };



// const Explore_Page = () => {
//   const { user } = useContext(UserContext);
//   const [services, setServices] = useState<Service[]>([]);
//   const [filteredServices, setFilteredServices] = useState<Service[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [priceRange, setPriceRange] = useState([0, 10000]);
//   const [durationCategory, setDurationCategory] = useState<string | null>(null);
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
//   const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
//   const [selectedTag, setSelectedTag] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(false);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [filtersVisible, setFiltersVisible] = useState(false);
//   const [serviceType, setServiceType] = useState<'provider' | 'publisher'>('publisher');
//   const [ownership, setOwnership] = useState<'mine' | 'others'>('others');

  




  // const predefinedTags = [
  //   'babysitter',
  //   'photographer',
  //   'private tutor',
  //   'hitchhike',
  //   'handyman',
  //   'dogwalker',
  //   'dogsitter',
  //   'mover',
  // ];

  // const israeliCities = [
  //   "Tel Aviv",
  //   "Jerusalem",
  //   "Haifa",
  //   "Beer Sheva",
  //   "Netanya",
  //   "Ashdod",
  //   "Rishon LeZion",
  //   "Petah Tikva",
  //   "Eilat",
  //   "Holon",
  //   "Bat Yam",
  //   "Rehovot",
  //   "Hadera",
  //   "Herzliya",
  //   "Ramat Gan",
  //   "Kfar Saba",
  //   "Modiin",
  //   "Givatayim",
  //   "Raanana",
  // ];
  

//   const fetchServices = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(
//         `${process.env.EXPO_PUBLIC_HOST}/api/services/get_all_services`
//       );
//       setServices(response.data);
//       setFilteredServices(response.data);
//       setError(false);
//     } catch (error) {
//       console.error('Failed to fetch services', error);
//       setError(true);
//       Alert.alert('Error', 'Failed to load services. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };


//   const fetchRequestedServices = async () => {
//     setLoading(true); 
//     setServices([]);
//     setFilteredServices([]);
//     try {
//       const response = await axios.get(
//         `${process.env.EXPO_PUBLIC_HOST}/api/services/get_requested_services`
//       );
//       setServices(response.data);
//       setFilteredServices(response.data);
//     } catch (error) {
//       console.error("Failed to fetch requested services", error);
//       Alert.alert("Error", "Failed to load requested services.");
//     } finally {
//       setLoading(false); 
//     }
//   };
  
//   const fetchOfferedServices = async () => {
//     setLoading(true);
//     setServices([]);
//     setFilteredServices([]);
//     try {
//       const response = await axios.get(
//         `${process.env.EXPO_PUBLIC_HOST}/api/services/get_offered_services`
//       );
//       setServices(response.data);
//       setFilteredServices(response.data);
//     } catch (error) {
//       console.error("Failed to fetch offered services", error);
//       Alert.alert("Error", "Failed to load offered services.");
//     } finally {
//       setLoading(false); 
//     }
//   };
  
//   const fetchUserServices = async () => {
//     setLoading(true); 
//     setServices([]);
//     setFilteredServices([]);
//     try {
//       const response = await axios.get(
//         `${process.env.EXPO_PUBLIC_HOST}/api/services/get_current_user_services`
//       );
//       setServices(response.data);
//       setFilteredServices(response.data);
//     } catch (error) {
//       console.error("Failed to fetch user services", error);
//       Alert.alert("Error", "Failed to load your services.");
//     } finally {
//       setLoading(false); 
//     }
//   };
  
//   const fetchOtherUsersServices = async () => {
//     setLoading(true); 
//     setServices([]);
//     setFilteredServices([]);
//     try {
//       const response = await axios.get(
//         `${process.env.EXPO_PUBLIC_HOST}/api/services/get_other_users_services`
//       );
//       setServices(response.data);
//       setFilteredServices(response.data);
//     } catch (error) {
//       console.error("Failed to fetch other users' services", error);
//       Alert.alert("Error", "Failed to load other users' services.");
//     } finally {
//       setLoading(false); 
//     }
//   };

//   const fetchServicesByFilters = async () => {
//     if (!serviceType || !ownership) {
//       setServices([]);
//       setFilteredServices([]);
//       return;
//     }
  
//     setLoading(true);
//     setServices([]);
//     setFilteredServices([]);
  
//     try {
//       let response;
//       if (serviceType === "provider" && ownership === "mine") {
//         response = await axios.get(
//           `${process.env.EXPO_PUBLIC_HOST}/api/services/get_current_user_services`
//         );
//       } else if (serviceType === "provider" && ownership === "others") {
//         response = await axios.get(
//           `${process.env.EXPO_PUBLIC_HOST}/api/services/get_other_users_services`
//         );
//       } else if (serviceType === "publisher" && ownership === "mine") {
//         response = await axios.get(
//           `${process.env.EXPO_PUBLIC_HOST}/api/services/get_current_user_services`
//         );
//       } else if (serviceType === "publisher" && ownership === "others") {
//         response = await axios.get(
//           `${process.env.EXPO_PUBLIC_HOST}/api/services/get_other_users_services`
//         );
//       }
  
//       setServices(response.data);
//       setFilteredServices(response.data); 
//     } catch (error) {
//       console.error("Failed to fetch services:", error);
//       Alert.alert("Error", "Failed to load services. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };
  
  

//   const handleDateSelect = (event, date) => {
//     if (date) {
//       setSelectedDate(date); 
//     }
//     setIsModalVisible(false); 
//   };


//   // const handleToggleServiceType = async (type) => {
//   //   const newType = type === serviceType ? null : type; 
//   //   setServiceType(newType);
  
//   //   if (newType && ownership) {
//   //     await fetchServicesByFilters();
//   //   } else {
//   //     setServices([]); 
//   //     setFilteredServices([]);
//   //   }
//   // };
  
//   // const handleToggleOwnership = async (type) => {
//   //   const newOwner = type === ownership ? null : type;
//   //   setOwnership(newOwner);
  
//   //   if (newOwner && serviceType) {
//   //     await fetchServicesByFilters();
//   //   } else {
//   //     setServices([]); 
//   //     setFilteredServices([]);
//   //   }
//   // };


//   const filterServices = () => {
//     let filtered = services;

//     if (searchQuery.trim()) {
//       filtered = filtered.filter((service) =>
//         service.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
//       );
//     }

//     filtered = filtered.filter(
//       (service) =>
//         service.offered_payment >= priceRange[0] &&
//         service.offered_payment <= priceRange[1]
//     );

//     if (selectedLocation && selectedLocation !== "All Locations") {
//       filtered = filtered.filter((service) => service.location.toLowerCase() === selectedLocation.toLowerCase());
//     }



//     if (durationCategory) {
//       filtered = filtered.filter((service) => {
//         const serviceDuration = parseISO8601Duration(service.estimated_duration);
//         switch (durationCategory) {
//           case "short":
//             return serviceDuration <= 180; // 0-3 hours
//           case "medium":
//             return serviceDuration > 180 && serviceDuration <= 1440; // 3 hours - 1 day
//           case "long":
//             return serviceDuration > 1440 && serviceDuration <= 4320; // 1-3 days
//           case "very_long":
//             return serviceDuration > 4320; // 3+ days
//           default:
//             return true;
//         }
//       });
//     }


//     if (selectedDate) {
//       filtered = filtered.filter((service) => {
//         const serviceStartDate = new Date(service.date_time_range[0]);
//         return (
//           serviceStartDate.toDateString() === selectedDate.toDateString()
//         );
//       });
//     }

//     if (serviceType) {
//       filtered = filtered.filter((service) => service.service_from === serviceType);
//     }

//     if (ownership) {
//       filtered = filtered.filter((service) =>
//         ownership === 'mine' ? service.owner_id === user.id : service.owner_id !== user.id
//       );
//     }

//     setFilteredServices(filtered);
//   };

//   const parseISO8601Duration = (duration: string): number => {
//     const matches = duration.match(
//       /P(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/
//     );
//     if (!matches) return 0;
  
//     const days = parseInt(matches[1] || '0', 10);
//     const hours = parseInt(matches[2] || '0', 10);
//     const minutes = parseInt(matches[3] || '0', 10);
//     return days * 24 * 60 + hours * 60 + minutes;
//   };
  


//   const handleSearch = async () => {
//     if (!searchQuery.trim()) {
//       setFilteredServices(services); 
//       return;
//     }
//     try {
//       const response = await axios.get(
//         `${process.env.EXPO_PUBLIC_HOST}/api/services/get_services_by_title/${searchQuery.trim()}`
//       );
//       setFilteredServices(response.data);
//     } catch (error) {
//       console.error('Search error', error);
//       Alert.alert('Error', 'Failed to search services. Please try again.');
//     }
//   };

//   const handleFilterByTag = (tag: string | null) => {
//     setSelectedTag(tag);
//     if (!tag) {
//       setFilteredServices(services); 
//     } else {
//       const filtered = services.filter((service) =>
//         service.tags.includes(tag)
//       );
//       setFilteredServices(filtered);
//     }
//   };

//    useEffect(() => {
//      setServices([]);
//      setFilteredServices([]);
//    }, []);
  

//    useEffect(() => {
//     if (services.length > 0 || searchQuery || priceRange || selectedLocation || durationCategory || selectedDate) {
//       filterServices();
//     }
//   }, [searchQuery, priceRange, durationCategory, selectedDate, selectedLocation]);
  
//   useEffect(() => {
//     fetchServicesByFilters();
//   }, [serviceType, ownership]);
  
  
//   const handleRefresh = async () => {
//     setRefreshing(true);
//     setFilteredServices([]);
//     setServices([]);
  
//     try {
//       if (serviceType === 'publisher') {
//         await fetchRequestedServices();
//       } else if (serviceType === 'provider') {
//         await fetchOfferedServices();
//       } else if (ownership === 'mine') {
//         await fetchUserServices();
//       } else if (ownership === 'others') {
//         await fetchOtherUsersServices();
//       } else {
//         setServices([]);
//         setFilteredServices([]);
//       }
//     } catch (error) {
//       console.error('Error during refresh:', error);
//       Alert.alert('Error', 'Failed to refresh services.');
//     } finally {
//       setRefreshing(false);
//     }
//   };
  
  

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text>Loading services...</Text>
//       </View>
//     );
//   }
  
//   if (!loading && services.length === 0 && !serviceType && !ownership) {
//     return (
//       <View style={styles.emptyContainer}>
//         <Text>Choose a filter or toggle to display services.</Text>
//       </View>
//     );
//   }
  
  

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>Failed to load services.</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
//           <Text style={styles.retryText}>Retry</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (




//     <View style={styles.container}>
//     <Text style={styles.header}>Explore Services</Text>

//     {/* Service Type Toggle */}
//     <View style={styles.toggleGroup}>
//   <TouchableOpacity
//     style={[
//       styles.toggleButton,
//       serviceType === 'publisher' && styles.activeToggleButton,
//     ]}
//     onPress={() => handleToggleServiceType('publisher')}
//   >
//     <Text
//       style={[
//         styles.toggleText,
//         serviceType === 'publisher' && styles.activeToggleText,
//       ]}
//     >
//       Requests
//     </Text>
//   </TouchableOpacity>

//   <TouchableOpacity
//     style={[
//       styles.toggleButton,
//       serviceType === 'provider' && styles.activeToggleButton,
//     ]}
//     onPress={() => handleToggleServiceType('provider')}
//   >
//     <Text
//       style={[
//         styles.toggleText,
//         serviceType === 'provider' && styles.activeToggleText,
//       ]}
//     >
//       Offers
//     </Text>
//   </TouchableOpacity>
// </View>

// {/* Ownership Toggle */}
// <View style={styles.toggleGroup}>
//   <TouchableOpacity
//     style={[
//       styles.toggleButton,
//       ownership === 'mine' && styles.activeToggleButton,
//     ]}
//     onPress={() => handleToggleOwnership('mine')}
//   >
//     <Text
//       style={[
//         styles.toggleText,
//         ownership === 'mine' && styles.activeToggleText,
//       ]}
//     >
//       Mine
//     </Text>
//   </TouchableOpacity>

//   <TouchableOpacity
//     style={[
//       styles.toggleButton,
//       ownership === 'others' && styles.activeToggleButton,
//     ]}
//     onPress={() => handleToggleOwnership('others')}
//   >
//     <Text
//       style={[
//         styles.toggleText,
//         ownership === 'others' && styles.activeToggleText,
//       ]}
//     >
//       Others
//     </Text>
//   </TouchableOpacity>
// </View>

//     {/* List of Services */}
//     {!loading && services.length > 0 && (
//       <FlatList
//         data={filteredServices}
//         renderItem={({ item }) => <ServiceCard service={item} />}
//         keyExtractor={(item) => item.id.toString()}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
//         }
//       />
//     )}
//   </View>
//   );
// };


// const styles = StyleSheet.create({

//   sliderContainer: {
//     marginVertical: 20,
//     alignItems: 'center',
//   },

//   container: {
//     flex: 1,
//     backgroundColor: "#e6ebf2",
//     paddingHorizontal: 10,
    
//   },
//   header: {
//     fontSize: 32,
//     fontWeight: "bold",
//     marginVertical: 15,
//     textAlign: "center",
//   },

//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

  
//   searchInput: {
//     backgroundColor: 'white',
//     borderRadius: 10,
//     padding: 10,
//     marginBottom: 10,
//     fontSize: 16,
//   },
//   dropdownContainer: {
//     marginVertical: 10,
//   },
//   datePickerButton: {
//     padding: 10,
//     backgroundColor: "white",
//     borderRadius: 5,
//     marginBottom: 10,
//     alignItems: "center",
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   picker: {
//     height: 50,
//     backgroundColor: "#fff",
//     borderRadius: 5,
//   },
//   filterLabel: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 5,
//   },

//   searchButton: {
//     backgroundColor: '#007AFF',
//     padding: 10,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   searchButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   tagContainer: {
//     flexDirection: 'row',
//     marginBottom: 10,
//   },
//   tagButton: {
//     backgroundColor: 'white',
//     paddingVertical: 5,
//     paddingHorizontal: 10,
//     borderRadius: 20,
//     marginRight: 5,
//   },
//   selectedTag: {
//     backgroundColor: '#007AFF',
//   },
//   tagText: {
//     fontSize: 14,
//     color: '#007AFF',
//   },
//   selectedTagText: {
//     color: 'white',
//   },
//   clearFilterButton: {
//     paddingVertical: 5,
//     paddingHorizontal: 10,
//     borderRadius: 20,
//     backgroundColor: 'red',
//     marginLeft: 10,
//   },
//   clearFilterText: {
//     color: 'white',
//     fontSize: 14,
//   },


//   filterIconButton: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginVertical: 10,
//   },

//   filtersContainer: {
//     marginVertical: 20,
//     padding: 10,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 10,
//   },
//   closeFiltersButton: {
//     marginTop: 10,
//     padding: 10,
//     backgroundColor: '#ff5c5c',
//     borderRadius: 5,
//     alignItems: 'center',
//   },
//   closeFiltersText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },

//   serviceCard: {
//     backgroundColor: "white",
//     padding: 15,
//     marginBottom: 10,
//     borderRadius: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     borderColor: "#001f3f", 
//     borderWidth: 1,
//   },
//   serviceTitle: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginBottom: 5,
//   },
//   serviceDescription: {
//     fontSize: 16,
//     color: "#333",
//     marginBottom: 10,
//   },
//   serviceDetails: {
//     fontSize: 16,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   detailLabel: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#003366",
//   },

//   detailValue: {
//     fontSize: 16, 
//     color: "#333",
//     marginTop: 2,
//   },
//   servicePrice: {
//     fontWeight: "bold",
//     fontSize: 18,
//     color: "green",
//     marginTop: 10,
//   },
//   icon: {
//     width: 25,
//     height: 25,
//     marginRight: 5,
  
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f4f6f9",

//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     color: "red",
//     marginBottom: 10,
//   },
//   retryButton: {
//     backgroundColor: "#007AFF",
//     padding: 10,
//     borderRadius: 5,

//   },
  
//   retryText: {
//     color: "white",
//     fontWeight: "bold",
//   },

//   toggleContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 10,
//   },
//   toggleGroup: {
//     flexDirection: 'row',
//   },
//   toggleButton: {
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 5,
//     marginHorizontal: 5,
//   },
//   activeToggleButton: {
//     backgroundColor: '#007AFF',
//   },
//   toggleText: {
//     color: '#333',
//     fontSize: 14,
//   },
//   activeToggleText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
  
  
// });

// export default Explore_Page;

