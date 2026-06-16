import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../services/firebase';
import { ref, query, orderByChild, equalTo, push, set, onValue } from 'firebase/database';
import {
  Plus,
  Briefcase,
  Clock,
  CheckCircle,
  Users,
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Hammer,
  MapPin,
  Send,
  Phone,
  Sliders,
  Bell,
} from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HirerJob {
  id: string;
  status: 'open' | 'in-progress' | 'completed';
}

interface WorkerPost {
  id: string;
  workerUid: string;
  workerName: string;
  workerPhoneNumber?: string;
  title: string;           // e.g. "Expert Plumber — 5 yrs experience"
  category: string;
  location: string;
  rate: number;
  rateType: 'fixed' | 'hourly';
  createdAt: string;
  availability: string;    // e.g. "Available Now" | "Available Weekends"
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Carpentry: <Hammer size={20} color={COLORS.primary} />,
  Plumbing: <Droplets size={20} color="#3B82F6" />,
  Electrical: <Zap size={20} color="#F59E0B" />,
  Painting: <Paintbrush size={20} color="#8B5CF6" />,
  Cleaning: <Wrench size={20} color="#10B981" />,
  Welding: <Zap size={20} color="#EF4444" />,
  Masonry: <Hammer size={20} color="#6B7280" />,
  Other: <Briefcase size={20} color={COLORS.textMedium} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Carpentry: '#0061C9',
  Plumbing: '#3B82F6',
  Electrical: '#F59E0B',
  Painting: '#8B5CF6',
  Cleaning: '#10B981',
  Welding: '#EF4444',
  Masonry: '#6B7280',
  Other: '#94A3B8',
};

// ─── Avatar helper ─────────────────────────────────────────────────────────────
const getInitials = (name?: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const AVATAR_COLORS = [
  '#0061C9', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B',
  '#3B82F6', '#EC4899', '#14B8A6',
];
const getAvatarColor = (uid: string) =>
  AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Component ────────────────────────────────────────────────────────────────

export const HirerHomeScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { profile } = useAuth();

  const [hirerJobs, setHirerJobs] = useState<HirerJob[]>([]);
  const [workerPosts, setWorkerPosts] = useState<WorkerPost[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const locationFilter = route.params?.locationFilter || '';

  // ── Filter worker posts based on search query and location filter ────────
  const filteredWorkerPosts = workerPosts.filter((wp) => {
    const matchesSearch =
      !searchQuery ||
      (wp.workerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wp.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wp.title || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      !locationFilter ||
      (wp.location || '').toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  // ── Subscribe in real-time to all required tables ──────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!profile?.uid) return;

      // 1. Subscribe to hirer's own jobs (for stats) - filtered client side
      const jobsRef = ref(database, 'jobs');
      const unsubJobs = onValue(jobsRef, (snap) => {
        if (snap.exists()) {
          const list: HirerJob[] = Object.entries(snap.val())
            .map(([id, val]: any) => ({
              id,
              status: val.status,
              hirerUid: val.hirerUid,
            }))
            .filter((j: any) => j.hirerUid === profile.uid);
          setHirerJobs(list);
        } else {
          setHirerJobs([]);
        }
        setLoadingJobs(false);
      }, (err) => {
        console.error('Jobs subscription error:', err);
        setLoadingJobs(false);
      });

      // 2. Subscribe to active worker availability posts
      const postsQuery = query(ref(database, 'workerPosts'));
      const unsubPosts = onValue(postsQuery, (snap) => {
        if (snap.exists()) {
          const list: WorkerPost[] = Object.entries(snap.val())
            .map(([id, val]: any) => ({ id, ...val }))
            .filter((p) => p.status === 'open'); // Only active worker posts
          
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setWorkerPosts(list);
        } else {
          setWorkerPosts([]);
        }
        setLoadingWorkers(false);
      }, (err) => {
        console.error('Worker posts subscription error:', err);
        setLoadingWorkers(false);
      });

      // 3. Subscribe to sent requests to track button status - filtered client side
      const requestsRef = ref(database, 'requests');
      const unsubRequests = onValue(requestsRef, (snap) => {
        if (snap.exists()) {
          const list = Object.values(snap.val()).filter((r: any) => r.hirerUid === profile.uid);
          const ids = new Set<string>(
            list.map((r: any) => r.workerPostId as string)
          );
          setSentRequests(ids);
        } else {
          setSentRequests(new Set());
        }
      }, (err) => {
        console.error('Requests subscription error:', err);
      });

      // 4. Track pending incoming requests (worker-to-hirer)
      const unsubNotifs = onValue(requestsRef, (snap) => {
        if (snap.exists()) {
          const pending = Object.values(snap.val()).filter(
            (r: any) => r.hirerUid === profile.uid && r.type === 'worker-to-hirer' && r.status === 'pending'
          ).length;
          setPendingCount(pending);
        } else {
          setPendingCount(0);
        }
      });

      // Cleanup listeners
      return () => {
        unsubJobs();
        unsubPosts();
        unsubRequests();
        unsubNotifs();
      };
    }, [profile?.uid])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // ── Send request to a worker ─────────────────────────────────────────────
  const handleSendRequest = async (wp: WorkerPost) => {
    if (!profile?.uid) return;
    setSendingRequest(wp.id);
    try {
      const requestsRef = ref(database, 'requests');
      const newReqRef = push(requestsRef);
      const reqId = newReqRef.key;

      await set(newReqRef, {
        id: reqId,
        type: 'hirer-to-worker',
        hirerUid: profile.uid,
        hirerName: profile.fullName || 'Hirer',
        hirerPhoneNumber: profile.phoneNumber || '',
        workerUid: wp.workerUid,
        workerName: wp.workerName,
        workerPhoneNumber: wp.workerPhoneNumber || '',
        workerPostId: wp.id,
        workerPostTitle: wp.title,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      
      Alert.alert('Request Sent', `Your request has been successfully sent to ${wp.workerName}.`);
    } catch (e) {
      console.error('Send request error:', e);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setSendingRequest(null);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalJobs = hirerJobs.length;
  const activeJobs = hirerJobs.filter((j) => j.status === 'open' || j.status === 'in-progress').length;
  const completedJobs = hirerJobs.filter((j) => j.status === 'completed').length;

  const firstName = profile?.fullName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.nameText}>{firstName} 👋</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.bellBtn} 
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <Bell size={22} color={COLORS.textMedium} />
            {pendingCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.postJobBtn}
            onPress={() => navigation.navigate('PostJob')}
            activeOpacity={0.85}
          >
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.postJobBtnText}>Post Job</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <Briefcase size={22} color={COLORS.white} />
            <Text style={styles.statNumber}>{loadingJobs ? '—' : totalJobs}</Text>
            <Text style={styles.statLabel}>Total Posted</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Clock size={22} color={COLORS.white} />
            <Text style={styles.statNumber}>{loadingJobs ? '—' : activeJobs}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <CheckCircle size={22} color={COLORS.white} />
            <Text style={styles.statNumber}>{loadingJobs ? '—' : completedJobs}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* ── Search & Filter Bar ── */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInner}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search worker name, category, title..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn} activeOpacity={0.7}>
                <Text style={styles.clearBtnTextSymbol}>×</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              locationFilter ? { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary } : {}
            ]}
            onPress={() =>
              navigation.navigate('Filter', {
                fromScreen: 'ClientHome',
                currentFilter: locationFilter,
                themeColor: COLORS.primary,
              })
            }
            activeOpacity={0.8}
          >
            <Sliders size={18} color={locationFilter ? COLORS.primary : COLORS.textMedium} />
          </TouchableOpacity>
        </View>

        {/* ── Location Filter Badge ── */}
        {locationFilter ? (
          <View style={styles.filterBadgeRow}>
            <View style={styles.filterBadge}>
              <MapPin size={12} color={COLORS.primary} />
              <Text style={styles.filterBadgeText}>Location: {locationFilter}</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.setParams({ locationFilter: '' })
                }
                style={styles.filterBadgeClose}
                activeOpacity={0.7}
              >
                <Text style={styles.filterBadgeCloseText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ── Post by Category ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Post by Category</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => (
            <TouchableOpacity
              key={cat}
              style={styles.categoryChip}
              onPress={() => navigation.navigate('PostJob', { preselectedCategory: cat })}
              activeOpacity={0.8}
            >
              {icon}
              <Text style={styles.categoryChipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Posted by Workers ── */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Users size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Posted by Workers</Text>
          </View>
          {filteredWorkerPosts.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredWorkerPosts.length} available</Text>
            </View>
          )}
        </View>

        {loadingWorkers ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
        ) : workerPosts.length === 0 ? (
          <View style={styles.emptyWorkerState}>
            <View style={styles.emptyWorkerIcon}>
              <Users size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyWorkerTitle}>No workers posted yet</Text>
            <Text style={styles.emptyWorkerSubtitle}>
              Skilled workers will appear here once they post their availability.{'\n'}
              Try posting a job and let workers come to you!
            </Text>
          </View>
        ) : filteredWorkerPosts.length === 0 ? (
          <View style={styles.emptyWorkerState}>
            <View style={styles.emptyWorkerIcon}>
              <Users size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyWorkerTitle}>No matching workers</Text>
            <Text style={styles.emptyWorkerSubtitle}>
              No workers match your search query or location filter. Try clearing them.
            </Text>
          </View>
        ) : (
          filteredWorkerPosts.map((wp) => {
            const alreadySent = sentRequests.has(wp.id);
            const isSending = sendingRequest === wp.id;
            const avatarColor = getAvatarColor(wp.workerUid);
            const catColor = CATEGORY_COLORS[wp.category] || COLORS.primary;

            return (
              <View key={wp.id} style={styles.workerCard}>
                {/* Left side: Avatar */}
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarText}>{getInitials(wp.workerName)}</Text>
                </View>

                {/* Center: Info */}
                <View style={styles.workerInfo}>
                  <View style={[styles.categoryBadge, { backgroundColor: catColor + '18' }]}>
                    <Text style={[styles.categoryBadgeText, { color: catColor }]}>{wp.category}</Text>
                  </View>

                  <Text style={styles.workerTitle} numberOfLines={2}>{wp.title}</Text>

                  <View style={styles.contactRow}>
                    <Text style={styles.workerName}>{wp.workerName}</Text>
                    {wp.workerPhoneNumber ? (
                      <View style={styles.phoneBox}>
                        <Phone size={10} color={COLORS.textMedium} />
                        <Text style={styles.phoneNumber}>{wp.workerPhoneNumber}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={11} color={COLORS.textLight} />
                      <Text style={styles.metaText} numberOfLines={1}>{wp.location}</Text>
                    </View>
                    <Text style={styles.rateText}>
                      ₹{wp.rate.toLocaleString('en-IN')}{wp.rateType === 'hourly' ? '/hr' : ''}
                    </Text>
                  </View>

                  <View style={styles.cardBottom}>
                    <View style={styles.availBox}>
                      <View style={styles.availDot} />
                      <Text style={styles.availText}>{wp.availability || 'Available'}</Text>
                    </View>

                    {isSending ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.sendBtn,
                          alreadySent && styles.sendBtnDisabled,
                        ]}
                        onPress={() => !alreadySent && handleSendRequest(wp)}
                        disabled={alreadySent}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.sendBtnText, alreadySent && styles.sendBtnTextDisabled]}>
                          {alreadySent ? 'Requested' : 'Send Request'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  greetingText: { fontSize: 13, color: COLORS.textMedium, fontWeight: '500' },
  nameText: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  postJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    gap: 6,
  },
  postJobBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { position: 'relative', padding: 4 },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  bellBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  scrollContent: { paddingBottom: SPACING.xxl },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    ...SHADOWS.sm,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginTop: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countBadgeText: { fontSize: 11 },

  // Categories
  categoriesScroll: { paddingLeft: SPACING.xl },
  categoryChip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    gap: 4,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 72,
  },
  categoryChipText: { fontSize: 10, fontWeight: '600', color: COLORS.textDark, textAlign: 'center' },

  // Worker posts empty state
  emptyWorkerState: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  },
  emptyWorkerIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWorkerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  emptyWorkerSubtitle: {
    fontSize: 13,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Worker card
  workerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  workerInfo: { flex: 1 },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '800' },
  workerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  workerName: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  phoneNumber: { fontSize: 11, fontWeight: '600', color: COLORS.textMedium },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, marginRight: 8 },
  metaText: { fontSize: 12, color: COLORS.textMedium },
  rateText: { fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  availBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  availText: { fontSize: 11, fontWeight: '600', color: COLORS.textMedium },
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    ...SHADOWS.sm,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  sendBtnTextDisabled: { color: COLORS.textLight },

  // Search & Filter
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  searchInner: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    height: 46,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingRight: SPACING.xl + 10,
    fontSize: 14,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchClearBtn: {
    position: 'absolute',
    right: SPACING.sm,
    padding: 6,
  },
  clearBtnTextSymbol: {
    color: COLORS.textLight,
    fontSize: 20,
    fontWeight: '600',
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterBadgeClose: {
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  filterBadgeCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
