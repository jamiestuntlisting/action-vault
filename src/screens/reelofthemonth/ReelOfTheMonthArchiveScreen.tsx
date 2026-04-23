import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { skillReels, stuntReels, getEmbedUrl, SkillReel, StuntReel } from '../../services/StuntListingService';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { ReelOfMonthCategory, ReelOfMonthEntry } from '../../services/AppState';

const MAX_WIDTH = 960;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function ReelOfTheMonthArchiveScreen({ navigation, route }: any) {
  usePageTitle('Reel of the Month · Archive');
  const initialCategory: ReelOfMonthCategory = route?.params?.category === 'stunt' ? 'stunt' : 'skill';
  const [tab, setTab] = useState<ReelOfMonthCategory>(initialCategory);
  const { state } = useAppState();
  const entries = state.settings.reelOfMonthEntries || [];

  const rows = useMemo(() => {
    const closed = entries.filter(e => e.category === tab && e.status === 'closed');
    return closed.sort((a, b) => {
      const avgA = a.finalAverage ?? 0;
      const avgB = b.finalAverage ?? 0;
      if (avgB !== avgA) return avgB - avgA;
      const cA = a.finalVoteCount ?? 0;
      const cB = b.finalVoteCount ?? 0;
      if (cB !== cA) return cB - cA;
      return b.month.localeCompare(a.month);
    });
  }, [entries, tab]);

  const lookup = tab === 'skill' ? skillReels : stuntReels;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.maxWidth}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reel of the Month · Archive</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabs}>
          {(['skill', 'stunt'] as ReelOfMonthCategory[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'skill' ? 'Skill' : 'Stunt'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {rows.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No archived winners yet</Text>
            <Text style={styles.emptyBody}>
              When the month ends, the featured {tab} reel will be frozen and added here.
            </Text>
          </View>
        )}

        {rows.map((row, idx) => {
          const reel = lookup.find(r => r.id === row.stuntListingReelId) as (SkillReel | StuntReel | undefined);
          if (!reel) return null;
          const thumb = reel.thumb || (reel.youtubeId ? `https://i.ytimg.com/vi/${reel.youtubeId}/hqdefault.jpg` : null);
          const rowTitle = tab === 'skill' ? (row.theme || (reel as SkillReel).skill) : ((reel as StuntReel).title || row.theme);
          const isTop = idx === 0;
          return (
            <TouchableOpacity
              key={row.id}
              style={[styles.row, isTop && styles.rowTop]}
              activeOpacity={0.8}
              onPress={() => {
                const embed = getEmbedUrl(reel);
                if (embed) navigation.navigate('VideoPlayer', { embedUrl: embed, title: rowTitle, reelId: reel.id });
              }}
            >
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
                <Text style={styles.rowTitle} numberOfLines={2}>{rowTitle}</Text>
                <Text style={styles.rowMeta}>{reel.name}</Text>
              </View>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreValue}>{(row.finalAverage ?? 0).toFixed(2)}</Text>
                <Text style={styles.scoreLabel}>{row.finalVoteCount ?? 0} {(row.finalVoteCount ?? 0) === 1 ? 'vote' : 'votes'}</Text>
              </View>
            </TouchableOpacity>
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
  tabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tab: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.round, backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  tabTextActive: { color: '#fff' },
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
