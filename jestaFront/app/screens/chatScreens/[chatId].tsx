import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  Image 
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { UserContext } from '../../contexts/authContext';

// Create a cache for other user profiles (same as in chatCard)
const otherUserCache = new Map<number, { name: string; image: string | null }>();

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface ChatMeta {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
}

const ChatScreen: React.FC = () => {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { user } = useContext(UserContext);

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMeta, setChatMeta] = useState<ChatMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);

  const [otherUserName, setOtherUserName] = useState<string>('Loading...');
  const [otherUserImage, setOtherUserImage] = useState<string | null>(null);

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/chats/read_messages`,
        { chat_id: chatId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (error) {
      console.error("Error marking messages as read", error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/chats/chat_history/${chatId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const msgs: Message[] = response.data || [];
      setMessages(msgs);
      if (msgs.length > 0) {
        setLastMessageId(msgs[msgs.length - 1].id);
      }
    } catch (error) {
      console.error("Error fetching chat history", error);
    } finally {
      setLoading(false);
      markMessagesAsRead();
    }
  };

  const fetchChatMeta = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST}/api/chats/all_chats`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.status === 200 && response.data && response.data.chats) {
        const meta: ChatMeta | undefined = response.data.chats.find(
          (chat: ChatMeta) => chat.id === parseInt(chatId, 10)
        );
        if (meta) {
          setChatMeta(meta);
          const otherUserId = user.id === meta.user1_id ? meta.user2_id : meta.user1_id;
          fetchOtherUserProfile(otherUserId);
        }
      }
    } catch (error) {
      console.error("Error fetching chat metadata", error);
    }
  };

  // Updated fetchOtherUserProfile using caching (as in chatCard)
  const fetchOtherUserProfile = async (otherUserId: number) => {
    // Check cache first
    const cached = otherUserCache.get(otherUserId);
    if (cached) {
      setOtherUserName(cached.name);
      setOtherUserImage(cached.image);
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
      console.error("Error fetching other user's profile", error);
      setOtherUserName('Unknown');
      setOtherUserImage(null);
    }
  };

  useEffect(() => {
    if (!chatId) return;
    fetchChatHistory();
    fetchChatMeta();
  }, [chatId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST}/api/chats/get_new_messages`,
          {
            params: { chat_id: chatId, last_message_id: lastMessageId },
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        if (response.status === 200) {
          const newMsgs: Message[] = response.data || [];
          if (newMsgs.length > 0) {
            setMessages(prev => [...prev, ...newMsgs]);
            setLastMessageId(newMsgs[newMsgs.length - 1].id);
          }
        }
      } catch (err) {
        console.error("Error polling new messages", err);
      }
      markMessagesAsRead();
    }, 3000);
    return () => clearInterval(interval);
  }, [chatId, lastMessageId]);

  const handleSend = async () => {
    if (newMessage.trim() === '') return;
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST}/api/chats/send_message`,
        { chat_id: chatId, content: newMessage },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.status === 200) {
        const sentMsg: Message = {
          id: response.data.message_id,
          chat_id: parseInt(chatId as string, 10),
          sender_id: user.id,
          content: newMessage,
          timestamp: new Date().toISOString(),
          is_read: false,
        };
        setMessages(prev => [...prev, sentMsg]);
        setNewMessage('');
        setLastMessageId(sentMsg.id);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user.id;
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMyMessage ? styles.myText : styles.theirText]}>
          {item.content}
        </Text>
        <Text style={styles.timestampText}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        {/* Header with Back Button and Other User Profile */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/chat")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerProfile}>
            {otherUserImage ? (
              <Image source={{ uri: otherUserImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={24} color="white" />
              </View>
            )}
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerTitle}>{otherUserName}</Text>
              {/* Optionally, you could add new messages count here */}
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ref={flatListRef}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 40,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  backButton: {
    padding: 4,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
  },
  messageText: {
    fontSize: 16,
  },
  myText: {
    color: 'white',
  },
  theirText: {
    color: 'black',
  },
  timestampText: {
    fontSize: 10,
    color: 'white',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 20,
  },
});

export default ChatScreen;
