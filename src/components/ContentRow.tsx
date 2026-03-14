import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors, FontSize, Spacing, FontWeight } from '../theme';
import { Video } from '../types';
import { VideoCard } from './VideoCard';

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
  if (videos.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={videos}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <VideoCard
            video={item}
            onPress={() => onVideoPress(item)}
            showProgress={showProgress}
            showRank={showRanks ? index + 1 : undefined}
            width={cardWidth}
          />
        )}
      />
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
  seeAll: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  list: {
    paddingHorizontal: Spacing.screen,
  },
});
