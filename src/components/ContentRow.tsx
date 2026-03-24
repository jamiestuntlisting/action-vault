import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { Video } from '../types';
import { VideoCard } from './VideoCard';

const isWeb = Platform.OS === 'web';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ContentRowProps {
  title: string;
  videos: Video[];
  onVideoPress: (video: Video) => void;
  onSeeAll?: () => void;
  showProgress?: boolean;
  showRanks?: boolean;
  cardWidth?: number;
}

export function ContentRow({ title, videos, onVideoPress, onSeeAll, showProgress, showRanks, cardWidth }: ContentRowProps) {
  const flatListRef = useRef<FlatList>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [isHovered, setIsHovered] = useState(false);

  if (videos.length === 0) return null;

  // Compute dynamic card width based on actual container width
  // Target ~4.5 cards visible on wider screens, ~2.3 on narrow phones
  const effectiveCardWidth = cardWidth ?? (() => {
    const w = containerWidth;
    if (w < 500) return Math.max(w * 0.42, 120);
    // Show ~4.5 cards: account for padding (Spacing.screen * 2 ≈ 32px) and gaps (Spacing.sm ≈ 8px)
    return Math.max(w * 0.21, 120);
  })();

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

  // Web hover props
  const hoverProps = isWeb ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  const showArrows = isWeb && isHovered;

  return (
    <View style={styles.container} {...(hoverProps as any)}>
      <View style={styles.header}>
        {onSeeAll ? (
          <TouchableOpacity onPress={onSeeAll} style={styles.titleTouchable}>
            <Text style={styles.title}>{title}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} style={{ marginLeft: 4, marginTop: 2 }} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.listContainer} onLayout={handleLayout}>
        <FlatList
          ref={flatListRef}
          data={videos}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyExtractor={item => item.id}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToAlignment="start"
          renderItem={({ item, index }) => (
            <VideoCard
              video={item}
              onPress={() => onVideoPress(item)}
              showProgress={showProgress}
              showRank={showRanks ? index + 1 : undefined}
              width={effectiveCardWidth}
            />
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
  container: {
    marginBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  titleTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAll: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  listContainer: {
    position: 'relative',
  },
  list: {
    paddingHorizontal: Spacing.screen,
  },
  arrowButton: {
    position: 'absolute',
    top: 0,
    bottom: 30, // leave space for title text below thumbnail
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
