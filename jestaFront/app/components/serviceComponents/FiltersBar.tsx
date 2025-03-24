import React, { useState, useEffect } from 'react';
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
  resetTrigger: boolean;
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
  resetTrigger,
}: FiltersBarProps) {
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');

  //sync price inputs when parent resets
  useEffect(() => {
    setMinPriceInput('');
    setMaxPriceInput('');
  }, [resetTrigger]);

  const handleMinPriceChange = (val: string) => {
    setMinPriceInput(val);
    const num = Number(val);
    if (!isNaN(num)) {
      setPriceRange([num, priceRange[1]]);
    }
  };

  const handleMaxPriceChange = (val: string) => {
    setMaxPriceInput(val);
    const num = Number(val);
    if (!isNaN(num)) {
      setPriceRange([priceRange[0], num]);
    }
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.label}>Price Range: {priceRange[0]}₪ - {priceRange[1]}₪</Text>

      <TextInput
        placeholder="Min Price"
        keyboardType="numeric"
        style={styles.input}
        value={minPriceInput}
        onChangeText={handleMinPriceChange}
      />
      <TextInput
        placeholder="Max Price"
        keyboardType="numeric"
        style={styles.input}
        value={maxPriceInput}
        onChangeText={handleMaxPriceChange}
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
