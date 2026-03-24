import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { StuntPodcast } from '../data/podcasts';

const isWeb = Platform.OS === 'web';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 160;

function PodcastCard({ podcast, onPress }: { podcast: StuntPodcast; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.coverContainer}>
        <View style={styles.coverFallback}>
          <Ionicons name="mic" size={32} color={Colors.primary} />
          <Text style={styles.coverTitle} numberOfLines={2}>{podcast.title}</Text>
        </View>
        {podcast.status === 'inactive' && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Archived</Text>
          </View>
        )}
        {podcast.status === 'active' && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
      </View>
      <Text style={styles.podcastTitle} numberOfLines={2}>{podcast.title}</Text>
      <Text style={styles.podcastHost} numberOfLines={1}>{podcast.hosts}</Text>
    </TouchableOpacity>
  );
}

interface PodcastSectionProps {
  podcasts: StuntPodcast[];
  navigation?: any;
}

export function PodcastSection({ podcasts, navigation }: PodcastSectionProps) {
  const flatListRef = useRef<FlatList>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [isHovered, setIsHovered] = useState(false);

  if (podcasts.length === 0) return null;

  const SCROLL_AMOUNT = containerWidth * 0.75;
  const canScrollLeft = scrollOffset > 10;
  const canScrollRight = contentWidth > containerWidth && scrollOffset < contentWidth - containerWidth - 10;

  const scrollLeft = useCallback(() => {
    const newOffset = Math.max(0, scrollOffset - SCROLL_AMOUNT);
    flatListRef.current?.scrollToOffset({ offset: newOffset, animated: true });
  }, [scrollOffset, SCROLL_AMOUNT]);

  const scrollRight = useCallback(() => {
    const maxOffset = contentWidth - containerWidth;
    const newOffset = Math.min(maxOffset, scrollOffset + SCROLL_AMOUNT);
    flatListRef.current?.scrollToOffset({ offset: newOffset, animated: true });
  }, [scrollOffset, contentWidth, containerWidth, SCROLL_AMOUNT]);

  const handleScroll = useCallback((event: any) => {
    setScrollOffset(event.nativeEvent.contentOffset.x);
  }, []);

  const handleContentSizeChange = useCallback((w: number) => {
    setContentWidth(w);
  }, []);

  const handleLayout = useCallback((event: any) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  function handlePodcastPress(podcast: StuntPodcast) {
    if (navigation) {
      navigation.navigate('PodcastDetail', { podcastId: podcast.id });
    }
  }

  function handleSeeAll() {
    if (navigation) {
      navigation.navigate('PodcastsGrid');
    }
  }

  const hoverProps = isWeb ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  const showArrows = isWeb && isHovered;

  return (
    <View style={styles.section} {...(hoverProps as any)}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSeeAll} style={styles.titleTouchable}>
          <Ionicons name="mic-outline" size={22} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Stunt Podcasts</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} style={{ marginLeft: 4, marginTop: 2 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionSubtitle}>
        Listen to stories from the stunt world
      </Text>

      <View style={styles.listContainer} onLayout={handleLayout}>
        <FlatList
          ref={flatListRef}
          data={podcasts}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyExtractor={item => item.id}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <PodcastCard podcast={item} onPress={() => handlePodcastPress(item)} />
          )}
        />

        {/* Left Arrow */}
        {showArrows && canScrollLeft && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowLeft]}
            onPress={scrollLeft}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Right Arrow */}
        {showArrows && canScrollRight && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowRight]}
            onPress={scrollRight}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-forward" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    marginBottom: 4,
  },
  titleTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  seeAll: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
  },
  listContainer: {
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
  },
  coverContainer: {
    width: CARD_WIDTH,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginBottom: 6,
  },
  coverFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a2e',
  },
  coverTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginTop: 6,
  },
  inactiveBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    color: Colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase' as const,
  },
  activeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(29,185,84,0.85)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase' as const,
  },
  podcastTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: 18,
  },
  podcastHost: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  arrowButton: {
    position: 'absolute',
    top: 0,
    bottom: 30,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  arrowLeft: {
    left: 0,
    borderTopRightRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  arrowRight: {
    right: 0,
    borderTopLeftRadius: BorderRadius.sm,
    borderBottomLeftRadius: BorderRadius.sm,
  },
});
