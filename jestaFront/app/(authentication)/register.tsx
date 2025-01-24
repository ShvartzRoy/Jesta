// screens/RegisterScreen.js
import React, { useState, useContext} from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { UserContext } from "../contexts/authContext";
import {Link, useRouter} from 'expo-router';
import axios from "axios";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {user,setUser, saveToken} = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
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
      Alert.alert("Success", "Registration successful!");
      console.log("User registered:", response.data);
      //log into new account
      const loginResponse = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/login`, {
        email: email.trim(),
        password: password.trim(),
      });
      // Handle success
      console.log("User logged in:", response.data);
      //set current user
      setUser({loggedIn: true, userName: response.data.username, id: response.data.id});
      // navigate to the set profile page
      router.push("/set_profile");
      setEmail("");
      setPassword("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Registration error:", error.response?.data);
        Alert.alert("Error, ", error.response?.data);
      } else {
        console.error("Registration error:", error);
        Alert.alert("Error, Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <Button title="Register" onPress={handleRegister} />

      <Link href= "/login">Log in</Link>
    </View>
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
