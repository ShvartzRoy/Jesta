import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { badgeDetails } from '../../../hooks/badgeUtils';

const AllBadgesModal = ({ visible, onClose, badges }: {
  visible: boolean;
  onClose: () => void;
  badges: { name: string }[] 
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>My Badges</Text>

          <ScrollView style={{ maxHeight: 300 }}>
            {badges.map((badgeObj) => {
                const badge = badgeDetails[badgeObj.name];
                if (!badge) return null;

                return (
                    <View key={badgeObj.name} style={styles.badgeRow}>
                    <FontAwesomeIcon icon={badge.icon} size={24} />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.badgeName}>{badgeObj.name}</Text>
                        <Text style={styles.badgeDescription}>{badge.description}</Text>
                    </View>
                    </View>
                );
                })
                }
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgeName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#555',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default AllBadgesModal;
