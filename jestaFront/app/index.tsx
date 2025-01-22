import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { UserContext } from './contexts/authContext';
import { ProfileContext } from './contexts/profileContext';


const Index = () => {
  const { user } = useContext(UserContext); // Access user context
  const { profile } = useContext(ProfileContext); // Access profile context
  const router = useRouter();
  const [isReady, setIsReady] = useState(false); // Tracks when context is ready

  useEffect(() => {
    // Navigate based on user state after context is ready
    if (user.loggedIn != undefined) {
      if (user?.loggedIn) {
        router.replace('/explore_page');
      } else {
        router.replace('/register');
      }
    }
  }, [user, router]);

  // Show a loading indicator while waiting for context
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return null; // Component renders nothing as navigation handles the flow
};

export default Index;







// // index.tsx
// import React, { useEffect, useState } from "react";
// import { View, ActivityIndicator, StyleSheet } from "react-native";
// import { useRouter } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// export default function Index() {
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const checkUserSession = async () => {
//       try {
//         const userData = await AsyncStorage.getItem("user");
//         if (userData) {
//           // Navigate to explore_page if user is logged in
//           router.replace("/explore_page");
//         } else {
//           // Navigate to register screen if not logged in
//           router.replace("/register");
//         }
//       } catch (error) {
//         console.error("Error checking user session:", error);
//         router.replace("/register");
//       } finally {
//         setLoading(false);
//       }
//     };

//     checkUserSession();
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   return null; // Nothing is rendered because navigation will handle the rest.
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });