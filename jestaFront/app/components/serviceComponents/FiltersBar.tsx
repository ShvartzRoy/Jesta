import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, StyleSheet } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

interface FiltersBarProps {
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  location: string;
  setLocation: (loc: string) => void;
  duration: string;
  setDuration: (dur: string) => void;
  filterRequests: boolean;
  setFilterRequests: (val: boolean) => void;
  filterMine: boolean;
  setFilterMine: (val: boolean) => void;
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
  filterMine,
  setFilterMine,
  resetTrigger,
}: FiltersBarProps) {
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  useEffect(() => {
    setDays('');
    setHours('');
    setMinutes('');
  }, [resetTrigger]);

  useEffect(() => {
    if (days === '' && hours === '' && minutes === '') {
      setDuration('');
    } else {
      const durString = `P${days || 0}DT${hours || 0}H${minutes || 0}M`;
      setDuration(durString);
    }
  }, [days, hours, minutes]);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>💰 Price Range: {priceRange[0]}₪ - {priceRange[1]}₪</Text>
      <MultiSlider
        values={priceRange}
        min={0}
        max={1000}
        step={20}
        sliderLength={340}
        onValuesChange={(values) => setPriceRange([values[0], values[1]])}
        selectedStyle={{ backgroundColor: '#007AFF' }}
        markerStyle={{ height: 24, width: 24 }}
        containerStyle={{ alignSelf: 'center', marginVertical: 12 }}
      />

      <Text style={styles.label}>📍 Location</Text>
      <TextInput
        placeholder="Enter city or area"
        placeholderTextColor="#666"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

      <Text style={styles.label}>⏳ Duration</Text>
      <View style={styles.durationRow}>
        <TextInput
          placeholder="Days"
          value={days}
          onChangeText={setDays}
          keyboardType="numeric"
          placeholderTextColor="#555"
          style={styles.durationInput}
        />
        <TextInput
          placeholder="Hours"
          value={hours}
          onChangeText={setHours}
          keyboardType="numeric"
          placeholderTextColor="#555"
          style={styles.durationInput}
        />
        <TextInput
          placeholder="Minutes"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="numeric"
          placeholderTextColor="#555"
          style={styles.durationInput}
        />
      </View>

      <View style={styles.toggleGroup}>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleText}>{filterRequests ? '📝 Requests' : '🎯 Offers'}</Text>
          <Switch value={filterRequests} onValueChange={setFilterRequests} />
        </View>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleText}>{filterMine ? '👤 Mine' : '🌍 Others'}</Text>
          <Switch value={filterMine} onValueChange={setFilterMine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  durationInput: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
  },
});
