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
  title: string;
  category: string;
  description: string;
  location: string;
  budgetType: 'fixed' | 'hourly';
  budget: number;
  urgency: string;
  hirerUid: string;
  hirerName: string;
  hirerPhoneNumber: string;
  status: 'open' | 'closed' | 'completed';
  createdAt: string;
}

interface WorkerRequest {
  id: string;
  type: 'worker-to-hirer' | 'hirer-to-worker';
  hirerUid: string;
  hirerName: string;
  workerUid: string;
  workerName: string;
  jobId?: string;
  jobTitle?: string;
  workerPostId?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Carpentry: <Hammer size={20} color={COLORS.success} />,
  Plumbing: <Droplets size={20} color="#3B82F6" />,
  Electrical: <Zap size={20} color="#F59E0B" />,
  Painting: <Paintbrush size={20} color="#8B5CF6" />,
  Cleaning: <Wrench size={20} color="#10B981" />,
  Welding: <Zap size={20} color="#EF4444" />,
  Masonry: <Hammer size={20} color="#6B7280" />,
  Other: <Briefcase size={20} color={COLORS.textMedium} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Carpentry: '#10B981',
  Plumbing: '#3B82F6',
  Electrical: '#F59E0B',
  Painting: '#8B5CF6',
  Cleaning: '#10B981',
  Welding: '#EF4444',
  Masonry: '#6B7280',
  Other: '#94A3B8',
};

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
  '#10B981', '#0061C9', '#8B5CF6', '#EF4444', '#F59E0B',
  '#3B82F6', '#EC4899', '#14B8A6',
];
const getAvatarColor = (uid: string) =>
  AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Component ────────────────────────────────────────────────────────────────

export const WorkerHomeScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { profile } = useAuth();

  const [hirerJobs, setHirerJobs] = useState<HirerJob[]>([]);
  const [requests, setRequests] = useState<WorkerRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<Map<string, { id: string; status: string }>>(new Map());
  const [existingJobIds, setExistingJobIds] = useState<Set<string>>(new Set());
  const [existingWorkerPostIds, setExistingWorkerPostIds] = useState<Set<string>>(new Set());
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const locationFilter = route.params?.locationFilter || '';

  // ── Filter jobs based on search query and location filter ────────────────
  const filteredHirerJobs = hirerJobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      (job.hirerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.title || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      !locationFilter ||
      (job.location || '').toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  // ── Subscribe in real-time to jobs and requests ───────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!profile?.uid) return;

      // 1. Subscribe to all open jobs posted by Hirers
      const jobsRef = ref(database, 'jobs');
      const unsubJobs = onValue(jobsRef, (snap) => {
        if (snap.exists()) {
          const rawData = snap.val();
          setExistingJobIds(new Set<string>(Object.keys(rawData)));

          const list: HirerJob[] = Object.entries(rawData)
            .map(([id, val]: any) => ({ id, ...val }))
            .filter((j: any) => j.status === 'open'); // Only open jobs

          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setHirerJobs(list);
        } else {
          setExistingJobIds(new Set());
          setHirerJobs([]);
        }
        setLoadingJobs(false);
      }, (err) => {
        console.error('Jobs subscription error:', err);
        setLoadingJobs(false);
      });

      // 2. Subscribe to worker requests (stats & button state) - filtered client side
      const requestsRef = ref(database, 'requests');
      const unsubRequests = onValue(requestsRef, (snap) => {
        if (snap.exists()) {
          const list: WorkerRequest[] = Object.entries(snap.val())
            .map(([id, val]: any) => ({
              id,
              ...val,
            }))
            .filter((r: any) => r.workerUid === profile.uid);

          const sentMap = new Map<string, { id: string; status: string }>();
          list.forEach((req) => {
            if (req.type === 'worker-to-hirer' && req.jobId) {
              sentMap.set(req.jobId, { id: req.id, status: req.status });
            }
          });
          setSentRequests(sentMap);
          setRequests(list);
        } else {
          setSentRequests(new Map());
          setRequests([]);
        }
        setLoadingRequests(false);
      }, (err) => {
        console.error('Requests subscription error:', err);
        setLoadingRequests(false);
      });

      // 3. Subscribe to active worker posts (to validate hirer-to-worker requests)
      const postsRef = ref(database, 'workerPosts');
      const unsubPosts = onValue(postsRef, (snap) => {
        if (snap.exists()) {
          setExistingWorkerPostIds(new Set<string>(Object.keys(snap.val())));
        } else {
          setExistingWorkerPostIds(new Set());
        }
      }, (err) => {
        console.error('Worker posts query error:', err);
      });

      // 4. Track pending incoming requests (hirer-to-worker)
      const unsubNotifs = onValue(requestsRef, (snap) => {
        if (snap.exists()) {
          const pending = Object.values(snap.val()).filter(
            (r: any) => r.workerUid === profile.uid && r.type === 'hirer-to-worker' && r.status === 'pending'
          ).length;
          setPendingCount(pending);
        } else {
          setPendingCount(0);
        }
      });

      // Cleanup listeners
      return () => {
        unsubJobs();
        unsubRequests();
        unsubPosts();
        unsubNotifs();
      };
    }, [profile?.uid])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // ── Send Request ───────────────────────────────────────────────────────────
  const handleSendRequest = async (job: HirerJob) => {
    if (!profile?.uid) return;
    setSendingRequest(job.id);
    try {
      const requestsRef = ref(database, 'requests');
      const newReqRef = push(requestsRef);
      const reqId = newReqRef.key;

      await set(newReqRef, {
        id: reqId,
        type: 'worker-to-hirer',
        hirerUid: job.hirerUid,
        hirerName: job.hirerName,
        hirerPhoneNumber: job.hirerPhoneNumber || '',
        workerUid: profile.uid,
        workerName: profile.fullName || 'Worker',
        workerPhoneNumber: profile.phoneNumber || '',
        jobId: job.id,
        jobTitle: job.title,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'Request Sent',
        `You have successfully applied to "${job.title}". The Hirer will review it.`
      );
    } catch (e) {
      console.error('Send request error:', e);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setSendingRequest(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  // Filter out any requests referencing jobs or availability posts that were deleted
  const validRequests = requests.filter((r) => {
    if (r.type === 'worker-to-hirer') {
      return r.jobId ? existingJobIds.has(r.jobId) : false;
    } else if (r.type === 'hirer-to-worker') {
      return r.workerPostId ? existingWorkerPostIds.has(r.workerPostId) : false;
    }
    return true;
  });

  const totalRequested = validRequests.length;
  const activeJobs = validRequests.filter((r) => r.status === 'accepted').length;
  const completedJobs = validRequests.filter((r) => r.status === 'rejected').length; // Stub or rejects count

  const firstName = profile?.fullName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={[styles.nameText, { color: COLORS.success }]}>{firstName} 👋</Text>
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
            style={styles.postAvailabilityBtn}
            onPress={() => navigation.navigate('PostAvailability')}
            activeOpacity={0.85}
          >
            <Send size={16} color={COLORS.white} />
            <Text style={styles.postAvailabilityBtnText}>Post Skills</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.success} />
        }
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.success }]}>
            <Briefcase size={22} color={COLORS.white} />
            <Text style={styles.statNumber}>{loadingRequests ? '—' : totalRequested}</Text>
            <Text style={styles.statLabel}>Jobs Requested</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
            <Clock size={22} color={COLORS.white} />
            <Text style={styles.statNumber}>{loadingRequests ? '—' : activeJobs}</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <CheckCircle size={22} color={COLORS.white} />
            <Text style={styles.statNumber}>{loadingRequests ? '—' : completedJobs}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* ── Search & Filter Bar ── */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInner}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search hirer name, category, title..."
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
              locationFilter ? { backgroundColor: COLORS.success + '15', borderColor: COLORS.success } : {}
            ]}
            onPress={() =>
              navigation.navigate('Filter', {
                fromScreen: 'WorkerHome',
                currentFilter: locationFilter,
                themeColor: COLORS.success,
              })
            }
            activeOpacity={0.8}
          >
            <Sliders size={18} color={locationFilter ? COLORS.success : COLORS.textMedium} />
          </TouchableOpacity>
        </View>

        {/* ── Location Filter Badge ── */}
        {locationFilter ? (
          <View style={styles.filterBadgeRow}>
            <View style={styles.filterBadge}>
              <MapPin size={12} color={COLORS.success} />
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

        {/* Categories horizontal list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Post by Category</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => (
            <TouchableOpacity 
              key={cat} 
              style={styles.categoryChip}
              onPress={() => navigation.navigate('PostAvailability', { preselectedCategory: cat })}
              activeOpacity={0.8}
            >
              {icon}
              <Text style={styles.categoryChipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Posted by Hirers list */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Users size={18} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Posted by Hirers</Text>
          </View>
          {filteredHirerJobs.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredHirerJobs.length} open jobs</Text>
            </View>
          )}
        </View>

        {loadingJobs ? (
          <ActivityIndicator color={COLORS.success} style={{ marginTop: SPACING.lg }} />
        ) : hirerJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Briefcase size={40} color={COLORS.success} />
            <Text style={styles.emptyTitle}>No open jobs yet</Text>
            <Text style={styles.emptySubtitle}>
              Jobs posted by Hirers in search of workers will appear here. Please pull to refresh.
            </Text>
          </View>
        ) : filteredHirerJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Briefcase size={40} color={COLORS.success} />
            <Text style={styles.emptyTitle}>No matching jobs</Text>
            <Text style={styles.emptySubtitle}>
              No jobs match your search query or location filter. Try clearing them.
            </Text>
          </View>
        ) : (
          filteredHirerJobs.map((job) => {
            const reqInfo = sentRequests.get(job.id);
            const alreadySent = !!reqInfo;
            const status = reqInfo?.status;
            const isSending = sendingRequest === job.id;
            const avatarColor = getAvatarColor(job.hirerUid);
            const catColor = CATEGORY_COLORS[job.category] || COLORS.success;

            return (
              <View key={job.id} style={styles.jobCard}>
                {/* Left side: Avatar */}
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarText}>{getInitials(job.hirerName)}</Text>
                </View>

                {/* Main Information */}
                <View style={styles.jobInfo}>
                  <View style={[styles.categoryBadge, { backgroundColor: catColor + '18' }]}>
                    <Text style={[styles.categoryBadgeText, { color: catColor }]}>{job.category}</Text>
                  </View>

                  <Text style={styles.jobTitle} numberOfLines={2}>
                    {job.title}
                  </Text>

                  <View style={styles.contactRow}>
                    <Text style={styles.hirerName}>{job.hirerName}</Text>
                    {job.hirerPhoneNumber ? (
                      <View style={styles.phoneBox}>
                        <Phone size={10} color={COLORS.textMedium} />
                        <Text style={styles.phoneNumber}>{job.hirerPhoneNumber}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={11} color={COLORS.textLight} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {job.location}
                      </Text>
                    </View>
                    <Text style={styles.rateText}>
                      ₹{job.budget.toLocaleString('en-IN')}
                      {job.budgetType === 'hourly' ? '/hr' : ''}
                    </Text>
                  </View>

                  <View style={styles.cardBottom}>
                    <View style={styles.urgencyBox}>
                      <View
                        style={[
                          styles.urgencyDot,
                          {
                            backgroundColor:
                              job.urgency === 'Emergency' || job.urgency === 'High'
                                ? '#EF4444'
                                : '#F59E0B',
                          },
                        ]}
                      />
                      <Text style={styles.urgencyText}>{job.urgency} Urgency</Text>
                    </View>

                    {isSending ? (
                      <ActivityIndicator size="small" color={COLORS.success} />
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.sendBtn,
                          alreadySent && styles.sendBtnDisabled,
                          status === 'accepted' && styles.sendBtnAccepted,
                        ]}
                        onPress={() => handleSendRequest(job)}
                        disabled={alreadySent}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.sendBtnText, alreadySent && styles.sendBtnTextDisabled]}>
                          {alreadySent
                            ? status === 'accepted'
                              ? 'Accepted'
                              : status === 'rejected'
                              ? 'Rejected'
                              : 'Pending'
                            : 'Send Request'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  greetingText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  nameText: { fontSize: 20, fontWeight: '800' },
  postAvailabilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  postAvailabilityBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
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
  scrollContent: { padding: SPACING.md, paddingBottom: 80 },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginVertical: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  countBadge: { backgroundColor: COLORS.success + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.success },

  // Categories
  categoriesScroll: { marginBottom: SPACING.lg, paddingLeft: SPACING.xs },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },

  // Job Cards
  jobCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
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
  jobInfo: { flex: 1 },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '800' },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  hirerName: { fontSize: 13, fontWeight: '600', color: COLORS.textMedium },
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
  urgencyBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  urgencyText: { fontSize: 11, fontWeight: '600', color: COLORS.textMedium },
  sendBtn: {
    backgroundColor: COLORS.success,
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
  sendBtnAccepted: {
    backgroundColor: '#D1FAE5',
  },
  sendBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  sendBtnTextDisabled: { color: COLORS.textLight },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: SPACING.xs,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, marginTop: SPACING.sm },
  emptySubtitle: { fontSize: 13, color: COLORS.textMedium, textAlign: 'center', lineHeight: 20 },

  // Search & Filter
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.md,
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
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.success + '15',
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  filterBadgeClose: {
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  filterBadgeCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
});
