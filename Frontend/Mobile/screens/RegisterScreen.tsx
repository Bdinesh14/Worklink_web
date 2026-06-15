import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { User, Phone, Mail, Lock, CheckCircle2, UserPlus } from 'lucide-react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export const RegisterScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const selectedRole = route.params?.selectedRole || 'client';
  const { setProfileAndRole } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Field errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // General loading/status
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Real-time checks
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const validateForm = () => {
    let isValid = true;

    // Reset errors
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Name Check
    if (!fullName.trim()) {
      setNameError('Full name is required');
      isValid = false;
    }

    // Email Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Phone Check (Allowing standard international and domestic formats)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
    if (!phoneNumber.trim()) {
      setPhoneError('Mobile number is required');
      isValid = false;
    } else if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Please enter a valid 10-15 digit phone number');
      isValid = false;
    }

    // Password Check
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    // Confirm Password Check
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      // 2. Prepare Profile Data
      const profileData = {
        uid: firebaseUser.uid,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        role: selectedRole,
        createdAt: new Date().toISOString(),
      };

      // 3. Save Profile into Firebase Realtime Database
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      await set(userRef, profileData);

      // 4. Update local Context State
      setProfileAndRole(profileData);

      showToast('Registration successful!', 'success');

      // 5. Navigate to appropriate Home portal
      setTimeout(() => {
        if (selectedRole === 'client') {
          navigation.replace('ClientHome');
        } else {
          navigation.replace('WorkerHome');
        }
      }, 800);
    } catch (error: any) {
      console.error('Registration error:', error);
      let errMsg = 'Failed to register account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errMsg = 'This email address is already in use by another account.';
      } else if (error.code === 'auth/invalid-email') {
        errMsg = 'The email address is invalid.';
      } else if (error.code === 'auth/weak-password') {
        errMsg = 'The password is too weak.';
      }
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Role Identity Badge */}
        <View style={styles.badgeContainer}>
          <View style={[styles.roleBadge, selectedRole === 'worker' ? styles.workerBadge : {}]}>
            <Text style={[styles.roleBadgeText, selectedRole === 'worker' ? styles.workerBadgeText : {}]}>
              REGISTERING AS {selectedRole.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>WL</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join WorkLink to find opportunities instantly.</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
            error={nameError}
            leftIcon={<User size={20} color={nameError ? COLORS.error : COLORS.textLight} />}
          />

          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={emailError ? COLORS.error : COLORS.textLight} />}
          />

          <Input
            label="Mobile Number"
            placeholder="+1 (555) 000-0000"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            error={phoneError}
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={phoneError ? COLORS.error : COLORS.textLight} />}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            isPassword
            autoCapitalize="none"
            leftIcon={<Lock size={20} color={passwordError ? COLORS.error : COLORS.textLight} />}
          />

          <Input
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmPasswordError}
            isPassword
            autoCapitalize="none"
            leftIcon={<Lock size={20} color={confirmPasswordError ? COLORS.error : COLORS.textLight} />}
            rightIcon={
              passwordsMatch ? (
                <View style={styles.matchIcon}>
                  <CheckCircle2 size={18} color={COLORS.success} />
                </View>
              ) : undefined
            }
          />

          <Button
            title="Register"
            onPress={handleRegister}
            loading={loading}
            icon={<UserPlus size={18} color={COLORS.white} />}
            style={styles.registerBtn}
          />
        </View>

        <Text style={styles.agreementText}>
          {"By registering, you agree to our "}
          <Text style={styles.accentAgreement}>{"Terms of Service"}</Text>
          {" and "}
          <Text style={styles.accentAgreement}>{"Privacy Policy"}</Text>
          {"."}
        </Text>

        {/* Footer Navigation */}
        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login', { selectedRole })}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
  },
  workerBadge: {
    backgroundColor: '#ECFDF5',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  workerBadgeText: {
    color: COLORS.success,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMedium,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  registerBtn: {
    marginTop: SPACING.sm,
  },
  matchIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreementText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 11,
    lineHeight: 16,
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    fontWeight: '500',
  },
  accentAgreement: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  footerText: {
    color: COLORS.textMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  loginText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
