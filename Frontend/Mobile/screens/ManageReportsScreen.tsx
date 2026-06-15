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
import { ArrowLeft, Trash2, MapPin, Briefcase, Clock, FileText } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { database } from '../services/firebase';
import { ref, query, orderByChild, equalTo, onValue, remove, get } from 'firebase/database';

interface UserListing {
  id: string;
  title: string;
  category: string;
  location: string;
  status: string;
  rate?: number;
  rateType?: string;
  budget?: number;
  budgetType?: string;
  createdAt: string;
}

export const ManageReportsScreen = ({ navigation }: { navigation: any }) => {
  const { profile } = useAuth();
  const isClient = profile?.role === 'client';
  const themeColor = isClient ? COLORS.primary : COLORS.success;

  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid || !profile?.role) return;

    const dbPath = isClient ? 'jobs' : 'workerPosts';

    const unsubscribe = onValue(ref(database, dbPath), (snap) => {
      if (snap.exists()) {
        const list: UserListing[] = Object.entries(snap.val())
          .map(([id, val]: any) => ({
            id,
            ...val,
          }))
          .filter((item: any) => (isClient ? item.hirerUid : item.workerUid) === profile.uid);
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setListings(list);
      } else {
        setListings([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Fetch user listings error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.uid, profile?.role]);

  const handleDelete = (item: UserListing) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to permanently delete "${item.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const dbPath = isClient ? 'jobs' : 'workerPosts';
              // 1. Delete the job or post itself
              await remove(ref(database, `${dbPath}/${item.id}`));

              // 2. Cascade delete requests referencing this job or post
              const reqsRef = ref(database, 'requests');
              const filterField = isClient ? 'jobId' : 'workerPostId';
              const reqsQuery = query(reqsRef, orderByChild(filterField), equalTo(item.id));
              
              const snap = await get(reqsQuery);
              if (snap.exists()) {
                const deletePromises = Object.keys(snap.val()).map((reqId) => 
                  remove(ref(database, `requests/${reqId}`))
                );
                await Promise.all(deletePromises);
              }

              Alert.alert('Deleted', 'Your listing has been successfully deleted.');
            } catch (e) {
              console.error('Delete listing error:', e);
              Alert.alert('Error', 'Failed to delete listing. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: UserListing }) => {
    const isCompleted = item.status === 'completed';
    const isClosed = item.status === 'closed';

    // Format price
    const price = isClient ? item.budget : item.rate;
    const priceType = isClient ? item.budgetType : item.rateType;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <Briefcase size={14} color={COLORS.textLight} />
          <Text style={styles.infoText}>{item.category}</Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={14} color={COLORS.textLight} />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>

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
              {priceType === 'hourly' ? '/hr' : ' fixed'}
            </Text>
          ) : null}

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'open'
                    ? COLORS.success + '15'
                    : item.status === 'closed'
                    ? COLORS.error + '15'
                    : COLORS.textLight + '15',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === 'open'
                      ? COLORS.success
                      : item.status === 'closed'
                      ? COLORS.error
                      : COLORS.textMedium,
                },
              ]}
            >
              {item.status?.toUpperCase() || 'OPEN'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Your Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColor} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: themeColor + '15' }]}>
            <FileText size={44} color={themeColor} />
          </View>
          <Text style={styles.emptyTitle}>No listings found</Text>
          <Text style={styles.emptySubtitle}>
            You haven't posted any {isClient ? 'job openings' : 'skills availability'} yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  deleteBtn: {
    padding: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textMedium,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
