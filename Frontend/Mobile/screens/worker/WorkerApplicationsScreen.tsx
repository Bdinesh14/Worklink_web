import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../services/firebase';
import { ref, query, orderByChild, equalTo, get, update, push, set } from 'firebase/database';
import {
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Inbox,
  User,
  Briefcase,
  Phone,
} from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestStatus = 'pending' | 'accepted' | 'rejected';

interface Request {
  id: string;
  type: 'hirer-to-worker' | 'worker-to-hirer';
  hirerUid: string;
  hirerName: string;
  workerUid: string;
  workerName: string;
  // hirer-to-worker fields
  workerPostId?: string;
  workerPostTitle?: string;
  // worker-to-hirer fields
  jobId?: string;
  jobTitle?: string;
  workerPhoneNumber?: string;
  hirerPhoneNumber?: string;
  status: RequestStatus;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name?: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const AVATAR_COLORS = [
  '#10B981', '#0061C9', '#8B5CF6', '#EF4444',
  '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6',
];
const avatarColor = (uid: string) =>
  AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',  color: '#F59E0B', bg: '#FEF3C7' },
  accepted: { label: 'Accepted', color: '#10B981', bg: '#D1FAE5' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2' },
};

const TABS = ['Received', 'Sent'];

// ─── Component ────────────────────────────────────────────────────────────────

export const WorkerApplicationsScreen = ({ navigation }: { navigation: any }) => {
  const { profile } = useAuth();

  const [tab, setTab] = useState<'Received' | 'Sent'>('Received');
  const [received, setReceived] = useState<Request[]>([]);   // hirer → worker's post
  const [sent, setSent] = useState<Request[]>([]);           // worker → hirer's job
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      // All requests where current user is the worker
      const q = query(ref(database, 'requests'), orderByChild('workerUid'), equalTo(profile.uid));
      const snap = await get(q);

      if (snap.exists()) {
        const all: Request[] = Object.entries(snap.val()).map(([id, val]: any) => ({
          id,
          type: val.type ?? 'hirer-to-worker',
          ...val,
        }));

        // Sort newest first
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Received: Requests sent by hirer to this worker's availability posts
        setReceived(all.filter((r) => r.type === 'hirer-to-worker'));
        // Sent: Requests sent by this worker to jobs posted by hirers
        setSent(all.filter((r) => r.type === 'worker-to-hirer'));
      } else {
        setReceived([]);
        setSent([]);
      }
    } catch (e) {
      console.error('Fetch applications error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  // ── Accept / Reject (Received requests from hirers) ─────────────────────────
  const handleAccept = (req: Request) => {
    Alert.alert(
      'Accept Request',
      `Accept ${req.hirerName}'s request for your post "${req.workerPostTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActingId(req.id);
            try {
              const chatId = [req.hirerUid, req.workerUid].sort().join('_');
              const chatData = {
                id: chatId,
                hirerUid: req.hirerUid,
                hirerName: req.hirerName,
                workerUid: req.workerUid,
                workerName: req.workerName,
                lastMessage: 'Request accepted! Chat is open. 👋',
                lastMessageAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              };

              const newMsgRef = push(ref(database, `messages/${chatId}`));
              const messageId = newMsgRef.key;
              const greetingMessage = {
                senderUid: req.workerUid,
                senderName: req.workerName,
                text: "I accepted your request! Let's chat here.",
                createdAt: new Date().toISOString(),
              };

              // Write to individual paths to avoid root "/" write check
              await update(ref(database, `requests/${req.id}`), { status: 'accepted' });
              await set(ref(database, `chats/${chatId}`), chatData);
              await set(ref(database, `messages/${chatId}/${messageId}`), greetingMessage);

              setReceived((prev) =>
                prev.map((r) => (r.id === req.id ? { ...r, status: 'accepted' } : r))
              );
            } catch (e) {
              console.error('Accept error:', e);
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (req: Request) => {
    Alert.alert(
      'Reject Request',
      `Reject ${req.hirerName}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActingId(req.id);
            try {
              await update(ref(database, `requests/${req.id}`), { status: 'rejected' });
              setReceived((prev) =>
                prev.map((r) => (r.id === req.id ? { ...r, status: 'rejected' } : r))
              );
            } catch (e) {
              console.error('Reject error:', e);
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  };

  // ── Render Card: Received (Hirer request to worker) ─────────────────────────
  const renderReceivedCard = ({ item }: { item: Request }) => {
    const color = avatarColor(item.hirerUid);
    const isActing = actingId === item.id;
    const sc = STATUS_CONFIG[item.status];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: color }]}>
            <Text style={styles.avatarText}>{getInitials(item.hirerName)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.personName}>{item.hirerName}</Text>
            <View style={styles.jobRow}>
              <User size={12} color={COLORS.textLight} />
              <Text style={styles.jobTitle} numberOfLines={1}>
                {item.workerPostTitle ?? 'Availability Post'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        <Text style={styles.timeText}>
          Received on{' '}
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>

        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            {isActing ? (
              <ActivityIndicator color={COLORS.success} />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(item)}
                  activeOpacity={0.85}
                >
                  <XCircle size={15} color="#EF4444" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(item)}
                  activeOpacity={0.85}
                >
                  <CheckCircle size={15} color={COLORS.white} />
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {item.status === 'accepted' && (
          <View style={styles.actionRow}>
            {item.hirerPhoneNumber ? (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${item.hirerPhoneNumber}`)}
                activeOpacity={0.85}
              >
                <Phone size={14} color={COLORS.success} />
                <Text style={styles.callBtnText}>Call</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.messageBtn, !item.hirerPhoneNumber && { flex: 1 }]}
              onPress={() => navigation.navigate('ChatScreen', {
                chatId: [item.hirerUid, item.workerUid].sort().join('_'),
                otherName: item.hirerName,
                otherUid: item.hirerUid,
              })}
              activeOpacity={0.85}
            >
              <Send size={14} color={COLORS.white} />
              <Text style={styles.messageBtnText}>Message Hirer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── Render Card: Sent (Worker request to hirer job) ─────────────────────────
  const renderSentCard = ({ item }: { item: Request }) => {
    const color = avatarColor(item.hirerUid);
    const sc = STATUS_CONFIG[item.status];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: color }]}>
            <Text style={styles.avatarText}>{getInitials(item.hirerName)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.personName}>{item.hirerName}</Text>
            <View style={styles.jobRow}>
              <Briefcase size={12} color={COLORS.textLight} />
              <Text style={styles.jobTitle} numberOfLines={1}>
                {item.jobTitle ?? 'Job Application'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            {item.status === 'pending' && <Clock size={11} color={sc.color} />}
            {item.status === 'accepted' && <CheckCircle size={11} color={sc.color} />}
            {item.status === 'rejected' && <XCircle size={11} color={sc.color} />}
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        <Text style={styles.timeText}>
          Sent on{' '}
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>

        {item.status === 'accepted' && (
          <View style={styles.actionRow}>
            {item.hirerPhoneNumber ? (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${item.hirerPhoneNumber}`)}
                activeOpacity={0.85}
              >
                <Phone size={14} color={COLORS.success} />
                <Text style={styles.callBtnText}>Call</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.messageBtn, !item.hirerPhoneNumber && { flex: 1 }]}
              onPress={() => navigation.navigate('ChatScreen', {
                chatId: [item.hirerUid, item.workerUid].sort().join('_'),
                otherName: item.hirerName,
                otherUid: item.hirerUid,
              })}
              activeOpacity={0.85}
            >
              <Send size={14} color={COLORS.white} />
              <Text style={styles.messageBtnText}>Message Hirer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const data = tab === 'Received' ? received : sent;
  const receivedPending = received.filter((r) => r.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Applications</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const isActive = tab === t;
          const badge = t === 'Received' ? receivedPending : 0;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setTab(t as any)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{t}</Text>
              {badge > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator color={COLORS.success} style={{ marginTop: SPACING.xl }} />
      ) : data.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Inbox size={40} color={COLORS.success} />
          </View>
          <Text style={styles.emptyTitle}>No requests found</Text>
          <Text style={styles.emptySubtitle}>
            {tab === 'Received'
              ? 'When Hirers contact you about your skills listings, they will show up here.'
              : 'When you apply to open jobs posted by Hirers, they will show up here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={tab === 'Received' ? renderReceivedCard : renderSentCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.success} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  header: {
    height: 56,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.bgLight,
  },
  tabBtnActive: { backgroundColor: COLORS.success },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.textMedium },
  tabTextActive: { color: COLORS.white },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
  listContent: { padding: SPACING.md, paddingBottom: 80 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  cardInfo: { flex: 1 },
  personName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 3 },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobTitle: { fontSize: 12, color: COLORS.textMedium, flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 11, color: COLORS.textLight, marginBottom: SPACING.sm },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#10B981',
  },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },

  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '15',
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  messageBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.success,
  },
  messageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
    marginTop: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: COLORS.textMedium, textAlign: 'center', lineHeight: 20 },
});
