import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Create a cache for other user profiles
const otherUserCache = new Map<number, { name: string; image: string | null }>();

interface Chat {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
}

interface ChatCardProps {
  chat: Chat;
  currentUserId: number;
  newMessagesCount?: number; // Optional new messages count
}

const ChatCard: React.FC<ChatCardProps> = ({ chat, currentUserId, newMessagesCount = 0 }) => {
  const router = useRouter();
  const [otherUserName, setOtherUserName] = useState<string>('Loading...');
  const [otherUserImage, setOtherUserImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine the other user's id based on currentUserId
  const otherUserId = currentUserId === chat.user1_id ? chat.user2_id : chat.user1_id;

  useEffect(() => {
    const fetchProfile = async () => {
      // Check cache first
      const cached = otherUserCache.get(otherUserId);
      if (cached) {
        setOtherUserName(cached.name);
        setOtherUserImage(cached.image);
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST}/api/users/get_profile/${otherUserId}`
        );
        const name = response.data.name || 'Unknown';
        const sanitizeImageUrl = (img: string | null) => {
          if (!img) return null;
          const trimmed = img.trim();
          if (trimmed.startsWith('http')) return trimmed;
          return `${process.env.EXPO_PUBLIC_HOST?.replace(/\/$/, '')}${trimmed}`;
        };
        const image = sanitizeImageUrl(response.data.image);
        // Cache the profile info
        otherUserCache.set(otherUserId, { name, image });
        setOtherUserName(name);
        setOtherUserImage(image);
      } catch (error) {
        console.error('Error fetching profile for user', otherUserId, error);
        setOtherUserName('Unknown');
        setOtherUserImage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [otherUserId]);

  const handlePress = () => {
    // Navigate to the chat details screen, passing the chat id
    router.push(`/screens/chatScreens/${chat.id}`);
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {otherUserImage ? (
        <Image source={{ uri: otherUserImage }} style={styles.image} />
      ) : (
        <View style={[styles.image, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={24} color="white" />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{otherUserName}</Text>
        <Text style={styles.subtitle}>
          {newMessagesCount > 0
            ? `${newMessagesCount} new message${newMessagesCount !== 1 ? 's' : ''}`
            : 'No new messages'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
});

export default ChatCard;
