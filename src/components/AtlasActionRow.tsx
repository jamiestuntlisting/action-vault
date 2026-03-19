import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { AtlasActionVideo } from '../services/AppState';
import { AtlasActionCard } from './AtlasActionCard';

const isWeb = Platform.OS === 'web';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AtlasActionRowProps {
  title: string;
  videos: AtlasActionVideo[];
  onVideoPress: (video: AtlasActionVideo) => void;
  onSeeAll?: () => void;
  cardWidth?: number;
}

export function AtlasActionRow({ title, videos, onVideoPress, onSeeAll, cardWidth }: AtlasActionRowProps) {
  const flatListRef = useRef<FlatList>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [isHovered, setIsHovered] = useState(false);

  if (videos.length === 0) return null;

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

  const hoverProps = isWeb ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  const showArrows = isWeb && isHovered;

  return (
    <View style={styles.container} {...(hoverProps as any)}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="fitness" size={20} color={Colors.primary} />
          <Text style={styles.title}>{title}</Text>
        </View>
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
          renderItem={({ item }) => (
            <AtlasActionCard
              video={item}
              onPress={() => onVideoPress(item)}
              width={cardWidth}
            />
          )}
        />

        {showArrows && canScrollLeft && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowLeft]}
            onPress={scrollLeft}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
        )}

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
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
