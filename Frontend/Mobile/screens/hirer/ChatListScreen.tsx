import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../services/firebase';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { MessageCircle, Clock } from 'lucide-react-native';

interface Chat {
  id: string;
  hirerUid: string;
  hirerName: string;
  workerUid: string;
  workerName: string;
  lastMessage: string;
  lastMessageAt: string;
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

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const ChatListScreen = ({ navigation }: { navigation: any }) => {
  const { profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile?.uid || !profile?.role) return;

    const unsubscribe = onValue(ref(database, 'chats'), (snap) => {
      if (snap.exists()) {
        const list: Chat[] = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter((c: any) => c.hirerUid === profile.uid || c.workerUid === profile.uid || c.id.includes(profile.uid));
        
        list.sort((a, b) => {
          const timeA = a.lastMessageAt || a.createdAt;
          const timeB = b.lastMessageAt || b.createdAt;
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        });
        setChats(list);
      } else {
        setChats([]);
      }
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Fetch chats error:', error);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [profile?.uid, profile?.role]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const renderItem = ({ item }: { item: Chat }) => {
    const isClient = profile?.role === 'client';
    let otherUid = isClient ? item.workerUid : item.hirerUid;
    let otherName = isClient ? item.workerName : item.hirerName;
    
    if (!otherUid) {
      otherUid = item.id.split('_').find((u: string) => u !== profile?.uid) || 'unknown';
    }
    if (!otherName) {
      otherName = isClient ? 'Worker' : 'Hirer';
    }

    const color = avatarColor(otherUid);
    const timeStr = formatTime(item.lastMessageAt || item.createdAt);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatScreen', {
          chatId: item.id,
          otherName: otherName,
          otherUid: otherUid,
        })}
        activeOpacity={0.85}
      >
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{getInitials(otherName)}</Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatTopRow}>
            <Text style={styles.chatName}>{otherName}</Text>
            <Text style={styles.chatTime}>{timeStr}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'Conversation started — say hello! 👋'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        {chats.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{chats.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : chats.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MessageCircle size={44} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No chats yet</Text>
          <Text style={styles.emptySubtitle}>
            When you accept a worker's application or a worker accepts your request, the chat will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  countBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  chatInfo: { flex: 1 },
  chatTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  chatName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  chatTime: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  lastMessage: { fontSize: 13, color: COLORS.textMedium, lineHeight: 18 },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: SPACING.xl + 52 + SPACING.md },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.sm,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: COLORS.textMedium, textAlign: 'center', lineHeight: 22 },
});
