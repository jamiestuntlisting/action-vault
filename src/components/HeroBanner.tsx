import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { Video } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = SCREEN_WIDTH * 0.65;

interface HeroBannerProps {
  video: Video;
  onPlay: () => void;
  onInfo: () => void;
  onAddToList: () => void;
  isInList: boolean;
}

export function HeroBanner({ video, onPlay, onInfo, onAddToList, isInList }: HeroBannerProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: video.thumbnailUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(10,10,10,0.4)', 'rgba(10,10,10,0.95)']}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <View style={styles.tags}>
          {video.skillTags.slice(0, 3).map(tag => (
            <View key={tag.id} style={styles.tag}>
              <Text style={styles.tagText}>{tag.displayName}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{video.description}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.playButton} onPress={onPlay} activeOpacity={0.8}>
            <Ionicons name="play" size={22} color={Colors.black} />
            <Text style={styles.playText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onAddToList} activeOpacity={0.8}>
            <Ionicons name={isInList ? 'checkmark' : 'add'} size={22} color={Colors.white} />
            <Text style={styles.secondaryText}>My List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onInfo} activeOpacity={0.8}>
            <Ionicons name="information-circle-outline" size={22} color={Colors.white} />
            <Text style={styles.secondaryText}>Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    marginBottom: Spacing.xl,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.screen,
  },
  tags: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(229,9,20,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  tagText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  title: {
    color: Colors.white,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.heavy,
    marginBottom: Spacing.xs,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  playText: {
    color: Colors.black,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  secondaryButton: {
    alignItems: 'center',
    gap: 2,
  },
  secondaryText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
});
