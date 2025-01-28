import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const FilterModal = ({ isVisible, onClose, onApply, onDontFilter, initialFilters }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [availableTags, setAvailableTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch available tags on component mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/tags/get_all_tags`);
        setAvailableTags(response.data.tags);
        setFilteredTags(response.data.tags);
      } catch (err) {
        //console.error('Failed to fetch tags:', err);
      }
    };
    fetchTags();
  }, []);

  // Handle tag search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(availableTags);
    }
  };

  // Add a tag to the selected tags
  const handleAddTag = (tag) => {
    if (!filters.tags.includes(tag.name)) {
      setFilters({ ...filters, tags: [...filters.tags, tag.name] });
    }
    setSearchQuery('');
    setFilteredTags(availableTags);
    Keyboard.dismiss();
  };

  // Remove a tag from the selected tags
  const handleRemoveTag = (tag) => {
    const updatedTags = filters.tags.filter((t) => t !== tag);
    setFilters({ ...filters, tags: updatedTags });
  };

  // Handle applying filters
  const handleApply = () => {
    onApply(filters);
  };

  // Render the main content (non-list items)
  const renderHeader = () => (
    <View>
      {/* Location Filter */}
      <Text style={styles.filterLabel}>Location</Text>
      <TextInput
        style={styles.filterInput}
        placeholder="Enter location"
        value={filters.location}
        onChangeText={(text) => setFilters({ ...filters, location: text })}
      />

      {/* Tags Filter */}
      <Text style={styles.filterLabel}>Tags</Text>
      <View style={styles.tagsContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Search tags..."
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        <View style={styles.selectedTagsContainer}>
          {filters.tags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={styles.selectedTag}
              onPress={() => handleRemoveTag(tag)}
            >
              <Text style={styles.selectedTagText}>{tag} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration Filter (Range) */}
      <Text style={styles.filterLabel}>Duration (Range)</Text>
      <View style={styles.durationContainer}>
        <TextInput
          style={[styles.filterInput, styles.durationInput]}
          placeholder="Start (e.g., PT1H)"
          value={filters.duration[0]}
          onChangeText={(text) =>
            setFilters({ ...filters, duration: [text, filters.duration[1]] })
          }
        />
        <Text style={styles.durationSeparator}>-</Text>
        <TextInput
          style={[styles.filterInput, styles.durationInput]}
          placeholder="End (e.g., PT3H)"
          value={filters.duration[1]}
          onChangeText={(text) =>
            setFilters({ ...filters, duration: [filters.duration[0], text] })
          }
        />
      </View>

      {/* Price Range Filter */}
      <Text style={styles.filterLabel}>Price Range</Text>
      <View style={styles.priceRangeContainer}>
        <TextInput
          style={[styles.filterInput, styles.priceInput]}
          placeholder="Min"
          value={String(filters.priceRange[0])}
          onChangeText={(text) =>
            setFilters({
              ...filters,
              priceRange: [parseFloat(text), filters.priceRange[1]],
            })
          }
          keyboardType="numeric"
        />
        <Text style={styles.priceSeparator}>-</Text>
        <TextInput
          style={[styles.filterInput, styles.priceInput]}
          placeholder="Max"
          value={String(filters.priceRange[1])}
          onChangeText={(text) =>
            setFilters({
              ...filters,
              priceRange: [filters.priceRange[0], parseFloat(text)],
            })
          }
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#007BFF" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Filter Services</Text>

            {/* Use FlatList for main content */}
            <FlatList
              data={[]} // Empty data array
              ListHeaderComponent={renderHeader} // Render non-list content here
              ListFooterComponent={
                <>
                  {/* Apply Filters Button */}
                  <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                  </TouchableOpacity>

                  {/* Don't Filter Button */}
                  <TouchableOpacity
                    style={styles.dontFilterButton}
                    onPress={onDontFilter}
                  >
                    <Text style={styles.dontFilterButtonText}>Don't Filter</Text>
                  </TouchableOpacity>
                </>
              }
              renderItem={null} // No items to render
              keyboardShouldPersistTaps="handled"
            />

            {/* Tags Dropdown (rendered outside FlatList) */}
            {(isSearchFocused || searchQuery) && (
              <FlatList
                data={filteredTags}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.tagItem}
                    onPress={() => handleAddTag(item)}
                  >
                    <Text>{item.name}</Text>
                  </TouchableOpacity>
                )}
                style={styles.tagsList}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 8,
  },
  tagItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  selectedTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagText: {
    fontSize: 14,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  durationInput: {
    width: '48%',
  },
  durationSeparator: {
    alignSelf: 'center',
    marginHorizontal: 8,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceInput: {
    width: '48%',
  },
  priceSeparator: {
    alignSelf: 'center',
    marginHorizontal: 8,
  },
  applyButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dontFilterButton: {
    backgroundColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dontFilterButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FilterModal;