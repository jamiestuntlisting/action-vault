import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap } from '../../data';

export function DownloadsScreen({ navigation }: any) {
  const { state, dispatch } = useAppState();
  const downloads = state.downloads.map(id => videoMap.get(id)).filter(Boolean);

  const totalSize = downloads.length * 85; // Mock: ~85MB per video

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Downloads</Text>

      <View style={styles.storageBar}>
        <View style={styles.storageInfo}>
          <Ionicons name="phone-portrait-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.storageText}>{totalSize} MB used</Text>
        </View>
        <View style={styles.storageTrack}>
          <View style={[styles.storageFill, { width: `${Math.min((totalSize / 1000) * 100, 100)}%` }]} />
        </View>
        <View style={styles.qualitySetting}>
          <Text style={styles.qualityLabel}>Download Quality</Text>
          <TouchableOpacity style={styles.qualityToggle}>
            <Text style={styles.qualityValue}>{state.settings.downloadQuality.toUpperCase()}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={downloads}
        keyExtractor={item => item!.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: video }) => (
          <TouchableOpacity
            style={styles.downloadItem}
            onPress={() => navigation.navigate('VideoPlayer', { videoId: video!.id })}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: video!.thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
            />
            <View style={styles.downloadInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>{video!.title}</Text>
              <Text style={styles.videoMeta}>~85 MB</Text>
              <View style={styles.wifiBadge}>
                <Ionicons name="wifi" size={12} color={Colors.success} />
                <Text style={styles.wifiText}>Downloaded on Wi-Fi</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => dispatch({ type: 'REMOVE_DOWNLOAD', payload: video!.id })}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="download-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No downloads yet</Text>
            <Text style={styles.emptySubtitle}>Download videos to watch offline</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
  },
  storageBar: {
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.xl,
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  storageText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  storageTrack: {
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  storageFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  qualitySetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  qualityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qualityValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  list: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 100,
  },
  downloadItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  thumbnail: {
    width: 120,
    height: 68,
    borderRadius: BorderRadius.sm,
  },
  downloadInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  videoTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginBottom: 2,
  },
  videoMeta: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    marginBottom: 4,
  },
  wifiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wifiText: {
    color: Colors.success,
    fontSize: FontSize.xs,
  },
  deleteButton: {
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 100,
    gap: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  emptySubtitle: {
    color: Colors.textTertiary,
    fontSize: FontSize.md,
  },
});
