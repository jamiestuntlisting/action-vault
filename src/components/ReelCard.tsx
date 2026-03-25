import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { StuntReel, SkillReel } from '../services/StuntListingService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Match VideoCard sizing — ensure at least 2 thumbnails on narrow phones
const CARD_WIDTH = Math.max(SCREEN_WIDTH < 500 ? SCREEN_WIDTH * 0.42 : SCREEN_WIDTH * 0.22, 120);

interface ReelCardProps {
  reel: StuntReel | SkillReel;
  onPress: () => void;
  width?: number;
}

export function ReelCard({ reel, onPress, width = CARD_WIDTH }: ReelCardProps) {
  const isSkill = 'skill' in reel;
  const title = isSkill ? (reel as SkillReel).skill : (reel as StuntReel).title;
  const thumbUrl = reel.thumb || (reel.youtubeId ? `https://i.ytimg.com/vi/${reel.youtubeId}/hqdefault.jpg` : null);

  return (
    <TouchableOpacity style={[styles.container, { width }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.thumbContainer, { width, height: width * 0.5625 }]}>
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : reel.photo ? (
          <View style={styles.placeholderThumb}>
            <Image source={{ uri: reel.photo }} style={styles.thumbnail} contentFit="cover" />
            <View style={styles.placeholderOverlay}>
              <Text style={styles.placeholderName} numberOfLines={1}>{reel.name}</Text>
              <Text style={styles.placeholderSkill} numberOfLines={1}>{title}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderThumb}>
            <Text style={styles.placeholderInitialLg}>{reel.name.charAt(0)}</Text>
            <Text style={styles.placeholderName} numberOfLines={1}>{reel.name}</Text>
            <Text style={styles.placeholderSkill} numberOfLines={1}>{title}</Text>
          </View>
        )}
        {/* StuntListing badge */}
        <View style={styles.slBadge}>
          <Text style={styles.slBadgeText}>STLG</Text>
        </View>
        {isSkill && (reel as SkillReel).level && (reel as SkillReel).level !== 'Not rated' && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{(reel as SkillReel).level}</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <View style={styles.performerRow}>
        {reel.photo ? (
          <Image source={{ uri: reel.photo }} style={styles.performerPhoto} contentFit="cover" />
        ) : (
          <View style={styles.performerPhotoPlaceholder}>
            <Text style={styles.performerInitial}>{reel.name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.performerInfo}>
          <Text style={styles.performerName} numberOfLines={1}>{reel.name}</Text>
          <Text style={styles.performerRole}>{reel.role === 'coordinator' ? 'Coordinator' : 'Performer'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.sm,
  },
  thumbContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumb: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
  },
  placeholderOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  placeholderInitialLg: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 2,
  },
  placeholderName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  placeholderSkill: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
  placeholderText: {
    fontSize: 24,
  },
  slBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#E50914',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  slBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  levelText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: FontWeight.medium,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    lineHeight: 16,
    marginBottom: 2,
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performerPhoto: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  performerPhotoPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  performerInitial: {
    color: Colors.textTertiary,
    fontSize: 8,
    fontWeight: FontWeight.bold,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 14,
  },
  performerRole: {
    color: Colors.textMuted,
    fontSize: 9,
    lineHeight: 12,
  },
});
