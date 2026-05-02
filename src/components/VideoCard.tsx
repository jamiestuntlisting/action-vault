import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, Spacing, FontWeight } from '../theme';
import { Video } from '../types';
import { useAppState } from '../services/AppState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Ensure at least 2 thumbnails visible on narrow phones
// On mobile (<500px): ~42% of screen. On wider screens: ~22%, min 120px
const CARD_WIDTH = Math.max(SCREEN_WIDTH < 500 ? SCREEN_WIDTH * 0.42 : SCREEN_WIDTH * 0.22, 120);
const CARD_HEIGHT = CARD_WIDTH * 0.56;

interface VideoCardProps {
  video: Video;
  onPress: () => void;
  onLongPress?: () => void;
  width?: number;
  showProgress?: boolean;
  showRank?: number;
}

export function VideoCard({ video, onPress, onLongPress, width = CARD_WIDTH, showProgress, showRank }: VideoCardProps) {
  const { getWatchProgress, dispatch } = useAppState();
  const [imgError, setImgError] = useState(false);
  const progress = getWatchProgress(video.id);
  const progressPercent = progress ? (progress.progressSeconds / video.durationSeconds) * 100 : 0;
  const isWatched = progress?.completed === true;
  const isPartiallyWatched = !isWatched && progress && progress.progressSeconds > 10;
  const height = width * 0.56;

  const handleToggleWatched = (e: any) => {
    // Don't navigate to the video — this tap is for the watched toggle only.
    e?.stopPropagation?.();
    dispatch({ type: 'TOGGLE_WATCHED', payload: { videoId: video.id, durationSeconds: video.durationSeconds } });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={[styles.imageContainer, { height }]}>
        {video.thumbnailUrl && !imgError ? (
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={[styles.image, (isWatched || isPartiallyWatched) && styles.imageWatched]}
            contentFit="cover"
            transition={200}
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.fallbackThumb}>
            <Ionicons name="videocam" size={Math.max(width * 0.15, 18)} color="rgba(255,255,255,0.3)" />
            <Text style={styles.fallbackTitle} numberOfLines={2}>{video.title}</Text>
          </View>
        )}
        {/* Grey overlay + status label for watched videos */}
        {(isWatched || isPartiallyWatched) && (
          <View style={styles.watchedOverlay}>
            <Ionicons
              name={isWatched ? 'checkmark-circle' : 'time-outline'}
              size={16}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.watchedLabel}>
              {isWatched ? 'Watched' : 'Partially Watched'}
            </Text>
          </View>
        )}
        {showRank !== undefined && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{showRank}</Text>
          </View>
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.durationSeconds)}</Text>
        </View>
        {video.isFeatured && !isWatched && !isPartiallyWatched && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        )}
        {/* Mark-as-watched toggle. Lets the user manually flag a video as
            seen so it stops showing in discovery rows. Tap toggles the
            completed flag (un-watching removes the entry). */}
        <TouchableOpacity
          style={styles.watchedToggle}
          onPress={handleToggleWatched}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons
            name={isWatched ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={22}
            color={isWatched ? Colors.primary : 'rgba(255,255,255,0.85)'}
          />
        </TouchableOpacity>
        {/* Progress bar: show for continue watching or partially watched */}
        {((showProgress && progressPercent > 0) || isPartiallyWatched) && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
          </View>
        )}
      </View>
      <Text style={[styles.title, (isWatched || isPartiallyWatched) && styles.titleWatched]} numberOfLines={2}>{video.title}</Text>
    </TouchableOpacity>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.sm,
  },
  imageContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackThumb: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    gap: 4,
  },
  fallbackTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    lineHeight: 13,
  },
  imageWatched: {
    opacity: 0.4,
  },
  watchedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  watchedLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rankBadge: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderTopRightRadius: BorderRadius.sm,
  },
  rankText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.heavy,
  },
  durationBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  durationText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  featuredBadge: {
    position: 'absolute',
    left: 4,
    top: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  featuredText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  watchedToggle: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.surfaceLight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  titleWatched: {
    color: Colors.textMuted,
  },
});
