import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, KeyboardTypeOptions, TextInputProps, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localValue, setLocalValue] = useState(rest.value || '');

  // Keep in sync with parent value if it changes externally
  React.useEffect(() => {
    if (rest.value !== undefined && rest.value !== localValue) {
      setLocalValue(rest.value);
    }
  }, [rest.value]);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    if (rest.onChangeText) {
      rest.onChangeText(text);
    }
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (rest.onFocus) {
      rest.onFocus(e);
    }
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (rest.onBlur) {
      rest.onBlur(e);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedInput,
          !!error && styles.errorInput,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : {}]}
          placeholderTextColor={COLORS.textLight}
          {...rest}
          secureTextEntry={isPassword && !showPassword}
          value={localValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconRight}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff size={20} color={COLORS.textMedium} />
            ) : (
              <Eye size={20} color={COLORS.textMedium} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMedium,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: SPACING.sm + 4,
    width: '100%',
  },
  focusedInput: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.textDark,
    fontSize: 15,
    paddingVertical: 0,
  },
  iconLeft: {
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    marginLeft: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
