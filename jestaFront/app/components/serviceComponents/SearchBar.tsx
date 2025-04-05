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
    <View style={styles.card}>
      <TextInput
        placeholder="🔍 Search for services..."
        placeholderTextColor="#777"
        value={searchValue}
        onChangeText={setSearchValue}
        style={styles.input}
      />

      <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortOptions(!showSortOptions)}>
        <Ionicons name="filter-outline" size={20} color="#007AFF" />
        <Text style={styles.sortText}>Sort Options</Text>
      </TouchableOpacity>

      {showSortOptions && (
        <View style={styles.pickerContainer}>
         <Picker
          selectedValue={sortOption}
          onValueChange={(itemValue) => setSortOption(itemValue)}
          style={styles.picker}
          dropdownIconColor="#007AFF"
        >
          <Picker.Item label="💸 Price: Low to High" value="price_low_high" color="black" />
          <Picker.Item label="💰 Price: High to Low" value="price_high_low" color="black" />
          <Picker.Item label="⏱ Duration: Short to Long" value="duration_short_long" color="black" />
          <Picker.Item label="⏳ Duration: Long to Short" value="duration_long_short" color="black" />
        </Picker>

        </View>
      )}
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
    elevation: 4,
  },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  sortText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  pickerContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  picker: {
    backgroundColor: '#f7f7f7',
    fontSize: 16,
  },
});
