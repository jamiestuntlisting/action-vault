import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { Video } from '../../types';
import { VideoCard } from '../../components/VideoCard';
import { videos as allVideos } from '../../data';
import { usePageTitle } from '../../hooks/usePageTitle';
import { AnalyticsService } from '../../services/AnalyticsService';

const MAX_WIDTH = 960;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function CategoryVideosScreen({ navigation, route }: any) {
  const { title, videoIds } = route.params as { title: string; videoIds: string[] };
  usePageTitle(route?.params?.title);

  useEffect(() => { AnalyticsService.categoryBrowse(title, title); }, [title]);

  const categoryVideos: Video[] = videoIds
    .map((id: string) => allVideos.find((v: Video) => v.id === id))
    .filter(Boolean) as Video[];

  const numColumns = SCREEN_WIDTH > 700 ? 4 : SCREEN_WIDTH > 500 ? 3 : 2;
  const cardWidth = (Math.min(SCREEN_WIDTH, MAX_WIDTH) - Spacing.screen * 2 - Spacing.sm * (numColumns - 1)) / numColumns;

  function handleWatchAll() {
    if (categoryVideos.length === 0) return;
    // Start playing the first video, queue the rest
    const first = categoryVideos[0];
    const remaining = categoryVideos.slice(1).map(v => ({
      videoId: v.id,
    }));
    navigation.navigate('VideoPlayer', {
      videoId: first.id,
      videoQueue: remaining,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.maxWidth}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.headerCount}>{categoryVideos.length} videos</Text>
          </View>
        </View>

        {/* Watch All button */}
        {categoryVideos.length > 1 && (
          <TouchableOpacity style={styles.watchAllButton} onPress={handleWatchAll} activeOpacity={0.8}>
            <Ionicons name="play-circle" size={22} color={Colors.black} />
            <Text style={styles.watchAllText}>Watch All</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={categoryVideos}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              onPress={() => navigation.navigate('VideoDetail', { videoId: item.id })}
              width={cardWidth}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="film-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No videos in this category</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  maxWidth: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.screen, paddingTop: 60, paddingBottom: Spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  headerCount: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  watchAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  watchAllText: {
    color: Colors.black,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  grid: { paddingHorizontal: Spacing.screen, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
});
