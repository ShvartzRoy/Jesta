import React from 'react';
import { View, Text, Switch, TextInput, StyleSheet } from 'react-native';

interface FiltersBarProps {
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  location: string;
  setLocation: (loc: string) => void;
  duration: string;
  setDuration: (dur: string) => void;
  filterRequests: boolean;
  setFilterRequests: (val: boolean) => void;
  filterOffers: boolean;
  setFilterOffers: (val: boolean) => void;
  filterMine: boolean;
  setFilterMine: (val: boolean) => void;
  filterOthers: boolean;
  setFilterOthers: (val: boolean) => void;
}

export default function FiltersBar({
  priceRange,
  setPriceRange,
  location,
  setLocation,
  duration,
  setDuration,
  filterRequests,
  setFilterRequests,
  filterOffers,
  setFilterOffers,
  filterMine,
  setFilterMine,
  filterOthers,
  setFilterOthers,
}: FiltersBarProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.label}>Price Range: {priceRange[0]}₪ - {priceRange[1]}₪</Text>
      {/* to replace with a slider later */}
      <TextInput
        placeholder="Min Price"
        keyboardType="numeric"
        style={styles.input}
        onChangeText={(val) => setPriceRange([Number(val), priceRange[1]])}
      />
      <TextInput
        placeholder="Max Price"
        keyboardType="numeric"
        style={styles.input}
        onChangeText={(val) => setPriceRange([priceRange[0], Number(val)])}
      />

      <Text style={styles.label}>Location:</Text>
      <TextInput
        placeholder="Enter Location"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

      <Text style={styles.label}>Duration:</Text>
      <TextInput
        placeholder="Enter Duration"
        value={duration}
        onChangeText={setDuration}
        style={styles.input}
      />

      <View style={styles.toggleRow}>
        <Text>Requests</Text>
        <Switch value={filterRequests} onValueChange={setFilterRequests} />
        <Text>Offers</Text>
        <Switch value={filterOffers} onValueChange={setFilterOffers} />
      </View>

      <View style={styles.toggleRow}>
        <Text>Mine</Text>
        <Switch value={filterMine} onValueChange={setFilterMine} />
        <Text>Others</Text>
        <Switch value={filterOthers} onValueChange={setFilterOthers} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 5,
    borderRadius: 5,
  },
  label: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
});
