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
  CheckCircle,
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
} from 'lucide-react-native';


// ─── Types ────────────────────────────────────────────────────────────────────

type JobStatus = 'open' | 'closed' | 'completed';

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  status: JobStatus;
  urgency: string;
  budget: number;
  budgetType: 'fixed' | 'hourly';
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Carpentry: <Hammer size={18} color={COLORS.primary} />,
  Plumbing: <Droplets size={18} color="#3B82F6" />,
  Electrical: <Zap size={18} color="#F59E0B" />,
  Painting: <Paintbrush size={18} color="#8B5CF6" />,
  Cleaning: <Wrench size={18} color="#10B981" />,
  Welding: <Zap size={18} color="#EF4444" />,
  Masonry: <Hammer size={18} color="#6B7280" />,
  Other: <Briefcase size={18} color={COLORS.textMedium} />,
};

const URGENCY_COLOR: Record<string, string> = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
  Emergency: '#7C3AED',
};

const STATUS_INFO: Record<JobStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open:      { label: 'Open',      color: '#10B981', icon: <Clock size={12} color="#10B981" /> },
  closed:    { label: 'Closed',    color: '#EF4444', icon: <Lock size={12} color="#EF4444" /> },
  completed: { label: 'Completed', color: '#6B7280', icon: <CheckCircle size={12} color="#6B7280" /> },
};

// Tab definition: label shown + which statuses it includes
const FILTER_TABS: { label: string; statuses: JobStatus[] }[] = [
  { label: 'All',       statuses: ['open', 'closed', 'completed'] },
  { label: 'Open',      statuses: ['open'] },
  { label: 'Closed',    statuses: ['closed'] },
  { label: 'Completed', statuses: ['completed'] },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const MyJobsScreen = ({ navigation }: { navigation: any }) => {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const snapshot = await get(ref(database, 'jobs'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Job[] = Object.entries(data)
          .map(([id, val]: any) => ({ id, ...val }))
          .filter((j: any) => j.hirerUid === profile.uid);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJobs(list);
      } else {
        setJobs([]);
      }
    } catch (e) {
      console.error('Fetch jobs error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  const onRefresh = () => { setRefreshing(true); fetchJobs(); };

  // ── Status update helper ───────────────────────────────────────────────────

  const updateStatus = async (jobId: string, newStatus: JobStatus) => {
    setUpdatingId(jobId);
    try {
      await update(ref(database, `jobs/${jobId}`), { status: newStatus });
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch (e) {
      console.error('Update job status error:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Action handlers ────────────────────────────────────────────────────────

  const confirmAction = (
    title: string,
    message: string,
    confirmLabel: string,
    isDestructive: boolean,
    onConfirm: () => void
  ) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmLabel, style: isDestructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
  };

  const handleMarkComplete = (job: Job) =>
    confirmAction(
      'Mark as Completed',
      'Mark this job as completed? This means the work is done.',
      'Mark Completed',
      false,
      () => updateStatus(job.id, 'completed')
    );

  const handleCloseJob = (job: Job) =>
    confirmAction(
      'Close Job',
      'Closing this job will stop new requests. Workers will no longer see it.',
      'Close Job',
      true,
      () => updateStatus(job.id, 'closed')
    );

  const handleReopenJob = (job: Job) =>
    confirmAction(
      'Reopen Job',
      'Reopen this job so workers can see and apply again?',
      'Reopen',
      false,
      () => updateStatus(job.id, 'open')
    );

  // ── Filter logic ───────────────────────────────────────────────────────────

  const activeTab = FILTER_TABS.find((t) => t.label === filter) ?? FILTER_TABS[0];
  const filteredJobs = jobs.filter((j) => activeTab.statuses.includes(j.status));

  // Count per tab for badges
  const countFor = (tab: typeof FILTER_TABS[number]) =>
    jobs.filter((j) => tab.statuses.includes(j.status)).length;

  // ── Render job card ────────────────────────────────────────────────────────

  const renderJob = ({ item }: { item: Job }) => {
    const si = STATUS_INFO[item.status];
    const urgencyColor = URGENCY_COLOR[item.urgency] || COLORS.textMedium;
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.jobCard}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            {CATEGORY_ICONS[item.category] ?? <Briefcase size={18} color={COLORS.primary} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.jobCategory}>{item.category}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: si.color + '18' }]}>
            {si.icon}
            <Text style={[styles.statusText, { color: si.color }]}>{si.label}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.jobDesc} numberOfLines={2}>{item.description}</Text>

        {/* Meta row */}
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <MapPin size={12} color={COLORS.textLight} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '18' }]}>
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>{item.urgency}</Text>
          </View>
        </View>

        {/* Budget + Actions */}
        <View style={styles.cardBottom}>
          <Text style={styles.budgetText}>
            ₹{item.budget.toLocaleString('en-IN')}{item.budgetType === 'hourly' ? '/hr' : ' fixed'}
          </Text>

          {isUpdating ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <View style={styles.actionsRow}>
              {/* OPEN → Mark Complete or Close */}
              {item.status === 'open' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnSuccess]}
                    onPress={() => handleMarkComplete(item)}
                    activeOpacity={0.85}
                  >
                    <CheckCircle size={12} color={COLORS.white} />
                    <Text style={styles.actionBtnTextWhite}>Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={() => handleCloseJob(item)}
                    activeOpacity={0.85}
                  >
                    <Lock size={12} color="#EF4444" />
                    <Text style={styles.actionBtnTextDanger}>Close</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* CLOSED → can Reopen */}
              {item.status === 'closed' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={() => handleReopenJob(item)}
                  activeOpacity={0.85}
                >
                  <RotateCcw size={12} color={COLORS.primary} />
                  <Text style={styles.actionBtnTextPrimary}>Reopen</Text>
                </TouchableOpacity>
              )}

              {/* COMPLETED → no actions */}
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PostJob')}
          activeOpacity={0.85}
        >
          <Plus size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs — scrollable so all 5 fit */}
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

      {/* Content */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Briefcase size={52} color={COLORS.border} />
          <Text style={styles.emptyTitle}>
            {filter === 'All' ? 'No jobs posted yet' : `No ${filter.toLowerCase()} jobs`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'All'
              ? 'Post your first job to find skilled workers'
              : `You have no ${filter.toLowerCase()} jobs at the moment`}
          </Text>
          {filter === 'All' && (
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('PostJob')}
              activeOpacity={0.85}
            >
              <Plus size={16} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>Post a Job</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJob}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        />
      )}
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
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
  filterTabActive: { backgroundColor: COLORS.primary },
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

  jobCard: {
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
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  jobCategory: { fontSize: 12, color: COLORS.textMedium, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  jobDesc: { fontSize: 13, color: COLORS.textMedium, lineHeight: 18, marginBottom: SPACING.sm },

  cardMeta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textLight },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  urgencyText: { fontSize: 11, fontWeight: '700' },

  cardBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: SPACING.sm, marginTop: 2,
  },
  budgetText: { fontSize: 15, fontWeight: '800', color: COLORS.textDark },

  actionsRow: { flexDirection: 'row', gap: SPACING.xs },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  actionBtnPrimary:  { backgroundColor: COLORS.primary },
  actionBtnSuccess:  { backgroundColor: '#10B981' },
  actionBtnDanger:   { borderWidth: 1.5, borderColor: '#EF4444' },
  actionBtnOutline:  { borderWidth: 1.5, borderColor: COLORS.primary },
  actionBtnTextWhite:   { fontSize: 11, fontWeight: '700', color: COLORS.white },
  actionBtnTextDanger:  { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  actionBtnTextPrimary: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: COLORS.textMedium, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, paddingVertical: 12,
    paddingHorizontal: SPACING.lg, borderRadius: 12,
    marginTop: SPACING.md, gap: 8,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
