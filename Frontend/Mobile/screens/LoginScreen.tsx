import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { Mail, Lock, LogIn } from 'lucide-react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, database } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  // Get the selectedRole passed from RoleSelectionScreen (defaults to 'client' if not provided)
  const selectedRole = route.params?.selectedRole || 'client';
  const { setProfileAndRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Field-specific errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // General status
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Sign in via Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      // 2. Fetch profile from Realtime Database to check the user role
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userProfile = snapshot.val();

        // Check if DB profile role matches the login selection
        if (userProfile.role !== selectedRole) {
          await auth.signOut();
          const actualLabel = userProfile.role === 'client' ? 'Hirer' : 'Worker';
          showToast(`This account is registered as a ${actualLabel}. Please log in as a ${actualLabel}.`, 'error');
          setLoading(false);
          return;
        }

        // Update AuthContext profile and role
        setProfileAndRole(userProfile);

        showToast('Login successful!', 'success');

        // Route user to their corresponding Home screen based on DB profile role
        setTimeout(() => {
          if (userProfile.role === 'client') {
            navigation.replace('ClientHome');
          } else {
            navigation.replace('WorkerHome');
          }
        }, 800);
      } else {
        // Auth succeeded but no DB profile (e.g. registration was interrupted).
        // Auto-create a minimal profile using the selectedRole so the user can proceed.
        const recoveredProfile = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || '',
          email: firebaseUser.email || email.trim().toLowerCase(),
          phoneNumber: '',
          role: selectedRole,
          createdAt: new Date().toISOString(),
        };
        try {
          await set(userRef, recoveredProfile);
        } catch (_) {
          // If DB write fails here, rules may still be wrong — show clear message
          showToast('Account found but profile save failed. Check Firebase rules.', 'error');
          setLoading(false);
          return;
        }
        setProfileAndRole(recoveredProfile);
        showToast('Login successful!', 'success');
        setTimeout(() => {
          if (selectedRole === 'client') {
            navigation.replace('ClientHome');
          } else {
            navigation.replace('WorkerHome');
          }
        }, 800);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errMsg = 'Failed to sign in. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errMsg = 'Network error. Please check your internet connection.';
      }
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In coming soon alert
  const handleGoogleSignIn = () => {
    showToast('Google Sign-In will be available soon. Please use email and password.', 'info');
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
              LOGGING IN AS {selectedRole.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>WL</Text>
          </View>
          <Text style={styles.title}>WorkLink</Text>
          <Text style={styles.subtitle}>Connecting potential to work.</Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
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

          <View style={styles.passwordHeader}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
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

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            icon={<LogIn size={18} color={COLORS.white} />}
            style={styles.loginBtn}
          />
        </View>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Google Authentication Button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={googleLoading || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Signup Footer Navigation */}
        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register', { selectedRole })}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.agreementText}>Privacy Policy  •  Terms of Service</Text>
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
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: -8, // Pull input label closer
    zIndex: 1,
  },
  forgotButton: {
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: SPACING.sm,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 52,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
    marginBottom: SPACING.lg,
  },
  googleG: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.googleRed,
  },
  googleButtonText: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  footerText: {
    color: COLORS.textMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  signUpText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  agreementText: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: '500',
  },
});
