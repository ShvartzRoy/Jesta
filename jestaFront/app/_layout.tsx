// _layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import AuthContext from './contexts/authContext';
import PContext from './contexts/profileContext';

const Layout = () => {
  return (
    <AuthContext>
      <PContext>
        <Slot />
      </PContext>
    </AuthContext>
  );
};

export default Layout;