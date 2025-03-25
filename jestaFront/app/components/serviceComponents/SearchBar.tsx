import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

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
  const [showSortOptions, setShowSortOptions] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search a service"
        placeholderTextColor="black"
        value={searchValue}
        onChangeText={setSearchValue}
        style={styles.input}
        
      />

      {/*Sort By Toggle Button*/}
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortOptions(!showSortOptions)}
      >
        <Ionicons name="options-outline" size={30} color="#007AFF" />
        <Text style={[styles.sortText]}>Sort By</Text>
      </TouchableOpacity>

      {/*Show Picker if toggled*/}
      {showSortOptions && (
        <>
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
        </>
      )}
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
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  sortText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
