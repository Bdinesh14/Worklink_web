import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ref, push, set, onValue, update, remove } from 'firebase/database';
import { ArrowLeft, Send } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../services/firebase';

interface Message {
  id: string;
  senderUid: string;
  senderName: string;
  type?: string;
  audioUrl?: string;
  text?: string;
  createdAt: string;
}

const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0] ?? '').join('').toUpperCase().slice(0, 2);
};

const AVATAR_COLORS = [
  '#0061C9', '#10B981', '#8B5CF6', '#EF4444',
  '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6',
];
const avatarColor = (uid: string) =>
  AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

export const ChatScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { chatId, otherName, otherUid } = route.params;
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = ref(database, `messages/${chatId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Message[] = Object.entries(data).map(([id, val]: any) => ({
          id,
          ...val,
        }));
        // Sort newest first (for FlatList inverted) using push IDs
        list.sort((a, b) => b.id.localeCompare(a.id));
        setMessages(list);
      } else {
        setMessages([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Real-time messages error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (!inputText.trim() || !profile?.uid) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const messagesRef = ref(database, `messages/${chatId}`);
      const newMsgRef = push(messagesRef);
      const timestamp = new Date().toISOString();

      const messageData = {
        type: 'text',
        senderUid: profile.uid,
        senderName: profile.fullName || 'Hirer',
        text: textToSend,
        createdAt: timestamp,
      };

      // Set the message and update the chat's metadata
      await set(newMsgRef, messageData);
      
      const isHirer = profile.role === 'client';
      const chatRef = ref(database, `chats/${chatId}`);
      await update(chatRef, {
        lastMessage: textToSend,
        lastMessageAt: timestamp,
        hirerUid: isHirer ? profile.uid : otherUid,
        workerUid: isHirer ? otherUid : profile.uid,
        hirerName: isHirer ? profile.fullName : otherName,
        workerName: isHirer ? otherName : profile.fullName,
      });

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };



  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.senderUid === profile?.uid;

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => {
            if (isMe) {
              Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    remove(ref(database, `messages/${chatId}/${item.id}`));
                  },
                },
              ]);
            }
          }}
          style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}
        >
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.otherMessageTime]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(otherUid) }]}>
          <Text style={styles.avatarText}>{getInitials(otherName)}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={styles.headerSubtitle}>Active Discussion</Text>
        </View>
      </View>

      {/* Message List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          inverted
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <>
            <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor={COLORS.textLight}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim()}
                activeOpacity={0.8}
              >
                <Send size={18} color={COLORS.white} />
              </TouchableOpacity>
            </>
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    width: '100%',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    ...SHADOWS.sm,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.white,
  },
  otherMessageText: {
    color: COLORS.textDark,
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: COLORS.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginRight: SPACING.sm,
    fontSize: 14,
    color: COLORS.textDark,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});
