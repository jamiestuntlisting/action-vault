import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { Video } from '../../types';
import { VideoCard } from '../../components/VideoCard';
import { videos as allVideos } from '../../data';

const MAX_WIDTH = 960;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function CategoryVideosScreen({ navigation, route }: any) {
  const { title, videoIds } = route.params as { title: string; videoIds: string[] };

  const categoryVideos: Video[] = videoIds
    .map((id: string) => allVideos.find((v: Video) => v.id === id))
    .filter(Boolean) as Video[];

  const numColumns = SCREEN_WIDTH > 700 ? 4 : SCREEN_WIDTH > 500 ? 3 : 2;
  const cardWidth = (Math.min(SCREEN_WIDTH, MAX_WIDTH) - Spacing.screen * 2 - Spacing.sm * (numColumns - 1)) / numColumns;

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
  grid: { paddingHorizontal: Spacing.screen, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
});
