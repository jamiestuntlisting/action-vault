import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, Spacing, FontWeight } from '../theme';
import { AtlasActionVideo } from '../services/AppState';
import { useAppState } from '../services/AppState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.max(SCREEN_WIDTH < 500 ? SCREEN_WIDTH * 0.38 : SCREEN_WIDTH * 0.22, 150);
const CARD_HEIGHT = CARD_WIDTH * 0.56;

interface AtlasActionCardProps {
  video: AtlasActionVideo;
  onPress: () => void;
  width?: number;
}

export function AtlasActionCard({ video, onPress, width = CARD_WIDTH }: AtlasActionCardProps) {
  const { isAtlasVideoUnlocked } = useAppState();
  const unlocked = isAtlasVideoUnlocked(video.id);
  const height = width * 0.56;

  return (
    <TouchableOpacity
      style={[styles.container, { width }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.imageContainer, { height }]}>
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {/* Lock overlay for paid locked videos */}
        {!video.isFree && !unlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.9)" />
          </View>
        )}
        {/* Price badge */}
        <View style={[styles.priceBadge, video.isFree ? styles.freeBadge : styles.paidBadge]}>
          <Text style={[styles.priceText, video.isFree && styles.freeText]}>
            {video.isFree ? 'FREE' : unlocked ? 'OWNED' : `$${video.price.toFixed(2)}`}
          </Text>
        </View>
        {/* Duration badge */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.durationSeconds)}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
      <Text style={styles.instructor} numberOfLines={1}>{video.instructorName}</Text>
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
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    left: 4,
    top: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  freeBadge: {
    backgroundColor: '#22c55e',
  },
  paidBadge: {
    backgroundColor: Colors.primary,
  },
  priceText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  freeText: {
    letterSpacing: 1,
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
  title: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  instructor: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
