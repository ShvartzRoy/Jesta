import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Modal 
} from 'react-native';
import axios from 'axios';

interface Tag {
  id: number;
  name: string;
}

interface SpecialistTagSearchProps {
  onSelectTag: (tag: Tag) => void;
  onClose: () => void;
  // Optionally pass tags as a prop if already fetched
  tags?: Tag[];
}

const SpecialistTagSearch: React.FC<SpecialistTagSearchProps> = ({ onSelectTag, onClose, tags: tagsProp }) => {
  const [tags, setTags] = useState<Tag[]>(tagsProp || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);

  // If tags are not provided via props, fetch them from the API
  useEffect(() => {
    if (!tagsProp) {
      const fetchTags = async () => {
        try {
          const response = await axios.get(`${process.env.EXPO_PUBLIC_HOST}/api/tags/get_all_tags`);
          // Assuming the API returns { tags: Tag[] }
          setTags(response.data.tags);
          setFilteredTags(response.data.tags);
        } catch (error) {
          console.error("Error fetching tags:", error);
        }
      };
      fetchTags();
    } else {
      setTags(tagsProp);
      setFilteredTags(tagsProp);
    }
  }, [tagsProp]);

  // Filter tags based on the search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags(tags);
    }
  }, [searchQuery, tags]);

  return (
    <Modal transparent={true} visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tags..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <FlatList
            data={filteredTags}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onSelectTag(item)} style={styles.tagItem}>
                <Text style={styles.tagText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            style={styles.tagList}
          />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  searchContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    maxHeight: '80%',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  tagList: {
    maxHeight: 200,
  },
  tagItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tagText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SpecialistTagSearch;
