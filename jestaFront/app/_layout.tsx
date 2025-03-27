import { Slot } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './hooks/queryClient';

import AuthContext from './contexts/authContext';
import PContext from './contexts/profileContext';
import { usePushNotifications } from './hooks/usePushNotifications';
import * as Notifications from 'expo-notifications';
import React from 'react';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Layout = () => {
  usePushNotifications((data) => {
    console.log('Foreground Notification Received:', data);

    if (data?.type === 'new_applicant') {
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext>
        <PContext>
          <Slot />
        </PContext>
      </AuthContext>
    </QueryClientProvider>
  );
};

export default Layout;
