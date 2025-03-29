import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import SpecialistShowCard from '../components/serviceComponents/specialistShowCard';
import { UserContext } from '../contexts/authContext';
import ServiceCardLina from '../components/serviceComponents/ServiceCardLina';

const ServiceUserProfileScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useContext(UserContext);

  const [profile, setProfile] = useState(null);
  const [specialists, setSpecialists] = useState([]);
  const [services, setServices] = useState([]);
  const [saved, setSaved] = useState([]);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState<'request' | 'offer' | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${id}`);
        const profileData = profileRes.data;
        if (profileData.image) profileData.image = `${process.env.EXPO_PUBLIC_HOST}${profileData.image}`;
        setProfile(profileData);

        try {
          const specialistsResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/specialists/get_specialist/${id}/`);
          if (specialistsResponse.data && typeof specialistsResponse.data === 'object') {
            setSpecialists([specialistsResponse.data]);
          }
        } catch {
          setSpecialists([]);
        }

        const allServicesResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/services/get_all_services`);
        const allServices = allServicesResponse.data;
        const userServices = allServices.filter(service => service.user_id == id);
        setServices(userServices);

        const accepted = userServices.some(service =>
          service.applicants?.some(
            applicant => applicant.user_id === user.id && applicant.applicant_state === 'accepted'
          )
        );
        setAccepted(accepted);

        const savedRes = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_saved_services/${user.id}`);
        setSaved(savedRes.data.map(service => service.id));
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (id && user?.id) {
      fetchData();
    }
  }, [id]);

  const toggleSave = async (serviceId) => {
    try {
      const isAlreadySaved = saved.includes(serviceId);
      const url = `${process.env.EXPO_PUBLIC_HOST}/api/services/${isAlreadySaved ? 'unsave' : 'save'}_service/${serviceId}`;
      await axios.post(url, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      setSaved((prev) => isAlreadySaved ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle saved state');
    }
  };

  const openLink = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const filteredServices = services.filter(service => {
    if (activeTab === 'request') return service.service_from === 'publisher';
    if (activeTab === 'offer') return service.service_from === 'provider';
    return false;
  });

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#007bff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        {profile?.image ? (
          <Image source={{ uri: profile.image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.nameAndAgeContainer}>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.age}>{profile?.age}</Text>
        </View>

        <Text style={styles.bio}>{profile?.bio}</Text>

        <View style={styles.socialLinks}>
          {profile?.facebook && (
            <TouchableOpacity style={styles.linkContainer} onPress={() => openLink(profile.facebook)}>
              <Ionicons style={styles.linkLogo} name="logo-facebook" />
            </TouchableOpacity>
          )}
          {profile?.linkedin && (
            <TouchableOpacity style={styles.linkContainer} onPress={() => openLink(profile.linkedin)}>
              <Ionicons style={styles.linkLogo} name="logo-linkedin" />
            </TouchableOpacity>
          )}
          {profile?.instagram && (
            <TouchableOpacity style={styles.linkContainer} onPress={() => openLink(profile.instagram)}>
              <Ionicons style={styles.linkLogo} name="logo-instagram" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Specialty</Text>
        {specialists.length > 0 ? (
          specialists.map((specialist) => (
            <SpecialistShowCard key={specialist.id} specialist={specialist} />
          ))
        ) : (
          <Text style={styles.noSpecialistsText}>No specialist profile for this user</Text>
        )}

        {accepted && (
          <TouchableOpacity style={styles.chatButton} onPress={() => Alert.alert('Open private chat')}>
            <Text style={styles.chatText}>Open Private Chat</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Services</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity
            style={[styles.filterButton, activeTab === 'request' && styles.filterButtonActive]}
            onPress={() => setActiveTab('request')}
          >
            <Text style={styles.filterButtonText}>Show Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeTab === 'offer' && styles.filterButtonActive]}
            onPress={() => setActiveTab('offer')}
          >
            <Text style={styles.filterButtonText}>Show Offers</Text>
          </TouchableOpacity>
        </View>

        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <ServiceCardLina
              key={service.id}
              service={{
                ...service,
                applicants: Array.isArray(service.applicants) ? service.applicants : [],
                tags: Array.isArray(service.tags) ? service.tags : [],
                date_time_range: Array.isArray(service.date_time_range) ? service.date_time_range : ["", ""],
              }}
              user={user}
              openServiceModal={() => {}}
              onUpdateService={() => {}}
              onDeleteService={() => {}}
              fetchServices={() => {}}
              hideOwner
              hideType
              hideSave
            />
          ))
        ) : (
          activeTab && (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              No {activeTab === 'request' ? 'requests' : 'offers'} to show.
            </Text>
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  container: { paddingTop: 80, padding: 16, alignItems: 'center' },
  image: { width: 150, height: 150, borderRadius: 100, marginBottom: 16 },
  placeholderImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  placeholderText: { color: '#888' },
  nameAndAgeContainer: { alignItems: 'center', flexDirection: 'row' },
  name: { fontSize: 24, fontWeight: 'bold', marginRight: 8 },
  age: { fontSize: 18, color: 'rgba(36,36,38,0.8)' },
  bio: { fontSize: 16, fontStyle: 'italic', marginBottom: 16, textAlign: 'center' },
  socialLinks: { flexDirection: 'row', marginTop: 16, justifyContent: 'center', width: '100%' },
  linkContainer: { paddingVertical: 12, paddingHorizontal: 20, marginHorizontal: 12, backgroundColor: '#ffffff', borderRadius: 30, borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  linkLogo: { color: '#007bff', fontSize: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 12, color: '#333' },
  noSpecialistsText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 8 },
  chatButton: { marginTop: 20, backgroundColor: '#007bff', padding: 12, borderRadius: 8 },
  chatText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  backButton: { position: 'absolute', top: 60, left: 16, zIndex: 10, backgroundColor: '#f8f8f8', borderRadius: 30, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  error: { color: 'red', fontSize: 16 },
  filterButton: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8 },
  filterButtonActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  filterButtonText: { color: 'black' },
});

export default ServiceUserProfileScreen;
