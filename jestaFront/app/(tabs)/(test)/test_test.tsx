import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';


import { UserContext } from '../../contexts/authContext';
import ServiceCardLina from '../../components/serviceComponents/ServiceCardLina';
import FiltersBar from '../../components/serviceComponents/FiltersBar';
import SearchBar from '../../components/serviceComponents/SearchBar';
import TagBar from '../../components/serviceComponents/TagBar';
import AddServiceModal from '../../components/serviceComponents/AddServiceModal';
import ApplicantsModal from '../../components/serviceComponents/ApplicantsModal';
import EditServiceModal from '../../components/serviceComponents/EditServiceModal';
import NotificationModal from '../../components/serviceComponents/NotificationsModal';
import { useNotification } from '../../contexts/notificationContext';

import nearbyCities from '../../../hooks/cityMapping'; 
import citiesWithCoords from '../../../hooks/citiesWithCoords';
import { normalizeCityName } from '../../../hooks/cityUtils';
import { getDistance } from 'geolib';
import * as Location from 'expo-location';

import { useLocalSearchParams } from 'expo-router';

import { RefreshControl } from 'react-native';



import {
  scheduleServiceReminders,
  updateReminders,
  cancelReminders,
  getReminderIds,
  isReminderOutdated,
} from '../../../hooks/reminderUtils';








interface Service {
  id: number;
  user_id: number;
  title: string;
  description: string;
  location: string;
  tags: string[];
  state: string;
  applicants: any[];
  date_time_range: string[];
  estimated_duration: string;
  offered_payment: number;
  service_from: 'provider' | 'publisher';
  is_volunteering: boolean;
}


export default function ExplorePage() {

  const { user } = useContext(UserContext);

  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  //Filters & search
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [location, setLocation] = useState('');

  const [durationDays, setDurationDays] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  
  const [duration, setDuration] = useState('');


  const [filterRequests, setFilterRequests] = useState(true);
  const [filterMine, setFilterMine] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [sortOption, setSortOption] = useState('price_low_high');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [addServiceVisible, setAddServiceVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [resetTrigger, setResetTrigger] = useState(false);


  const [showSavedServices, setShowSavedServices] = useState(false);
  const [savedServiceIds, setSavedServiceIds] = useState<number[]>([]); 

  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const modalRef = useRef(null);

  const {newNotification } = useNotification();

  const [acceptedServiceIds, setAcceptedServiceIds] = useState<number[]>([]);
  const [showAcceptedOnly, setShowAcceptedOnly] = useState(false);

  const [nearby, setNearby] = useState(false);


  //const [userCity, setUserCity] = useState('');

  const { userCity, refreshUserCity } = useContext(UserContext);


  const [loadingCity, setLoadingCity] = useState(true);

  const [useGpsNearby, setUseGpsNearby] = useState(false);
  const [showGpsPreferences, setShowGpsPreferences] = useState(false);

  const [radiusKm, setRadiusKm] = useState('');

  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  const shownOutdatedReminderIds = useRef<Set<number>>(new Set());

  const [includeCompleted, setIncludeCompleted] = useState(false);

  const [refreshing, setRefreshing] = useState(false);



  const { referralCode } = useLocalSearchParams();

  useEffect(() => {
    if (referralCode) {
      Alert.alert("🎉 Referral Bonus", "You earned XP for signing up with a referral code!");
    }
  }, [referralCode]);



  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermissionGranted(granted);
    })();
  }, []);
  








  // const fetchUserCity = async (manual = false) => {
  //   try {
  //     setLoadingCity(true);
  
  //     const servicesEnabled = await Location.hasServicesEnabledAsync();
  //     if (!servicesEnabled) {
  //       if (manual) {
  //         Alert.alert("Location Disabled", "Please enable location services (GPS) in your phone settings.");
  //       }
  //       setLoadingCity(false);
  //       return;
  //     }
  
  //     const { status } = await Location.requestForegroundPermissionsAsync();
  //     const granted = status === 'granted';
  //     setLocationPermissionGranted(granted); 
  
  //     if (!granted) {
  //       if (manual) Alert.alert("Permission Denied", "Please enable location access in your phone settings.");
  //       setLoadingCity(false);
  //       return;
  //     }
  
  //     const location = await Location.getCurrentPositionAsync({
  //       accuracy: Location.Accuracy.High,
  //       maximumAge: 5000,
  //       timeout: 5000, 
  //     });
  
  //     const geocode = await Location.reverseGeocodeAsync(location.coords);
  //     const city = geocode?.[0]?.city;
  
  //     if (city) {
  //       const normalized = normalizeCityName(city);
  //       setUserCity(normalized);
  //     } else if (manual) {
  //       Alert.alert("Could not detect city", "Try again later or enter manually.");
  //     }
  //   } catch (err) {
  //     console.error("Manual location error:", err);
  //     if (manual) Alert.alert("Error", "Something went wrong detecting your location.");
  //   } finally {
  //     setLoadingCity(false); 
  //   }
  // };


  useEffect(() => {
    const checkOutdatedReminders = async () => {
      for (const service of services) {
        const isAcceptedApplicant = service.applicants?.some(
          (applicant: any) =>
            applicant.user_id === user.id && applicant.applicant_state === 'accepted'
        );
  
        const isCreator = service.user_id === user.id;
  
        if (!isAcceptedApplicant && !isCreator) continue;
  
        const reminder = await getReminderIds(service.id);
        const isOutdated = await isReminderOutdated(service);
  
        if (reminder && isOutdated) {
          await updateReminders(service);
        }
      }
    };
  
    if (services.length > 0) {
      checkOutdatedReminders();
    }
  }, [services]);
  
  
  
  
  




  
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

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchServices();
  //   }, 5000); 
  
  //   return () => clearInterval(interval); 
  // }, []);


  useEffect(() => {
    if (newNotification) {
      setNotifications((prev) => [newNotification, ...prev]);
    }
  }, [newNotification]);

  // useEffect(() => {
  //   fetchUserCity(); 
  // }, []);


  useEffect(() => {
    fetchServices();
  }, []);


  useEffect(() => {
    const tryRefreshCity = async () => {
      try {
        await refreshUserCity();
      } catch (e) {
        console.log("City detection error:", e);
      } finally {
        setLoadingCity(false);
      }
    };
  
    tryRefreshCity();
  }, []);
  
  
  
  
  

  //Fetch services
  const fetchServices = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/services/get_all_services`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
  
      if (response.status === 200 && response.data) {
        setServices(response.data);
  
        const acceptedIds = response.data
          .filter(service =>
            service.applicants.some(
              applicant => applicant.user_id === user.id && applicant.applicant_state === 'accepted'
            )
          )
          .map(service => service.id);

        setAcceptedServiceIds(acceptedIds);


        
        } else {
        Alert.alert('Error', 'Failed to fetch services');
        setServices([]);
        setFilteredServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Could not load services');
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  

  const toggleSaveService = async (serviceId: number) => {
    try {
      const isCurrentlySaved = savedServiceIds.includes(serviceId);
      const endpoint = isCurrentlySaved ? 'unsave_service' : 'save_service';
  
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/${endpoint}/${serviceId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
  
      if (response.status === 200) {
        if (isCurrentlySaved) {
          setSavedServiceIds((prev) => prev.filter(id => id !== serviceId));
        } else {
          setSavedServiceIds((prev) => [...prev, serviceId]);
        }
        Alert.alert("Success", response.data.message);
      }
    } catch (error: any) {
      console.error("Error toggling save:", error?.response?.data || error.message);
      Alert.alert("Error", "Failed to toggle save.");
    }
  };
  
  
  
  const openModal = () => {
    setModalVisible(true);
    modalRef.current?.refreshNotifications(); 
  };
  

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/notifications/get_latest`);
      setNotifications(res.data.notifications);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };
 
  
  //Apply filters & sorting
  const applyFilters = () => {
    let result = [...services];

    if (selectedTags.length > 0) {
      result = result.filter(service =>
        service.tags.some(tag => selectedTags.some(selected => tag.toLowerCase() === selected.toLowerCase()))
      );
    }

    if (searchValue.trim() !== '') {
      const search = searchValue.toLowerCase();
      result = result.filter(service => service.title.toLowerCase().includes(search));
    }

    //Requests/Offers
    if (!filterRequests) result = result.filter(service => service.service_from !== 'publisher');
    else result = result.filter(service => service.service_from === 'publisher');

    //Mine/Others
    if (!filterMine) result = result.filter(service => service.user_id !== user.id);
    else result = result.filter(service => service.user_id === user.id);


    if (!includeCompleted) {
      result = result.filter(service => service.state !== 'completed');
    }
    

    //Location
    // if (location.trim() !== '') {
    //   result = result.filter(service => service.location.toLowerCase().includes(location.toLowerCase()));
    // }


 

    //Location filter:
    if (radiusKm && userCity && citiesWithCoords[userCity]) {
      const userCoords = citiesWithCoords[userCity];
      const radiusInMeters = parseFloat(radiusKm) * 1000;
    
      result = result.filter(service => {
        const serviceCoords = citiesWithCoords[normalizeCityName(service.location)];
        if (!serviceCoords) return false;
    
        const distance = getDistance(userCoords, serviceCoords);
        return distance <= radiusInMeters;
      });
    } else if (useGpsNearby && userCity) {
      const normalizedCity = normalizeCityName(userCity);
      const nearbyList = (nearbyCities[normalizedCity] || []).map(c => normalizeCityName(c));
            result = result.filter(service =>
        nearbyList.includes(service.location.trim().toLowerCase())
      );
    } else if (nearby && location.trim() !== '') {
      const nearbyList = (nearbyCities[location] || []).map(c => c.trim().toLowerCase());
      result = result.filter(service =>
        nearbyList.includes(service.location.trim().toLowerCase())
      );
    } else if (location.trim() !== '') {
      result = result.filter(service =>
        normalizeCityName(service.location).includes(normalizeCityName(location))
      );
    }
    


    
    const parseDurationToMinutes = (durationStr: string) => {
      const regex = /P(\d+)DT(\d+)H(\d+)M/;
      const match = durationStr.match(regex);
      if (!match) return 0;
      const days = parseInt(match[1]);
      const hours = parseInt(match[2]);
      const minutes = parseInt(match[3]);
      return days * 24 * 60 + hours * 60 + minutes;
    };
    
    if (duration.trim() !== '') {
      const targetMinutes = parseDurationToMinutes(duration);
      result = result.filter(service => {
        const serviceMinutes = parseDurationToMinutes(service.estimated_duration);
        return serviceMinutes === targetMinutes;
      });
    }
    
    
    
    

    

     //Price
    result = result.filter(service => service.offered_payment >= priceRange[0] && service.offered_payment <= priceRange[1]);
    if (sortOption === 'price_low_high') result.sort((a, b) => a.offered_payment - b.offered_payment);
    else if (sortOption === 'price_high_low') result.sort((a, b) => b.offered_payment - a.offered_payment);
    else if (sortOption === 'duration_short_long') result.sort((a, b) => a.estimated_duration.localeCompare(b.estimated_duration));
    else if (sortOption === 'duration_long_short') result.sort((a, b) => b.estimated_duration.localeCompare(a.estimated_duration));



    setFilteredServices(result);
  };

  useEffect(() => {
    applyFilters();
  }, [services, selectedTags, searchValue, filterRequests, filterMine, location, duration, priceRange, sortOption, nearby, radiusKm, useGpsNearby, userCity, includeCompleted,]);

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setLocation('');
    setFilterRequests(true);
    setFilterMine(true);
    setSearchValue('');
    setSortOption('price_low_high');
    setSelectedTags([]);
    setResetTrigger(prev => !prev); 
    setDuration('');
    setDurationDays('');
    setDurationHours('');
    setDurationMinutes('');
    setNearby(false);            
    setRadiusKm('');            
    setUseGpsNearby(false); 
    setIncludeCompleted(false);



  };

  const handleAddService = async (serviceData: any) => {
    try {
      const payload = {
        title: serviceData.title,
        description: serviceData.description,
        tags: serviceData.tags,
        location: serviceData.location,
        date_time_range: serviceData.date_time_range,
        estimated_duration: serviceData.estimated_duration,
        offered_payment: serviceData.offered_payment,
        service_from: serviceData.service_from,
        is_volunteering: serviceData.is_volunteering,
      };

      console.log("Sending payload:", payload);

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/create_service`,
        payload,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Service created successfully!");
        const newService = response.data;
        setServices((prev) => [...prev, newService]);
        setAddServiceVisible(false);
      } else {
        Alert.alert("Error", "Failed to create service. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create service:", error.message);
      Alert.alert("Error", "Failed to create service. Please try again.");
    }
  };


  const handleOpenNotifications = async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/notifications/get_unread`);
      setNotifications(res.data);
      setNotificationModalVisible(true);
    } catch (error) {
      console.error("Error opening notifications modal:", error);
      Alert.alert("Error", "Unable to load notifications.");
    }
  };
  
  

  const handleUpdateService = (updatedService: Service) => {
    setServices((prev) =>
      prev.map((s) => (s.id === updatedService.id ? updatedService : s))
    );
  };

  const handleDeleteService = (deletedId: number) => {
    setServices((prev) => prev.filter((s) => s.id !== deletedId));
  };


  const handleAcceptApplicant = async (serviceId: number, applicantEmail: string) => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/accept_applicant/${serviceId}/${encodeURIComponent(applicantEmail)}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
  
      if (response.status === 200) {
        Alert.alert("Success", "Applicant accepted!");
  
        setServices((prevServices) => {
          const updated = prevServices.map((service) => {
            if (service.id === serviceId) {
              const updatedApplicants = service.applicants.map((applicant) =>
                applicant.email === applicantEmail ? { ...applicant, status: 'accepted' } : applicant
              );
              return { ...service, applicants: updatedApplicants };
            }
            return service;
          });
  
          const accepted = updated
            .filter(service =>
              service.applicants?.some(
                (applicant: any) =>
                  (applicant.email === user.email || applicant.user_id === user.id) &&
                  applicant.status === 'accepted'
              )
            )
            .map(service => service.id);
  
          setAcceptedServiceIds(accepted);
  
          return updated;
        });
      }
    } catch (error) {
      console.error("Accept error:", error);
      Alert.alert("Error", "Failed to accept applicant.");
    }
  };
  

  const handleRejectApplicant = async (serviceId: number, applicantEmail: string) => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/reject_applicant/${serviceId}/${encodeURIComponent(applicantEmail)}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
  
      if (response.status === 200) {
        Alert.alert("Success", "Applicant rejected!");
  
        setServices((prevServices) => {
          const updated = prevServices.map((service) => {
            if (service.id === serviceId) {
              const updatedApplicants = service.applicants.map((applicant) =>
                applicant.email === applicantEmail ? { ...applicant, status: 'rejected' } : applicant
              );
              return { ...service, applicants: updatedApplicants };
            }
            return service;
          });
  
          const accepted = updated
            .filter(service =>
              service.applicants?.some(
                (applicant: any) =>
                  (applicant.email === user.email || applicant.user_id === user.id) &&
                  applicant.status === 'accepted'
              )
            )
            .map(service => service.id);
  
          setAcceptedServiceIds(accepted);
          
  
          return updated;
        });
      }
    } catch (error) {
      console.error("Reject error:", error);
      Alert.alert("Error", "Failed to reject applicant.");
    }
  };
  


  const openServiceModal = (service: Service) => {
    console.log('Open Service:', service.id);
  };



  

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: '#f0f4f8' , top : 20}}>
      {showSavedServices ? (
        <ScrollView>
  
          {/* Back Arrow at Top */}
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity onPress={() => setShowSavedServices(false)}>
              <Ionicons name="arrow-back" size={40} color="#007AFF" />
            </TouchableOpacity>
          </View>
  
          {/* Title + Toggle */}
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 24 }}>Saved & Accepted Services</Text>
  
            <TouchableOpacity
              onPress={() => setShowAcceptedOnly(prev => !prev)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                backgroundColor: '#007AFF',
                borderRadius: 8,
                marginTop: 8,
              }}
            >
              <Text style={{ color: 'white' }}>
                {showAcceptedOnly ? 'Show Only Saved' : 'Show Only Accepted'}
              </Text>
            </TouchableOpacity>
          </View>
  
          {/* Filtered Services List */}
          {services
          .filter(service => {
            if (showAcceptedOnly) {
              return acceptedServiceIds.includes(service.id);
            }
            return savedServiceIds.includes(service.id);
          })
          .map(service => (
            <ServiceCardLina
              key={service.id}
              service={service}
              user={user}
              openServiceModal={() => {}}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
              onAcceptApplicant={handleAcceptApplicant}
              onRejectApplicant={handleRejectApplicant}
              isSaved={savedServiceIds.includes(service.id)}
              toggleSave={toggleSaveService}
              fetchServices={fetchServices}
            />
        ))}

  
          {/* Empty State */}
          {(showAcceptedOnly
            ? acceptedServiceIds.length === 0
            : services.filter(service =>
                savedServiceIds.includes(service.id) || acceptedServiceIds.includes(service.id)
              ).length === 0) && (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              {showAcceptedOnly ? 'No accepted services yet' : 'No saved services yet'}
            </Text>
          )}

        </ScrollView>
          ) : (
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={fetchServices} />
              }
            >

  
          {/* Top Row Icons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 15 }}>
            {/* Saved Services */}
            <TouchableOpacity onPress={() => setShowSavedServices(true)}>
              <Ionicons name="bookmark" size={40} color="#f0a500" />
            </TouchableOpacity>
  
            {/* Show/Hide Filters */}
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Ionicons name="search" size={40} color="#007AFF" />
            </TouchableOpacity>
  
            {/* Notifications */}
            <TouchableOpacity onPress={handleOpenNotifications}>
              <Ionicons name="notifications-outline" size={40} />
            </TouchableOpacity>


            {/* Refresh Button */}
            <TouchableOpacity onPress={fetchServices} disabled={refreshing}>
              {refreshing ? (
                <ActivityIndicator size={24} color="#007AFF" />
              ) : (
                <Ionicons name="refresh" size={40} color="#007AFF" />
              )}
            </TouchableOpacity>


  
            {/* Add New Service */}
            <TouchableOpacity onPress={() => setAddServiceVisible(true)}>
              <Ionicons name="add-circle" size={40} color="#28a745" />
            </TouchableOpacity>
          </View>
  
          {/* Filters Section */}
          {showFilters && (
            <>
              <SearchBar
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                sortOption={sortOption}
                setSortOption={setSortOption}
              />


          <View style={{ marginVertical: 10, paddingHorizontal: 10 }}>
            <TouchableOpacity
              onPress={() => setShowGpsPreferences(prev => !prev)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>📡 Location Preferences</Text>
              <Ionicons name={showGpsPreferences ? 'chevron-up' : 'chevron-down'} size={20} />
            </TouchableOpacity>




            {showGpsPreferences && (
              <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 10 }}>



            <Text style={{ marginBottom: 6 }}>
              📍 Your detected city:{" "}
              <Text style={{ fontWeight: 'bold' }}>
                {userCity || 'Not detected yet'}
              </Text>
            </Text>

            <TouchableOpacity
                onPress={async () => {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  const granted = status === 'granted';
                  setLocationPermissionGranted(granted);
                  if (granted) {
                    await refreshUserCity(); 
                  } else {
                    Alert.alert("Permission Denied", "Please allow location access to use this feature.");
                  }
                }}
              style={{
                backgroundColor: '#007AFF',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignSelf: 'flex-start',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>🔄 Detect My Location</Text>
            </TouchableOpacity>




              {locationPermissionGranted && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text>Show services near my location</Text>
                  <Switch
                    value={useGpsNearby}
                    onValueChange={(value) => {
                      setUseGpsNearby(value);
                          if (value) {
                          setRadiusKm('20'); //Default to 20 km when enabled
                        } else {
                          setRadiusKm('');
                        }
                    }}
                  />
                </View>
              )}
              </View>
            )}
          </View>

  
              <FiltersBar
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                location={location}
                setLocation={setLocation}
                duration={duration}
                setDuration={setDuration}
                durationDays={durationDays}
                setDurationDays={setDurationDays}
                durationHours={durationHours}
                setDurationHours={setDurationHours}
                durationMinutes={durationMinutes}
                setDurationMinutes={setDurationMinutes}
                filterRequests={filterRequests}
                setFilterRequests={setFilterRequests}
                filterMine={filterMine}
                setFilterMine={setFilterMine}
                nearby={nearby}
                setNearby={setNearby}
                resetTrigger={resetTrigger}
                radiusKm={radiusKm}
                setRadiusKm={setRadiusKm}
                hideLocationInput={useGpsNearby} 
                includeCompleted={includeCompleted}
                setIncludeCompleted={setIncludeCompleted}
              />
  
              <TagBar
                predefinedTags={predefinedTags}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
              />
  
              <TouchableOpacity
                style={{
                  backgroundColor: '#dc3545',
                  padding: 10,
                  marginVertical: 5,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={resetFilters}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Reset Filters</Text>
              </TouchableOpacity>
            </>
          )}
  
          {/* Add Service Modal */}
          <AddServiceModal
            visible={addServiceVisible}
            onClose={() => setAddServiceVisible(false)}
            onAddService={handleAddService}
          />
  
          {/* Notification Modal */}
          <NotificationModal
            visible={notificationModalVisible}
            onClose={() => setNotificationModalVisible(false)}
            notifications={notifications}
          />
  
          {/* Services List */}
          { loading || loadingCity  ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
            <ActivityIndicator size="large" color="#007AFF" />
            </View>

          ) : filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <ServiceCardLina
                key={service.id}
                service={service}
                user={user}
                openServiceModal={() => {}}
                onUpdateService={handleUpdateService}
                onDeleteService={handleDeleteService}
                onAcceptApplicant={handleAcceptApplicant}
                onRejectApplicant={handleRejectApplicant}
                isSaved={savedServiceIds.includes(service.id)}
                toggleSave={toggleSaveService}
                fetchServices={fetchServices}
              />
            ))
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 20 }}></Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}  