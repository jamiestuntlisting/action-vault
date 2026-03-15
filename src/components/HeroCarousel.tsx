import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { Video } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 960;
const EFFECTIVE_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);
const BANNER_HEIGHT = EFFECTIVE_WIDTH * 0.55;

interface HeroCarouselProps {
  videos: Video[];
  onPlay: (video: Video) => void;
  onInfo: (video: Video) => void;
  onAddToList: (video: Video) => void;
  isInList: (videoId: string) => boolean;
}

export function HeroCarousel({ videos, onPlay, onInfo, onAddToList, isInList }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoPlayTimer = useRef<any>(null);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (videos.length <= 1) return;
    autoPlayTimer.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % videos.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 6000);
    return () => clearInterval(autoPlayTimer.current);
  }, [videos.length]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / EFFECTIVE_WIDTH);
    if (index !== activeIndex && index >= 0 && index < videos.length) {
      setActiveIndex(index);
      // Reset auto-play timer on manual scroll
      clearInterval(autoPlayTimer.current);
      autoPlayTimer.current = setInterval(() => {
        setActiveIndex(prev => {
          const next = (prev + 1) % videos.length;
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        });
      }, 6000);
    }
  }

  function renderItem({ item }: { item: Video }) {
    const inList = isInList(item.id);
    return (
      <View style={styles.slide}>
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,10,0.4)', 'rgba(10,10,10,0.95)']}
          style={styles.gradient}
        />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.playButton} onPress={() => onPlay(item)} activeOpacity={0.8}>
              <Ionicons name="play" size={22} color={Colors.black} />
              <Text style={styles.playText}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onAddToList(item)} activeOpacity={0.8}>
              <Ionicons name={inList ? 'checkmark' : 'add'} size={22} color={Colors.white} />
              <Text style={styles.secondaryText}>My List</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onInfo(item)} activeOpacity={0.8}>
              <Ionicons name="information-circle-outline" size={22} color={Colors.white} />
              <Text style={styles.secondaryText}>Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: EFFECTIVE_WIDTH,
          offset: EFFECTIVE_WIDTH * index,
          index,
        })}
      />
      {/* Dot indicators */}
      {videos.length > 1 && (
        <View style={styles.dots}>
          {videos.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: BANNER_HEIGHT,
    marginBottom: Spacing.xl,
  },
  slide: {
    width: EFFECTIVE_WIDTH,
    height: BANNER_HEIGHT,
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
  dots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 20,
  },
});
