import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import axios from 'axios';

export default function ApplicantsModal({
  visible,
  onClose,
  applicants,
  serviceId,
  user,
  onApplicantChange,
  onServiceUpdate, 
  isCompleted = false,
}: {
  visible: boolean;
  onClose: () => void;
  applicants: any[];
  serviceId: number;
  user: any;
  onApplicantChange: () => void;
  onServiceUpdate: (updatedService: any) => void; 
  isCompleted?: boolean;
}) {
  const [applicantList, setApplicantList] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileVisible, setProfileVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchApplicants();
    }
  }, [visible]);

  const fetchApplicants = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_list_of_applicants_with_their_states/${serviceId}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const applicantsDict = response.data || {};
      const applicantsArray = Object.entries(applicantsDict).map(([email, status]) => ({
        email,
        status,
      }));
      setApplicantList(applicantsArray);
    } catch (error) {
      console.error('Error fetching applicants:', error.response?.data || error.message);
      Alert.alert('Error', 'Unable to fetch applicants.');
    }
  };

  const handleAccept = async (email: string) => {
    try {
      const encodedEmail = encodeURIComponent(email);
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_user_id_by_email/${encodedEmail}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const user_id = response.data["user_id"];
      await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/accept_applicant/${serviceId}/${user_id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      Alert.alert("Success", "Applicant accepted!");
      fetchApplicants();
      onApplicantChange();

      const updatedServiceRes = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_service/${serviceId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      onServiceUpdate(updatedServiceRes.data); 
    } catch (error) {
      console.error('Error accepting applicant:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to accept applicant.');
    }
  };

  const handleReject = async (email: string) => {
    try {
      const encodedEmail = encodeURIComponent(email);
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_user_id_by_email/${encodedEmail}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const user_id = response.data["user_id"];
      await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/reject_applicant/${serviceId}/${user_id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      Alert.alert("Success", "Applicant rejected!");
      fetchApplicants();
      onApplicantChange();

      const updatedServiceRes = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_service/${serviceId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      onServiceUpdate(updatedServiceRes.data); 
    } catch (error) {
      console.error('Error rejecting applicant:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to reject applicant.');
    }
  };

  const openProfile = async (email: string) => {
    try {
      const encodedEmail = encodeURIComponent(email);
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_user_id_by_email/${encodedEmail}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const user_id = response.data["user_id"];
      const profileResponse = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user_id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSelectedProfile(profileResponse.data);
      setProfileVisible(true);
    } catch (error) {
      console.error('Error fetching profile:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load profile.');
    }
  };

  const renderApplicant = ({ item }: { item: any }) => (
    <View
      style={{
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10,
      }}
    >
      <Text
        style={{ fontWeight: 'bold', color: '#007AFF', marginBottom: 5 }}
        onPress={() => openProfile(item.email)}
      >
        Email: {item.email}
      </Text>
      <Text style={{ marginBottom: 5 }}>
        Status:{' '}
        <Text
          style={{
            color:
              item.status === 'accepted'
                ? 'green'
                : item.status === 'rejected'
                ? 'red'
                : 'blue',
          }}
        >
          {item.status}
        </Text>
      </Text>

      {isCompleted && (
      <Text style={{ fontStyle: 'italic', color: 'gray', marginTop: 4 }}>
          This service is completed — applicants can no longer be accepted or rejected.
        </Text>
      )}


      {item.status === 'pending' && !isCompleted &&(
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={{ backgroundColor: '#28a745', padding: 8, borderRadius: 5 }}
            onPress={() => handleAccept(item.email)}
          >
            <Text style={{ color: 'white' }}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#dc3545', padding: 8, borderRadius: 5 }}
            onPress={() => handleReject(item.email)}
          >
            <Text style={{ color: 'white' }}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Applicants</Text>

          <FlatList
            data={applicantList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderApplicant}
          />

          <TouchableOpacity
            style={{
              marginTop: 15,
              backgroundColor: '#f94449',
              padding: 10,
              borderRadius: 5,
              alignItems: 'center',
            }}
            onPress={onClose}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Modal */}
      <Modal visible={profileVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%' }}>
            {selectedProfile ? (
              <>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Profile Details</Text>
                <Text>Name: {selectedProfile.name || 'N/A'}</Text>
                <Text>Age: {selectedProfile.age || 'N/A'}</Text>
                <Text>Bio: {selectedProfile.bio || 'N/A'}</Text>
                {selectedProfile.facebook && <Text>Facebook: {selectedProfile.facebook}</Text>}
                {selectedProfile.linkedin && <Text>LinkedIn: {selectedProfile.linkedin}</Text>}
                {selectedProfile.instagram && <Text>Instagram: {selectedProfile.instagram}</Text>}
              </>
            ) : (
              <Text>Loading profile...</Text>
            )}
            <TouchableOpacity
              style={{ marginTop: 15, backgroundColor: '#007AFF', padding: 10, borderRadius: 5, alignItems: 'center' }}
              onPress={() => setProfileVisible(false)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
