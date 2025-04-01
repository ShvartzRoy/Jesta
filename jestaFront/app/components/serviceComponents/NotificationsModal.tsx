import React, { useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert
} from 'react-native';
import axios from 'axios';
import { SwipeListView } from 'react-native-swipe-list-view';
import { FontAwesome } from '@expo/vector-icons';
import { useNotification } from '../../contexts/notificationContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const NotificationsModal = forwardRef(({ visible, onClose }, ref) => {
  const [fetchedNotifications, setFetchedNotifications] = useState([]);
  const { liveNotifications, removeLiveNotification } = useNotification();
  const [combinedNotifications, setCombinedNotifications] = useState([]);


  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/notifications/get_unread`);
      setFetchedNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshNotifications: fetchNotifications,
  }));

  useEffect(() => {
    if (visible) {
      fetchNotifications();
      setFetchedNotifications([]);
    }
  }, [visible]);
  
  useEffect(() => {
    const merged = [
      ...liveNotifications,
      ...fetchedNotifications.filter(
        (n) => !liveNotifications.some((live) => live.id === n.id)
      ),
    ];
    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setCombinedNotifications(merged);
  }, [liveNotifications, fetchedNotifications]);
  
  useEffect(() => {
    if (!visible) return;
  
    const interval = setInterval(() => {
      fetchNotifications();
    }, 3000); //every 3 seconds
  
    return () => clearInterval(interval);
  }, [visible]);
  
  
  const markAsRead = async (id) => {
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/notifications/mark_as_read/${id}`);
      setFetchedNotifications((prev) => prev.filter((n) => n.id !== id));
      removeLiveNotification(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // const combinedNotifications = useMemo(() => {
  //   const merged = [
  //     ...liveNotifications,
  //     ...fetchedNotifications.filter(
  //       (n) => !liveNotifications.some((live) => live.id === n.id)
  //     ),
  //   ];
  //   return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  // }, [fetchedNotifications, liveNotifications]);

  const renderItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.readButton}
        onPress={() => markAsRead(item.id)}
      >
        <FontAwesome name="check" size={18} color="white" />
        <Text style={styles.readText}>Read</Text>
      </TouchableOpacity>
    </View>
  );

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/notifications/mark_all_as_read`);
      setFetchedNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      Alert.alert("Error", "Could not mark all as read.");
    }
  };
  

  

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.header}>Unread Notifications</Text>
          <SwipeListView
            data={combinedNotifications}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderItem}
            renderHiddenItem={renderHiddenItem}
            rightOpenValue={-75}
            disableRightSwipe
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
     


            <TouchableOpacity
            onPress={() => {
                Alert.alert(
                "Mark All as Read",
                "Are you sure you want to mark all notifications as read?",
                [
                    {
                    text: "Cancel",
                    style: "cancel",
                    },
                    {
                    text: "Yes",
                    onPress: handleMarkAllAsRead,
                    style: "destructive",
                    },
                ]
                );
            }}
            style={styles.markAllButton}
            >
            <Text style={styles.markAllText}>Mark All as Read</Text>
            </TouchableOpacity>


            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
            </View>

        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { backgroundColor: 'white', width: '90%', maxHeight: SCREEN_HEIGHT * 0.7, borderRadius: 20, padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  notificationItem: { backgroundColor: '#f9f9f9', padding: 12, borderBottomWidth: 1, borderColor: '#eee', borderRadius: 8, minHeight: 80, justifyContent: 'center' },
  title: { fontWeight: 'bold', fontSize: 16 },
  body: { fontSize: 14, color: '#333' },
  date: { fontSize: 12, color: '#888', marginTop: 4 },
  rowBack: { alignItems: 'center', justifyContent: 'flex-end', flex: 1, flexDirection: 'row', paddingRight: 5, marginBottom: 10, minHeight: 80, backgroundColor: 'transparent', borderRadius: 8 },
  readButton: { backgroundColor: '#28a745', width: 75, height: '100%', alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  readText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  closeButton: { marginTop: 10, alignSelf: 'center' },
  closeText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },

  clearButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },


  markAllButton: {
    marginTop: 10,
    marginRight: 10, 
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  
  
  markAllText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  
});

export default NotificationsModal;
