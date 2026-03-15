import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { stuntReels, skillReels, StuntReel, SkillReel } from '../../services/StuntListingService';
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
              onPress={() => Linking.openURL(item.url)}
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
  grid: { paddingHorizontal: Spacing.screen, paddingBottom: 100, gap: Spacing.md },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
});
