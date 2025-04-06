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

  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentEmail, setSentEmail] = useState('');



  // const handleRegister = async () => {
  //   setError([false, '']);
  //   if (!email || !password) {
  //     Alert.alert("Error", "Please enter both email and password.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     console.log('process.env.PUBLIC_HOST', process.env.EXPO_PUBLIC_HOST);
  //     const response = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/register`, {
  //       email: email.trim(),
  //       password: password.trim(),
  //       referral_code: referralCode.trim() || null,


  //     });
  //     console.log("User registered:", response.data);
  //     console.log("User logged in:", response.data);
  //     setUser({ loggedIn: true, userName: response.data.username, id: response.data.id });

  //     router.push(`/set_profile?referralCode=${referralCode.trim()}`);

  //     setEmail("");
  //     setPassword("");
  //   } catch (error) {
      
  //     setError([true, error.response?.data || error.message]);

  //   } finally {
  //     setLoading(false);
  //   }
  // };



  const handleRegister = async () => {
    setError([false, '']);
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }


    if (referralCode.trim()) {
      try {
        const referralRes = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/users/validate_referral_code`, {
          params: { referral_code: referralCode.trim() }
        });
        if (!referralRes.data.valid) {
          setError([true, { msg: "Referral code is invalid." }]);
          return;
        }
      } catch (error) {
        setError([true, { msg: "Failed to validate referral code." }]);
        return;
      }
    }
  
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_HOST}/api/users/send_verification_code`, {
        email: email.trim(),
      });
      setSentEmail(email.trim());
      setStep('verify');
    } catch (error) {
      setError([true, error.response?.data || { msg: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  
  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/users/verify_code`,
        {
          email: sentEmail,
          code: verificationCode.trim(),
          password: password.trim(),
          referral_code: referralCode.trim() || null,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      setUser({
        loggedIn: true,
        userName: response.data.username,
        id: response.data.id,
      });
  
      router.push(`/set_profile?referralCode=${referralCode.trim()}`);
    } catch (error) {
      setError([true, error.response?.data || { msg: error.message }]);
    } finally {
      setLoading(false);
    }
  };


  {/* Function to handle error messages */}

  function getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (typeof error?.msg === 'string') return error.msg;
    if (typeof error?.detail === 'string') return error.detail;
    if (typeof error?.error === 'string') return error.error;
    if (Array.isArray(error?.errors) && error.errors.length > 0 && error.errors[0]?.msg)
      return error.errors[0].msg;
    return JSON.stringify(error);
  }
  
  
  



  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/favicon.png')}
          style={{
            width: 80,
            height: 80,
            marginBottom: 30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            borderRadius: 12,
          }}
        />
  
        <Text style={styles.title}>Register</Text>
  
        {step === 'register' ? (
          <>
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
  <Text style={styles.errorMessage}>{getErrorMessage(isError[1])}</Text>
)}


  
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => {
                Keyboard.dismiss();
                handleRegister();
              }}
            >
              <Text style={styles.registerButtonText}>Send Verification Code</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ marginBottom: 10 }}>
              Enter the code sent to <Text style={{ fontWeight: 'bold' }}>{sentEmail}</Text>
            </Text>
  
            <TextInput
              style={styles.input}
              placeholder="Verification Code"
              placeholderTextColor={"#888"}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
            />
  
  {isError[0] && (
  <Text style={styles.errorMessage}>{getErrorMessage(isError[1])}</Text>
)}


  
            <TouchableOpacity style={styles.registerButton} onPress={handleVerifyCode}>
              <Text style={styles.registerButtonText}>Verify & Register</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={styles.resendButton} onPress={handleRegister}>
              <Text style={styles.resendButtonText}>Resend Code</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={styles.backButtonOutline} onPress={() => setStep('register')}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </>
        )}
  
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/login")}
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


  resendButton: {
    marginTop: 12,
    backgroundColor: '#c5cae9', 
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    elevation: 2,
  },
  
  resendButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  
  backButtonOutline: {
    marginTop: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  
  backButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  

});