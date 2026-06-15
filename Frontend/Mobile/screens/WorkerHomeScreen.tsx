import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { Hammer, User, Mail, Phone, LogOut } from 'lucide-react-native';

export const WorkerHomeScreen = ({ navigation }: { navigation: any }) => {
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Redirect to splash which will handle routing back to role selection
    navigation.replace('Splash');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: COLORS.success + '20' }]}>
        <Text style={styles.headerTitle}>Worker Portal</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.success }]}>
            <Hammer size={36} color={COLORS.white} />
          </View>
          <Text style={styles.welcomeText}>Welcome back, Worker!</Text>
          <Text style={styles.instructions}>You are successfully authenticated under the Labor/Worker flow.</Text>
        </View>

        {/* Profile details */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>YOUR PROFILE DETAILS</Text>
          
          <View style={styles.detailRow}>
            <User size={18} color={COLORS.textMedium} />
            <Text style={styles.detailLabel}>Full Name:</Text>
            <Text style={styles.detailValue}>{profile?.fullName || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Mail size={18} color={COLORS.textMedium} />
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{profile?.email || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Phone size={18} color={COLORS.textMedium} />
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{profile?.phoneNumber || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          style={{ borderColor: COLORS.success }}
          textStyle={{ color: COLORS.success }}
          icon={<LogOut size={18} color={COLORS.success} />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  header: {
    height: 56,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.md,
    marginBottom: SPACING.xl,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  instructions: {
    fontSize: 14,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  profileSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md + 4,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1.2,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '60',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginLeft: SPACING.sm,
    width: 90,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textMedium,
    flex: 1,
  },
  footer: {
    padding: SPACING.xl,
  },
});
