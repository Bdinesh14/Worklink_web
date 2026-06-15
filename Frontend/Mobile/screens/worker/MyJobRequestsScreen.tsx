import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../services/firebase';
import { ref, query, orderByChild, equalTo, get, update } from 'firebase/database';
import {
  Briefcase,
  Clock,
  XCircle,
  Wrench,
  Droplets,
  Zap,
  Paintbrush,
  Hammer,
  Plus,
  MapPin,
  RotateCcw,
  Lock,
  CheckCircle,
} from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type PostStatus = 'open' | 'closed';

interface WorkerPost {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  rate: number;
  rateType: 'fixed' | 'hourly';
  availability: string;
  status: PostStatus;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Carpentry: <Hammer size={18} color={COLORS.success} />,
  Plumbing: <Droplets size={18} color="#3B82F6" />,
  Electrical: <Zap size={18} color="#F59E0B" />,
  Painting: <Paintbrush size={18} color="#8B5CF6" />,
  Cleaning: <Wrench size={18} color="#10B981" />,
  Welding: <Zap size={18} color="#EF4444" />,
  Masonry: <Hammer size={18} color="#6B7280" />,
  Other: <Briefcase size={18} color={COLORS.textMedium} />,
};

const STATUS_INFO: Record<PostStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open:   { label: 'Active', color: '#10B981', icon: <Clock size={12} color="#10B981" /> },
  closed: { label: 'Closed', color: '#EF4444', icon: <Lock size={12} color="#EF4444" /> },
};

const FILTER_TABS: { label: string; statuses: PostStatus[] }[] = [
  { label: 'All',    statuses: ['open', 'closed'] },
  { label: 'Open',   statuses: ['open'] },
  { label: 'Closed', statuses: ['closed'] },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const MyJobRequestsScreen = ({ navigation }: { navigation: any }) => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<WorkerPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const snapshot = await get(ref(database, 'workerPosts'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: WorkerPost[] = Object.entries(data)
          .map(([id, val]: any) => ({
            id,
            // Support legacy records without status by defaulting to open
            status: val.status || 'open',
            ...val,
          }))
          .filter((p: any) => p.workerUid === profile.uid);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(list);
      } else {
        setPosts([]);
      }
    } catch (e) {
      console.error('Fetch worker posts error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  // ── Status toggle ──────────────────────────────────────────────────────────
  const togglePostStatus = async (postId: string, currentStatus: PostStatus) => {
    const nextStatus: PostStatus = currentStatus === 'open' ? 'closed' : 'open';
    setUpdatingId(postId);
    try {
      await update(ref(database, `workerPosts/${postId}`), { status: nextStatus });
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: nextStatus } : p))
      );
    } catch (e) {
      console.error('Toggle status error:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = (post: WorkerPost) => {
    const title = post.status === 'open' ? 'Close Post' : 'Reopen Post';
    const message =
      post.status === 'open'
        ? 'Are you sure you want to close this listing? Hirers will no longer see it on their feeds.'
        : 'Reopen this listing so it appears on Hirers\' dashboards?';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: post.status === 'open' ? 'Close' : 'Reopen',
        style: post.status === 'open' ? 'destructive' : 'default',
        onPress: () => togglePostStatus(post.id, post.status),
      },
    ]);
  };

  // ── Filter Logic ───────────────────────────────────────────────────────────
  const activeTab = FILTER_TABS.find((t) => t.label === filter) ?? FILTER_TABS[0];
  const filteredPosts = posts.filter((p) => activeTab.statuses.includes(p.status));

  const countFor = (tab: typeof FILTER_TABS[number]) =>
    posts.filter((p) => tab.statuses.includes(p.status)).length;

  const renderPost = ({ item }: { item: WorkerPost }) => {
    const si = STATUS_INFO[item.status];
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.postCard}>
        {/* Top details */}
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.success + '15' }]}>
            {CATEGORY_ICONS[item.category] ?? <Briefcase size={18} color={COLORS.success} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.postTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.postCategory}>{item.category}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: si.color + '15' }]}>
            {si.icon}
            <Text style={[styles.statusText, { color: si.color }]}>{si.label}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.postDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Metadata */}
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MapPin size={12} color={COLORS.textLight} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={styles.availBadge}>
            <Text style={styles.availText}>{item.availability || 'Available'}</Text>
          </View>
        </View>

        {/* Rate and action buttons */}
        <View style={styles.cardBottom}>
          <Text style={styles.rateText}>
            ₹{item.rate.toLocaleString('en-IN')}
            {item.rateType === 'hourly' ? '/hr' : ' fixed'}
          </Text>

          {isUpdating ? (
            <ActivityIndicator size="small" color={COLORS.success} />
          ) : (
            <View style={styles.actionsRow}>
              {item.status === 'open' ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={() => handleToggleStatus(item)}
                  activeOpacity={0.85}
                >
                  <Lock size={12} color="#EF4444" />
                  <Text style={styles.actionBtnTextDanger}>Close Listing</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={() => handleToggleStatus(item)}
                  activeOpacity={0.85}
                >
                  <RotateCcw size={12} color={COLORS.success} />
                  <Text style={styles.actionBtnTextSuccess}>Reopen</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Job Request</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PostAvailability')}
          activeOpacity={0.85}
        >
          <Plus size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Row */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map((tab) => {
            const count = countFor(tab);
            const isActive = filter === tab.label;
            return (
              <TouchableOpacity
                key={tab.label}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setFilter(tab.label)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && tab.label !== 'All' && (
                  <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={COLORS.success} style={{ marginTop: SPACING.xl }} />
      ) : filteredPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Briefcase size={52} color={COLORS.border} />
          <Text style={styles.emptyTitle}>
            {filter === 'All' ? 'No availability posts yet' : `No ${filter.toLowerCase()} listings`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'All'
              ? 'Post your first skills listing to advertise your services to Hirers!'
              : `You have no ${filter.toLowerCase()} listings at the moment.`}
          </Text>
          {filter === 'All' && (
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('PostAvailability')}
              activeOpacity={0.85}
            >
              <Plus size={16} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>Post Skills Now</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 80 }}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    flexDirection: 'row',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bgLight,
  },
  filterTabActive: { backgroundColor: COLORS.success },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },
  filterTextActive: { color: COLORS.white },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabCountText: { fontSize: 10, fontWeight: '700', color: COLORS.textMedium },
  tabCountTextActive: { color: COLORS.white },

  // Cards
  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  postTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  postCategory: { fontSize: 12, color: COLORS.textMedium, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  postDesc: { fontSize: 13, color: COLORS.textMedium, lineHeight: 18, marginBottom: SPACING.sm },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textLight },
  availBadge: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  availText: { fontSize: 11, fontWeight: '700', color: COLORS.success },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: 2,
  },
  rateText: { fontSize: 15, fontWeight: '800', color: COLORS.textDark },
  actionsRow: { flexDirection: 'row', gap: SPACING.xs },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionBtnDanger: { borderWidth: 1.5, borderColor: '#EF4444' },
  actionBtnOutline: { borderWidth: 1.5, borderColor: COLORS.success },
  actionBtnTextDanger: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  actionBtnTextSuccess: { fontSize: 11, fontWeight: '700', color: COLORS.success },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: COLORS.textMedium, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    marginTop: SPACING.md,
    gap: 8,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
