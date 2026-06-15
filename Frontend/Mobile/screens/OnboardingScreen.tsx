import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Button } from '../components/Button';
import { Clock, MapPin, MessageSquare, ArrowRight, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
}

export const OnboardingScreen = ({ navigation }: { navigation: any }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const slides: Slide[] = [
    {
      id: 0,
      title: 'Real-time Hiring',
      description: 'Get instant matches for your local projects, home repairs, or freelance tasks in real-time.',
      icon: (
        <View style={[styles.iconWrapper, { backgroundColor: '#EEF2FF' }]}>
          <Clock size={64} color={COLORS.primary} />
        </View>
      ),
      accentColor: COLORS.primary,
    },
    {
      id: 1,
      title: 'Nearby Workers',
      description: 'Find and connect with highly skilled, verified professionals situated right around your corner.',
      icon: (
        <View style={[styles.iconWrapper, { backgroundColor: '#ECFDF5' }]}>
          <MapPin size={64} color={COLORS.success} />
        </View>
      ),
      accentColor: COLORS.success,
    },
    {
      id: 2,
      title: 'Fast Communication',
      description: 'Chat instantly, share specific work details, and align on rates safely within our built-in secure messenger.',
      icon: (
        <View style={[styles.iconWrapper, { backgroundColor: '#FFFBEB' }]}>
          <MessageSquare size={64} color={COLORS.warning} />
        </View>
      ),
      accentColor: COLORS.warning,
    },
  ];

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeSlide) {
      setActiveSlide(slide);
    }
  };

  const handleNext = async () => {
    if (activeSlide < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (activeSlide + 1) * width,
        animated: true,
      });
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      navigation.replace('RoleSelection');
    } catch (error) {
      console.error('Error saving onboarding completion status:', error);
      navigation.replace('RoleSelection');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconButton} onPress={completeOnboarding}>
          <X size={22} color={COLORS.textMedium} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>WorkLink</Text>
        
        <TouchableOpacity onPress={completeOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Swipable Carousel Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.slidesContainer}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.graphicContainer}>
              {slide.icon}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Layout Controls */}
      <View style={styles.footer}>
        {/* Dot Indicators */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeSlide ? styles.activeDot : {},
                index === activeSlide ? { backgroundColor: slides[index].accentColor } : {},
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          title={activeSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          icon={activeSlide !== slides.length - 1 ? <ArrowRight size={18} color={COLORS.white} /> : undefined}
          style={activeSlide === slides.length - 1 ? { backgroundColor: COLORS.primary } : {}}
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
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50', // 50% opacity
  },
  headerIconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textMedium,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  graphicContainer: {
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  slideDescription: {
    fontSize: 15,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
});
