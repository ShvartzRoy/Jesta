"use client";
import React, { useState, useEffect, createContext } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { normalizeCityName } from '../../hooks/cityUtils';



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


    const saveAuthToken = async (token) => {
    await SecureStore.setItemAsync("authToken", token);
  };

    const getAuthToken = async () => {
      return await SecureStore.getItemAsync("authToken");
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
  
      //console.log('Detected city:', city);
      console.log('Geocoding result:', place);
      console.log('Raw detected city:', city);
      const normalized = normalizeCityName(city);
      console.log('Normalized city:', normalized);

  
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
      //const token = expoPushToken;
      const token = await getAuthToken();

      const id = deviceId || getDeviceId();

      await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/logout`, {}, {
        headers: {
          'Expo-Push-Token': token,
          'Device-Id': id,
        },
        withCredentials: true,
      });

      await SecureStore.deleteItemAsync("authToken");
      setUser({ loggedIn: false, id: null });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

useEffect(() => {
  const initializeAuth = async () => {
    try {
      // 1. Get stored token if available
      const storedToken = await getAuthToken();

      // 2. Get user info using stored token
      const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
      });

      // 3. Save new auth token if it came in response (optional)
      if (response.data.token) {
        await saveAuthToken(response.data.token);
      }

      const id = getDeviceId();
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken && id) {
        await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/save_push_token`, {
          token: pushToken,
          device_id: id,
        });
      }

      setUser({
        loggedIn: true,
        id: response.data.id,
      });

      // 4. Use stored token to save detected city
      await getAndSaveUserCity(storedToken);
    } catch (error) {
      console.error("Auth initialization failed:", error);
      setUser({ loggedIn: false, id: null });
    }

    // 5. Then fetch saved city
    const city = await getUserCity();
    setUserCity(city);

    console.log("User city:", city);
  };

  initializeAuth();
}, []);



  const getUserCity = async () => {
    try {
      //const res = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_user_city`);

      const token = await getAuthToken();
      const res = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_user_city`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return res.data.city;
    } catch (err) {
      console.error("Failed to fetch user city:", err);
      return null;
    }
  };
  

  const refreshUserCity = async () => {
    try {
      const token = await getAuthToken();
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