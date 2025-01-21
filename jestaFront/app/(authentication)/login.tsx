// screens/RegisterScreen.js
import React, { useState, useContext} from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import {Link, useRouter} from 'expo-router';
import { UserContext } from "../authContext";
import axios from "axios";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const {user,setUser, saveToken} = useContext(UserContext);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
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

      //navigate to another screen or clear input fields
      router.push("/explore_page");
      setEmail("");
      setPassword("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Login error:", error.response?.data);
        Alert.alert("Error, ", error.response?.data);
      } else {
        console.error("Login error:", error);
        Alert.alert("Error, Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
