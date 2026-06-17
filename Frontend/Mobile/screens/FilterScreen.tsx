import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Button } from '../components/Button';

export const FilterScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { fromScreen, currentFilter, themeColor } = route.params || {};
  const activeColor = themeColor || COLORS.primary;

  const [location, setLocation] = useState(currentFilter || '');

  const handleApply = () => {
    navigation.navigate(fromScreen || 'ClientHome', {
      screen: 'Home',
      params: { locationFilter: location.trim() },
    });
  };

  const handleClear = () => {
    setLocation('');
    navigation.navigate(fromScreen || 'ClientHome', {
      screen: 'Home',
      params: { locationFilter: '' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Filter</Text>
        {location ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearHeaderBtn}>
            <Trash2 size={16} color={COLORS.error} />
            <Text style={styles.clearHeaderText}>Reset</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <View style={styles.content}>
        {/* Location Filtering */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FILTER BY LOCATION</Text>
          <Text style={styles.sectionSubtitle}>
            Enter a city, town, or neighborhood to find listings near you.
          </Text>

          <View style={styles.inputContainer}>
            <MapPin size={20} color={location ? activeColor : COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input,
                location ? { borderColor: activeColor, borderWidth: 1.5 } : {},
              ]}
              placeholder="e.g. Koramangala, Bangalore"
              placeholderTextColor={COLORS.textLight}
              value={location}
              onChangeText={setLocation}
              autoFocus
              autoCapitalize="words"
            />
          </View>
        </View>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.clearBtn, { borderColor: COLORS.border }]}
          onPress={handleClear}
          activeOpacity={0.8}
        >
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
        <Button
          title="Apply Filters"
          onPress={handleApply}
          style={{ flex: 2, backgroundColor: activeColor }}
        />
      </View>
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
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  clearHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  clearHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1.2,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMedium,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 1,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingLeft: SPACING.xxl - 4,
    paddingRight: SPACING.md,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  footer: {
    padding: SPACING.xl,
    flexDirection: 'row',
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  clearBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMedium,
  },
});
