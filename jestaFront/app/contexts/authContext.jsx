"use client";
import React, { useState, useEffect, createContext } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Location from 'expo-location';



axios.defaults.withCredentials = true;

const UserContext = createContext();

const AuthContext = ({ children }) => {
  const [user, setUser] = useState({
    loggedIn: undefined, 
    id: null,
  });


  const [expoPushToken, setExpoPushToken] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  const [userCity, setUserCity] = useState(null);


  const getDeviceId = () => {
    const id = Device.osInternalBuildId || Device.deviceName || Constants.deviceName || Math.random().toString();
    setDeviceId(id);
    return id;
  };

  const getAndSaveUserCity = async (token) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }
  
      const location = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync(location.coords);
      
      const city = place.city || place.subregion || place.region;
      if (!city) return;
  
      console.log('Detected city:', city);
  
      await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/set_user_city`, 
        { city },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Failed to get/save location:', err);
    }
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
  
        const token = await registerForPushNotificationsAsync();
        const id = getDeviceId();
  
        if (token && id) {
          await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/save_push_token`, {
            token,
            device_id: id,
          });
        }
  
        setUser({
          loggedIn: true,
          id: response.data.id,
        });
  
        await getAndSaveUserCity(token); 
  
      } catch (error) {
        setUser({ loggedIn: false, id: null });
      }
  
      const city = await getUserCity(); 
      setUserCity(city);
  
      //await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/set_user_city`, { city });
  
      console.log("User city:", city);
    };
  
    initializeAuth();
  }, []);


  const getUserCity = async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_user_city`);
      return res.data.city;
    } catch (err) {
      console.error("Failed to fetch user city:", err);
      return null;
    }
  };
  

  const refreshUserCity = async () => {
    try {
      const token = expoPushToken; 
      if (!token) return;
      await getAndSaveUserCity(token);
  
      const updatedCity = await getUserCity(); 
      setUserCity(updatedCity);
    } catch (e) {
      console.error("Failed to refresh city manually:", e);
    }
  };
  
  

  return (
    <UserContext.Provider value={{ user, setUser, logoutUser, userCity, refreshUserCity }}>
    {children}
    </UserContext.Provider>
  );
};

export default AuthContext;
export { UserContext };