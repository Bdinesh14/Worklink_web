import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../services/firebase';
import { ref, push, set } from 'firebase/database';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react-native';

const CATEGORIES = [
  'Carpentry', 'Plumbing', 'Electrical', 'Cleaning',
  'Painting', 'Welding', 'Masonry', 'Other',
];

const AVAILABILITY_OPTIONS = [
  { label: 'Available Now', desc: 'Ready for work immediately' },
  { label: 'Available Weekends', desc: 'Saturday & Sunday' },
  { label: 'Flexible Schedule', desc: 'Can adjust to request timings' },
];

interface DropdownProps {
  label: string;
  value: string;
  options: { label: string; desc?: string }[];
  onSelect: (val: string) => void;
  placeholder: string;
  error?: string;
  activeColor: string;
}

const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onSelect, placeholder, error, activeColor }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.label === value);

  return (
    <View style={ddStyles.container}>
      <Text style={ddStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[ddStyles.trigger, error ? ddStyles.triggerError : {}]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[ddStyles.triggerText, !value && ddStyles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={18} color={COLORS.textLight} />
      </TouchableOpacity>
      {!!error && <Text style={ddStyles.errorText}>{error}</Text>}

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={ddStyles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={ddStyles.sheet}>
            <Text style={ddStyles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[ddStyles.option, item.label === value && { backgroundColor: activeColor + '10' }]}
                  onPress={() => { onSelect(item.label); setOpen(false); }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[ddStyles.optionLabel, item.label === value && { color: activeColor }]}>
                      {item.label}
                    </Text>
                    {item.desc && <Text style={ddStyles.optionDesc}>{item.desc}</Text>}
                  </View>
                  {item.label === value && <Check size={16} color={activeColor} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const ddStyles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.textMedium, marginBottom: SPACING.xs },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
  },
  triggerError: { borderColor: COLORS.error },
  triggerText: { flex: 1, fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  placeholder: { color: COLORS.textLight, fontWeight: '400' },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    maxHeight: '70%',
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, marginBottom: SPACING.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  optionDesc: { fontSize: 12, color: COLORS.textMedium, marginTop: 2 },
});

export const PostAvailabilityScreen = ({ navigation }: { navigation: any }) => {
  const { profile } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [rateType, setRateType] = useState<'fixed' | 'hourly'>('hourly');
  const [rate, setRate] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title / Skill summary is required';
    if (!category) e.category = 'Please select a category';
    if (!description.trim()) e.description = 'Experience/Skill description is required';
    else if (description.trim().length < 20) e.description = 'Description should be at least 20 characters';
    if (!location.trim()) e.location = 'Location is required';
    if (!rate.trim()) e.rate = 'Rate amount is required';
    else if (isNaN(Number(rate)) || Number(rate) <= 0) e.rate = 'Enter a valid amount';
    if (!availability) e.availability = 'Please select availability';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!profile?.uid) return;

    setLoading(true);
    try {
      const postsRef = ref(database, 'workerPosts');
      const newPostRef = push(postsRef);
      await set(newPostRef, {
        title: title.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        rateType,
        rate: Number(rate),
        availability,
        workerUid: profile.uid,
        workerName: profile.fullName,
        workerPhoneNumber: profile.phoneNumber || '',
        status: 'open',
        createdAt: new Date().toISOString(),
      });

      showToast('Skills listed successfully!', 'success');
      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (err) {
      console.error('Post skills error:', err);
      showToast('Failed to post availability. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast message={toastMsg} type={toastType} visible={toastVisible} onDismiss={() => setToastVisible(false)} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.textMedium} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advertise Your Skills</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Skill Summary / Title</Text>
          <TextInput
            style={[styles.textInput, errors.title ? styles.inputError : {}]}
            placeholder="e.g. Expert Plumber - 5+ years experience"
            placeholderTextColor={COLORS.textLight}
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
          />
          {!!errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Category */}
        <Dropdown
          label="Category"
          value={category}
          options={CATEGORIES.map((c) => ({ label: c }))}
          onSelect={setCategory}
          placeholder="Select skill category"
          error={errors.category}
          activeColor={COLORS.success}
        />

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Details of Skills & Experience</Text>
          <TextInput
            style={[styles.textArea, errors.description ? styles.inputError : {}]}
            placeholder="List your specific skills, work experience, tools you own, etc..."
            placeholderTextColor={COLORS.textLight}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            autoCapitalize="sentences"
          />
          {!!errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Location */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Operating Location</Text>
          <TextInput
            style={[styles.textInput, errors.location ? styles.inputError : {}]}
            placeholder="e.g. Koramangala, Bangalore"
            placeholderTextColor={COLORS.textLight}
            value={location}
            onChangeText={setLocation}
            autoCapitalize="words"
          />
          {!!errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        {/* Rate Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Pricing Rate Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, rateType === 'hourly' && styles.toggleBtnActive]}
              onPress={() => setRateType('hourly')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, rateType === 'hourly' && styles.toggleTextActive]}>
                Hourly Rate
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, rateType === 'fixed' && styles.toggleBtnActive]}
              onPress={() => setRateType('fixed')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, rateType === 'fixed' && styles.toggleTextActive]}>
                Fixed Price
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing Rate */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {rateType === 'hourly' ? 'Hourly Rate (₹/hr)' : 'Fixed Service Charge (₹)'}
          </Text>
          <View style={[styles.budgetInputRow, errors.rate ? styles.inputError : {}]}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder={rateType === 'hourly' ? '250' : '1500'}
              placeholderTextColor={COLORS.textLight}
              value={rate}
              onChangeText={setRate}
              keyboardType="numeric"
            />
            {rateType === 'hourly' && <Text style={styles.perHr}>/hr</Text>}
          </View>
          {!!errors.rate && <Text style={styles.errorText}>{errors.rate}</Text>}
        </View>

        {/* Availability */}
        <Dropdown
          label="Work Availability"
          value={availability}
          options={AVAILABILITY_OPTIONS}
          onSelect={setAvailability}
          placeholder="Select availability schedule"
          error={errors.availability}
          activeColor={COLORS.success}
        />

        {/* Submit */}
        <Button
          title="List Skills"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: SPACING.md, backgroundColor: COLORS.success }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
    backgroundColor: COLORS.white,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  scrollContent: { padding: SPACING.xl, paddingBottom: 60 },
  fieldContainer: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textMedium, marginBottom: SPACING.xs },
  textInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  inputError: { borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4, fontWeight: '500' },
  toggleRow: { flexDirection: 'row', gap: SPACING.sm },
  toggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  toggleBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  toggleText: { fontSize: 14, fontWeight: '600', color: COLORS.textMedium },
  toggleTextActive: { color: COLORS.white },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
  },
  rupeeSign: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginRight: 6 },
  budgetInput: { flex: 1, fontSize: 15, color: COLORS.textDark },
  perHr: { fontSize: 13, color: COLORS.textMedium, fontWeight: '600' },
});
