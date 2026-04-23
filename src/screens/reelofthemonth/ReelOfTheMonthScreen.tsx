import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { VerticalRatingSlider } from '../../components/VerticalRatingSlider';
import { getSkillReelsBySkill, getProfileUrl, getEmbedUrl, SkillReel } from '../../services/StuntListingService';
import { usePageTitle } from '../../hooks/usePageTitle';

const MAX_WIDTH = 960;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function endOfMonthDate(monthKey: string): Date {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0, 23, 59, 59);
}

function daysLeftIn(monthKey: string): number {
  const end = endOfMonthDate(monthKey).getTime();
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function nextMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const next = new Date(y, m, 1);
  return MONTH_NAMES[next.getMonth()];
}

export function ReelOfTheMonthScreen({ navigation }: any) {
  usePageTitle('Skill Reel of the Month');

  const { state, dispatch } = useAppState();
  const entries = state.settings.reelOfMonthEntries || [];
  const votes = state.settings.reelOfMonthVotes || [];
  const liveEntry = useMemo(() => entries.find(e => e.category === 'skill' && e.status === 'live'), [entries]);

  const reels = useMemo<SkillReel[]>(() => {
    if (!liveEntry) return [];
    return getSkillReelsBySkill(liveEntry.skill).filter(r => r.thumb || r.youtubeId);
  }, [liveEntry]);
  const parentCategory = reels[0]?.cat;

  const [activeReelIdx, setActiveReelIdx] = useState(0);
  useEffect(() => { setActiveReelIdx(0); }, [liveEntry?.id]);

  const currentEmail = state.currentUser?.email || '';
  const existingVote = useMemo(
    () => (liveEntry ? votes.find(v => v.entryId === liveEntry.id && v.userEmail.toLowerCase() === currentEmail.toLowerCase()) : undefined),
    [votes, liveEntry, currentEmail],
  );

  const [rating, setRating] = useState<number>(existingVote?.rating ?? 0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    if (existingVote) setRating(existingVote.rating);
  }, [existingVote?.rating]);

  // Auto-save on change (debounced). Rating 0 = "no score" = no vote saved
  // (existing vote is removed if the user drags back down to 0).
  useEffect(() => {
    if (!hasInteractedRef.current) return;
    if (!liveEntry || !currentEmail) return;
    const t = setTimeout(() => {
      const nowIso = new Date().toISOString();
      const withoutMine = (state.settings.reelOfMonthVotes || []).filter(
        v => !(v.entryId === liveEntry.id && v.userEmail.toLowerCase() === currentEmail.toLowerCase()),
      );
      const next = rating >= 1
        ? [...withoutMine, {
            entryId: liveEntry.id,
            userEmail: currentEmail,
            userName: state.activeProfile?.name || currentEmail.split('@')[0],
            experienceLevel: state.activeProfile?.experienceLevel || null,
            rating,
            createdAt: existingVote?.createdAt || nowIso,
            updatedAt: nowIso,
          }]
        : withoutMine;
      dispatch({ type: 'UPDATE_SETTINGS', payload: { reelOfMonthVotes: next } });
      setSavedAt(Date.now());
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rating]);

  // Hide "Saved" indicator after ~2s
  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);

  const [winW, setWinW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : Dimensions.get('window').width));
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const h = () => setWinW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const narrow = winW < 720;

  if (!state.isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={48} color={Colors.textMuted} />
        <Text style={styles.fallbackTitle}>Sign in required</Text>
        <Text style={styles.fallbackBody}>Skill Reel of the Month is for StuntListing members. Sign in to rate this month&apos;s featured category.</Text>
      </View>
    );
  }

  if (!liveEntry || reels.length === 0) {
    const now = new Date();
    const nextMonth = MONTH_NAMES[(now.getMonth() + 1) % 12];
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.maxWidth}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.eyebrow}>Skill Reel of the Month</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.fallbackCard}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.fallbackTitle}>No skill is live right now</Text>
            <Text style={styles.fallbackBody}>
              The next Skill Reel of the Month goes up {nextMonth} 1.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('ReelOfTheMonthArchive')}
            >
              <Text style={styles.primaryBtnText}>See past skills</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const activeReel = reels[Math.min(activeReelIdx, reels.length - 1)];
  const embedUrl = getEmbedUrl(activeReel);
  const daysLeft = daysLeftIn(liveEntry.month);
  const [y, m] = liveEntry.month.split('-').map(Number);
  const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;
  const nextRevealLabel = `${nextMonthLabel(liveEntry.month)} 1`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.maxWidth}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{monthLabel} · Skill reel of the month</Text>
            <Text style={styles.title}>{liveEntry.skill}</Text>
            <Text style={styles.subtitle}>
              {reels.length} {reels.length === 1 ? 'reel' : 'reels'}{parentCategory ? ` · ${parentCategory}` : ''} · rate this skill as a whole
            </Text>
          </View>
          <View style={styles.daysPill}>
            <Ionicons name="time-outline" size={12} color={Colors.accent} />
            <Text style={styles.daysPillText}>{daysLeft} days left</Text>
          </View>
        </View>

        <View style={[styles.grid, narrow && styles.gridNarrow]}>
          <View style={[styles.playerWrap, narrow && styles.playerWrapNarrow]}>
            {Platform.OS === 'web' && embedUrl ? (
              // @ts-ignore web-only element
              <iframe
                key={activeReel.id}
                src={embedUrl}
                style={{ width: '100%', height: '100%', border: 0, borderRadius: 8 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <TouchableOpacity
                style={styles.nativeFallback}
                onPress={() => embedUrl && navigation.navigate('VideoPlayer', { embedUrl, title: activeReel.skill, reelId: activeReel.id })}
              >
                <Ionicons name="play-circle" size={64} color={Colors.accent} />
                <Text style={styles.nativeFallbackText}>Play reel</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.sliderPanel, narrow && styles.sliderPanelNarrow]}>
            <VerticalRatingSlider
              value={rating}
              onChange={(v) => { hasInteractedRef.current = true; setRating(v); }}
              height={300}
            />
            <View style={styles.saveIndicator}>
              {savedAt ? (
                <>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.saveText}>
                    {rating >= 1 ? 'Saved' : 'Score cleared'}
                  </Text>
                </>
              ) : (
                <Text style={styles.saveHint}>
                  {rating >= 1 ? 'Auto-saves as you slide' : 'Slide up to score · stays at No score otherwise'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Active reel meta */}
        <View style={styles.activeMetaBlock}>
          <TouchableOpacity
            onPress={() => { if (Platform.OS === 'web') window.open(getProfileUrl(activeReel.alias), '_blank'); }}
          >
            <Text style={styles.performerName}>{activeReel.name}</Text>
          </TouchableOpacity>
          <Text style={styles.performerRole}>{activeReel.role === 'coordinator' ? 'Coordinator' : 'Performer'} · {activeReel.skill}</Text>
          {activeReel.desc ? <Text style={styles.contextLine}>{activeReel.desc}</Text> : null}
        </View>

        {/* Reel chooser */}
        <Text style={styles.chooserLabel}>All {reels.length} reels tagged {liveEntry.skill}</Text>
        <ReelChooser
          reels={reels}
          activeIdx={activeReelIdx}
          onSelect={setActiveReelIdx}
        />

        <Text style={styles.caption}>
          One rating per member for the whole skill · scores hidden until {nextRevealLabel} · you can change your vote until then
        </Text>

        <TouchableOpacity
          style={styles.archiveLink}
          onPress={() => navigation.navigate('ReelOfTheMonthArchive')}
        >
          <Text style={styles.archiveLinkText}>See past skills →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ReelChooser({
  reels, activeIdx, onSelect,
}: {
  reels: SkillReel[];
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollXRef = useRef(0);
  const [scrollW, setScrollW] = useState(0);
  const [contentW, setContentW] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    setAtEnd(contentW <= scrollW + 1);
  }, [contentW, scrollW]);

  const pageBy = (dir: 1 | -1) => {
    const next = Math.max(0, Math.min(contentW - scrollW, scrollXRef.current + dir * Math.max(200, scrollW * 0.8)));
    scrollRef.current?.scrollTo({ x: next, animated: true });
  };

  return (
    <View style={styles.chooserWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chooserRow}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          scrollXRef.current = x;
          setAtStart(x <= 0);
          setAtEnd(x + e.nativeEvent.layoutMeasurement.width >= e.nativeEvent.contentSize.width - 1);
        }}
        onLayout={(e) => setScrollW(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentW(w)}
        scrollEventThrottle={32}
      >
        {reels.map((r, i) => {
          const thumb = r.thumb || (r.youtubeId ? `https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg` : null);
          const active = i === activeIdx;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.chooserCard, active && styles.chooserCardActive]}
              onPress={() => onSelect(i)}
              activeOpacity={0.8}
            >
              {thumb ? (
                <Image source={{ uri: thumb }} style={styles.chooserThumb} contentFit="cover" />
              ) : (
                <View style={[styles.chooserThumb, { backgroundColor: Colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="film-outline" size={20} color={Colors.textMuted} />
                </View>
              )}
              <Text style={styles.chooserName} numberOfLines={1}>{r.name}</Text>
              {active && <View style={styles.chooserActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!atStart && (
        <TouchableOpacity style={[styles.chooserNav, styles.chooserNavLeft]} onPress={() => pageBy(-1)} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      )}
      {!atEnd && (
        <TouchableOpacity style={[styles.chooserNav, styles.chooserNavRight]} onPress={() => pageBy(1)} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  maxWidth: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: Spacing.screen },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md, paddingTop: Platform.OS === 'web' ? Spacing.lg : 50 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  eyebrow: { color: Colors.textTertiary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, marginTop: 2 },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  daysPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.round,
    borderWidth: 1, borderColor: Colors.accent + '66',
  },
  daysPillText: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  grid: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.md, alignItems: 'flex-start' },
  gridNarrow: { flexDirection: 'column' },
  playerWrap: {
    flex: 1,
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  playerWrapNarrow: { width: '100%' },
  nativeFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  nativeFallbackText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  sliderPanel: {
    width: 200,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  sliderPanelNarrow: { width: '100%' },
  saveIndicator: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 32,
    maxWidth: 180,
  },
  saveText: { color: Colors.success, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  saveHint: { color: Colors.textMuted, fontSize: FontSize.xs, fontStyle: 'italic', textAlign: 'center' },
  activeMetaBlock: { marginTop: Spacing.lg, paddingBottom: Spacing.md },
  performerName: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  performerRole: { color: Colors.textTertiary, fontSize: FontSize.sm, marginTop: 2 },
  contextLine: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs },
  chooserLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  chooserWrap: { position: 'relative' },
  chooserRow: { gap: Spacing.sm, paddingVertical: 4 },
  chooserCard: { width: 140, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, overflow: 'hidden', position: 'relative' },
  chooserCardActive: { borderWidth: 2, borderColor: Colors.accent },
  chooserThumb: { width: '100%', aspectRatio: 16 / 9 },
  chooserName: { color: Colors.textSecondary, fontSize: FontSize.xs, padding: 6, fontWeight: FontWeight.medium },
  chooserActiveDot: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  chooserNav: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  chooserNavLeft: { left: 4 },
  chooserNavRight: { right: 4 },
  caption: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.lg, fontStyle: 'italic' },
  archiveLink: { marginTop: Spacing.lg },
  archiveLinkText: { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  fallbackCard: { alignItems: 'center', padding: Spacing.xxxl, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, marginTop: Spacing.xl },
  fallbackTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.md, textAlign: 'center' },
  fallbackBody: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm, textAlign: 'center' },
  primaryBtn: { marginTop: Spacing.xl, backgroundColor: Colors.accent, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.md },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
