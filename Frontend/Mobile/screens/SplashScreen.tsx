import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export const SplashScreen = ({ navigation }: { navigation: any }) => {
  const { user, role, loading } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false, // width style animation doesn't support native driver
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Run redirection check once authentication loading completes
    if (!loading) {
      const timer = setTimeout(async () => {
        try {
          const onboardingCompleted = await AsyncStorage.getItem('hasCompletedOnboarding');
          
          if (user) {
            if (role === 'client') {
              navigation.replace('ClientHome');
            } else if (role === 'worker') {
              navigation.replace('WorkerHome');
            } else {
              // Logged in but profile role not created yet
              navigation.replace('RoleSelection');
            }
          } else {
            if (onboardingCompleted === 'true') {
              navigation.replace('RoleSelection');
            } else {
              navigation.replace('Onboarding');
            }
          }
        } catch (error) {
          console.error('Error during redirection check:', error);
          navigation.replace('Onboarding');
        }
      }, 2000); // Allow at least 2 seconds for visual animations to play

      return () => clearTimeout(timer);
    }
  }, [loading, user, role]);

  // Width interpolation for progress bar
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Styled Logo Box */}
        <View style={styles.logoBox}>
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>WL</Text>
          </View>
        </View>
        
        <Text style={styles.title}>WorkLink</Text>
        <Text style={styles.subtitle}>Hire Nearby Workers Instantly</Text>
      </Animated.View>

      <View style={styles.loaderContainer}>
        {/* Custom Progress Bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.versionText}>v 1.0.4 • Secure & Trusted</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: SPACING.lg,
  },
  logoInner: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMedium,
    fontWeight: '500',
  },
  loaderContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.xxl,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
});
