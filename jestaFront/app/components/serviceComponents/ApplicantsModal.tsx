import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

interface Applicant {
  user_id: number;
  username: string;
  applicant_state: string;
}

interface ApplicantsModalProps {
  visible: boolean;
  onClose: () => void;
  applicants: Applicant[];
}

export default function ApplicantsModal({
  visible,
  onClose,
  applicants,
}: ApplicantsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Applicants</Text>
          {applicants.length === 0 ? (
            <Text style={{ textAlign: 'center', marginVertical: 10 }}>No applicants yet.</Text>
          ) : (
            <FlatList
              data={applicants}
              keyExtractor={(item) => item.user_id.toString()}
              renderItem={({ item }) => (
                <View style={styles.applicantRow}>
                  <Text>{item.username}</Text>
                  <Text>Status: {item.applicant_state}</Text>
                </View>
              )}
            />
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: 'white' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    width: '90%',
    height: '60%',
    borderRadius: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  applicantRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
});
