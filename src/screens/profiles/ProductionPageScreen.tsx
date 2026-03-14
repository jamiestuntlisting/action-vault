import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { productionMap, videos } from '../../data';
import { VideoCard } from '../../components/VideoCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ProductionPageScreen({ route, navigation }: any) {
  const { productionId } = route.params;
  const production = productionMap.get(productionId);

  const prodVideos = useMemo(() =>
    videos.filter(v => v.productions.some(p => p.id === productionId)), [productionId]);

  const allCoordinators = useMemo(() => {
    const map = new Map<string, any>();
    prodVideos.forEach(v => v.coordinators.forEach(c => map.set(c.id, c)));
    return [...map.values()];
  }, [prodVideos]);

  const allPerformers = useMemo(() => {
    const map = new Map<string, any>();
    prodVideos.forEach(v => v.performers.forEach(p => map.set(p.id, p)));
    return [...map.values()];
  }, [prodVideos]);

  if (!production) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{production.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{production.year}</Text>
          <Text style={styles.metaText}>{production.studio}</Text>
          <View style={styles.budgetBadge}>
            <Text style={styles.budgetText}>{production.budgetTier.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {allCoordinators.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coordinators</Text>
          {allCoordinators.map(c => (
            <TouchableOpacity key={c.id} style={styles.personRow}
              onPress={() => navigation.navigate('CoordinatorProfile', { coordinatorId: c.id })}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
              <Text style={styles.personName}>{c.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {allPerformers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performers</Text>
          {allPerformers.map(p => (
            <TouchableOpacity key={p.id} style={styles.personRow}
              onPress={() => navigation.navigate('PerformerProfile', { performerId: p.id })}>
              <Ionicons name="person-outline" size={18} color={Colors.accent} />
              <Text style={styles.personName}>{p.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BTS Content ({prodVideos.length})</Text>
        <View style={styles.videoGrid}>
          {prodVideos.map(v => (
            <VideoCard key={v.id} video={v}
              onPress={() => navigation.navigate('VideoDetail', { videoId: v.id })}
              width={(SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md) / 2}
            />
          ))}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backButton: {
    position: 'absolute', top: 50, left: Spacing.screen, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: Spacing.sm,
  },
  header: { paddingTop: 100, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xxl },
  title: { color: Colors.textPrimary, fontSize: FontSize.hero, fontWeight: FontWeight.heavy },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  metaText: { color: Colors.textTertiary, fontSize: FontSize.md },
  budgetBadge: {
    backgroundColor: Colors.surfaceHighlight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.xs,
  },
  budgetText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  section: { paddingHorizontal: Spacing.screen, marginBottom: Spacing.xxl },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  personRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  personName: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
});
