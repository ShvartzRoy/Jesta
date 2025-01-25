// screens/RegisterScreen.js
import React, { useState, useContext} from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard} from "react-native";
import {Link, useRouter} from 'expo-router';
import { UserContext } from "../contexts/authContext";
import { ProfileContext } from "../contexts/profileContext";
import axios from "axios";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {user,setUser, saveToken} = useContext(UserContext);
  const { profile, setProfile} = useContext(ProfileContext); // Access profile context
  const { fetchAndSetProfile } = useContext(ProfileContext);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/login`, {
        email: email.trim(),
        password: password.trim(),
      });
      // Handle success
      Alert.alert("Success", "Login successful!");
      console.log("User logged in:", response.data);
      //set current user
      setUser({loggedIn: true, userName: response.data.username, id: response.data.id});

      //if the user has not set up their profile, redirect to set_profile page
      //check user profile
      // Fetch the profile of the logged-in user
      try {
            console.log("checking profile context for:", user.id);
            const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user.id}`, {
            headers: {"Content-Type": "application/json"},
            withCredentials: true
            });
            console.log("User response:", response.data);
            setProfile({
                name: response.data.name,
                "bio": response.data.bio,
                "age": response.data.age,
                "image": response.data.image,
                "resume": response.data.resume,
                "facebook": response.data.facebook,
                "linkedin": response.data.linkedin,
                "instagram": response.data.instagram,
            });
            console.log("Profile set to:", profile);
      } catch (error) {
            setProfile({name: null});
            router.replace('/set_profile');
            console.log("didnt find profile for:", user.id);
      }

      
      router.replace("/explore_page");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.log("login error", error);
      Alert.alert("Login error", "Details are incorrect. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Log in</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Log in" onPress={handleLogin} />
        <Link href= "/register">Register</Link>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});
