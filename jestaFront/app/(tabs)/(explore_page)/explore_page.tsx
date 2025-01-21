import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { UserContext } from '../../contexts/authContext';

const Explore_Page = () => {
  const { user } = useContext(UserContext);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>User ID: {user?.id}</Text>
    </View>
  );
};

export default Explore_Page;
