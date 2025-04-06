import React, { useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from "react-native";
import { Link, useRouter } from 'expo-router';
import { UserContext } from "../contexts/authContext";
import { ProfileContext } from "../contexts/profileContext";
import axios from "axios";
import { Image } from 'react-native';


export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, setUser, saveToken } = useContext(UserContext);
  const { profile, setProfile } = useContext(ProfileContext); // Access profile context
  const { fetchAndSetProfile } = useContext(ProfileContext);
  const router = useRouter();
  const [isError, setError] = useState([false, '']); // Added error state

  const handleLogin = async () => {
    setError([false, '']); // Reset error state
    if (!email || !password) {
      setError([true, "Please enter both fields"]); // Set error state
      return;
    }
    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/login`, {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      // Handle success
      console.log("User logged in:", response.data);
      // Set current user
      setUser({ loggedIn: true, userName: response.data.username, id: response.data.id });

      // If the user has not set up their profile, redirect to set_profile page
      // Check user profile
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${user.id}`, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        });
        console.log("User response:", response.data);
        setProfile({
          name: response.data.name,
          bio: response.data.bio,
          age: response.data.age,
          image: response.data.image,
          resume: response.data.resume,
          facebook: response.data.facebook,
          linkedin: response.data.linkedin,
          instagram: response.data.instagram,
        });
        console.log("Profile set to:", profile);
      } catch (error) {
        setProfile({ name: null });
        router.replace('/set_profile');
        console.log("didn't find profile for:", user.id);
      }

      router.replace("/test_test");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.log("login error", error);
      setError([true, error.response?.data || error.message]); // Set error state
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
      <Image
          source={require('../../assets/images/favicon.png')}
          style={{ width: 80, height: 80, marginBottom: 30 ,   shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            borderRadius: 12,}}
        />
        <Text style={styles.title}>Log in</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={"#888"}

          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={"#888"}

          value={password}
          onChangeText={setPassword}
          secureTextEntry
          
        />

        {/* Error Message */}
        {isError[0] && (
          <Text style={styles.errorMessage}>
            {isError[1].detail || isError[1]}
          </Text>
        )}

        {/* Log In Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.replace("/register")} // Use router.push for navigation
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4faff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
  },
  
  input: {
    width: "100%",
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 14,
    backgroundColor: "#fff",
    fontSize: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    textAlign: 'left', 
    writingDirection: 'ltr',
  },
  
  loginButton: {
    backgroundColor: '#5dade2', 
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '70%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fffaf0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  registerButton: {
    backgroundColor: '#d6eaf8',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '70%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  registerButtonText: {
    color: '#444',
    fontSize: 16,
    fontWeight: '600',
  },
  
  errorMessage: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
  },
});