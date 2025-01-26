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
import {  useRouter } from 'expo-router';

export default function SpecialistsExplore() {
  const [categories, setCategories] = useState([]);
  const [otherTags, setOtherTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSpecialistTags, setShowSpecialistTags] = useState(true);
  const router = useRouter();

  // Fetch categories and tags from the API
  const fetchCategoriesAndTags = async () => {
    try {
      const categoryResponse = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/tags/get_categories`
      );
      const allTagsResponse = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/tags/get_all_tags`
      );

      const categoriesWithTags = categoryResponse.data.categories.map(
        (category) => ({
          id: category.id,
          name: category.name,
          tags: category.tags,
          specialist_tags: category.specialist_tags,
        })
      );

      const uncategorizedTags = allTagsResponse.data.tags.filter(
        (tag) =>
          !categoriesWithTags.some((category) =>
            category.tags.some((categoryTag) => categoryTag.id === tag.id)
          )
      );

      setCategories(categoriesWithTags);
      setOtherTags(uncategorizedTags);
    } catch (error) {
      console.error("Error fetching categories or tags:", error);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchCategoriesAndTags();
  };

  // Filter categories and tags based on the search query
  const filteredCategories = categories
    .map((category) => {
      const allTags = showSpecialistTags
        ? category.specialist_tags
        : [...category.tags, ...category.specialist_tags];

      // Check if the category name matches the search query
      const isCategoryMatch = category.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter tags if the category name doesn't match
      const filteredTags = isCategoryMatch
        ? allTags // Show all tags if the category name matches
        : allTags.filter((tag) =>
            tag.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

      return {
        ...category,
        tags: filteredTags,
        showCategory: isCategoryMatch || filteredTags.length > 0,
      };
    })
    .filter((category) => category.showCategory && category.tags.length > 0); // Ensure categories with no tags are not shown

  // Check if the search query matches "Other"
  const isOtherCategory = "other".toLowerCase().includes(searchQuery.toLowerCase());

  // Filter uncategorized tags
  const filteredOtherTags = isOtherCategory
    ? otherTags // Show all uncategorized tags if searching for "Other"
    : otherTags.filter((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Render tags for a given category
  const renderTags = (tags) => {
    return tags.map((tag) => (
      <TouchableOpacity
        key={tag.id.toString()}
        style={styles.tagCard}
        onPress={() => {console.log(tag.name); router.replace(`/${tag.name}`);}} // Navigate to TagResultsScreen
      >
        <Text style={styles.tagText}>{tag.name}</Text>
      </TouchableOpacity>
    ));
  };

  // Render category sections
  const renderCategories = () => {
    return (
      <>
        {filteredCategories.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryHeader}>{category.name}</Text>
            <View style={styles.tagsContainer}>{renderTags(category.tags)}</View>
          </View>
        ))}

        {/* Render "Other" category for uncategorized tags */}
        {!showSpecialistTags && (filteredOtherTags.length > 0 || isOtherCategory) && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryHeader}>Other</Text>
            <View style={styles.tagsContainer}>
              {renderTags(filteredOtherTags)}
            </View>
          </View>
        )}
      </>
    );
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
          <Text style={styles.title}>Explore Services</Text>
          <Text style={styles.subtitle}>
            Choose a category to find the right service provider
          </Text>

          {/* Search Bar */}
          <TextInput
            style={styles.searchBar}
            placeholder="Search for a service..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Toggle Button enable when needed
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowSpecialistTags((prev) => !prev)}
          >
            <Text style={styles.toggleButtonText}>
              {showSpecialistTags ? "Show All Tags" : "Show Specialist Tags"}
            </Text>
          </TouchableOpacity> */}

          {/* Scrollable List */}
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
            {renderCategories()}
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
    paddingBottom: 0,
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
  toggleButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 16,
  },
  toggleButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 0, // Remove padding to extend to the navbar
    marginBottom: 0,
  },
  categorySection: {
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  categoryHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 16,
    width: "100%",
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