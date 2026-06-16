import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, MapPin, Briefcase, Clock, FileText, User } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { database } from '../services/firebase';
import { ref, onValue, remove, get } from 'firebase/database';

export const ManageReportsScreen = ({ navigation }: { navigation: any }) => {
  const { profile } = useAuth();
  const isWorker = profile?.role === 'worker';
  const themeColor = isWorker ? COLORS.success : COLORS.primary;

  const [posts, setPosts] = useState<any[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'requests'>('posts');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    
    const dbPath = isWorker ? 'workerPosts' : 'jobs';

    // Fetch user posts
    const unsubPosts = onValue(ref(database, dbPath), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(item => isWorker ? item.workerUid === profile.uid : item.hirerUid === profile.uid)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(list);
      } else {
        setPosts([]);
      }
    });

    // Fetch accepted requests
    const unsubRequests = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(r => (isWorker ? r.workerUid === profile.uid : r.hirerUid === profile.uid) && r.status === 'accepted')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAcceptedRequests(list);
      } else {
        setAcceptedRequests([]);
      }
      setLoading(false);
    });

    return () => {
      unsubPosts();
      unsubRequests();
    };
  }, [profile?.uid, isWorker]);

  const handleDeleteRequest = (item: any, isRequest: boolean) => {
    const title = isRequest 
      ? (item.jobTitle || item.workerPostTitle || 'Job Engagement')
      : item.title;
      
    Alert.alert(
      isRequest ? 'End Engagement?' : 'Delete Post?',
      isRequest 
        ? `Are you sure you want to end the engagement for "${title}"? This will delete the request and its chat conversation.`
        : `Deleting "${title}" will permanently remove the post, all applications, and all related chat conversations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(item.id, isRequest),
        },
      ]
    );
  };

  const confirmDelete = async (itemId: string, isRequest: boolean) => {
    if (!profile?.uid) return;
    setDeleting(true);

    try {
      if (isRequest) {
        // Find the specific request details to delete chat
        const reqRef = ref(database, `requests/${itemId}`);
        const reqSnap = await get(reqRef);
        if (reqSnap.exists()) {
          const reqVal = reqSnap.val();
          const chatId = [reqVal.hirerUid, reqVal.workerUid].sort().join('_');
          
          // Delete request and chat
          await remove(ref(database, `requests/${itemId}`));
          await remove(ref(database, `chats/${chatId}`));
        } else {
          await remove(ref(database, `requests/${itemId}`));
        }
        Alert.alert('Success', 'Engagement ended and chat history removed.');
      } else {
        const dbPath = isWorker ? 'workerPosts' : 'jobs';
        // Cascade delete for posts
        const requestsSnap = await get(ref(database, 'requests'));
        const relatedRequests: string[] = [];
        const relatedChatIds = new Set<string>();

        if (requestsSnap.exists()) {
          Object.entries(requestsSnap.val()).forEach(([reqId, reqVal]: any) => {
            const isRelated = isWorker
              ? reqVal.workerPostId === itemId
              : reqVal.jobId === itemId;

            if (isRelated) {
              relatedRequests.push(reqId);
              const chatId = [reqVal.hirerUid, reqVal.workerUid].sort().join('_');
              relatedChatIds.add(chatId);
            }
          });
        }

        for (const reqId of relatedRequests) {
          await remove(ref(database, `requests/${reqId}`));
        }

        for (const chatId of relatedChatIds) {
          await remove(ref(database, `chats/${chatId}`));
        }

        await remove(ref(database, `${dbPath}/${itemId}`));
        Alert.alert('Success', 'Deleted post and all related applications/chats.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const renderPost = ({ item }: { item: any }) => {
    const price = isWorker ? item.rate : item.budget;
    const priceType = isWorker ? item.rateType : item.budgetType;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteRequest(item, false)}
            disabled={deleting}
          >
            <Trash2 size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Briefcase size={14} color={COLORS.textLight} />
          <Text style={styles.infoText}>{item.category}</Text>
        </View>

        {item.location && (
          <View style={styles.infoRow}>
            <MapPin size={14} color={COLORS.textLight} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        )}

        <View style={styles.cardBottom}>
          <View style={styles.metaBox}>
            <Clock size={12} color={COLORS.textLight} />
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>

          {price ? (
            <Text style={styles.priceText}>
              ₹{price.toLocaleString('en-IN')}
              {priceType === 'hourly' ? '/hr' : ''}
            </Text>
          ) : null}

          <View style={[styles.statusBadge, { backgroundColor: item.status === 'open' ? COLORS.success + '15' : COLORS.textLight + '15' }]}>
            <Text style={[styles.statusText, { color: item.status === 'open' ? COLORS.success : COLORS.textMedium }]}>
              {item.status?.toUpperCase() || 'OPEN'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAcceptedRequest = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>
            {item.jobTitle || item.workerPostTitle || 'Job Engagement'}
          </Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteRequest(item, true)}
            disabled={deleting}
          >
            <Trash2 size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <User size={14} color={COLORS.textLight} />
          <Text style={styles.infoText}>
            {isWorker ? `Client: ${item.hirerName}` : `Worker: ${item.workerName}`}
          </Text>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.metaBox}>
            <Clock size={12} color={COLORS.textLight} />
            <Text style={styles.timeText}>
              Accepted: {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '15' }]}>
            <Text style={[styles.statusText, { color: COLORS.success }]}>
              {item.status?.toUpperCase() || 'ACCEPTED'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'posts' && { backgroundColor: themeColor }]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && { color: COLORS.white }]}>
            My Posts ({posts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'requests' && { backgroundColor: themeColor }]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && { color: COLORS.white }]}>
            Accepted Jobs ({acceptedRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColor} />
        </View>
      ) : activeTab === 'posts' ? (
        posts.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: themeColor + '15' }]}>
              <Briefcase size={44} color={themeColor} />
            </View>
            <Text style={styles.emptyTitle}>No Posts Yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven't posted any {isWorker ? 'skills availability' : 'job openings'} yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderPost}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : acceptedRequests.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: themeColor + '15' }]}>
            <FileText size={44} color={themeColor} />
          </View>
          <Text style={styles.emptyTitle}>No Accepted Jobs</Text>
          <Text style={styles.emptySubtitle}>
            Active accepted request reports will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={acceptedRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderAcceptedRequest}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, height: 56, borderBottomWidth: 1,
    borderBottomColor: COLORS.border, backgroundColor: COLORS.white, ...SHADOWS.sm,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  tabsContainer: {
    flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.border
  },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyIconBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMedium, textAlign: 'center', lineHeight: 20 },
  listContent: { padding: SPACING.md, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  deleteBtn: { padding: 6, backgroundColor: '#FEE2E2', borderRadius: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  infoText: { fontSize: 13, color: COLORS.textMedium },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm, marginTop: SPACING.sm },
  metaBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: COLORS.textLight },
  priceText: { fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '800' },
});
