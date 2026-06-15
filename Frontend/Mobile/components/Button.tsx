import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isText = variant === 'text';

  const buttonStyles: any[] = [
    styles.button,
    isSecondary && styles.secondaryButton,
    isOutline && styles.outlineButton,
    isText && styles.textButton,
    (disabled || loading) && styles.disabledButton,
    style || {},
  ];

  const textStyles: any[] = [
    styles.text,
    isSecondary && styles.secondaryText,
    isOutline && styles.outlineText,
    isText && styles.textText,
    disabled && styles.disabledText,
    textStyle || {},
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isText ? COLORS.primary : COLORS.white} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: COLORS.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.sm,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButton: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.primary,
  },
  outlineText: {
    color: COLORS.primary,
  },
  textText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  disabledText: {
    color: COLORS.textLight,
  },
});
