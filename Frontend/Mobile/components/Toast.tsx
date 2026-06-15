import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onDismiss,
  duration = 3000,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible && message) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();

      // Dismiss timer
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, message]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible || !message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  const containerStyles = [
    styles.toastContainer,
    isSuccess && styles.successToast,
    isError && styles.errorToast,
    isWarning && styles.warningToast,
  ];

  const renderIcon = () => {
    if (isSuccess) return <CheckCircle size={20} color={COLORS.white} />;
    if (isError) return <AlertCircle size={20} color={COLORS.white} />;
    return <Info size={20} color={COLORS.white} />;
  };

  return (
    <SafeAreaView style={styles.outerContainer} pointerEvents="box-none">
      <Animated.View
        style={[
          containerStyles,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {renderIcon()}
        <Text style={styles.toastText} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.textDark,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    width: width - SPACING.xl,
    ...SHADOWS.md,
    pointerEvents: 'auto',
  },
  successToast: {
    backgroundColor: COLORS.success,
  },
  errorToast: {
    backgroundColor: COLORS.error,
  },
  warningToast: {
    backgroundColor: COLORS.warning,
  },
  toastText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.sm,
    flex: 1,
  },
});
