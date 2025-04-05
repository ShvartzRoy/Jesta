import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function SpecialistsExplore() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Fetch tags from the API
  const fetchTags = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/tags/get_all_tags`
      );
      // The API returns an object with a "tags" property (list of TagSchema)
      setTags(response.data.tags);
    } catch (error) {
      setError("Failed to fetch tags. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTags();
  };

  // Filter tags based on search query (by tag name)
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render each tag as a clickable card
  const renderTags = () => {
    return filteredTags.map((tag) => (
      <TouchableOpacity
        key={tag.id.toString()}
        style={styles.tagCard}
        onPress={() => {
          console.log(tag.name);
          router.replace(`/${tag.name}`);
        }}
      >
        <Text style={styles.tagText}>{tag.name}</Text>
      </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Explore Specialists</Text>
          <Text style={styles.subtitle}>
            Choose a tag to find the right service provider
          </Text>

          {/* Search Bar */}
          <TextInput
            style={styles.searchBar}
            placeholder="Search for a tag..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#007BFF"]}
                tintColor="#007BFF"
              />
            }
          >
            {renderTags()}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F0F4F8",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 24,
    textAlign: "center",
  },
  searchBar: {
    width: "100%",
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 0,
    marginBottom: 0,
  },
  tagCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007BFF",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
});

export default SpecialistsExplore;
