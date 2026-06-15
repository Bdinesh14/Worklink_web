import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Button } from '../components/Button';
import { Briefcase, Hammer, ArrowLeft, Check, Star } from 'lucide-react-native';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  rating: number;
}

export const RoleSelectionScreen = ({ navigation }: { navigation: any }) => {
  const [selectedRole, setSelectedRole] = useState<'client' | 'worker' | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials: Testimonial[] = [
    {
      id: 0,
      quote: '"WorkLink helped me find my first client in 24 hours. The communication was so seamless!"',
      author: 'Sarah Jenkins',
      role: 'Interior Designer',
      rating: 5,
    },
    {
      id: 1,
      quote: '"I hired an electrician within 15 minutes to fix my shop wiring. Saved my business today!"',
      author: 'David Vance',
      role: 'Retail Store Owner',
      rating: 5,
    },
    {
      id: 2,
      quote: '"Great platform to get reliable carpentry jobs nearby. Highly recommend it to all workers."',
      author: 'Marcus Brody',
      role: 'Professional Carpenter',
      rating: 5,
    },
  ];

  // Auto-scroll testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleContinue = () => {
    if (selectedRole) {
      // Proceed to login screen and pass selectedRole as a parameter
      navigation.navigate('Login', { selectedRole });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Onboarding')}>
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

      {/* Main Body */}
      <View style={styles.content}>
        <Text style={styles.title}>Join as a Client or Worker</Text>
        <Text style={styles.subtitle}>Select your role to start connecting with local opportunities.</Text>

        {/* Roles List */}
        <View style={styles.rolesContainer}>
          {/* Hirer / Client Card */}
          <TouchableOpacity
            style={[
              styles.card,
              selectedRole === 'client' ? styles.activeCard : {},
            ]}
            onPress={() => setSelectedRole('client')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, selectedRole === 'client' ? styles.activeIconBox : {}]}>
                <Briefcase size={28} color={selectedRole === 'client' ? COLORS.white : COLORS.primary} />
              </View>
              {selectedRole === 'client' && (
                <View style={styles.checkBadge}>
                  <Check size={14} color={COLORS.white} />
                </View>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>I want to hire</Text>
              <Text style={styles.cardDescription}>
                Post local jobs, browse skilled workers, and manage active service projects.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Worker Card */}
          <TouchableOpacity
            style={[
              styles.card,
              selectedRole === 'worker' ? styles.activeCard : {},
            ]}
            onPress={() => setSelectedRole('worker')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, selectedRole === 'worker' ? styles.activeIconBox : {}]}>
                <Hammer size={28} color={selectedRole === 'worker' ? COLORS.white : COLORS.success} />
              </View>
              {selectedRole === 'worker' && (
                <View style={[styles.checkBadge, { backgroundColor: COLORS.success }]}>
                  <Check size={14} color={COLORS.white} />
                </View>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>I want to work</Text>
              <Text style={styles.cardDescription}>
                Find local service jobs, send custom work requests, and build your professional profile.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Social Proof Testimonials */}
        <View style={styles.testimonialContainer}>
          <Text style={styles.trustedLabel}>TRUSTED BY 10K+ PROFESSIONALS</Text>
          <View style={styles.testimonialCard}>
            <View style={styles.starsRow}>
              {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                <Star key={i} size={14} color="#FBBF24" fill="#FBBF24" />
              ))}
            </View>
            <Text style={styles.quoteText}>{testimonials[activeTestimonial].quote}</Text>
            <Text style={styles.authorText}>
              {`- ${testimonials[activeTestimonial].author}, `}
              <Text style={styles.authorRole}>{testimonials[activeTestimonial].role}</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Continue Controls */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={selectedRole === null}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  rolesContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: SPACING.md,
    flexDirection: 'column',
    ...SHADOWS.sm,
  },
  activeCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconBox: {
    backgroundColor: COLORS.primary,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    marginTop: SPACING.xs,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textMedium,
    lineHeight: 18,
  },
  testimonialContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  trustedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1.2,
    marginBottom: SPACING.xs + 2,
  },
  testimonialCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border + '80',
    width: '100%',
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    gap: 2,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  authorText: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '700',
  },
  authorRole: {
    fontWeight: '400',
    color: COLORS.textMedium,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
});
