import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { signOut, updatePassword } from 'firebase/auth';
import { auth, database } from '../../services/firebase';
import { ref, update } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import { User, Mail, Phone, LogOut, Briefcase, ChevronRight, Shield, Hammer, FileText, Camera, Key } from 'lucide-react-native';

export const WorkerProfileScreen = ({ navigation }: { navigation: any }) => {
  const { profile, setProfileAndRole } = useAuth();
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handlePhotoChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && profile) {
        const base64String = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await update(ref(database, `users/${profile.uid}`), { photoUrl: base64String });
        setProfileAndRole({ ...profile, photoUrl: base64String });
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update profile picture.');
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      setModalError('Password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    setModalError('');
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        Alert.alert('Success', 'Password updated successfully!');
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        setModalError('No authenticated user session found.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setModalError('This action requires recent authentication. Please log out and log back in.');
      } else {
        setModalError(err.message || 'Failed to update password.');
      }
    } finally {
      setChangingPassword(false);
    }
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
          <TouchableOpacity onPress={handlePhotoChange} style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: COLORS.success }]}>
              {profile?.photoUrl ? (
                <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
              <View style={styles.cameraOverlay}>
                <Camera size={14} color="#FFF" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profile?.fullName || 'User'}</Text>
          <View style={styles.roleBadge}>
            <Hammer size={12} color={COLORS.success} />
            <Text style={styles.roleBadgeText}>Worker / Labor</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACCOUNT DETAILS</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><User size={18} color={COLORS.success} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{profile?.fullName || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Mail size={18} color={COLORS.success} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{profile?.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><Phone size={18} color={COLORS.success} /></View>
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
            <View style={styles.detailIcon}><FileText size={18} color={COLORS.success} /></View>
            <Text style={styles.menuLabel}>Manage Your Reports</Text>
            <ChevronRight size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SECURITY</Text>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.8} onPress={() => setShowPasswordModal(true)}>
            <View style={styles.detailIcon}><Shield size={18} color={COLORS.success} /></View>
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

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Key size={24} color={COLORS.success} />
              <Text style={styles.modalTitle}>Change Password</Text>
            </View>
            <Text style={styles.modalSubtitle}>Enter a new secure password of at least 6 characters.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textLight}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            {!!modalError && <Text style={styles.modalError}>{modalError}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setModalError('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handlePasswordChange}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  avatarContainer: { marginBottom: SPACING.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  profileName: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: SPACING.xs,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.success },
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
    backgroundColor: COLORS.success + '15',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    width: '100%',
    ...SHADOWS.lg,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
  modalSubtitle: { fontSize: 13, color: COLORS.textMedium, marginBottom: SPACING.lg },
  modalInput: {
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.textDark,
  },
  modalError: { color: COLORS.error, fontSize: 12, fontWeight: '600', marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: SPACING.xl },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: { color: COLORS.textMedium, fontWeight: '700', fontSize: 15 },
  modalSaveBtn: {
    flex: 1,
    height: 46,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
