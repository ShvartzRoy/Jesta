import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0056d6', // Blue theme for active icon
        tabBarInactiveTintColor: 'rgba(142,142,147,1)', // Light gray for inactive icons
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
        name="(explore_page)/explore_page"
        options={{
          headerTitle: 'Explore', // Title displayed in the header
          tabBarIcon: ({ color }) => (
            <Ionicons name="briefcase-outline" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="(search)/search"
        options={{
          headerTitle: 'Search', // Title displayed in the header
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="(chat)/chat"
        options={{
          headerTitle: 'Chat', // Title displayed in the header
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbox-outline" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)/profile"
        options={{
          headerTitle: 'Profile', // Title displayed in the header
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
