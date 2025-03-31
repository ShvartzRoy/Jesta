import React, { useState , useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Image, Modal, FlatList } from 'react-native';
import axios from 'axios';
import ApplicantsModal from './ApplicantsModal';
import EditServiceModal from './EditServiceModal';
import { Ionicons } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import ReviewModal from './ReviewModal';

const styles = StyleSheet.create({
  actionButton: {
    padding: 10,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});





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


const parseDuration = (duration: string) => {
  if (!duration || typeof duration !== 'string') return 'No duration available';

  const regex = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  const match = duration.match(regex);

  if (!match) return 'Invalid duration';

  const [_, days, hours, minutes, seconds] = match.map((value) => (value ? parseInt(value) : 0));

  let result = [];
  if (days) result.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours) result.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes) result.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds) result.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

  return result.length > 0 ? result.join(', ') : '0 minutes';
};

//format DateTime nicely
const formatDateTime = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export default function ServiceCard({
  service,
  user,
  openServiceModal,
  onUpdateService,
  onDeleteService,
  isSaved,
  toggleSave,
  fetchServices,
  hideOwner = false,
  hideType = false,
  hideSave = false,
  
}: {
  service: Service;
  user: any;
  openServiceModal: (service: Service) => void;
  onUpdateService?: (updatedService: Service) => void;
  onDeleteService: (id: number) => void;
  isSaved: boolean;
  toggleSave: (serviceId: number) => void;
  fetchServices: () => Promise<void>;
  hideOwner?: boolean;
  hideType?: boolean;
  hideSave?: boolean; 


  
}) {


  const serviceType = service.service_from === 'provider' ? 'Offer' : 'Request';

  const router = useRouter();
  const [creatorName, setCreatorName] = useState<string>('Loading...');
  const [creatorImage, setCreatorImage] = useState<string | null>(null);


  const [isApplied, setIsApplied] = useState(
    service.applicants.some((applicant) => applicant.user_id === user.id)
  );
  const [applicantState, setApplicantState] = useState<string | null>(null);

  const [descriptionVisible, setDescriptionVisible] = useState(false);


  useEffect(() => {
    const updated = service.applicants.find((applicant) => applicant.user_id === user.id);
    setApplicantState(updated?.applicant_state || null);
  }, [service.applicants, user.id]);
  

  useEffect(() => {
    const fetchCreatorName = async () => {
      try {
        const response = await axios.get(
          //`${process.env.EXPO_PUBLIC_HOST}/api/services/get_owner_name/${service.id}`
          `${process.env.EXPO_PUBLIC_HOST}/api/services/get_owner_profile/${service.id}`
        );
        setCreatorName(response.data.name || 'Unknown');
        setCreatorImage(response.data.image || null);
        } catch (error) {
        console.error("Error fetching creator name:", error);
        setCreatorName('Unknown');
        setCreatorImage(null);

      }
    };
  
    fetchCreatorName();
  }, [service.id]);


  



  const [applicantsVisible, setApplicantsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
  const [showApplicantsForReview, setShowApplicantsForReview] = useState(false);

  const [hasReviewed, setHasReviewed] = useState(false);

  const isCompleted = service.state === 'completed';

  



  useEffect(() => {
    if (isCompleted && service.user_id !== user.id && applicantState === 'accepted') {
      axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/reviews/check_review_exists?reviewed_user_id=${service.user_id}&service_id=${service.id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      .then((res) => {
        setHasReviewed(res.data.already_reviewed);
      })
      .catch((err) => {
        console.log('Review check error:', err.response?.data || err.message);
      });
    }
  }, [isCompleted, applicantState, service.id, user.id]);
  






  const [hasReviewedApplicantIds, setHasReviewedApplicantIds] = useState<number[]>([]);
  useEffect(() => {
    if (showApplicantsForReview && isCompleted) {
      axios
        .get(`${process.env.EXPO_PUBLIC_HOST}/api/reviews/get_written_reviews/${user.id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        })
        .then((res) => {
          console.log("Fetched reviews:", res.data); 
          const reviewedIds = res.data
            .filter((r: any) => r.service === service.id)
            .map((r: any) => r.reviewed_user); 
  
          console.log("Reviewed user IDs:", reviewedIds);
          setHasReviewedApplicantIds(reviewedIds);
        })
        .catch((err) => {
          console.error('Error fetching reviewed applicants:', err.response?.data || err.message);
        });
    }
  }, [showApplicantsForReview]);
  


  




  const [acceptedApplicants, setAcceptedApplicants] = useState<any[]>([]);

  useEffect(() => {
    if (isCompleted) {
      axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_all_accepted_applicants/${service.id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      ).then(res => {
        setAcceptedApplicants(res.data);
      }).catch(err => {
        console.error("Error fetching accepted applicants:", err.response?.data || err.message);
      });
    }
  }, [isCompleted, service.id]);


  const markServiceAsCompleted = async () => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/mark_service_completed/${service.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
  
      if (response.status === 200) {
        Alert.alert("Marked as Completed");

        fetchServices();
      } else {
        Alert.alert("Error", "Failed to mark service as completed");
      }
    } catch (error) {
      console.error("Error marking completed:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };
  
  
  const handleShare = async () => {
    try {
      console.log("Fetching share info for service:", service.id);
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_service_info_for_sharing/${service.id}`
      );
  
      console.log("Raw share info response:", response);
  
      const data = response.data;
      console.log("Parsed data:", data);
  
      const shareData = {
        title: data["title"],
        description: data["description"],
        location: data["location"],
        date_time_range: data["date time range"] || ["", ""],
        estimated_duration: data["estimated duration"] || "",
        offered_payment: parseFloat(data["offered payment"]) || 0,
        tags: data["tags"] || [],
      };
  
      console.log("Processed share data:", shareData);
  
      const shareMessage = `
  👤 ${data.shared_by} wants to share this service with you via Jesta:

  📌 ${shareData.title}
  📍 Location: ${shareData.location}
  🕒 ${formatDateTime(shareData.date_time_range[0])} - ${formatDateTime(shareData.date_time_range[1])}
  ⏱️ Duration: ${parseDuration(shareData.estimated_duration)}
  💰 ${shareData.offered_payment > 0 ? `₪${shareData.offered_payment}` : service.is_volunteering ? 'Volunteering' : 'Free'}
  🏷️ Tags: ${shareData.tags.join(', ')}
  
  📝 ${shareData.description}

  🔗 Shared via the *Jesta* App — find more local services near you!

  `;
  
      console.log("Final share message:", shareMessage);
  
      await Share.share({ message: shareMessage.trim() });
    } catch (error) {
      console.error("Error sharing service:", error);
      Alert.alert("Error", "Could not share service info.");
    }
  };
  
  

  const handleServiceUpdate = (updatedService: Service) => {
    const updatedUserApplicant = updatedService.applicants.find(app => app.user_id === user.id);
    setApplicantState(updatedUserApplicant?.applicant_state || null);
    setIsApplied(!!updatedUserApplicant);
  
    if (onUpdateService) {
      onUpdateService(updatedService);
    }
  };
  

  //DELETE SERVICE
  const confirmDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete() },
      ]
    );
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/delete_service/${service.id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Service deleted!');
        onDeleteService(service.id);
      } else {
        Alert.alert('Error', 'Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      Alert.alert('Error', 'Error deleting service. Please try again.');
    }
  };

  //APPLY
  const handleApply = async () => {
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/apply_to_service/${service.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'You have applied successfully!');
        setIsApplied(true);
        setApplicantState('pending');
        await fetchServices();
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Failed to apply:', error);
      Alert.alert('Error', 'Failed to apply. Please try again.');
    }
  };

  //UNAPPLY
    const handleUnapply = async () => {
        try {
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
            Alert.alert('Success', 'You have unapplied successfully!');
            setIsApplied(false); //reset state
            setApplicantState(null); //reset applicant state
            await fetchServices();
            
          } else {
            Alert.alert('Error', 'Something went wrong. Please try again.');
          }
        } catch (error) {
          console.error('Failed to unapply:', error);
          Alert.alert('Error', 'Failed to unapply. Please try again.');
        }
      };
      

  const renderApplicantStatus = () => {
    if (!isApplied) return null;

    let statusColor;
    switch (applicantState) {
      case 'accepted':
        statusColor = 'green';
        break;
      case 'rejected':
        statusColor = 'red';
        break;
      case 'pending':
      default:
        statusColor = 'blue';
        break;
    }

    return (
      <Text style={{ color: statusColor, fontWeight: 'bold', marginTop: 10 }}>
        Your Application Status: {applicantState}
      </Text>
    );
  };

  //CONDITIONS:
  const userApplicant = service.applicants.find(applicant => applicant.user_id === user.id);
  const shouldShowApplyButton =
  service.service_from === 'publisher' &&
  !isApplied &&
  applicantState !== 'rejected' &&
  service.user_id !== user.id &&
  !isCompleted;

const shouldShowUnapplyButton =
  service.service_from === 'publisher' &&
  isApplied &&
  (applicantState === 'pending' || applicantState === 'accepted') &&
  service.user_id !== user.id &&
  !isCompleted;

  return (
<View style={{ 
  backgroundColor: 'white', 
  borderRadius: 16, 
  padding: 16, 
  marginBottom: 12, 
  width: '100%',
  minHeight: 160,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
}}>
  
    <TouchableOpacity onPress={() => setDescriptionVisible(true)}>
          
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <View style={{
          backgroundColor: service.service_from === 'provider' ? '#4CAF50' : '#FFC107',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          marginRight: 8,
          minWidth: 70,
          alignItems: 'center'
        }}>
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>
            {service.service_from === 'provider' ? 'OFFER' : 'REQUEST'}
          </Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', flexShrink: 1 }}>{service.title}</Text>
      </View>




        <View style={{ marginTop: 6 }}>
        <Text style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          📍 <Text>Location: {service.location}</Text>
        </Text>
        <Text style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          🗓️ <Text>{formatDateTime(service.date_time_range[0])} - {formatDateTime(service.date_time_range[1])}</Text>
        </Text>
        {parseDuration(service.estimated_duration) !== '0 minutes' &&
          !service.estimated_duration.includes('P0DT0H0M') && (
            <Text style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              ⏱️ Duration: {parseDuration(service.estimated_duration)}
            </Text>
          )}

      </View>

        
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: service.offered_payment > 0
          ? '#2E7D32'
          : service.is_volunteering
          ? '#00bcd4'
          : '#555',
        marginTop: 8,
      }}>
        {service.offered_payment > 0
          ? `₪${service.offered_payment}`
          : service.is_volunteering
          ? 'Volunteering'
          : 'Free'}
      </Text>


      <Text style={{ marginTop: 4, fontWeight: 'bold', color: isCompleted ? 'green' : 'orange' }}>
        Service Status: {isCompleted ? 'Completed' : 'Ongoing'}
      </Text>



        {!hideOwner && (
        <TouchableOpacity onPress={() => router.push(`/service_user_profile/${service.user_id}`)}>
         <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            {creatorImage ? (
              <Image
                source={{ uri: creatorImage }}
                style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
                />
            ) : (
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#ccc',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 8,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>👤</Text>
              </View>
            )}
            <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>
              Created by: {creatorName}
            </Text>
          </View>


        </TouchableOpacity>
      )}


      </TouchableOpacity>


      <TouchableOpacity
      style={{ position: 'absolute', top: 10, right: 10  , margingBottom: 10}}
      onPress={handleShare}
    >
      <Ionicons name="share-social-outline" size={22} color="#007AFF" />
    </TouchableOpacity>


       {/*Heart Icon*/}
       {!hideSave && (
      <TouchableOpacity
        style={{ position: 'absolute', top: 10, right: 10, marginTop: 40 }}
        onPress={() => toggleSave(service.id)}
      >
        <Ionicons name={isSaved ? "heart" : "heart-outline"} size={24} color={isSaved ? 'red' : 'gray'} />
      </TouchableOpacity>
       )}


      {/*Tags*/}
      {service.tags && service.tags.filter(tag => tag.trim() !== '').length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {service.tags
            .filter(tag => tag.trim() !== '')
            .map((tag: string, index: number) => (
              <View
                key={index}
                style={{
                  backgroundColor: '#007AFF',
                  borderRadius: 15,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  marginRight: 5,
                  marginBottom: 5,
                }}
              >
                <Text style={{ color: 'white' }}>{tag}</Text>
              </View>
            ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>


        
        {/* Apply */}
        {shouldShowApplyButton && (

          <TouchableOpacity style={styles.actionButton} onPress={handleApply}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle-outline"  size={22} color="#007AFF" />
            <Text style={{ marginLeft: 6, color: '#007AFF', fontWeight: 'bold' }}>Apply</Text>
            </View>

          </TouchableOpacity>

        )}


        {/* Unapply */}
        {shouldShowUnapplyButton && (
          <TouchableOpacity style={styles.actionButton} onPress={handleUnapply}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="close-circle-outline" size={22} color="#FF5722" />
            <Text style={{ marginLeft: 6, color: '#FF5722', fontWeight: 'bold' }}>Unapply</Text>
            </View>
          </TouchableOpacity>
        )}



   {/*View Applicants Button*/}
   {service.service_from === 'publisher' &&
          service.user_id === user.id &&
          service.applicants.length > 0 && (
        <>
          <TouchableOpacity style={styles.actionButton} onPress={() => setApplicantsVisible(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="people-outline" size={22} color="#28a745" />
            <Text style={{ marginLeft: 6, color: '#28a745', fontWeight: 'bold' }}>Applicants</Text>
            </View>

          </TouchableOpacity>

            {/*Updated ApplicantsModal Integration*/}
            <ApplicantsModal
              visible={applicantsVisible}
              onClose={() => setApplicantsVisible(false)}
              applicants={service.applicants}
              serviceId={service.id}
              user={user}
              onApplicantChange={fetchServices}
              onServiceUpdate={(updatedService) => {
                setApplicantState(() => {
                  const updatedApplicant = updatedService.applicants.find(
                    (a: any) => a.user_id === user.id
                  );
                  return updatedApplicant?.applicant_state || null;
                });
                
                if (onUpdateService) {
                  onUpdateService(updatedService);
                }
              }}
              isCompleted={isCompleted}
            />



        </>
        )}


        {/* Mark as Completed */}
        {service.user_id === user.id && !isCompleted && (
          <TouchableOpacity style={styles.actionButton} onPress={markServiceAsCompleted}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-done-outline" size={22} color="#6c63ff" />
            <Text style={{ marginLeft: 6, color: '#6c63ff', fontWeight: 'bold' }}>Complete</Text>
            </View>
          </TouchableOpacity>
        )}


        {/* Leave Review */}
        {isCompleted && (
     
      (
        (service.user_id === user.id && service.applicants.some((a) => a.applicant_state === 'accepted')) ||
        (service.user_id !== user.id && applicantState === 'accepted')
      ) && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (service.user_id === user.id) {
              setShowApplicantsForReview(true);
            } else {
              setSelectedApplicantId(service.user_id);
              setReviewModalVisible(true);
            }
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name={service.user_id !== user.id && hasReviewed ? "checkmark-circle-outline" : "star-outline"}
            size={22}
            color={service.user_id !== user.id && hasReviewed ? "green" : "#FFA500"}
          />
          <Text style={{
            marginLeft: 6,
            color: service.user_id !== user.id && hasReviewed ? "green" : "#FFA500",
            fontWeight: 'bold',
          }}>
            {service.user_id !== user.id && hasReviewed ? "Reviewed" : "Review"}
          </Text>
            
          </View>
        </TouchableOpacity>
      )
    )}
  
  
          {/* Save */}



        {/* Edit */}
        {service.user_id === user.id && !isCompleted && (
          <>
          <TouchableOpacity style={styles.actionButton} onPress={() => setEditVisible(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="create-outline" size={22} color="#FFA500" />
            <Text style={{ marginLeft: 6, color: '#FFA500', fontWeight: 'bold' }}>Edit</Text>
            </View>
          </TouchableOpacity>
          <EditServiceModal
            visible={editVisible}
            onClose={() => setEditVisible(false)}
            service={service}
            user={user}
            onSave={onUpdateService}
          />
        </>
        )}


        {/* Delete */}
        {service.user_id === user.id && (
          <TouchableOpacity style={styles.actionButton} onPress={confirmDelete}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="trash-outline" size={22} color="#dc3545" />
            <Text style={{ marginLeft: 6, color: '#dc3545', fontWeight: 'bold' }}>Delete</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>




      {descriptionVisible && (
        <Modal
          transparent
          animationType="slide"
          visible={descriptionVisible}
          onRequestClose={() => setDescriptionVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 10,
              padding: 20,
              width: '85%',
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                Description
              </Text>
              <Text style={{ marginBottom: 10 }}>
                {service.description || 'No description available.'}
              </Text>

              {/*Application Status*/}
              {renderApplicantStatus()}

              <TouchableOpacity
                style={{ marginTop: 10, backgroundColor: '#007AFF', padding: 10, borderRadius: 5, alignItems: 'center' }}
                onPress={() => setDescriptionVisible(false)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}


      {/* Creator selecting from applicants to review */}
      <Modal
        visible={showApplicantsForReview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApplicantsForReview(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            width: '85%',
            maxHeight: '60%',
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Select Applicant to Review</Text>
            <FlatList

              //data={service.applicants.filter(a => a.applicant_state === 'accepted')}
              data={acceptedApplicants}

              keyExtractor={(item) => item.user_id.toString()}
              
              renderItem={({ item }) => {
                const displayName = item.name || item.email || 'Unknown Applicant';
                const hasReviewed = hasReviewedApplicantIds.includes(item.user_id);
              
                return (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#f9f9f9',
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: '#ddd',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    onPress={() => {
                      setSelectedApplicantId(item.user_id);
                      setShowApplicantsForReview(false);
                      setReviewModalVisible(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 16, color: '#333', fontWeight: 'bold' }}>
                      {displayName}
                    </Text>
                    {hasReviewed && (
                      <Ionicons name="checkmark-circle" size={20} color="green" style={{ marginLeft: 10 }} />
                    )}
                  </View>

                  </TouchableOpacity>
                );
              }}
              




            />
            <TouchableOpacity
              onPress={() => setShowApplicantsForReview(false)}
              style={{
                marginTop: 10,
                backgroundColor: '#dc3545',
                padding: 10,
                borderRadius: 6,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <ReviewModal
        key={`${selectedApplicantId}-${service.id}`}
        visible={reviewModalVisible}
        onClose={() => {
          setReviewModalVisible(false);
          //setSelectedApplicantId(null);
        }}
        reviewedUserId={selectedApplicantId}
        serviceId={service.id}
        user={user}
        onReviewSuccess={() => {
          Alert.alert("Thank you!", "Your review has been submitted.");
          setHasReviewedApplicantIds((prev) => [...prev, selectedApplicantId!]); 
        }}
      />



    </View>
  );
}
