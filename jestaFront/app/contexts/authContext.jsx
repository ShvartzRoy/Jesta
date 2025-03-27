"use client";
import React, { useState, useEffect, createContext } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';


axios.defaults.withCredentials = true;

const UserContext = createContext();

const AuthContext = ({ children }) => {
  const [user, setUser] = useState({
    loggedIn: undefined, 
    id: null,
  });


  const [expoPushToken, setExpoPushToken] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  const getDeviceId = () => {
    const id = Device.osInternalBuildId || Device.deviceName || Constants.deviceName || Math.random().toString();
    setDeviceId(id);
    return id;
  };

  const registerForPushNotificationsAsync = async () => {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;

    setExpoPushToken(token);
    return token;
  };

  const logoutUser = async () => {
    try {
      const token = expoPushToken;
      const id = deviceId || getDeviceId();

      await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/logout`, {}, {
        headers: {
          'Expo-Push-Token': token,
          'Device-Id': id,
        },
        withCredentials: true,
      });

      setUser({ loggedIn: false, id: null });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/user`, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        });
        console.log("User response:", response.data);

        const token = await registerForPushNotificationsAsync();
        const id = getDeviceId();

        if (token && id) {
          console.log("Saving push token:", token, "device:", id);
          await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/save_push_token`, {
            token,
            device_id: id,
          });
        }
        

        setUser({
          loggedIn: true,
          id: response.data.id,
        });
      } catch (error) {
        setUser({ loggedIn: false, id: null });
      }
    };

    initializeAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default AuthContext;
export { UserContext };