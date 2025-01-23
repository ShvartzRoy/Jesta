import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { UserContext } from '../../contexts/authContext';
import { useRouter } from 'expo-router';

const Menu = ({ onClose }) => {
  const { setUser } = useContext(UserContext);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/logout`); // Adjust the endpoint if necessary
      setUser({loggedIn: false, id: null}); // Clear user context
      router.replace('/register');
    } catch (error) {
      Alert.alert('Logout Failed', 'An error occurred while logging out. Please try again.');
    }
  };

  return (
    <View style={styles.menuContainer}>
      <View style={styles.menu}>
        <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/edit_profile')} style={styles.menuItem}>
          <Text style={styles.menuText}>Edit Profile</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    width: 250,
    alignItems: 'center',
  },
  menuItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
    width: '100%',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ddd',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default Menu;
