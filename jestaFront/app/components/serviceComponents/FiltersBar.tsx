import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TextInput, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
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
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.label}>Price Range: {priceRange[0]}₪ - {priceRange[1]}₪</Text>
      <MultiSlider
        values={priceRange}
        min={0}
        max={1000}
        step={20}
        sliderLength={350}
        onValuesChange={(values) => setPriceRange([values[0], values[1]])}
        selectedStyle={{ backgroundColor: '#007AFF' }}
        containerStyle={{ alignSelf: 'center', marginVertical: 10 }}
        markerStyle={{ height: 25, width: 25 }}

      />

      <Text style={styles.label}>Location:</Text>
      <TextInput
        placeholder="Enter Location"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

<Text style={styles.label}>Duration:</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TextInput
          placeholder="Days"
          keyboardType="numeric"
          placeholderTextColor="black"
          value={days}
          onChangeText={setDays}
          style={[styles.input, { flex: 1, marginRight: 5 }]}
        />
        <TextInput
          placeholder="Hours"
          keyboardType="numeric"
          placeholderTextColor="black"
          value={hours}
          onChangeText={setHours}
          style={[styles.input, { flex: 1, marginHorizontal: 5 }]}
        />
        <TextInput
          placeholder="Minutes"
          keyboardType="numeric"
          placeholderTextColor="black"
          value={minutes}
          onChangeText={setMinutes}
          style={[styles.input, { flex: 1, marginLeft: 5 }]}
        />
      </View>

      <View style={[styles.toggleRow, { justifyContent: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
          <Text style={{ marginRight: 5 }}>{filterRequests ? 'Requests' : 'Offers'}</Text>
          <Switch value={filterRequests} onValueChange={setFilterRequests} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ marginRight: 5 }}>{filterMine ? 'Mine' : 'Others'}</Text>
          <Switch value={filterMine} onValueChange={setFilterMine} />
        </View>
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
    alignItems: 'center',
    marginTop: 10,
  },
});