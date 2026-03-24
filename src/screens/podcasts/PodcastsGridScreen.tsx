import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { podcasts, StuntPodcast } from '../../data/podcasts';
import { usePageTitle } from '../../hooks/usePageTitle';

function PodcastGridCard({ podcast, onPress }: { podcast: StuntPodcast; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.coverContainer}>
        <View style={styles.coverFallback}>
          <Ionicons name="mic" size={32} color={Colors.primary} />
          <Text style={styles.coverTitle} numberOfLines={2}>{podcast.title}</Text>
        </View>
        {podcast.status === 'active' ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        ) : (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Archived</Text>
          </View>
        )}
      </View>
      <Text style={styles.podcastTitle} numberOfLines={2}>{podcast.title}</Text>
      <Text style={styles.podcastHost} numberOfLines={1}>{podcast.hosts}</Text>
      <Text style={styles.podcastDesc} numberOfLines={2}>{podcast.description}</Text>
    </TouchableOpacity>
  );
}

export function PodcastsGridScreen({ navigation }: any) {
  usePageTitle('Stunt Podcasts');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const filtered = filter === 'all' ? podcasts :
    podcasts.filter(p => p.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stunt Podcasts</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Archived'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <PodcastGridCard
            podcast={item}
            onPress={() => navigation.navigate('PodcastDetail', { podcastId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: Spacing.md, paddingHorizontal: Spacing.screen,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold,
  },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.screen, gap: 8, marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: FontWeight.semibold },
  filterChipTextActive: { color: '#fff' },
  grid: { paddingHorizontal: Spacing.screen, paddingBottom: 80 },
  row: { gap: 12, marginBottom: 16 },
  card: { flex: 1 },
  coverContainer: {
    height: 110, borderRadius: BorderRadius.md, overflow: 'hidden',
    backgroundColor: Colors.surface, marginBottom: 6,
  },
  coverFallback: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12,
    backgroundColor: '#1a1a2e',
  },
  coverTitle: {
    color: Colors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold,
    textAlign: 'center', marginTop: 6,
  },
  activeBadge: {
    position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(29,185,84,0.85)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  activeBadgeText: { color: '#fff', fontSize: 9, fontWeight: FontWeight.bold, textTransform: 'uppercase' as const },
  inactiveBadge: {
    position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  inactiveBadgeText: { color: Colors.textMuted, fontSize: 9, textTransform: 'uppercase' as const },
  podcastTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, lineHeight: 18 },
  podcastHost: { color: Colors.textSecondary, fontSize: 11, marginTop: 1 },
  podcastDesc: { color: Colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: 4 },
});
