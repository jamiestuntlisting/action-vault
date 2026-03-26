import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { usePageTitle } from '../../hooks/usePageTitle';

const MAX_WIDTH = 960;

// External Atlas Action courses (not yet in-app, link to atlasaction.com)
const EXTERNAL_COURSES = [
  {
    id: 'ext-first-day-primer',
    title: '1st Day Primer',
    subtitle: 'Free Course',
    description: 'Prepares new stunt professionals for their initial on-set experience. Covers punctuality, protocols, working with coordinators, and career-building practices.',
    lessons: 12,
    duration: '30 min',
    price: 0,
    isFree: true,
    thumbnailUrl: 'https://i.ytimg.com/vi/RRWdgHTU1po/hqdefault.jpg',
    url: 'https://atlas-action-s-school.teachable.com/p/first-day-primer',
  },
  {
    id: 'ext-essentials',
    title: 'Essentials for Stunts',
    subtitle: '90+ Lessons',
    description: 'Master the roadmap for your stunt craft. Learn the 8 ways a coordinator evaluates performers, common mistakes, and key principles for consistent stunt work.',
    lessons: 90,
    duration: '3+ hours',
    price: null,
    isFree: false,
    thumbnailUrl: 'https://i.ytimg.com/vi/jsTsOucm-m4/hqdefault.jpg',
    url: 'https://essentialsforstunts.carrd.co',
  },
  {
    id: 'ext-fighting-for-film',
    title: 'Fighting for Film',
    subtitle: 'Fight Choreography',
    description: 'Learn to execute fight choreography on camera. Covers the four components of a perfect strike, hiding punches from camera, and daily training drills.',
    lessons: null,
    duration: null,
    price: null,
    isFree: false,
    thumbnailUrl: 'https://i.ytimg.com/vi/Chgl_2oxcEg/hqdefault.jpg',
    url: 'https://fightingforfilm.carrd.co',
  },
  {
    id: 'ext-performer-to-coordinator',
    title: 'From Performer to Coordinator',
    subtitle: '80+ Lessons',
    description: 'Advance your career from performer to coordinator. Covers finding work, interviews, script breakdowns, and hiring the best team.',
    lessons: 80,
    duration: '8+ hours',
    price: null,
    isFree: false,
    thumbnailUrl: 'https://i.ytimg.com/vi/8qtxyYG32Jg/hqdefault.jpg',
    url: 'https://performertocoordinator.carrd.co',
  },
  {
    id: 'ext-action-for-actors',
    title: 'Action for Actors',
    subtitle: '54 Lessons',
    description: 'Teaches actors how to excel in action entertainment. Master auditions, physical conditioning, and creating high-production-value content.',
    lessons: 54,
    duration: '2+ hours',
    price: null,
    isFree: false,
    thumbnailUrl: 'https://i.ytimg.com/vi/FQJFjotz-gE/hqdefault.jpg',
    url: 'https://actionforactors.carrd.co',
  },
];

export function AtlasActionScreen({ navigation }: any) {
  usePageTitle('Atlas Action');
  const { state, isAtlasVideoUnlocked } = useAppState();

  const inAppCourses = useMemo(() =>
    state.settings.atlasActionCourses.filter(c => c.enabled),
    [state.settings.atlasActionCourses]);

  const getCourseProgress = (courseId: string) => {
    const course = inAppCourses.find(c => c.id === courseId);
    if (!course) return { total: 0, unlocked: 0 };
    const total = course.videoIds.length;
    const unlocked = course.videoIds.filter(id => isAtlasVideoUnlocked(id)).length;
    return { total, unlocked };
  };

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
          <View style={styles.heroContent}>
            <Text style={styles.heroTagline}>WHERE YOU LEARN ACTION</Text>
            <Text style={styles.heroTitle}>Professional Stunt Training</Text>
            <Text style={styles.heroDescription}>
              Online courses taught by veteran stunt coordinator Brad Martin with 30+ years of experience on major Hollywood productions.
            </Text>
          </View>
        </View>

        {/* In-App Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available on StuntListing TV</Text>
          <Text style={styles.sectionSubtitle}>Watch directly in the app</Text>

          {inAppCourses.map(course => {
            const { total, unlocked } = getCourseProgress(course.id);
            const owned = state.purchasedAtlasCourses.includes(course.id);
            return (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => navigation.navigate('AtlasActionDetail', { atlasCourseId: course.id })}
              >
                <Image source={{ uri: course.thumbnailUrl }} style={styles.courseThumb} contentFit="cover" />
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseInstructor}>{course.instructorName}</Text>
                  <Text style={styles.courseMeta}>
                    {total} lessons {owned ? `\u2022 ${unlocked}/${total} unlocked` : `\u2022 $${course.price.toFixed(2)}`}
                  </Text>
                  <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* External Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More from Atlas Action</Text>
          <Text style={styles.sectionSubtitle}>Available on atlasaction.com</Text>

          {EXTERNAL_COURSES.map(course => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => Linking.openURL(course.url)}
            >
              <Image source={{ uri: course.thumbnailUrl }} style={styles.courseThumb} contentFit="cover" />
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                {course.isFree && (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                )}
                <Text style={styles.courseMeta}>
                  {course.lessons ? `${course.lessons} lessons` : ''}
                  {course.duration ? ` \u2022 ${course.duration}` : ''}
                </Text>
                <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
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
  heroContent: {},
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.lg,
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
  freeBadge: {
    backgroundColor: '#22c55e', alignSelf: 'flex-start',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginTop: 2,
  },
  freeBadgeText: { color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold },
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
