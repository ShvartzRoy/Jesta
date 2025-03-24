import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import ApplicantsModal from './ApplicantsModal';
import EditServiceModal from './EditServiceModal';

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

//Format DateTime nicely
const formatDateTime = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr; //Invalid date
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export default function ServiceCard({
  service,
  user,
  openServiceModal,
  onUpdateService,
  onDeleteService,
}: {
  service: Service;
  user: any;
  openServiceModal: (service: Service) => void;
  onUpdateService?: (updatedService: Service) => void;
  onDeleteService: (id: number) => void;
}) {
  const serviceType = service.service_from === 'provider' ? 'Offer' : 'Request';
  const [isApplied, setIsApplied] = useState(
    service.applicants.some((applicant) => applicant.user_id === user.id)
  );
  const [applicantState, setApplicantState] = useState(() => {
    const userApplicant = service.applicants.find((applicant) => applicant.user_id === user.id);
    return userApplicant ? userApplicant.applicant_state : null;
  });

  const [applicantsVisible, setApplicantsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

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
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Service deleted!');
        onDeleteService(service.id); // Notify parent
      } else {
        Alert.alert('Error', 'Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      Alert.alert('Error', 'Error deleting service. Please try again.');
    }
  };

  //APPLY BUTTON
  const handleApply = async () => {
    try {
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
        Alert.alert('Success', 'You have applied successfully!');
        setIsApplied(true);
        setApplicantState('pending');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Failed to apply to the service:', error);
      Alert.alert('Error', 'Failed to apply to the service. Please try again.');
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

  return (
    <View
      style={{
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#001f3f',
      }}
    >
      <TouchableOpacity onPress={() => openServiceModal(service)}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{service.title}</Text>
        <Text>{service.description}</Text>
        <Text>Location: {service.location}</Text>
        <Text>
          {formatDateTime(service.date_time_range[0])} - {formatDateTime(service.date_time_range[1])}
        </Text>
        <Text>Duration: {parseDuration(service.estimated_duration)}</Text>
        <Text>Type: {serviceType}</Text>
        <Text>
          {service.offered_payment > 0
            ? `₪${service.offered_payment}`
            : service.is_volunteering
            ? 'Volunteering'
            : 'Free'}
        </Text>
        {renderApplicantStatus()}
      </TouchableOpacity>

      {/*Apply Button */}
      {service.user_id !== user.id && !isApplied && (
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

      {/*View Applicants Button */}
      {service.applicants.length > 0 && (
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

          <ApplicantsModal
            visible={applicantsVisible}
            onClose={() => setApplicantsVisible(false)}
            applicants={service.applicants}
          />
        </>
      )}

      {/*Edit & Delete Buttons */}
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
