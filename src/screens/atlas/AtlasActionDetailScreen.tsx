import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState, AtlasActionVideo, AtlasActionCourse } from '../../services/AppState';
import { StripeService } from '../../services/StripeService';

const MAX_WIDTH = 960;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function AtlasActionDetailScreen({ navigation, route }: any) {
  const { atlasVideoId, atlasCourseId } = route.params as { atlasVideoId?: string; atlasCourseId?: string };
  const { state, dispatch, isAtlasVideoUnlocked } = useAppState();

  const video = useMemo(() =>
    state.settings.atlasActionVideos.find(v => v.id === atlasVideoId),
    [atlasVideoId, state.settings.atlasActionVideos]);

  const course = useMemo(() =>
    state.settings.atlasActionCourses.find(c => c.id === atlasCourseId),
    [atlasCourseId, state.settings.atlasActionCourses]);

  // If viewing a video, find its parent course
  const parentCourse = useMemo(() => {
    if (!video) return null;
    return state.settings.atlasActionCourses.find(c => c.videoIds.includes(video.id)) || null;
  }, [video, state.settings.atlasActionCourses]);

  // If viewing a course, get its videos
  const courseVideos = useMemo(() => {
    if (!course) return [];
    return course.videoIds
      .map(id => state.settings.atlasActionVideos.find(v => v.id === id))
      .filter(Boolean) as AtlasActionVideo[];
  }, [course, state.settings.atlasActionVideos]);

  const unlocked = video ? isAtlasVideoUnlocked(video.id) : false;

  async function handlePurchaseVideo() {
    if (!video) return;
    try {
      await StripeService.initiateCheckout({
        type: 'video',
        id: video.id,
        title: video.title,
        price: video.price,
      });
    } catch (e: any) {
      if (Platform.OS === 'web') {
        alert('Unable to start checkout. Please try again.');
      } else {
        Alert.alert('Error', 'Unable to start checkout. Please try again.');
      }
    }
  }

  async function handlePurchaseCourse(c: AtlasActionCourse) {
    try {
      await StripeService.initiateCheckout({
        type: 'course',
        id: c.id,
        title: c.title,
        price: c.price,
      });
    } catch (e: any) {
      if (Platform.OS === 'web') {
        alert('Unable to start checkout. Please try again.');
      } else {
        Alert.alert('Error', 'Unable to start checkout. Please try again.');
      }
    }
  }

  function handlePlayVideo() {
    if (!video) return;
    navigation.navigate('VideoPlayer', {
      embedUrl: video.youtubeEmbedUrl,
      title: video.title,
    });
  }

  // ─── Video Detail View ───
  if (video) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidth}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Atlas Action</Text>
          </View>

          {/* Thumbnail / Player area */}
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: video.thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={200}
            />
            {unlocked || video.isFree ? (
              <TouchableOpacity style={styles.playOverlay} onPress={handlePlayVideo}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={36} color={Colors.white} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.lockFullOverlay}>
                <Ionicons name="lock-closed" size={40} color="rgba(255,255,255,0.8)" />
                <Text style={styles.lockText}>Locked</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoSection}>
            <Text style={styles.videoTitle}>{video.title}</Text>
            <Text style={styles.instructor}>
              <Ionicons name="person" size={14} color={Colors.textMuted} /> {video.instructorName}
            </Text>
            <Text style={styles.duration}>
              <Ionicons name="time" size={14} color={Colors.textMuted} /> {Math.floor(video.durationSeconds / 60)} min
            </Text>

            {video.description ? (
              <Text style={styles.description}>{video.description}</Text>
            ) : null}

            {/* Purchase / Play button */}
            {video.isFree || unlocked ? (
              <TouchableOpacity style={styles.playFullButton} onPress={handlePlayVideo}>
                <Ionicons name="play-circle" size={22} color={Colors.black} />
                <Text style={styles.playFullText}>Play Video</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchaseVideo}>
                  <Ionicons name="card" size={20} color={Colors.white} />
                  <Text style={styles.purchaseText}>Purchase for ${video.price.toFixed(2)}</Text>
                </TouchableOpacity>

                {/* Show course bundle option if available */}
                {parentCourse && !state.purchasedAtlasCourses.includes(parentCourse.id) && (
                  <TouchableOpacity
                    style={styles.courseBundleButton}
                    onPress={() => handlePurchaseCourse(parentCourse)}
                  >
                    <Ionicons name="albums" size={18} color={Colors.primary} />
                    <Text style={styles.courseBundleText}>
                      Or get the full "{parentCourse.title}" course for ${parentCourse.price.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Other videos in course */}
          {parentCourse && (
            <View style={styles.courseSection}>
              <Text style={styles.courseSectionTitle}>More in "{parentCourse.title}"</Text>
              {parentCourse.videoIds
                .map(id => state.settings.atlasActionVideos.find(v => v.id === id))
                .filter(Boolean)
                .map((v) => {
                  const vid = v as AtlasActionVideo;
                  const isUnlocked = isAtlasVideoUnlocked(vid.id);
                  return (
                    <TouchableOpacity
                      key={vid.id}
                      style={styles.courseVideoRow}
                      onPress={() => navigation.push('AtlasActionDetail', { atlasVideoId: vid.id })}
                    >
                      <Image source={{ uri: vid.thumbnailUrl }} style={styles.courseVideoThumb} contentFit="cover" />
                      <View style={styles.courseVideoInfo}>
                        <Text style={styles.courseVideoTitle} numberOfLines={2}>{vid.title}</Text>
                        <Text style={styles.courseVideoDuration}>{Math.floor(vid.durationSeconds / 60)} min</Text>
                      </View>
                      {isUnlocked || vid.isFree ? (
                        <Ionicons name="play-circle" size={24} color={Colors.primary} />
                      ) : (
                        <Ionicons name="lock-closed" size={20} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    );
  }

  // ─── Course Detail View ───
  if (course) {
    const courseOwned = state.purchasedAtlasCourses.includes(course.id);
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidth}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Atlas Action Course</Text>
          </View>

          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: course.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.videoTitle}>{course.title}</Text>
            <Text style={styles.instructor}>{course.instructorName}</Text>
            <Text style={styles.duration}>{courseVideos.length} videos</Text>
            {course.description && <Text style={styles.description}>{course.description}</Text>}

            {!courseOwned && (
              <TouchableOpacity style={styles.purchaseButton} onPress={() => handlePurchaseCourse(course)}>
                <Ionicons name="card" size={20} color={Colors.white} />
                <Text style={styles.purchaseText}>Purchase Course for ${course.price.toFixed(2)}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.courseSection}>
            <Text style={styles.courseSectionTitle}>Course Videos</Text>
            {courseVideos.map((vid) => {
              const isUnlocked = isAtlasVideoUnlocked(vid.id);
              return (
                <TouchableOpacity
                  key={vid.id}
                  style={styles.courseVideoRow}
                  onPress={() => navigation.push('AtlasActionDetail', { atlasVideoId: vid.id })}
                >
                  <Image source={{ uri: vid.thumbnailUrl }} style={styles.courseVideoThumb} contentFit="cover" />
                  <View style={styles.courseVideoInfo}>
                    <Text style={styles.courseVideoTitle} numberOfLines={2}>{vid.title}</Text>
                    <Text style={styles.courseVideoDuration}>{Math.floor(vid.durationSeconds / 60)} min</Text>
                  </View>
                  {isUnlocked || vid.isFree ? (
                    <Ionicons name="play-circle" size={24} color={Colors.primary} />
                  ) : (
                    <Ionicons name="lock-closed" size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    );
  }

  // Fallback
  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.videoTitle}>Content not found</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.instructor}>Go Back</Text>
      </TouchableOpacity>
    </View>
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
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  thumbnail: { width: '100%', height: '100%' },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  playButton: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  lockFullOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm,
  },
  lockText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  infoSection: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.lg },
  videoTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  instructor: { color: Colors.textMuted, fontSize: FontSize.md, marginBottom: 4 },
  duration: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.md },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22, marginBottom: Spacing.lg },
  playFullButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  playFullText: { color: Colors.black, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  purchaseButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  purchaseText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  courseBundleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md, marginTop: Spacing.md,
  },
  courseBundleText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, flex: 1 },
  courseSection: { paddingHorizontal: Spacing.screen, marginTop: Spacing.xxl },
  courseSectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  courseVideoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  courseVideoThumb: { width: 80, height: 45, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface },
  courseVideoInfo: { flex: 1 },
  courseVideoTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  courseVideoDuration: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
