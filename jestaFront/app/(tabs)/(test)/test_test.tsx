import React, { useContext, useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

import { UserContext } from '../../contexts/authContext';
import ServiceCard from '../../components/serviceComponents/ServiceCard';
import FiltersBar from '../../components/serviceComponents/FiltersBar';
import SearchBar from '../../components/serviceComponents/SearchBar';
import TagBar from '../../components/serviceComponents/TagBar';
import AddServiceModal from '../../components/serviceComponents/AddServiceModal';

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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState('');
  const [filterRequests, setFilterRequests] = useState(true);
  const [filterOffers, setFilterOffers] = useState(true);
  const [filterMine, setFilterMine] = useState(true);
  const [filterOthers, setFilterOthers] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [sortOption, setSortOption] = useState('price_low_high');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [addServiceVisible, setAddServiceVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [resetTrigger, setResetTrigger] = useState(false);


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

  //Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/services/get_all_services`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        console.log('Fetched services:', response.data);

        if (response.status === 200 && response.data) {
          setServices(response.data);
          setFilteredServices(response.data);
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
      }
    };

    fetchServices();
  }, []);

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

    if (!filterRequests) result = result.filter(service => service.service_from !== 'publisher');
    if (!filterOffers) result = result.filter(service => service.service_from !== 'provider');
    if (!filterMine) result = result.filter(service => service.user_id !== user.id);
    if (!filterOthers) result = result.filter(service => service.user_id === user.id);

    if (location.trim() !== '') {
      result = result.filter(service =>
        service.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (duration.trim() !== '') {
      result = result.filter(service => service.estimated_duration.includes(duration));
    }

    result = result.filter(service =>
      service.offered_payment >= priceRange[0] && service.offered_payment <= priceRange[1]
    );

    if (sortOption === 'price_low_high') {
      result.sort((a, b) => a.offered_payment - b.offered_payment);
    } else if (sortOption === 'price_high_low') {
      result.sort((a, b) => b.offered_payment - a.offered_payment);
    } else if (sortOption === 'duration_short_long') {
      result.sort((a, b) => a.estimated_duration.localeCompare(b.estimated_duration));
    } else if (sortOption === 'duration_long_short') {
      result.sort((a, b) => b.estimated_duration.localeCompare(a.estimated_duration));
    }

    setFilteredServices(result);
  };

  useEffect(() => {
    applyFilters();
  }, [services, selectedTags, searchValue, filterRequests, filterOffers, filterMine, filterOthers, location, duration, priceRange, sortOption]);

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setLocation('');
    setDuration('');
    setFilterRequests(true);
    setFilterOffers(true);
    setFilterMine(true);
    setFilterOthers(true);
    setSearchValue('');
    setSortOption('price_low_high');
    setSelectedTags([]);
    setResetTrigger(prev => !prev); 

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

  const handleUpdateService = (updatedService: Service) => {
    setServices((prev) =>
      prev.map((s) => (s.id === updatedService.id ? updatedService : s))
    );
  };

  const handleDeleteService = (deletedId: number) => {
    setServices((prev) => prev.filter((s) => s.id !== deletedId));
  };

  const openServiceModal = (service: Service) => {
    console.log('Open Service:', service.id);
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <ScrollView>

        {/*Show/Hide Filters */}
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Text>
        </TouchableOpacity>

        {showFilters && (
          <>
            <SearchBar
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              sortOption={sortOption}
              setSortOption={setSortOption}
            />

            <FiltersBar
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              location={location}
              setLocation={setLocation}
              duration={duration}
              setDuration={setDuration}
              filterRequests={filterRequests}
              setFilterRequests={setFilterRequests}
              filterOffers={filterOffers}
              setFilterOffers={setFilterOffers}
              filterMine={filterMine}
              setFilterMine={setFilterMine}
              filterOthers={filterOthers}
              setFilterOthers={setFilterOthers}
              resetTrigger={resetTrigger} 
            />

            <TagBar
              predefinedTags={predefinedTags}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
            />

            {/*Reset Filters */}
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

        {/*Add Service */}
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 12,
            marginVertical: 10,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setAddServiceVisible(true)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Add New Service</Text>
        </TouchableOpacity>

        <AddServiceModal
          visible={addServiceVisible}
          onClose={() => setAddServiceVisible(false)}
          onAddService={handleAddService}
        />

        {/*Services*/}
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : filteredServices && filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              user={user}
              openServiceModal={openServiceModal}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          ))
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No services available.</Text>
        )}
      </ScrollView>
    </View>
  );
}
