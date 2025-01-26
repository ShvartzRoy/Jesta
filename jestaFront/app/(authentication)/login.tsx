import React, { useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from "react-native";
import { Link, useRouter } from 'expo-router';
import { UserContext } from "../contexts/authContext";
import { ProfileContext } from "../contexts/profileContext";
import axios from "axios";

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
        email: email.trim(),
        password: password.trim(),
      });
      // Handle success
      console.log("User logged in:", response.data);
      // Set current user
      setUser({ loggedIn: true, userName: response.data.username, id: response.data.id });

      // If the user has not set up their profile, redirect to set_profile page
      // Check user profile
      try {
        console.log("checking profile context for:", user.id);
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

      router.replace("/explore_page");
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
  loginButton: {
    backgroundColor: '#007BFF', // Blue background for prominence
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '50%', // Less wide than before
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#E0E0E0', // Light gray background for a subtle look
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: 100, // Smaller width for the register button
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#000000', // Black text for contrast
    fontSize: 16,
  },
  errorMessage: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
  },
});