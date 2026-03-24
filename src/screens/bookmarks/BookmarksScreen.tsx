import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap } from '../../data';
import { usePageTitle } from '../../hooks/usePageTitle';

export function BookmarksScreen({ navigation }: any) {
  usePageTitle('Bookmarks');
  const { getProfileBookmarks, dispatch } = useAppState();
  const bookmarks = getProfileBookmarks();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>
      <Text style={styles.title}>Bookmarks</Text>

      <FlatList
        data={bookmarks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const video = videoMap.get(item.videoId);
          if (!video) return null;
          return (
            <TouchableOpacity
              style={styles.bookmarkItem}
              onPress={() => navigation.navigate('VideoPlayer', { videoId: item.videoId, startTime: item.timestampSeconds })}
            >
              <Image source={{ uri: video.thumbnailUrl }} style={styles.thumb} contentFit="cover" />
              <View style={styles.info}>
                <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
                <Text style={styles.timestamp}>{formatTime(item.timestampSeconds)}</Text>
                {item.note ? <Text style={styles.note} numberOfLines={2}>{item.note}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => dispatch({ type: 'REMOVE_BOOKMARK', payload: item.id })}>
                <Ionicons name="close-circle-outline" size={22} color={Colors.textTertiary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No bookmarks yet</Text>
            <Text style={styles.emptySubtitle}>Bookmark moments while watching to save them here</Text>
          </View>
        }
      />
    </View>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  backButton: {
    position: 'absolute', top: 50, left: Spacing.screen, zIndex: 10,
  },
  title: {
    color: Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.screen, marginBottom: Spacing.lg, textAlign: 'center',
  },
  list: { paddingHorizontal: Spacing.screen, paddingBottom: 100 },
  bookmarkItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  thumb: { width: 80, height: 45, borderRadius: BorderRadius.sm },
  info: { flex: 1 },
  videoTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  timestamp: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginTop: 2 },
  note: { color: Colors.textTertiary, fontSize: FontSize.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 100, gap: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptySubtitle: { color: Colors.textTertiary, fontSize: FontSize.md, textAlign: 'center', paddingHorizontal: 40 },
});
