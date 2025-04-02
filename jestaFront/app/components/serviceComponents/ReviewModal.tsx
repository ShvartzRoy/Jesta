import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  reviewedUserId: number | null;
  serviceId: number;
  user: { token: string };
  userId: number;
  onReviewSuccess: () => void;
}

export default function ReviewModal({
  visible,
  onClose,
  reviewedUserId,
  serviceId,
  user,
  userId,
  onReviewSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState('');
  const [info, setInfo] = useState('');
  const [existingReviewLoaded, setExistingReviewLoaded] = useState(false);

  


  
  useEffect(() => {
    let isMounted = true;
  
    if (visible && reviewedUserId && serviceId) {
      axios
        .get(
          `${process.env.EXPO_PUBLIC_HOST}/api/reviews/get_review_for_user_service?reviewed_user_id=${reviewedUserId}&service_id=${serviceId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        )
        .then((res) => {
          if (isMounted && res.data) {
            setRating(String(res.data.ranking));
            setInfo(res.data.info || '');
          }
        })
        .catch((err) => {
          console.log('No existing review or error:', err.response?.data || err.message);
          setRating('');
          setInfo('');
        });
    }
  
    return () => {
      isMounted = false;
    };
  }, [visible, reviewedUserId, serviceId]);
  


  const handleSubmit = async () => {
    if (!rating) return Alert.alert('Rating is required');
    try {
        await axios.post(
            `${process.env.EXPO_PUBLIC_HOST}/api/reviews/add_review`,
            {
              reviewed_user: reviewedUserId,
              service: serviceId, 
              ranking: parseInt(rating),
              info,
            },
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
          
          
      onClose();
      onReviewSuccess();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message;
      Alert.alert('Error', detail || 'Failed to submit review');
    }
    
  };

  

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Leave a Review</Text>
          

          <View style={{ flexDirection: 'row', marginBottom: 10, justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(String(star))}>
              <Ionicons
                name={Number(rating) >= star ? 'star' : 'star-outline'}                
                size={28}
                color="#FFD700"
                style={{ marginHorizontal: 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>


          <TextInput
            placeholder="Optional comment" //max 200 chars
            placeholderTextColor="black"
            multiline
            value={info}
            onChangeText={setInfo}
            maxLength={200}
            style={[styles.input, { height: 80 }]}
          />
          <View style={styles.buttons}>
            <TouchableOpacity onPress={handleSubmit}   style={[styles.submit, !rating && { backgroundColor: '#ccc' }]} disabled={!rating}><Text style={styles.text}>Submit</Text></TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.cancel}><Text style={styles.text}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000aa' },
  modal: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%' },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between' },
  submit: { backgroundColor: '#28a745', padding: 10, borderRadius: 6, width: '48%', alignItems: 'center' },
  cancel: { backgroundColor: '#dc3545', padding: 10, borderRadius: 6, width: '48%', alignItems: 'center' },
  text: { color: 'white', fontWeight: 'bold' },
});