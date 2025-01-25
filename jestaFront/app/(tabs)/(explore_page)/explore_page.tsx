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
import { LocalizationProvider } from "@mui/x-date-pickers";
//import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parse, isBefore, isAfter, format, isValid, set } from 'date-fns';
import { DateTimePicker } from "@mui/x-date-pickers";
import { Picker } from "@react-native-picker/picker";
import { UserContext } from "../../contexts/authContext";
import axios from "axios";
import { DatePicker } from '@mui/x-date-pickers';


interface Service {
  id: number;
  user_id: number;
  title: string;
  description: string;
  location: string;
  tags: string[];
  state: string;
  applicants: number[];
  date_time_range: string[];
  estimated_duration: string;
  offered_payment: number;
  service_from: "provider" | "publisher";
  is_volunteering: boolean;
}

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
  const [isApplied, setIsApplied] = useState(service.applicants.includes(user.id));
  


 
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
        Alert.alert("Success", "You have applied successfully!");
        window.alert("You have applied successfully!");
        setIsApplied(true); 
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
        window.alert("Something went wrong. Please try again.");

      }
    } catch (error) {
      console.error("Failed to apply to the service:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to apply to the service. Please try again.");
      window.alert("Failed to apply to the service. Please try again.");
    }
  };

  const handleUnapply = async () => {
    try {
      console.log("Unapplying from service with ID:", service.id);

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/remove_from_service/${service.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status === 200) {
        Alert.alert("Success", "You have unapplied successfully!");
        window.alert("You have unapplied successfully!");
        setIsApplied(false); 
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
        window.alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Failed to unapply from the service:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to unapply from the service. Please try again.");
      window.alert("Failed to unapply from the service. Please try again.");
    }
  };
    

 
  

    const shouldShowApplyButton =
    !isApplied && service.service_from === "publisher" && service.user_id !== user.id && service.user_id;


    const shouldShowUnapplyButton = 
    isApplied && service.service_from === "publisher" && service.user_id !== user.id && service.user_id;
  

    

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
          <Text style={styles.applyButtonText}>{isApplied ? "Applied" : "Apply"}</Text>
        </TouchableOpacity>
      )}

      {shouldShowUnapplyButton && (
        <TouchableOpacity style={styles.uapplyButton} onPress={handleUnapply}>
          <Text style={styles.uapplyButtonText}>Unapply</Text>
        </TouchableOpacity>
      )}

    </TouchableOpacity>
  );
};

// const AddServiceModal = ({visible, onClose, fetchServices}) => {
//   const { user } = useContext(UserContext);

//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [tags, setTags] = useState([]);
//   const [location, setLocation] = useState("");
//   const [startTime, setStartTime] = useState<Date | null>(null);
//   const [endTime, setEndTime] = useState<Date | null>(null);
//   const [duration, setDuration] = useState({
//     minutes: 0,
//     hours: 0,
//     days: 0,
//     months: 0,
//     years: 0,
//   });
//   const [offeredPayment, setOfferedPayment] = useState(0);
//   const [serviceFrom, setServiceFrom] = useState("publisher");
//   const [isVolunteering, setIsVolunteering] = useState(false);

//   const formattedStartTime = startTime ? format(startTime, 'yyyy-MM-dd') : null;
//   const formattedEndTime = endTime ? format(endTime, 'yyyy-MM-dd') : null;
  

//   const convertToISO8601 = () => {
//     const { years, months, days, hours, minutes } = duration;
//     return `P${years ? `${years}Y` : ""}${months ? `${months}M` : ""}${
//       days ? `${days}D` : ""
//     }T${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}`;
//   };

//   const handleSubmit = async () => {
//     if (!title || !description || !tags.length || !location || !startTime || !endTime) {
//       Alert.alert("Error", "All fields are required!");
//       window.alert("All fields are required!");
//       return;
//     }

//     const payload = {
//       title,
//       description,
//       tags,
//       location,
//       date_time_range: [formattedStartTime, formattedEndTime],
//       estimated_duration: convertToISO8601(),
//       offered_payment: offeredPayment,
//       service_from: serviceFrom,
//       is_volunteering: isVolunteering,
//     };

//     try {
//       const response = await axios.post(
//         `${process.env.EXPO_PUBLIC_HOST}/api/services/create_service`,
//         payload,
//         {
//           headers: { Authorization: `Bearer ${user.token}` },
//         }
//       );
//       if (response.status === 200) {
//         Alert.alert("Success", "Service created successfully!");
//         window.alert("Service created successfully!");
//         fetchServices();
//         onClose();
//       }
//     } catch (error) {
//       console.error("Failed to create service:", error);
//       Alert.alert("Error", "Failed to create service. Please try again.");
//       window.alert("Failed to create service. Please try again.");
//     }
//   };

//   return (
//     <Modal visible={visible} animationType="slide" transparent={true}>
//       <View style={styles.modalContainer}>
//         <View style={styles.modalContent}>
//           <Text style={styles.modalTitle}>Add a Service</Text>
//           <TextInput
//             placeholder="Title"
//             value={title}
//             onChangeText={setTitle}
//             style={styles.input}
//           />
//           <TextInput
//             placeholder="Description"
//             value={description}
//             onChangeText={setDescription}
//             style={styles.input}
//           />
//           <Picker
//             selectedValue={tags}
//             onValueChange={(value) => setTags([...tags, value])}
//             style={styles.picker}
//           >
//             <Picker.Item label="Select Tags" value="" />
//             {predefinedTags.map((tag) => (
//               <Picker.Item key={tag} label={tag} value={tag} />
//             ))}
//           </Picker>
//           <Picker
//             selectedValue={location}
//             onValueChange={setLocation}
//             style={styles.picker}
//           >
//             <Picker.Item label="Select Location" value="" />
//             {israeliCities.map((city) => (
//               <Picker.Item key={city} label={city} value={city} />
//             ))}
//           </Picker>
//           <Text>Start Time:</Text>
//           <DateTimePicker
//             label="Start Time"
//             value={startTime}
//             onChange={(newValue) => setStartTime(newValue)}
//           />
//           <DateTimePicker
//             label="End Time"
//             value={endTime}
//             onChange={(newValue) => setEndTime(newValue)}
//           />
//           <View style={styles.durationInputs}>
//             <TextInput
//               placeholder="Minutes"
//               keyboardType="numeric"
//               onChangeText={(value) => setDuration({ ...duration, minutes: parseInt(value) })}
//               style={styles.inputSmall}
//             />
//             <TextInput
//               placeholder="Hours"
//               keyboardType="numeric"
//               onChangeText={(value) => setDuration({ ...duration, hours: parseInt(value) })}
//               style={styles.inputSmall}
//             />
//             <TextInput
//               placeholder="Days"
//               keyboardType="numeric"
//               onChangeText={(value) => setDuration({ ...duration, days: parseInt(value) })}
//               style={styles.inputSmall}
//             />
//             <TextInput
//               placeholder="Months"
//               keyboardType="numeric"
//               onChangeText={(value) => setDuration({ ...duration, months: parseInt(value) })}
//               style={styles.inputSmall}
//             />
//             <TextInput
//               placeholder="Years"
//               keyboardType="numeric"
//               onChangeText={(value) => setDuration({ ...duration, years: parseInt(value) })}
//               style={styles.inputSmall}
//             />
//           </View>
//           <TextInput
//             placeholder="Offered Payment"
//             keyboardType="numeric"
//             value={offeredPayment.toString()}
//             onChangeText={(value) => setOfferedPayment(parseInt(value))}
//             style={styles.input}
//           />
//           <Picker
//             selectedValue={serviceFrom}
//             onValueChange={setServiceFrom}
//             style={styles.picker}
//           >
//             <Picker.Item label="Request" value="publisher" />
//             <Picker.Item label="Offer" value="provider" />
//           </Picker>
//           <Picker
//             selectedValue={isVolunteering}
//             onValueChange={(value) => setIsVolunteering(value === true)}
//             style={styles.picker}
//           >
//             <Picker.Item label="Not Volunteering" value="false" />
//             <Picker.Item label="Volunteering" value="true" />
//           </Picker>
//           <View style={styles.modalButtons}>
//             <TouchableOpacity onPress={handleSubmit} style={styles.modalButton}>
//               <Text style={styles.modalButtonText}>Submit</Text>
//             </TouchableOpacity>
//             <TouchableOpacity onPress={onClose} style={styles.modalButtonCancel}>
//               <Text style={styles.modalButtonText}>Cancel</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };



const AddServiceModal = ({ visible, onClose, fetchServices }) => {
  const { user } = useContext(UserContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [duration, setDuration] = useState({
    minutes: 0,
    hours: 0,
    days: 0,
    months: 0,
    years: 0,
  });
  const [offeredPayment, setOfferedPayment] = useState(0);
  const [serviceFrom, setServiceFrom] = useState("publisher");
  const [isVolunteering, setIsVolunteering] = useState(false);
  const [isDurationVisible, setIsDurationVisible] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setLocation("");
    setStartTime("");
    setEndTime("");
    setDuration({ minutes: 0, hours: 0, days: 0, months: 0, years: 0 });
    setOfferedPayment(0);
    setServiceFrom("publisher");
    setIsVolunteering(false);
    setIsDurationVisible(false);
  };

  const validateInputs = () => {
    if (!title || !description || !tags.length || !location) {
      Alert.alert("Error", "Please fill in all the required fields!");
      return false;
    }

    if (!startTime || !endTime) {
      Alert.alert("Error", "Please select both start and end dates!");
      return false;
    }

    if (startTime > endTime) {
      Alert.alert("Error", "End time cannot be before start time!");
      return false;
    }

    return true;
  };

  const convertToISO8601 = () => {
    const { years, months, days, hours, minutes } = duration;
    return `P${years ? `${years}Y` : ""}${months ? `${months}M` : ""}${
      days ? `${days}D` : ""
    }T${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}`;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    const payload = {
      title,
      description,
      tags,
      location,
      date_time_range: [startTime, endTime],
      estimated_duration: convertToISO8601(),
      offered_payment: offeredPayment,
      service_from: serviceFrom,
      is_volunteering: isVolunteering,
    };

    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/create_service`,
        payload,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      if (response.status === 200) {
        Alert.alert("Success", "Service created successfully!");
        fetchServices();
        resetForm();
        onClose();
      } else {
        Alert.alert("Error", "Failed to create service. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create service:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to create service. Please try again.");
    }
  };

  const handleTagSelection = (selectedTag) => {
    setTags((prevTags) =>
      prevTags.includes(selectedTag)
        ? prevTags.filter((tag) => tag !== selectedTag)
        : [...prevTags, selectedTag]
    );
  };
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.modalTitle}>Add a Service</Text>
  
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TextInput
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />
            <View style={styles.divider} />
  
            <Text style={styles.sectionTitle}>Tags</Text>
            <Picker
              selectedValue=""
              onValueChange={(value) => value && handleTagSelection(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Tags" value="" />
              {predefinedTags.map((tag) => (
                <Picker.Item key={tag} label={tag} value={tag} />
              ))}
            </Picker>
            <Text style={styles.selectedTags}>
              Selected Tags: {tags.join(", ")}
            </Text>
            <View style={styles.divider} />
  
            <Text style={styles.sectionTitle}>Location</Text>
            <Picker
              selectedValue={location}
              onValueChange={setLocation}
              style={styles.picker}
            >
              <Picker.Item label="Select Location" value="" />
              {israeliCities.map((city) => (
                <Picker.Item key={city} label={city} value={city} />
              ))}
            </Picker>
            <View style={styles.divider} />
  
            <Text style={styles.sectionTitle}>Date and Time</Text>
            <Text style={styles.datePickerLabel}>Start Date</Text>
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              style={styles.dateButton}
            >
              <Image
                source={require("../../../assets/images/timeperiod.png")}
                style={styles.dateIcon}
              />
            </TouchableOpacity>
            <Text style={styles.dateText}>
              {startTime ? `The Start date picked is ${startTime}` : ""}
            </Text>
            <Text style={styles.datePickerLabel}>End Date</Text>
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={styles.dateButton}
            >
              <Image
                source={require("../../../assets/images/timeperiod.png")}
                style={styles.dateIcon}
              />
            </TouchableOpacity>
            <Text style={styles.dateText}>
              {endTime ? `The End date picked is ${endTime}` : ""}
            </Text>
  
            <Modal visible={showStartPicker} transparent={true}>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerTitle}>Please pick Start Date</Text>
                <DateTimePicker
                  mode="date"
                  value={new Date()}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) setStartTime(format(selectedDate, "yyyy-MM-dd"));
                    setShowStartPicker(false);
                  }}
                />
              </View>
            </Modal>
  
            <Modal visible={showEndPicker} transparent={true}>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerTitle}>Please pick End Date</Text>
                <DateTimePicker
                  mode="date"
                  value={new Date()}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) setEndTime(format(selectedDate, "yyyy-MM-dd"));
                    setShowEndPicker(false);
                  }}
                />
              </View>
            </Modal>
            <View style={styles.divider} />
  
            <Text style={styles.sectionTitle}>Duration</Text>
            <TouchableOpacity
              onPress={() => setIsDurationVisible(!isDurationVisible)}
              style={styles.toggleDuration}
            >
              <Text>{isDurationVisible ? "Hide Duration" : "Show Duration"}</Text>
            </TouchableOpacity>
            {isDurationVisible && (
              <View style={styles.durationBox}>
                <TextInput
                  placeholder="Minutes"
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setDuration({ ...duration, minutes: parseInt(value) || 0 })
                  }
                  style={styles.durationInput}
                />
                <TextInput
                  placeholder="Hours"
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setDuration({ ...duration, hours: parseInt(value) || 0 })
                  }
                  style={styles.durationInput}
                />
                <TextInput
                  placeholder="Days"
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setDuration({ ...duration, days: parseInt(value) || 0 })
                  }
                  style={styles.durationInput}
                />
                <TextInput
                  placeholder="Months"
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setDuration({ ...duration, months: parseInt(value) || 0 })
                  }
                  style={styles.durationInput}
                />
                <TextInput
                  placeholder="Years"
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setDuration({ ...duration, years: parseInt(value) || 0 })
                  }
                  style={styles.durationInput}
                />
              </View>
            )}
            <View style={styles.divider} />
  
            <Text style={styles.sectionTitle}>Payment and Type</Text>
            <TextInput
              placeholder="Offered Payment"
              keyboardType="numeric"
              value={offeredPayment.toString()}
              onChangeText={(value) =>
                setOfferedPayment(parseInt(value) || 0)
              }
              style={styles.input}
            />
            <Picker
              selectedValue={serviceFrom}
              onValueChange={setServiceFrom}
              style={styles.picker}
            >
              <Picker.Item label="Request" value="publisher" />
              <Picker.Item label="Offer" value="provider" />
            </Picker>
            <Picker
              selectedValue={isVolunteering ? "true" : "false"}
              onValueChange={(value) => setIsVolunteering(value === "true")}
              style={styles.picker}
            >
              <Picker.Item label="Not Volunteering" value="false" />
              <Picker.Item label="Volunteering" value="true" />
            </Picker>
  
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleSubmit} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  onClose();
                }}
                style={styles.modalButtonCancel}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState("");
  const [editValue, setEditValue] = useState("");
  const [applicantsModalVisible, setApplicantsModalVisible] = useState(false);
  const [applicants, setApplicants] = useState({});
  const [addModalVisible, setAddModalVisible] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDateTimeRange, setEditDateTimeRange] = useState<string[]>(["", ""]);
  const [editEstimatedDuration, setEditEstimatedDuration] = useState("");
  const [editOfferedPayment, setEditOfferedPayment] = useState(0);




  // const fetchApplicants = async () => {
  //   try {
  //     const response = await axios.get(
  //       `${process.env.EXPO_PUBLIC_HOST}/api/services/get_list_of_applicants_with_their_states/${selectedService.id}`,
  //       {
  //         headers: { Authorization: `Bearer ${user.token}` },
  //       }
  //     );
  //     if (response.status === 200) {
  //       window.alert(`Applicants: ${response.data}`);
  //       setApplicants(response.data || {});
  //     } else {
  //       Alert.alert("Error", "Failed to load applicants.");
  //       window.alert("Failed to load applicants.");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching applicants:", error.response?.data || error.message);
  //     Alert.alert("Error", "Unable to fetch applicants.");
  //     window.alert(`Unable to fetch applicants. ${error.response?.data || error.message}`);
  //   }
  // };

  const fetchApplicants = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_list_of_applicants_with_their_states/${selectedService.id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      if (response.status === 200) {
        const applicantsDict = response.data || {};
        const applicantsArray = Object.entries(applicantsDict).map(([email, status]) => ({
          email,
          status,
        }));
        setApplicants(applicantsArray); 
      } else {
        Alert.alert("Error", "Failed to load applicants.");
      }
    } catch (error) {
      console.error("Error fetching applicants:", error.response?.data || error.message);
      Alert.alert("Error", "Unable to fetch applicants.");
    }
  };
  

  const handleAccept = async (userId) => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/accept_applicant/${selectedService.id}/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      if (response.status === 200) {
        Alert.alert("Success", "Applicant accepted successfully.");
        fetchApplicants(); 
      }
    } catch (error) {
      console.error("Error accepting applicant:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to accept applicant.");
    }
  };

  const handleReject = async (userId) => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/reject_applicant/${selectedService.id}/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      if (response.status === 200) {
        Alert.alert("Success", "Applicant rejected successfully.");
        fetchApplicants(); 
      }
    } catch (error) {
      console.error("Error rejecting applicant:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to reject applicant.");
    }
  };

  const renderApplicantsModal = () => (
    <Modal
      visible={applicantsModalVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Applicants</Text>
          <FlatList
            data={applicants}
            keyExtractor={(item, index) => item?.email?.toString() || index.toString()} 
            renderItem={({ item }) => (
              <View style={styles.applicantItem}>
                <Text style={styles.applicantText}>Email: {item.email || "N/A"}</Text>
                <Text style={styles.applicantText}>Status: {item.status || "Unknown"}</Text>
                <View style={styles.applicantActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(item.email)}
                  >
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(item.email)}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setApplicantsModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  




  

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
      window.alert("Failed to fetch the owner's name.");
    }
  };


  // const openEditModal = (field: string, value: string | number | null) => {
  //   console.log("Opening edit modal for field:", field, "with value:", value); 
  //   setEditField(field);
  //   setEditValue(value);
  //   setEditModalVisible(true);
  // };
  
  const openEditModal = (field: string, value: string | number | null) => {
    console.log("Opening edit modal for field:", field, "with value:", value);
  
    setEditField(field);
  
    // Set the appropriate state based on the field being edited
    switch (field) {
      case "name":
        setEditName(value as string || "");
        break;
      case "description":
        setEditDescription(value as string || "");
        break;
      case "location":
        setEditLocation(value as string || "");
        break;
      case "date_time_range":
        if (Array.isArray(value) && value.length === 2) {
          setEditDateTimeRange(value as string[]);
        } else {
          setEditDateTimeRange(["", ""]);
        }
        break;
      case "estimated_duration":
        setEditEstimatedDuration(value as string || "");
        break;
      case "offered_payment":
        setEditOfferedPayment(value as number || 0);
        break;
      default:
        console.error("Unsupported field:", field);
        break;
    }
  
    setEditModalVisible(true);
  };
  
  
 
  
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
      window.alert("Failed to load services. Please try again.");
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
        window.alert("Service deleted successfully!");
        closeServiceModal();
        fetchServices(); 
      }
    } catch (error) {
      console.error("Failed to delete service:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to delete service. Please try again.");
      window.alert("Failed to delete service. Please try again.");
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
                onPress={() => {
                  Alert.alert("Chat feature coming soon!");
                  window.alert("Chat feature coming soon!");
                }}
              >
                <Text style={styles.modalButtonText}>Open Chat</Text>
              </TouchableOpacity>
              {isOwnService && (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#f94449" }]}
                    onPress={() => handleDeleteService(selectedService.id)}
                  >
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setEditModalVisible(true)}
                  >
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
            <View>
            {selectedService.service_from === "publisher" &&
              selectedService.user_id === user.id && (
                <TouchableOpacity
                  style={styles.viewApplicantsButton}
                  onPress={() => {
                    setApplicantsModalVisible(true);
                    fetchApplicants();
                  }}
                >
                  <Text style={styles.viewApplicantsButtonText}>View Applicants</Text>
                </TouchableOpacity>
              )}

            {renderApplicantsModal()}
          </View>

          </View>
        </View>
      </Modal>
    );
  };
  


  // const renderEditModal = () => {
  //   if (!selectedService) return "";
  
  //   const handleSaveEdit = async () => {
  //     if (!editField || editValue === "") {
  //       Alert.alert("Error", "Please provide a value to update.");
  //       window.alert("Please provide a value to update.");
  //       return;
  //     }
    
  //     try {
  //       const endpointMap: { [key: string]: string } = {
  //         name: "update_name",
  //         description: "update_description",
  //         location: "update_location",
  //         date_time_range: "update_date_time_range",
  //         estimated_duration: "update_estimated_duration",
  //         offered_payment: "update_offered_payment",
  //       };
  //       const endpoint = endpointMap[editField];
  //       if (!endpoint) {
  //         Alert.alert("Error", "Invalid field selected.");
  //         window.alert("Invalid field selected.");
  //         return;
  //       }
    
  //       const requestBody =
  //         editField === "date_time_range"
  //           ? { new_data: editValue.split(",") } 
  //           : { new_data: editValue};
    
  //       const response = await axios.post(
  //         `${process.env.EXPO_PUBLIC_HOST}/api/services/${endpoint}/${selectedService?.id}`,
  //         requestBody.new_data,
  //         {
  //           headers: { Authorization: `Bearer ${user.token}` },
  //         }
  //       );
    
  //       if (response.status === 200) {
  //         Alert.alert("Success", `${editField.replace("_", " ")} updated successfully!`);
  //         window.alert(`${editField.replace("_", " ")} updated successfully!`);
    
  //         setSelectedService((prev) => {
  //           if (!prev) return null;
  //           return { ...prev, [editField]: editValue };
  //         });
    
  //         setServices((prevServices) =>
  //           prevServices.map((service) =>
  //             service.id === selectedService?.id
  //               ? { ...service, [editField]: editValue }
  //               : service
  //           )
  //         );
    
  //         setEditModalVisible(false); 
  //       } else {
  //         Alert.alert("Error", "Failed to update the service. Please try again.");
  //         window.alert("Failed to update the service. Please try again.");
  //       }
  //     } catch (error) {
  //       console.error("API Error:", error.response?.data || error.message);
  //       Alert.alert("Error", "Failed to update the service. Please try again.");
  //       window.alert(`Failed to update the service. Please try again: ${error.message}`);
  //     }
  //   };
    
    
  //   return (
  //     <Modal visible={editModalVisible} transparent={true} animationType="slide">
  //       <View style={styles.modalContainer}>
  //         <View style={styles.modalContent}>
  //           <Text style={styles.modalTitle}>Edit Service</Text>
  
  //           {editField ? (
  //             <>
  //               <Text style={styles.modalField}>Editing: {editField.replace("_", " ")}</Text>
  //               <TextInput
  //                 style={styles.input}
  //                 placeholder={`Enter new ${editField.replace("_", " ")}`}
  //                 value={editValue || ""}
  //                 onChangeText={setEditValue}
  //               />
  //               <View style={styles.modalButtons}>
  //               <TouchableOpacity style={styles.modalButton} onPress={handleSaveEdit}>
  //                 <Text style={styles.modalButtonText}>Save</Text>
  //               </TouchableOpacity>

  //                 <TouchableOpacity
  //                   style={[styles.modalButton, { backgroundColor: "#f94449" }]}
  //                   onPress={() => {setEditModalVisible(false);
  //                     setEditField("");
  //                     setEditValue("");
  //                   }}
  //                 >
  //                   <Text style={styles.modalButtonText}>Discard</Text>
  //                 </TouchableOpacity>
  //               </View>
  //             </>
  //           ) : (
  //             <>
  //               <Text style={styles.modalField}>Select a field to edit:</Text>
  //               {["name", "description", "location", "date_time_range", "estimated_duration", "offered_payment"].map(
  //                 (field) => (
  //                   <TouchableOpacity
  //                     key={field}
  //                     style={styles.modalButton}
  //                     onPress={() => setEditField(field)}
  //                   >
  //                     <Text style={styles.modalButtonText}>{field.replace("_", " ")}</Text>
  //                   </TouchableOpacity>
  //                 )
  //               )}
  //               <TouchableOpacity
  //                 style={[styles.modalButton, { backgroundColor: "#f94449" }]}
  //                 onPress={() => setEditModalVisible(false)}
  //               >
  //                 <Text style={styles.modalButtonText}>Cancel</Text>
  //               </TouchableOpacity>
  //             </>
  //           )}
  //         </View>
  //       </View>
  //     </Modal>
  //   );
  // };
  const renderEditModal = () => {
    if (!selectedService) return null;
  
  
    const handleSaveEdit = async () => {
      try {
        let endpoint = "";
        let new_data = null;
  
        switch (editField) {
          case "name":
            endpoint = "update_name";
            new_data = editName;
            break;
          case "description":
            endpoint = "update_description";
            new_data = editDescription;
            break;
          case "location":
            endpoint = "update_location";
            new_data =editLocation;
            break;
          case "date_time_range":
            endpoint = "update_date_time_range";
            new_data = editDateTimeRange;
            break;
          case "estimated_duration":
            endpoint = "update_estimated_duration";
            new_data = editEstimatedDuration;
            break;
          case "offered_payment":
            endpoint = "update_offered_payment";
            new_data = parseFloat(editOfferedPayment);
            break;
          default:
            Alert.alert("Error", "Invalid field selected.");
            window.alert("Invalid field selected.");
            return;
        }
  
        let response = null;

        if (editField === "date_time_range"){
          response = await axios.post(
            `${process.env.EXPO_PUBLIC_HOST}/api/services/${endpoint}/${selectedService?.id}`,
            new_data,
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
        }else{
          response = await axios.post(
            `${process.env.EXPO_PUBLIC_HOST}/api/services/${endpoint}/${selectedService?.id}?new_data=${encodeURIComponent(
              (new_data.toString())
            )}`,
            {},
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
        }
        
  
        if (response.status === 200) {
          Alert.alert("Success", `${editField.replace("_", " ")} updated successfully!`);
          window.alert(`${editField.replace("_", " ")} updated successfully!`);
          setSelectedService((prev) => {
            if (!prev) return null;
            return { ...prev, [editField]: new_data };
          });
          setServices((prevServices) =>
            prevServices.map((service) =>
              service.id === selectedService?.id
                ? { ...service, [editField]: new_data }
                : service
            )
          );
          await fetchServices(); 
          setEditModalVisible(false);
          setModalVisible(false);
          setEditField("");
          setEditName("");
          setEditDescription("");
          setEditLocation("");
          setEditDateTimeRange(["", ""]);
          setEditEstimatedDuration("");
          setEditOfferedPayment(0);

        } else {
          Alert.alert("Error", "Failed to update the service. Please try again.");
          window.alert("Failed to update the service. Please try again.");
        }
      } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        Alert.alert("Error", "Failed to update the service. Please try again.");
        window.alert(`Failed to update the service. Please try again: ${error.message}`);
      }
    };
  
    return (
      <Modal visible={editModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Service</Text>
  
            {editField ? (
              <>
                <Text style={styles.modalField}>Editing: {editField.replace("_", " ")}</Text>
                {editField === "name" && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new name"
                    value={editName}
                    onChangeText={setEditName}
                  />
                )}
                {editField === "description" && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new description"
                    value={editDescription}
                    onChangeText={setEditDescription}
                  />
                )}
                {editField === "location" && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new location"
                    value={editLocation}
                    onChangeText={setEditLocation}
                  />
                )}
                {editField === "date_time_range" && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter start date (YYYY-MM-DD)"
                      value={editDateTimeRange[0]}
                      onChangeText={(value) =>
                        setEditDateTimeRange((prev) => [value, prev[1]])
                      }
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter end date (YYYY-MM-DD)"
                      value={editDateTimeRange[1]}
                      onChangeText={(value) =>
                        setEditDateTimeRange((prev) => [prev[0], value])
                      }
                    />
                  </>
                )}
                {editField === "estimated_duration" && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter estimated duration"
                    value={editEstimatedDuration}
                    onChangeText={setEditEstimatedDuration}
                  />
                )}
                {editField === "offered_payment" && (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter offered payment"
                    keyboardType="numeric"
                    value={editOfferedPayment.toString()}
                    onChangeText={(value) =>
                      setEditOfferedPayment(parseFloat(value) || 0)
                    }
                  />
                )}
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButton} onPress={handleSaveEdit}>
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
  
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#f94449" }]}
                    onPress={() => {
                      setEditModalVisible(false);
                      setEditField("");
                      setEditName("");
                      setEditDescription("");
                      setEditLocation("");
                      setEditDateTimeRange(["", ""]);
                      setEditEstimatedDuration("");
                      setEditOfferedPayment(0);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Discard</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalField}>Select a field to edit:</Text>
                {[
                  "name",
                  "description",
                  "location",
                  "date_time_range",
                  "estimated_duration",
                  "offered_payment",
                ].map((field) => (
                  <TouchableOpacity
                    key={field}
                    style={styles.inputEdit}
                    onPress={() => setEditField(field)}
                  >
                    <Text style={styles.modalButtonText}>{field.replaceAll("_", " ")}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#f94449" }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
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

    <TouchableOpacity
    style={styles.addButton}
    onPress={() => setAddModalVisible(true)} 
  >
    <Text style={styles.addButtonText}>Add a Service</Text>
  </TouchableOpacity>
  </View>
    
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
      {renderEditModal()}
      <AddServiceModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        fetchServices={fetchServices}
      />
    </View>
    </LocalizationProvider>
  );
};

const styles = StyleSheet.create({
  inputEdit: {
    backgroundColor: "#64B5F6", 
    borderWidth: 1,
    borderColor: "#64B5F6",
    borderRadius: 8, 
    padding: 10, 
    marginVertical: 5, 
    alignItems: "center", 
    justifyContent: "center", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    color: "#1565C0",
    fontWeight: "600", 
    elevation: 3,
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
    elevation: 5,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  picker: {
    height: 40,
    marginBottom: 10,
  },
  selectedTags: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  toggleDuration: {
    backgroundColor: "#e6e6e6",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  
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


  addButton: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  durationInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 5,
    width: "18%",
  },
  

  applyButton: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  uapplyButton: {
    marginTop: 10,
    backgroundColor: "#f94449",
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
  uapplyButtonText: {
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

  modalField: {
    fontSize: 16,
    marginBottom: 10,
  },

  applicantItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  applicantText: {
    fontSize: 16,
    marginBottom: 5,
  },
  applicantActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
  },
  rejectButton: {
    backgroundColor: "#F44336",
    padding: 10,
    borderRadius: 5,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#f94449",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  viewApplicantsButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  viewApplicantsButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  modalCloseButton: {
    marginTop: 15,
    alignSelf: "center",
  },
  modalCloseButtonText: {
    color: "#f94449",
    fontSize: 16,
    fontWeight: "bold",
  },

  dateButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#e6e6e6",
    marginVertical: 10,
  },
  dateIcon: {
    width: 30,
    height: 30,
    tintColor: "#007AFF",
  },
  dateText: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
    textAlign: "center",
  },

  datePickerModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  datePickerContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  closeDatePickerButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
  },
  closeDatePickerButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
  },


  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 10,
  },
  modalButtonCancel: {
    backgroundColor: "#f94449",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  durationBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
  },

  durationInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
    width: "90%", 
    alignSelf: "center",
  },


  fieldContainer: {
    marginBottom: 15,
  },

  fieldLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },

  
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  inputField: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
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

