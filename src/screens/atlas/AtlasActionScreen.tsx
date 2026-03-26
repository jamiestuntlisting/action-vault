import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { usePageTitle } from '../../hooks/usePageTitle';

const MAX_WIDTH = 960;

export function AtlasActionScreen({ navigation }: any) {
  usePageTitle('Atlas Action');
  const { state, isAtlasVideoUnlocked } = useAppState();

  const courses = useMemo(() =>
    state.settings.atlasActionCourses.filter(c => c.enabled),
    [state.settings.atlasActionCourses]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.maxWidth}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Atlas Action</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTagline}>WHERE YOU LEARN ACTION</Text>
          <Text style={styles.heroTitle}>Professional Stunt Training</Text>
          <Text style={styles.heroDescription}>
            Online courses taught by veteran stunt coordinator Brad Martin with 30+ years of experience on major Hollywood productions.
          </Text>
        </View>

        {/* All Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Courses</Text>

          {courses.map(course => {
            const hasVideos = course.videoIds.length > 0;
            const total = course.videoIds.length;
            const unlocked = course.videoIds.filter(id => isAtlasVideoUnlocked(id)).length;
            const owned = state.purchasedAtlasCourses.includes(course.id);

            return (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => navigation.navigate('AtlasActionDetail', { atlasCourseId: course.id })}
              >
                <Image source={{ uri: course.thumbnailUrl }} style={styles.courseThumb} contentFit="cover" />
                {!hasVideos && (
                  <View style={styles.comingSoonBadgeOverlay}>
                    <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
                  </View>
                )}
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseInstructor}>{course.instructorName}</Text>
                  {hasVideos ? (
                    <Text style={styles.courseMeta}>
                      {total} lessons{owned ? ` \u2022 ${unlocked}/${total} unlocked` : course.price > 0 ? ` \u2022 $${course.price.toFixed(2)}` : ' \u2022 Free'}
                    </Text>
                  ) : (
                    <Text style={[styles.courseMeta, { color: '#FFCE75' }]}>Videos coming soon</Text>
                  )}
                  <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* About Brad Martin */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Instructor</Text>
          <View style={styles.instructorCard}>
            <Ionicons name="person-circle" size={48} color={Colors.primary} />
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorName}>Brad Martin</Text>
              <Text style={styles.instructorRole}>2nd Unit Director & Stunt Coordinator</Text>
              <Text style={styles.instructorBio}>
                30+ years of experience on major Hollywood films including Live Free or Die Hard, The Other Guys, Zoolander 2, Underworld, and Dungeons & Dragons.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => Linking.openURL('https://atlasaction.com')}
        >
          <Text style={styles.ctaText}>Visit AtlasAction.com</Text>
          <Ionicons name="open-outline" size={18} color={Colors.white} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  maxWidth: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.screen, paddingTop: 60, paddingBottom: Spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  hero: {
    marginHorizontal: Spacing.screen,
    backgroundColor: '#1a1a2e',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,206,117,0.3)',
  },
  heroTagline: {
    color: '#FFCE75', fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    letterSpacing: 2, marginBottom: Spacing.sm,
  },
  heroTitle: {
    color: Colors.textPrimary, fontSize: FontSize.xxxl || 28, fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  heroDescription: {
    color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22,
  },
  section: {
    paddingHorizontal: Spacing.screen, marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  courseCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  courseThumb: {
    width: 90, height: 60, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
  },
  comingSoonBadgeOverlay: {
    position: 'absolute', left: Spacing.md, top: Spacing.md,
    width: 90, height: 60, borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center',
  },
  comingSoonBadgeText: {
    color: '#FFCE75', fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1,
  },
  courseInfo: { flex: 1 },
  courseTitle: {
    color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold,
  },
  courseInstructor: {
    color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2,
  },
  courseMeta: {
    color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2,
  },
  courseDesc: {
    color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 4, lineHeight: 16,
  },
  instructorCard: {
    flexDirection: 'row', gap: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, padding: Spacing.lg,
  },
  instructorInfo: { flex: 1 },
  instructorName: {
    color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold,
  },
  instructorRole: {
    color: '#FFCE75', fontSize: FontSize.sm, marginTop: 2,
  },
  instructorBio: {
    color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.sm, lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#FFCE75', marginHorizontal: Spacing.screen,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
  },
  ctaText: { color: '#000', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
