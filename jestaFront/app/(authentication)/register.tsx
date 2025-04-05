import React, { useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from "react-native";
import { UserContext } from "../contexts/authContext";
import { Link, useRouter } from 'expo-router';
import axios from "axios";
import { Image } from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, setUser, saveToken } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [isError, setError] = useState([false, '']);
  const router = useRouter();

  const [referralCode, setReferralCode] = useState("");


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
        referral_code: referralCode.trim() || null,


      });
      // Handle success
      console.log("User registered:", response.data);
      // Log into new account



      // const loginResponse = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/login`, {
      //   email: email.trim(),
      //   password: password.trim(),
      // }, {withCredentials: true}
    //);



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
        <Image
             source={require('../../assets/images/favicon.png')}
             style={{ width: 80, height: 80, marginBottom: 30 ,   shadowColor: "#000",
               shadowOffset: { width: 0, height: 1 },
               shadowOpacity: 0.1,
               shadowRadius: 2,
               borderRadius: 12,}}
           />

        <Text style={styles.title}>Register</Text>
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

      <TextInput
        style={styles.input}
        placeholder="Referral Code (optional)"
        placeholderTextColor={"#888"}

        value={referralCode}
        onChangeText={setReferralCode}
        autoCapitalize="none"
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
    backgroundColor: '#f4faff',
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
  errorMessage: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
  },
});