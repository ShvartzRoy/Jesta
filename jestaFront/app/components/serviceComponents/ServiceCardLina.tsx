import React, { useState , useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import ApplicantsModal from './ApplicantsModal';
import EditServiceModal from './EditServiceModal';
import { Ionicons } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';




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

  const [isApplied, setIsApplied] = useState(
    service.applicants.some((applicant) => applicant.user_id === user.id)
  );
  const [applicantState, setApplicantState] = useState<string | null>(null);

  useEffect(() => {
    const updated = service.applicants.find((applicant) => applicant.user_id === user.id);
    setApplicantState(updated?.applicant_state || null);
  }, [service.applicants, user.id]);
  

  useEffect(() => {
    const fetchCreatorName = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST}/api/services/get_owner_name/${service.id}`
        );
        setCreatorName(response.data.name || 'Unknown');
      } catch (error) {
        console.error("Error fetching creator name:", error);
        setCreatorName('Unknown');
      }
    };
  
    fetchCreatorName();
  }, [service.id]);
  

  const [applicantsVisible, setApplicantsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  


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
        Your Status: {applicantState}
      </Text>
    );
  };

  //CONDITIONS:
  const userApplicant = service.applicants.find(applicant => applicant.user_id === user.id);
  const shouldShowApplyButton =
  service.service_from === 'publisher' &&
  !isApplied &&
  applicantState !== 'rejected' &&
  service.user_id !== user.id;

const shouldShowUnapplyButton =
  service.service_from === 'publisher' &&
  isApplied &&
  (applicantState === 'pending' || applicantState === 'accepted') &&
  service.user_id !== user.id;

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
        <TouchableOpacity onPress={() => openServiceModal(service)}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{service.title}</Text>
        <Text>{service.description}</Text>
        <Text>Location: {service.location}</Text>
        <Text>
          {formatDateTime(service.date_time_range[0])} - {formatDateTime(service.date_time_range[1])}
        </Text>
        <Text>Duration: {parseDuration(service.estimated_duration)}</Text>
        {!hideType && (
          <Text>Type: {serviceType}</Text>
        )}
        <Text>
          {service.offered_payment > 0
            ? `₪${service.offered_payment}`
            : service.is_volunteering
            ? 'Volunteering'
            : 'Free'}
        </Text>

        {!hideOwner && (
        <TouchableOpacity onPress={() => router.push(`/service_user_profile/${service.user_id}`)}>
          <Text style={{ color: '#007AFF', marginTop: 4 }}>
            Created by: {creatorName}
          </Text>
        </TouchableOpacity>
      )}


        {renderApplicantStatus()}
      </TouchableOpacity>


       {/*Heart Icon*/}
       {!hideSave && (
      <TouchableOpacity
        style={{ position: 'absolute', top: 10, right: 10 }}
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

      {/*Apply Button*/}
      {shouldShowApplyButton && (
        <TouchableOpacity
          style={{
            marginTop: 10,
            backgroundColor: '#007AFF',
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
          }}
          onPress={handleApply}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Apply</Text>
        </TouchableOpacity>
      )}

      {shouldShowUnapplyButton && (
        <TouchableOpacity
          style={{
            marginTop: 10,
            backgroundColor: '#FFA500',
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
          }}
          onPress={handleUnapply}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Unapply</Text>
        </TouchableOpacity>
      )}

      


      {/*View Applicants Button*/}
      {service.service_from === 'publisher' &&
          service.user_id === user.id &&
          service.applicants.length > 0 && (
        <>
            <TouchableOpacity
            style={{
                marginTop: 10,
                backgroundColor: '#28a745',
                padding: 10,
                borderRadius: 5,
                alignItems: 'center',
            }}
            onPress={() => setApplicantsVisible(true)}
            >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>View Applicants</Text>
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
            />



        </>
        )}

      {/*Edit & Delete*/}
      {service.user_id === user.id && (
        <>
          <TouchableOpacity
            style={{
              marginTop: 10,
              backgroundColor: '#FFA500',
              padding: 10,
              borderRadius: 5,
              alignItems: 'center',
            }}
            onPress={() => setEditVisible(true)}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Edit Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              marginTop: 10,
              backgroundColor: '#dc3545',
              padding: 10,
              borderRadius: 5,
              alignItems: 'center',
            }}
            onPress={confirmDelete}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete Service</Text>
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
    </View>
  );
}
