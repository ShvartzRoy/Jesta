import { Slot } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../hooks/queryClient';

import AuthContext from './contexts/authContext';
import PContext from './contexts/profileContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import * as Notifications from 'expo-notifications';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationProvider, useNotification } from './contexts/notificationContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PushNotificationHandler = () => {
  const { setNewNotification } = useNotification(); 

  usePushNotifications((data) => {
    if (data?.title && data?.body) {
      setNewNotification({
        id: Date.now(),
        title: data.title,
        body: data.body,
        created_at: new Date().toISOString(),
        read: false,
      });
    }
  });

  return null;
};


const Layout = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext>
        <PContext>
          <NotificationProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <PushNotificationHandler />
              <Slot />
            </GestureHandlerRootView>
          </NotificationProvider>
        </PContext>
      </AuthContext>
    </QueryClientProvider>
  );
};

export default Layout;
