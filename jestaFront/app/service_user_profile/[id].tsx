
import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Linking, Alert, FlatList, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import SpecialistShowCard from '../components/serviceComponents/specialistShowCard';
import { UserContext } from '../contexts/authContext';
import ServiceCardLina from '../components/serviceComponents/ServiceCardLina';
import RankBadgeSection from '../components/serviceComponents/RankBadgeSection';
import AllBadgesModal from '../components/serviceComponents/AllBadgesModal';
import ConfettiCannon from 'react-native-confetti-cannon';
import AsyncStorage from '@react-native-async-storage/async-storage';


// this file is for the profiles opened from the explore page




const ServiceUserProfileScreen = () => {
  const { id } = useLocalSearchParams();
  const userId = id ? parseInt(id as string) : null;
  const { user } = useContext(UserContext);

  const [profile, setProfile] = useState(null);
  const [specialists, setSpecialists] = useState([]);
  const [services, setServices] = useState([]);
  const [saved, setSaved] = useState([]);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState<'request' | 'offer' | null>(null);


  const [completedServices, setCompletedServices] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);


  const [showReviews, setShowReviews] = useState(false);
  const [showCompletedServices, setShowCompletedServices] = useState(false);

  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);

  const [prevLevel, setPrevLevel] = useState(userLevel);
  const [showConfetti, setShowConfetti] = useState(false);

  const previousLevelRef = useRef(userLevel); 


  interface Badge {
    id: number;
    name: string;
    description: string;
  }


  const [badges, setBadges] = useState<Badge[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showAllBadges, setShowAllBadges] = useState(false);


  const [averageRating, setAverageRating] = useState<number | null>(null);

  const [isCreatorOfAcceptedApplicant, setIsCreatorOfAcceptedApplicant] = useState(false);

//-------------------------------


  const cleanBadgeArray = (badges: any[]) =>
    badges.map(({ id, name, description }) => ({
      id,
      name,
      description,
    }));
  
//-------------------------------

useEffect(() => {
  const fetchAverageRating = async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/reviews/get_average_rating/${userId}/`);
      setAverageRating(res.data?.average_rating || null);
    } catch (err) {
      console.error('Error fetching average rating:', err);
    }
  };

  if (userId) {
    fetchAverageRating();
  }
}, [userId,refreshTrigger]);

//-------------------------------

  
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/ranks/get_badges/${userId}/`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });


        const cleanedBadges = res.data.map(({ id, name, description }) => ({
          id,
          name,
          description,
        }));
        setBadges(cleanBadgeArray(res.data));


      } catch (err) {
        console.error('Error fetching badges:', err.response?.data || err.message);
      }
    };
  
    fetchBadges();
  }, [userId]);
//-------------------------------


  const handleReviewSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };
 
  
  //-------------------------------

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 3000); //every 3 seconds
  
    return () => clearInterval(interval); 
  }, []);
  
//-------------------------------

  useEffect(() => {

    const fetchProfileData = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };

        const [servicesRes, reviewsRes, xpRes, levelRes, profileRes] = await Promise.all([
          axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/services/get_list_of_all_completed_services_of_user/${userId}`, { headers }),
          axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/reviews/get_reviews/${userId}/`, { headers }),
          axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/ranks/get_xp/${userId}/`, { headers }),
          axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/ranks/get_level/${userId}/`, { headers }),
          axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${userId}`, { headers }),
          
        ]);

        setCompletedServices(servicesRes.data);
        setReceivedReviews(reviewsRes.data);
        setUserXP(xpRes.data);
        setUserLevel(levelRes.data);

    

        if (userId === user?.id) {
          const storedLevel = await AsyncStorage.getItem('lastSeenLevel');
          const numericStoredLevel = parseInt(storedLevel || "0");
        
          if (levelRes.data > numericStoredLevel) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        
            await AsyncStorage.setItem('lastSeenLevel', levelRes.data.toString());
          }
        }
        



        const profileData = profileRes.data;

        if (profileData.image) {
          profileData.image = `${process.env.EXPO_PUBLIC_HOST}${profileData.image}`;
        }
        
        setProfile(profileData);

        const cleanedBadges = profileData.badges.map(({ id, name, description }) => ({
          id,
          name,
          description,
        }));
        setBadges(cleanBadgeArray(profileData.badges));

        

      } catch (err) {
        Alert.alert("Error", "Failed to load profile info.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId,refreshTrigger]);





  //-------------------------------

  useEffect(() => {

    const fetchData = async () => {
      try {
        const profileRes = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${id}`);
        const profileData = profileRes.data;
        const { badges: _, ...profileWithoutBadges } = profileData;

        if (profileWithoutBadges.image) {
          profileWithoutBadges.image = `${process.env.EXPO_PUBLIC_HOST}${profileWithoutBadges.image}`;
        }
        
        setProfile(profileWithoutBadges);


        try {
          const specialistsResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/specialists/get_specialist/${id}/`);
          if (specialistsResponse.data && typeof specialistsResponse.data === 'object') {
            setSpecialists([specialistsResponse.data]);
          }
        } catch {
          setSpecialists([]);
        }


 //-------------------------------
       
        const allServicesResponse = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/services/get_all_services`);
        const allServices = allServicesResponse.data;
        const userServices = allServices.filter(service => service.user_id == id);
        setServices(userServices);


 //-------------------------------
       
        const accepted = userServices.some(service =>
          service.applicants?.some(
            applicant => applicant.user_id === user.id && applicant.applicant_state === 'accepted'
          )
        );
        setAccepted(accepted);

//-------------------------------

    const creatorHasThisUserAsApplicant = allServices.some(service =>
      service.user_id === user.id &&
      service.applicants?.some(
        applicant => applicant.user_id === parseInt(id) 
      )
    );
    setIsCreatorOfAcceptedApplicant(creatorHasThisUserAsApplicant);

        
//-------------------------------
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


  //-------------------------------


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


  //-------------------------------




  const openLink = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };


  //-------------------------------


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


  //-------------------------------


  const filteredServices = services.filter(service => {
    if (activeTab === 'request') return service.service_from === 'publisher';
    if (activeTab === 'offer') return service.service_from === 'provider';
    return false;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>


      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#007bff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>


        {/* Profile Image */}
        {profile?.image ? (
          <Image source={{ uri: profile.image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Name and Age and chats Row */}

      <View style={styles.nameAgeChatContainer}>
       
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.age}>{profile?.age}</Text>



      {/* Chat Icons */}
      {(accepted || isCreatorOfAcceptedApplicant) && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
         
         
         {/* regular chat icon */}
         
          <TouchableOpacity onPress={() => Alert.alert('Open private chat')} style={styles.chatIconButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#007bff" />
          </TouchableOpacity>


          {/* WhatsApp chat */}

          {profile?.phone_number && (
            <TouchableOpacity
              onPress={() => {
                const phone = profile.phone_number.replace(/\D/g, '');
                const url = `https://wa.me/${phone}`;
                Linking.canOpenURL(url)
                  .then((supported) => {
                    if (supported) {
                      Linking.openURL(url);
                    } else {
                      Alert.alert("Error", "WhatsApp is not installed or phone number is invalid.");
                    }
                  });
              }}
              style={styles.chatIconButton}
            >
              <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
            </TouchableOpacity>
          )}
        </View>
      )}



      </View>


      { /* Average Rating */}
      {averageRating && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 6 }}>
          <Ionicons name="star" size={28} color="#fbc02d" />
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginLeft: 4 }}>{averageRating.toFixed(1)}</Text>
        </View>
      )}



      {/* XP + Level + Badge Row */}
      <RankBadgeSection
        level={userLevel}
        xp={userXP}
        badges={badges}
        userName={profile?.name}
        onPressSeeAll={() => setShowAllBadges(true)}
      />


{/*show Confetti if level increased*/}
      {showConfetti && (
        <ConfettiCannon
          count={100}
          origin={{ x: 200, y: 0 }}
          explosionSpeed={350}
          fallSpeed={3000}
          fadeOut
        />
        
      )}

      


{/* Bio */}

        <Text style={styles.bio}>{profile?.bio}</Text>

        {/* Social Links */}

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


        {/*specialists */}

        {specialists.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Specialty</Text>
            {specialists.map((specialist) => (
              <SpecialistShowCard key={specialist.id} specialist={specialist} />
            ))}
          </>
        )}



       


 {/* Completed Services Section */}

      <TouchableOpacity onPress={() => setShowCompletedServices(!showCompletedServices)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={styles.sectionTitle}>My Completed Services</Text>
        <Ionicons name={showCompletedServices ? 'chevron-up' : 'chevron-down'} size={20} style={{ marginLeft: 6 }} />
      </TouchableOpacity>


      {showCompletedServices && (
  <View style={{ maxHeight: 250, width: '100%' }}>
    <ScrollView
      showsVerticalScrollIndicator
      nestedScrollEnabled
    >
      {completedServices.length > 0 ? (
        completedServices.map(service => (
          <View key={service.id} style={[styles.completedServiceCard, styles.shadowCard]}>
            <Text style={styles.cardTitle}>{service.title}</Text>
            <Text>{service.location}</Text>
            <Text>{new Date(service.date_time_range[0]).toLocaleDateString()}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No completed services yet.</Text>
      )}
    </ScrollView>

{/* all badges */}

    <AllBadgesModal
      visible={showAllBadges}
      onClose={() => setShowAllBadges(false)}
      badges={badges}
    />



  </View>
)}


{/* Received Reviews Section */}  


      <TouchableOpacity onPress={() => setShowReviews(!showReviews)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={styles.sectionTitle}>Reviews About Me</Text>
        <Ionicons name={showReviews ? 'chevron-up' : 'chevron-down'} size={20} style={{ marginLeft: 6 }} />
      </TouchableOpacity>


  {showReviews && (
    <View style={{ maxHeight: 250, width: '100%' }}>
      <ScrollView
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        {receivedReviews.length > 0 ? (
          receivedReviews.map((review) => (
            <View key={review.id} style={[styles.reviewCard, styles.shadowCard]}>
              <View style={{ flexDirection: 'row' }}>
                {Array.from({ length: review.ranking }).map((_, i) => (
                  <Ionicons key={i} name="star" size={18} color="#fbc02d" />
                ))}
              </View>
              {review.info && <Text style={styles.reviewText}>{review.info}</Text>}
              <Text style={styles.reviewDate}>
                By: {review.reviewer_name} on {new Date(review.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.reviewDate}>
                Related service: {review.service}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No reviews received.</Text>
        )}
      </ScrollView>
    </View>
  )}
  


{/* Services Section */}


        <View style={styles.filterToggleContainer}>
        <TouchableOpacity
            style={[styles.filterButton, activeTab === 'request' && styles.filterButtonActive]}
            onPress={() => setActiveTab(activeTab === 'request' ? null : 'request')}
          >
            <Text style={styles.filterButtonText}>Show Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeTab === 'offer' && styles.filterButtonActive]}
            onPress={() =>  setActiveTab(activeTab === 'offer' ? null : 'offer')}
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
              refreshTrigger={refreshTrigger}
              setRefreshTrigger={setRefreshTrigger}
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

{/* confetti modal */}
      <Modal visible={showConfetti} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 16, elevation: 10 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}> 🎉 Leveled Up 🎉 </Text>
            <Text style={{ fontSize: 18, marginTop: 10, textAlign: 'center' }}> Keep going! </Text>
          </View>
        </View>
      </Modal>

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
  name: { fontSize: 26, fontWeight: 'bold', marginRight: 8 },
  age: { fontSize: 18, color: 'rgba(36,36,38,0.8)' },
  bio: { fontSize: 16, fontStyle: 'italic', marginBottom: 16, textAlign: 'center' },
  socialLinks: { flexDirection: 'row', marginTop: 16, justifyContent: 'center', width: '100%' },
  linkContainer: { paddingVertical: 12, paddingHorizontal: 20, marginHorizontal: 12, backgroundColor: '#ffffff', borderRadius: 30, borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  linkLogo: { color: '#007bff', fontSize: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 12, color: '#333' },
  noSpecialistsText: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 8 },
  chatButton: { marginTop: 20, backgroundColor: '#007bff', padding: 12, borderRadius: 8 },
  chatText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  backButton: { position: 'absolute', top: 60, left: 16, zIndex: 10, backgroundColor: '#f8f8f8', borderRadius: 30, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  error: { color: 'red', fontSize: 16 },

  nameAgeChatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  
  chatIconButton: {
    marginLeft: 8,
    padding: 4,
  },
  
  
  shadowCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  

  card: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    fontStyle: 'italic',
    color: 'gray',
  },
  reviewCard: {
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  reviewRating: {
    fontWeight: 'bold',
    color: '#fbc02d',
  },
  reviewText: {
    marginTop: 4,
    color: '#333',
  },
  reviewDate: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },


  completedServiceCard: {
    backgroundColor: '#e0f7e9', 
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#b2dfdb',
  },


  roundedButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    alignSelf: 'center',
  },
  roundedButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },


  filterToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
  },

  //filterButton: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8 },
  //filterButtonActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  //filterButtonText: { color: 'black' },

  filterButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14,
  },
  
  
  
  
});

export default ServiceUserProfileScreen;
