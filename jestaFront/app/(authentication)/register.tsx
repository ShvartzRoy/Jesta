import React, { useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from "react-native";
import { UserContext } from "../contexts/authContext";
import { Link, useRouter } from 'expo-router';
import axios from "axios";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, setUser, saveToken } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [isError, setError] = useState([false, '']);
  const router = useRouter();

  const handleRegister = async () => {
    setError([false, '']);
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      console.log('process.env.PUBLIC_HOST', process.env.EXPO_PUBLIC_HOST);
      const response = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/register`, {
        email: email.trim(),
        password: password.trim(),
      });
      // Handle success
      console.log("User registered:", response.data);
      // Log into new account
      const loginResponse = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/login`, {
        email: email.trim(),
        password: password.trim(),
      });
      // Handle success
      console.log("User logged in:", response.data);
      // Set current user
      setUser({ loggedIn: true, userName: response.data.username, id: response.data.id });
      // Navigate to the set profile page
      router.push("/set_profile");
      setEmail("");
      setPassword("");
    } catch (error) {
      setError([true, error.response?.data || error.message]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Register</Text>
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

        {isError[0] && (
          <Text style={styles.errorMessage}>
            {isError[1].detail || isError[1]}
          </Text>
        )}

        {/* Register Button */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => {
            Keyboard.dismiss();
            handleRegister();
          }}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>

        {/* Log In Link */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/login")} // Use router.push for navigation
        >
          <Text style={styles.loginButtonText}>Log in</Text>
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
  registerButton: {
    backgroundColor: '#007BFF', // Blue background for prominence
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '50%', // Less wide than before
    alignItems: 'center',
    marginBottom: 10,
  },
  registerButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#E0E0E0', // Light gray background for a subtle look
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: 100, // Smaller width for the login button
    alignItems: 'center', // Center text horizontally
    justifyContent: 'center', // Center text vertically
  },
  loginButtonText: {
    color: '#000000', // Black text for contrast
    fontSize: 16,
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
  errorMessage: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
  },
});