import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { ArrowLeft, Bell, Briefcase, MessageSquare, CheckCircle, Clock } from 'lucide-react-native';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const NotificationsScreen = ({ navigation }: { navigation: any }) => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const isWorker = profile?.role === 'worker';
  const accentColor = isWorker ? COLORS.success : COLORS.primary;

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg(msg);
    setToastType(type);
  };

  useEffect(() => {
    if (!profile?.uid) return;

    const unsub = onValue(ref(database, 'requests'), (snap) => {
      if (snap.exists()) {
        const all = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .filter(r => {
            if (isWorker) {
              return r.workerUid === profile.uid && r.type === 'hirer-to-worker';
            } else {
              return r.hirerUid === profile.uid && r.type === 'worker-to-hirer';
            }
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(all);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.uid, isWorker]);

  const handleAccept = async (reqId: string) => {
    try {
      await update(ref(database, `requests/${reqId}`), { status: 'accepted' });
      showToast('Request accepted! You can now chat.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to update', 'error');
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await update(ref(database, `requests/${reqId}`), { status: 'rejected' });
      showToast('Request rejected.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to update', 'error');
    }
  };

  const handleChat = (req: any) => {
    const otherUid = isWorker ? req.hirerUid : req.workerUid;
    const otherName = isWorker ? req.hirerName : req.workerName;
    const chatId = [profile?.uid, otherUid].sort().join('_');
    navigation.navigate('ChatScreen', { chatId, otherUserName: otherName || 'User' });
  };

  const pendingCount = notifications.filter(n => n.status === 'pending').length;

  const getNotifIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle size={18} color={COLORS.success} />;
    if (status === 'rejected') return <Clock size={18} color={COLORS.error} />;
    return <Bell size={18} color={accentColor} />;
  };

  const getStatusStyle = (status: string) => {
    if (status === 'accepted') return { backgroundColor: '#ECFDF5', color: COLORS.success };
    if (status === 'rejected') return { backgroundColor: '#FEE2E2', color: COLORS.error };
    return { backgroundColor: '#FFFBEB', color: '#F59E0B' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast message={toastMsg} type={toastType} visible={!!toastMsg} onDismiss={() => setToastMsg(null)} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {pendingCount > 0 && (
            <View style={[styles.badgeContainer, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{pendingCount} new</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={accentColor} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={accentColor} style={{ opacity: 0.8 }} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>New requests and updates will appear here.</Text>
          </View>
        ) : (
          notifications.map(notif => (
            <View key={notif.id} style={[
              styles.card,
              { borderLeftColor: notif.status === 'pending' ? accentColor : COLORS.border, borderLeftWidth: 4 }
            ]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardUser}>
                  <View style={[
                    styles.iconBox,
                    { backgroundColor: notif.status === 'pending' ? accentColor + '18' : COLORS.bgLight }
                  ]}>
                    {getNotifIcon(notif.status)}
                  </View>
                  <View>
                    <Text style={styles.userName}>{isWorker ? notif.hirerName : notif.workerName}</Text>
                    <View style={styles.jobRow}>
                      <Briefcase size={12} color={COLORS.textMedium} />
                      <Text style={styles.jobTitle}>{notif.jobTitle || notif.workerPostTitle || 'General Service'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <View style={[styles.statusPill, { backgroundColor: getStatusStyle(notif.status).backgroundColor }]}>
                    <Text style={[styles.statusText, { color: getStatusStyle(notif.status).color }]}>
                      {notif.status.charAt(0).toUpperCase() + notif.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>{formatDate(notif.createdAt)}</Text>
                </View>
              </View>

              {notif.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => handleReject(notif.id)} style={[styles.actionBtn, styles.rejectBtn]}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleAccept(notif.id)} style={[styles.actionBtn, { backgroundColor: accentColor }]}>
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}

              {notif.status === 'accepted' && (
                <View style={styles.chatRow}>
                  <TouchableOpacity onPress={() => handleChat(notif)} style={[styles.chatBtn, { backgroundColor: accentColor }]}>
                    <MessageSquare size={16} color={COLORS.white} />
                    <Text style={styles.chatBtnText}>Open Chat</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  scrollContent: { padding: SPACING.md, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  emptySubtitle: { fontSize: 14, color: COLORS.textMedium },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardUser: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 2 },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobTitle: { fontSize: 13, color: COLORS.textMedium },
  cardMeta: { alignItems: 'flex-end', gap: 6 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 11, color: COLORS.textLight },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  rejectBtn: { borderWidth: 1, borderColor: COLORS.error, backgroundColor: 'transparent' },
  rejectBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 14 },
  acceptBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  chatRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10 },
  chatBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
