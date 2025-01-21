"use client";
import React, { useState, useEffect, createContext } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

axios.defaults.withCredentials = true;

const UserContext = createContext();

const AuthContext = ({ children }) => {
  const [user, setUser] = useState({
    loggedIn: undefined, // Initial state as undefined
    id: null,
  });

  useEffect(() => {
    console.log("Im right here!");
    const initializeAuth = async () => {
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/user`, {
          headers: {"Content-Type": "application/json"},
          withCredentials: true
        });
        console.log("User response:", response.data);
        setUser({
          loggedIn: true,
          id: response.data.id,
        });
      } catch (error) {
        console.error("Error validating user:", error);
        setUser({ loggedIn: false, id: null});
      }
    };

    initializeAuth();
  }, []);

  return <UserContext.Provider value={{ user, setUser}}>{children}</UserContext.Provider>;
};

export default AuthContext;
export { UserContext };
