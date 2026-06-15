import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';

export const ForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  // Toast status
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleReset = async () => {
    setEmailError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Trigger Firebase reset link
      await sendPasswordResetEmail(auth, email.trim());
      
      showToast('Reset link sent to your email address!', 'success');
      
      // Delay navigation back to login to let the user read success state
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2500);
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errMsg = 'Failed to send password reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errMsg = 'No user account found matching this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errMsg = 'The email address is invalid.';
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

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.textMedium} />
        </TouchableOpacity>
        
        <View style={styles.logoRow}>
          <View style={styles.logoTiny}>
            <Text style={styles.logoTinyText}>WL</Text>
          </View>
          <Text style={styles.headerTitle}>WorkLink</Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Main Brand Logo */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>WL</Text>
            </View>
          </View>
          <Text style={styles.brandTitle}>WorkLink</Text>
        </View>

        {/* Forgot Password Text Box */}
        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your registered email address below, and we'll email you a secure link to reset your password.
          </Text>
        </View>

        {/* Input & Action */}
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

          <Button
            title="Send Reset Link"
            onPress={handleReset}
            loading={loading}
            icon={<Send size={18} color={COLORS.white} />}
            style={styles.resetBtn}
          />
        </View>

        {/* Footer Back Link */}
        <TouchableOpacity 
          style={styles.footerLink}
          onPress={() => navigation.navigate('Login')}
        >
          <ArrowLeft size={16} color={COLORS.primary} style={styles.footerIcon} />
          <Text style={styles.footerLinkText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    padding: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTiny: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  logoTinyText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scrollContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
    marginBottom: SPACING.sm,
  },
  logoInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  content: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
    fontWeight: '500',
  },
  form: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  resetBtn: {
    marginTop: SPACING.sm,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  footerIcon: {
    marginRight: SPACING.xs,
  },
  footerLinkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
