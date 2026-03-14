import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { trainingPathMap, videoMap } from '../../data';

export function TrainingPathDetailScreen({ route, navigation }: any) {
  const { pathId } = route.params;
  const path = trainingPathMap.get(pathId);
  const { getWatchProgress } = useAppState();

  if (!path) return null;

  const pathVideos = path.videoIds.map(id => videoMap.get(id)).filter(Boolean);
  const watchedCount = pathVideos.filter(v => {
    const progress = getWatchProgress(v!.id);
    return progress?.completed;
  }).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      <Image source={{ uri: path.thumbnailUrl }} style={styles.hero} contentFit="cover" />

      <View style={styles.content}>
        <Text style={styles.title}>{path.title}</Text>
        <Text style={styles.description}>{path.description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{pathVideos.length} videos</Text>
          <Text style={styles.metaText}>{Math.round(path.totalDuration / 60)} min total</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(watchedCount / pathVideos.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{watchedCount} of {pathVideos.length} completed</Text>
        </View>

        {pathVideos.map((video, index) => {
          const progress = getWatchProgress(video!.id);
          const isCompleted = progress?.completed;
          return (
            <TouchableOpacity
              key={video!.id}
              style={styles.videoItem}
              onPress={() => navigation.navigate('VideoPlayer', { videoId: video!.id })}
            >
              <View style={styles.indexCircle}>
                {isCompleted ? (
                  <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                ) : (
                  <Text style={styles.indexText}>{index + 1}</Text>
                )}
              </View>
              <Image source={{ uri: video!.thumbnailUrl }} style={styles.videoThumb} contentFit="cover" />
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>{video!.title}</Text>
                <Text style={styles.videoDuration}>{Math.round(video!.durationSeconds / 60)} min</Text>
              </View>
              <Ionicons name="play-circle-outline" size={28} color={Colors.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backButton: {
    position: 'absolute', top: 50, left: Spacing.screen, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: Spacing.sm,
  },
  hero: { width: '100%', height: 200 },
  content: { padding: Spacing.screen },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22, marginBottom: Spacing.lg },
  metaRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.lg },
  metaText: { color: Colors.textTertiary, fontSize: FontSize.sm },
  progressSection: { marginBottom: Spacing.xxl },
  progressBar: { height: 4, backgroundColor: Colors.surfaceHighlight, borderRadius: 2, marginBottom: Spacing.sm },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 2 },
  progressText: { color: Colors.textTertiary, fontSize: FontSize.sm },
  videoItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  indexCircle: { width: 28, alignItems: 'center' },
  indexText: { color: Colors.textTertiary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  videoThumb: { width: 100, height: 56, borderRadius: BorderRadius.sm },
  videoInfo: { flex: 1 },
  videoTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  videoDuration: { color: Colors.textTertiary, fontSize: FontSize.xs, marginTop: 2 },
});
