import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { UserContext } from '../../contexts/authContext';
import { useRouter } from 'expo-router';

const Menu = ({ onClose }) => {
  const { setUser } = useContext(UserContext);
  const { logoutUser } = useContext(UserContext);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutUser(); 
      router.replace('/register');
    } catch (error) {
      Alert.alert('Logout Failed', 'An error occurred while logging out. Please try again.');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: handleLogout },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.menuContainer}>
      <View style={styles.menu}>
        <TouchableOpacity onPress={() => router.replace('/edit_profile')} style={styles.menuItem}>
          <Text style={styles.menuText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmLogout} style={styles.menuItem}>
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: '#f9fafe', // Light blue background
    padding: 20,
    borderRadius: 16,
    width: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  menuItem: {
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#d6eaf8', 
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1d4ed8', 
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12, 
    backgroundColor: '#efd6f8', 
    borderRadius: 12,
    width: '70%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a', 
  },
});

export default Menu;
