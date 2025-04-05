import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface YourLocationToggleProps {
  userCity: string;
  gpsNearbyMode: boolean;
  setGpsNearbyMode: (val: boolean) => void;
}

const YourLocationToggle = ({ userCity, gpsNearbyMode, setGpsNearbyMode }: YourLocationToggleProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded(prev => !prev)} style={styles.headerRow}>
        <Text style={styles.title}>📍 Location Preferences</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <Text style={styles.cityText}>Your detected city: <Text style={styles.cityName}>{userCity || 'Unknown'}</Text></Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show nearby cities to my location</Text>
            <Switch
              value={gpsNearbyMode}
              onValueChange={setGpsNearbyMode}
            />
          </View>
        </View>
      )}
    </View>
  );
};

export default YourLocationToggle;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    marginTop: 10,
  },
  cityText: {
    fontSize: 14,
    marginBottom: 8,
  },
  cityName: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 14,
  },
});
