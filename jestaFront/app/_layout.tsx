// _layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import AuthContext from './contexts/authContext';
import PContext from './contexts/profileContext';

const Layout = () => {
  return (
    <AuthContext>
      <PContext>
        <Slot />
      </PContext>
    </AuthContext>
  );
};

export default Layout;

// "use client"
// import React, { useState, useEffect, createContext } from 'react';
// import axios from 'axios';

// axios.defaults.withCredentials = true;

// // const CategoryContext = createContext();
// const UserContext = createContext();
// // const StoreProductsContext = createContext();
// // const searchContext = createContext();

// const AuthContext = ({ children }) => {
//   const [user, setUser] = useState({
//     loggedIn: undefined, // Set to undefined initially
//     userName: null,
//     id: null,
//     cart_id: null,
//   });

//   useEffect(() => {
//     axios.get(`${process.env.EXPO_PUBLIC_HOST}/user`, {
//       headers: { 'Content-Type': 'application/json' },
//       withCredentials: true
//     })
//       .then(response => {
//         const userData = response.data;
//         setUser({
//           loggedIn: true,
//           userName: userData.username,
//           id: userData.id,
//         });
//       })
//       .catch(error => {
//         setUser({
//           loggedIn: false,
//           userName: null,
//           id: null,
//         });
//         console.log('No logged in user');
//       });
//   }, []);


//   return (
//     <UserContext.Provider value={{ user, setUser }}>
//         {children}
//     </UserContext.Provider>
//   );
// };

// export default AuthContext;
// export { UserContext};



// import { Stack } from 'expo-router';

// export default function RootLayout() {
//   return (
//     // <Stack>
//     //   <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//     //   <Stack.Screen name="+not-found" />
//     // </Stack>
//   );
// }
