import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { UserContext } from './contexts/authContext';
import { ProfileContext } from './contexts/profileContext';


const Index = () => {
  const { user } = useContext(UserContext); // Access user context
  const { profile, loading} = useContext(ProfileContext); // Access profile context
  const router = useRouter();
  const [isReady, setIsReady] = useState(false); // Tracks when context is ready

  useEffect(() => {
    // Navigate based on user state after context is ready
    if (user.loggedIn != undefined) {
      if (user?.loggedIn) {
        if(profile?.name != null && !loading){
          router.replace('/set_profile');
        }
        else{
          router.replace('/mainprofile');
        }
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