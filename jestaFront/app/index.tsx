import { View, Text } from 'react-native'
import React, {useContext} from 'react'
import { Link } from 'expo-router'
import RegisterScreen from './(authentication)/register'
import Explore_Page from './(tabs)/(explore_page)/explore_page'
import { UserContext } from "./authContext";

const index = () => {
  const {user,setUser} = useContext(UserContext);
  return (
    <div>
      {user.loggedIn && <Explore_Page/>}
      {!user.loggedIn && <RegisterScreen/>}
    </div>
    
  )
}

export default index




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