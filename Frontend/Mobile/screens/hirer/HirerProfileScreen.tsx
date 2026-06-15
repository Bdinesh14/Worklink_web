import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { User, Mail, Phone, LogOut, Briefcase, ChevronRight, Shield, FileText } from 'lucide-react-native';

export const HirerProfileScreen = ({ navigation }: { navigation: any }) => {
  const { profile, setProfileAndRole } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              setProfileAndRole(null);
              // Reset to Splash which handles redirect
              navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
            } catch (e) {
              console.error('Logout error:', e);
            }
          },
        },
      ]
    );
  };

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{profile?.fullName || 'User'}</Text>
          <View style={styles.roleBadge}>
            <Briefcase size={12} color={COLORS.primary} />
            <Text style={styles.roleBadgeText}>Hirer / Client</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACCOUNT DETAILS</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><User size={18} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{profile?.fullName || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Mail size={18} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{profile?.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Phone size={18} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>{profile?.phoneNumber || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Management */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MANAGEMENT</Text>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ManageReports')}
          >
            <View style={styles.detailIcon}><FileText size={18} color={COLORS.primary} /></View>
            <Text style={styles.menuLabel}>Manage Your Reports</Text>
            <ChevronRight size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SECURITY</Text>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.8}>
            <View style={styles.detailIcon}><Shield size={18} color={COLORS.primary} /></View>
            <Text style={styles.menuLabel}>Change Password</Text>
            <ChevronRight size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
  scrollContent: { padding: SPACING.xl, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  profileName: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: SPACING.xs,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1, marginBottom: SPACING.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 4 },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 4 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FEE2E2',
    paddingVertical: SPACING.md + 2,
    borderRadius: 16,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
