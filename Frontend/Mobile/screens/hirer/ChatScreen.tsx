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
} from 'react-native';
import { ref, push, set, onValue, update } from 'firebase/database';
import { ArrowLeft, Send, Mic, Square, Play, Pause } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../services/firebase';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface Message {
  id: string;
  senderUid: string;
  senderName: string;
  type?: string;
  audioUrl?: string;
  text?: string;
  createdAt: string;
}

const AudioPlayer = ({ url, isMe }: { url: string, isMe: boolean }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = async () => {
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          newSound.setPositionAsync(0);
        }
      });
    } else {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const color = isMe ? COLORS.white : COLORS.textDark;
  return (
    <TouchableOpacity onPress={togglePlayPause} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', borderRadius: 20 }}>
      {isPlaying ? <Pause size={20} color={color} /> : <Play size={20} color={color} />}
      <Text style={{ color: color, fontWeight: '600' }}>Voice Message</Text>
    </TouchableOpacity>
  );
};

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0] ?? '').join('').toUpperCase().slice(0, 2);

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

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

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
      
      const chatRef = ref(database, `chats/${chatId}`);
      await update(chatRef, {
        lastMessage: textToSend,
        lastMessageAt: timestamp,
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

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        const base64Audio = `data:audio/m4a;base64,${base64}`;
        
        const messagesRef = ref(database, `messages/${chatId}`);
        const newMsgRef = push(messagesRef);
        const timestamp = new Date().toISOString();
        await set(newMsgRef, {
          type: 'voice',
          audioUrl: base64Audio,
          senderUid: profile?.uid,
          senderName: profile?.fullName || 'Hirer',
          createdAt: timestamp,
        });
        
        const chatRef = ref(database, `chats/${chatId}`);
        await update(chatRef, {
          lastMessage: 'Voice message',
          lastMessageAt: timestamp,
        });
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    setRecording(null);
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.senderUid === profile?.uid;

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
          {item.type === 'voice' && item.audioUrl ? (
            <AudioPlayer url={item.audioUrl} isMe={isMe} />
          ) : (
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
              {item.text}
            </Text>
          )}
          <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.otherMessageTime]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={COLORS.textDark} />
        </TouchableOpacity>

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
          {isRecording ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }} />
                <Text style={{ color: '#EF4444', fontWeight: '700' }}>Recording...</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity onPress={cancelRecording}>
                  <Text style={{ color: COLORS.textMedium, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={stopRecording} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                  <Square size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={startRecording} style={{ padding: SPACING.xs, marginRight: SPACING.xs }}>
                <Mic size={24} color={COLORS.primary} />
              </TouchableOpacity>
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
          )}
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
