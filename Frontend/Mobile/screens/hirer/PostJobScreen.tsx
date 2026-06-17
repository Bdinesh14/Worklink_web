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

const URGENCY_LEVELS = [
  { label: 'Low', desc: 'Flexible, no rush', color: '#10B981' },
  { label: 'Medium', desc: 'Within a few days', color: '#F59E0B' },
  { label: 'High', desc: 'Within 24 hours', color: '#EF4444' },
  { label: 'Emergency', desc: 'Right now, ASAP', color: '#7C3AED' },
];

interface DropdownProps {
  label: string;
  value: string;
  options: { label: string; desc?: string; color?: string }[];
  onSelect: (val: string) => void;
  placeholder: string;
  error?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onSelect, placeholder, error }) => {
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
        {selected?.color && (
          <View style={[ddStyles.colorDot, { backgroundColor: selected.color }]} />
        )}
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
                  style={[ddStyles.option, item.label === value && ddStyles.optionSelected]}
                  onPress={() => { onSelect(item.label); setOpen(false); }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[ddStyles.optionLabel, item.label === value && { color: COLORS.primary }]}>
                      {item.label}
                    </Text>
                    {item.desc && <Text style={ddStyles.optionDesc}>{item.desc}</Text>}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {item.color && <View style={[ddStyles.colorDot, { backgroundColor: item.color }]} />}
                    {item.label === value && <Check size={16} color={COLORS.primary} />}
                  </View>
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
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
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
  optionSelected: { backgroundColor: COLORS.primaryLight + '30' },
  optionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  optionDesc: { fontSize: 12, color: COLORS.textMedium, marginTop: 2 },
});

export const PostJobScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { profile } = useAuth();
  const preselectedCategory = route.params?.preselectedCategory || '';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(preselectedCategory);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budgetType, setBudgetType] = useState<'fixed' | 'hourly'>('fixed');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState('');
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
    if (!title.trim()) e.title = 'Job title is required';
    if (!category) e.category = 'Please select a category';
    if (!description.trim()) e.description = 'Description is required';
    else if (description.trim().length < 20) e.description = 'Description should be at least 20 characters';
    if (!location.trim()) e.location = 'Location is required';
    if (!budget.trim()) e.budget = 'Budget amount is required';
    else if (isNaN(Number(budget)) || Number(budget) <= 0) e.budget = 'Enter a valid amount';
    if (!urgency) e.urgency = 'Please select urgency level';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!profile?.uid) return;

    setLoading(true);
    try {
      const jobsRef = ref(database, 'jobs');
      const newJobRef = push(jobsRef);
      await set(newJobRef, {
        title: title.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        budgetType,
        budget: Number(budget),
        urgency,
        hirerUid: profile.uid,
        hirerName: profile.fullName,
        hirerPhoneNumber: profile.phoneNumber || '',
        status: 'open',
        createdAt: new Date().toISOString(),
      });

      showToast('Job posted successfully!', 'success');
      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (err) {
      console.error('Post job error:', err);
      showToast('Failed to post job. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast message={toastMsg} type={toastType} visible={toastVisible} onDismiss={() => setToastVisible(false)} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Job Title */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Job Title</Text>
          <TextInput
            style={[styles.textInput, errors.title ? styles.inputError : {}]}
            placeholder="e.g. Fix leaking kitchen pipe"
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
          placeholder="Select job category"
          error={errors.category}
        />

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.textArea, errors.description ? styles.inputError : {}]}
            placeholder="Describe the work needed in detail..."
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
          <Text style={styles.fieldLabel}>Location</Text>
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

        {/* Budget Type Toggle */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Budget Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, budgetType === 'fixed' && styles.toggleBtnActive]}
              onPress={() => setBudgetType('fixed')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, budgetType === 'fixed' && styles.toggleTextActive]}>
                Fixed Price
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, budgetType === 'hourly' && styles.toggleBtnActive]}
              onPress={() => setBudgetType('hourly')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, budgetType === 'hourly' && styles.toggleTextActive]}>
                Hourly Rate
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget Amount */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {budgetType === 'fixed' ? 'Total Budget (₹)' : 'Hourly Rate (₹/hr)'}
          </Text>
          <View style={[styles.budgetInputRow, errors.budget ? styles.inputError : {}]}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder={budgetType === 'fixed' ? '1500' : '200'}
              placeholderTextColor={COLORS.textLight}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
            {budgetType === 'hourly' && <Text style={styles.perHr}>/hr</Text>}
          </View>
          {!!errors.budget && <Text style={styles.errorText}>{errors.budget}</Text>}
        </View>

        {/* Urgency */}
        <Dropdown
          label="Urgency Level"
          value={urgency}
          options={URGENCY_LEVELS}
          onSelect={setUrgency}
          placeholder="Select urgency level"
          error={errors.urgency}
        />

        {/* Submit */}
        <Button
          title="Post Job"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: SPACING.md }}
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
  toggleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
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
