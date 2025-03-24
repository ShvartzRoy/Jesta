import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TagBarProps {
  predefinedTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
}

export default function TagBar({ predefinedTags, selectedTags, setSelectedTags }: TagBarProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <View style={styles.container}>
      {predefinedTags.map((tag) => (
        <TouchableOpacity
          key={tag}
          style={[
            styles.tagButton,
            selectedTags.includes(tag) ? styles.tagSelected : styles.tagUnselected,
          ]}
          onPress={() => toggleTag(tag)}
        >
          <Text style={styles.tagText}>{tag}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 5,
  },
  tagSelected: {
    backgroundColor: '#007AFF',
  },
  tagUnselected: {
    backgroundColor: '#ccc',
  },
  tagText: {
    color: 'white',
  },
});
