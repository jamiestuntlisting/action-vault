import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { getSkillReelsBySkill } from '../../services/StuntListingService';
import { usePageTitle } from '../../hooks/usePageTitle';

const MAX_WIDTH = 960;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function ReelOfTheMonthArchiveScreen({ navigation }: any) {
  usePageTitle('Skill Reel of the Month · Archive');
  const { state } = useAppState();
  const entries = state.settings.reelOfMonthEntries || [];

  const rows = useMemo(() => {
    const closed = entries.filter(e => e.category === 'skill' && e.status === 'closed');
    return closed.sort((a, b) => {
      const avgA = a.finalAverage ?? 0;
      const avgB = b.finalAverage ?? 0;
      if (avgB !== avgA) return avgB - avgA;
      const cA = a.finalVoteCount ?? 0;
      const cB = b.finalVoteCount ?? 0;
      if (cB !== cA) return cB - cA;
      return b.month.localeCompare(a.month);
    });
  }, [entries]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.maxWidth}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skill Reel of the Month · Archive</Text>
          <View style={{ width: 40 }} />
        </View>

        {rows.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No archived skills yet</Text>
            <Text style={styles.emptyBody}>
              When the month ends, the featured skill&apos;s final average is frozen and added here.
            </Text>
          </View>
        )}

        {rows.map((row, idx) => {
          const reelsForSkill = getSkillReelsBySkill(row.skill);
          const firstWithThumb = reelsForSkill.find(r => r.thumb || r.youtubeId);
          const thumb = firstWithThumb?.thumb || (firstWithThumb?.youtubeId ? `https://i.ytimg.com/vi/${firstWithThumb.youtubeId}/hqdefault.jpg` : null);
          const parentCategory = reelsForSkill[0]?.cat;
          const isTop = idx === 0;
          return (
            <View key={row.id} style={[styles.row, isTop && styles.rowTop]}>
              <View style={styles.thumbWrap}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: Colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="film-outline" size={28} color={Colors.textMuted} />
                  </View>
                )}
                {isTop && (
                  <View style={styles.crown}>
                    <Ionicons name="trophy" size={14} color="#fff" />
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.monthLabel}>{monthLabel(row.month)}</Text>
                <Text style={styles.rowTitle} numberOfLines={2}>{row.skill}</Text>
                <Text style={styles.rowMeta}>
                  {reelsForSkill.length} {reelsForSkill.length === 1 ? 'reel' : 'reels'}{parentCategory ? ` · ${parentCategory}` : ''}
                </Text>
              </View>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreValue}>{(row.finalAverage ?? 0).toFixed(2)}</Text>
                <Text style={styles.scoreLabel}>{row.finalVoteCount ?? 0} {(row.finalVoteCount ?? 0) === 1 ? 'vote' : 'votes'}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  maxWidth: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: Spacing.screen },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg, paddingTop: Platform.OS === 'web' ? Spacing.lg : 50 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, marginBottom: Spacing.sm,
  },
  rowTop: { borderWidth: 1, borderColor: Colors.accent },
  thumbWrap: { width: 120, height: 68, borderRadius: BorderRadius.sm, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  crown: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: Colors.accent, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: { color: Colors.textTertiary, fontSize: FontSize.xs, fontWeight: FontWeight.medium, textTransform: 'uppercase' },
  rowTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 2 },
  rowMeta: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  scoreBlock: { alignItems: 'flex-end', minWidth: 60 },
  scoreValue: { color: Colors.accent, fontSize: FontSize.xxl, fontWeight: FontWeight.heavy },
  scoreLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  emptyCard: { alignItems: 'center', padding: Spacing.xxxl, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.md },
  emptyBody: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm, textAlign: 'center' },
});
