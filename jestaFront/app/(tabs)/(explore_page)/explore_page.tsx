import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { UserContext } from "../../contexts/authContext";
import axios from "axios";

interface Service {
  id: number;
  title: string;
  description: string;
  location: string;
  tags: string[];
  date_time_range: string[];
  estimated_duration: string;
  offered_payment: number;
  is_volunteering: boolean;
}

const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
  return (
    <TouchableOpacity style={styles.serviceCard}>
      <Text style={styles.serviceTitle}>{service.title}</Text>
      <Text style={styles.serviceDescription}>{service.description}</Text>
      <View style={styles.serviceDetails}>
        <View>
          <Text style={styles.detailLabel}>Tags:</Text>
          <Text>{service.tags.join(", ")}</Text>
        </View>
        <View>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text>{service.location}</Text>
        </View>
        <View>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text>{service.date_time_range[0]} - {service.date_time_range[1]}</Text>
        </View>
        <View>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text>{service.estimated_duration}</Text>
        </View>
      </View>
      <Text style={styles.servicePrice}>
        {service.offered_payment > 0
          ? `$${service.offered_payment}`
          : service.is_volunteering
          ? "Volunteering"
          : "Free"}
      </Text>
    </TouchableOpacity>
  );
};

const Explore_Page = () => {
  const { user } = useContext(UserContext);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/services/get_all_services`
      );
      setServices(response.data);
      setError(false);
    } catch (error) {
      console.error("Failed to fetch services", error);
      setError(true);
      Alert.alert("Error", "Failed to load services. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading services...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load services.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Services</Text>
      <FlatList
        data={services}
        renderItem={({ item }) => <ServiceCard service={item} />}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 15,
    textAlign: "center",
  },
  serviceCard: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  serviceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "gray",
  },
  servicePrice: {
    fontWeight: "bold",
    fontSize: 16,
    color: "green",
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default Explore_Page;