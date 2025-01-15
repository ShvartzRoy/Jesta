"use client"
import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

// const CategoryContext = createContext();
const UserContext = createContext();
// const StoreProductsContext = createContext();
// const searchContext = createContext();

const AuthContext = ({ children }) => {
  const [user, setUser] = useState({
    loggedIn: undefined, // Set to undefined initially
    userName: null,
    id: null,
    cart_id: null,
  });

  useEffect(() => {
    axios.get(`${process.env.EXPO_PUBLIC_HOST}/user`, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    })
      .then(response => {
        const userData = response.data;
        setUser({
          loggedIn: true,
          userName: userData.username,
          id: userData.id,
        });
      })
      .catch(error => {
        setUser({
          loggedIn: false,
          userName: null,
          id: null,
        });
        console.log('No logged in user');
      });
  }, []);


  return (
    <UserContext.Provider value={{ user, setUser }}>
        {children}
    </UserContext.Provider>
  );
};

export default AuthContext;
export { UserContext};
