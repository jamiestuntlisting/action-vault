import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { stuntReels, skillReels, StuntReel, SkillReel, getEmbedUrl } from '../../services/StuntListingService';
import { ReelCard } from '../../components/ReelCard';

const MAX_WIDTH = 960;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ReelGridScreen({ navigation, route }: any) {
  const { title, reelIds } = route.params as { title: string; reelIds: string[] };

  // Build a lookup from all reels
  const allReels = [...stuntReels, ...skillReels];
  const reelMap = new Map(allReels.map(r => [r.id, r]));

  const reels: (StuntReel | SkillReel)[] = reelIds
    .map((id: string) => reelMap.get(id))
    .filter(Boolean) as (StuntReel | SkillReel)[];

  const numColumns = SCREEN_WIDTH > 700 ? 5 : SCREEN_WIDTH > 500 ? 4 : 3;
  const cardWidth = (Math.min(SCREEN_WIDTH, MAX_WIDTH) - Spacing.screen * 2 - Spacing.sm * (numColumns - 1)) / numColumns;

  function handleWatchAll() {
    // Build a queue of all reel embed URLs and titles for sequential playback
    const queue = reels
      .map(r => {
        const embedUrl = getEmbedUrl(r);
        const reelTitle = 'skill' in r ? (r as SkillReel).skill : (r as StuntReel).title;
        return embedUrl ? { embedUrl, title: `${reelTitle} - ${r.name}`, reelId: r.id } : null;
      })
      .filter(Boolean) as { embedUrl: string; title: string; reelId: string }[];

    if (queue.length > 0) {
      // Start playing the first reel with the full queue
      navigation.navigate('VideoPlayer', {
        embedUrl: queue[0].embedUrl,
        title: queue[0].title,
        reelId: queue[0].reelId,
        queue: queue.slice(1), // remaining items
      });
    }
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
            <Text style={styles.headerCount}>{reels.length} reels</Text>
          </View>
        </View>

        {/* Watch All button */}
        {reels.length > 0 && (
          <TouchableOpacity style={styles.watchAllButton} onPress={handleWatchAll} activeOpacity={0.8}>
            <Ionicons name="play-circle" size={22} color={Colors.black} />
            <Text style={styles.watchAllText}>Watch All</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={reels}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ReelCard
              reel={item}
              onPress={() => navigation.navigate('ReelDetail', { reelId: item.id })}
              width={cardWidth}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="videocam-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No reels in this category</Text>
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
  grid: { paddingHorizontal: Spacing.screen, paddingBottom: 100, gap: Spacing.md },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
});
