import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import ChatCard from '../../components/chatComponents/chatCard';
import { UserContext } from '../../contexts/authContext';

interface Chat {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
}

interface ChatListResponse {
  chats: Chat[];
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  timestamp: string;
  is_read: boolean;
}

const Chat: React.FC = () => {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Mapping from chat id to new message count
  const [newMessageCounts, setNewMessageCounts] = useState<{ [key: number]: number }>({});

  // Fetch all chats for the current user
  const fetchChats = async () => {
    try {
      const response = await axios.get<ChatListResponse>(
        `${process.env.EXPO_PUBLIC_HOST}/api/chats/all_chats`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.status === 200) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error('Error fetching chats', error);
    } finally {
      setLoading(false);
    }
  };

  // For a given chat, use get_new_messages endpoint to fetch messages (with last_message_id = 0)
  // then count unread messages not sent by the current user.
  const fetchNewMessageCount = async (chatId: number): Promise<number> => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/chats/get_new_messages`,
        {
          params: { chat_id: chatId, last_message_id: 0 },
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const messages: Message[] = response.data || [];
      const count = messages.filter(m => !m.is_read && m.sender_id !== user.id).length;
      return count;
    } catch (error) {
      console.error(`Error fetching new messages for chat ${chatId}`, error);
      return 0;
    }
  };

  // Update new message counts for all chats
  const updateNewMessageCounts = async (chats: Chat[]) => {
    const counts: { [key: number]: number } = {};
    await Promise.all(
      chats.map(async (chat) => {
        counts[chat.id] = await fetchNewMessageCount(chat.id);
      })
    );
    setNewMessageCounts(counts);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // When chats change, update the counts once...
  useEffect(() => {
    if (chats.length > 0) {
      updateNewMessageCounts(chats);
    }
  }, [chats]);

  // Then, set up an interval to refresh the counts every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (chats.length > 0) {
        updateNewMessageCounts(chats);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [chats]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : chats.length === 0 ? (
        <Text style={styles.emptyText}>No chats available.</Text>
      ) : (
        <ScrollView>
          {chats.map(chat => (
            <ChatCard
              key={chat.id}
              chat={chat}
              currentUserId={user.id}
              newMessagesCount={newMessageCounts[chat.id] || 0}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
});

export default Chat;
