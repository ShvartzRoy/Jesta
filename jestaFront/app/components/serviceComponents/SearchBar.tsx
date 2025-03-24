import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface SearchBarProps {
  searchValue: string;
  setSearchValue: (val: string) => void;
  sortOption: string;
  setSortOption: (val: string) => void;
}

export default function SearchBar({
  searchValue,
  setSearchValue,
  sortOption,
  setSortOption,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search a service" 
        placeholderTextColor="black"  
        value={searchValue}
        onChangeText={setSearchValue}
        style={styles.input}
     
      />

      <Text style={styles.label}>Sort By:</Text>
      <Picker
        selectedValue={sortOption}
        onValueChange={(itemValue) => setSortOption(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Price (Low to High)" value="price_low_high" color="black" />
        <Picker.Item label="Price (High to Low)" value="price_high_low" color="black" />
        <Picker.Item label="Duration (Short to Long)" value="duration_short_long" color="black" />
        <Picker.Item label="Duration (Long to Short)" value="duration_long_short" color="black" />
      </Picker>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 5,
    borderRadius: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 5,
  },
  label: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  
});
