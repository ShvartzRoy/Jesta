import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0056d6', // Blue theme for active icon
        tabBarInactiveTintColor: 'rgb(63, 63, 63)', // Light gray for inactive icons
        headerStyle: {
          backgroundColor: 'rgba(0,122,255,1)', // Blue header background
        },
        headerShadowVisible: false, // No shadow for a cleaner look
        headerTintColor: '#fff', // White header text
        tabBarStyle: {
          backgroundColor: '#e8e8ee', // Light gray for the tab bar background
          borderTopWidth: 0, // Remove border for a seamless look
        },
        tabBarShowLabel: false, // Hides labels from the tab bar
      }}
    >
      <Tabs.Screen
  name="(test)/test_test"
  options={{
    headerTitle: 'Explore',
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name="briefcase-outline"
        color={color}
        size={focused ? 28 : 24}
        style={{ transform: [{ scale: focused ? 1.1 : 1.1 }] }}
      />
    ),
  }}
/>

      <Tabs.Screen
        name="(specialists_explore)/specialists_explore"
        options={{
          headerTitle: 'Search Specialists', // Title displayed in the header
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="search-outline"
              color={color}
              size={focused ? 28 : 24} // Increase size when focused
              style={{
                transform: [{ scale: focused ? 1.1 : 1.1 }], // Slight zoom on press
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(chat)/chat"
        options={{
          headerTitle: 'Chat', // Title displayed in the header
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="chatbox-outline"
              color={color}
              size={focused ? 28 : 24} // Increase size when focused
              style={{
                transform: [{ scale: focused ? 1.1 : 1.1 }], // Slight zoom on press
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)/profile"
        options={{
          headerTitle: 'Profile', // Title displayed in the header
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="person-outline"
              color={color}
              size={focused ? 28 : 24} // Increase size when focused
              style={{
                transform: [{ scale: focused ? 1.1 : 1.1 }], // Slight zoom on press
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}