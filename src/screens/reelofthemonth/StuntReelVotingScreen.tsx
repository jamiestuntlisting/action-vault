import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { VerticalRatingSlider } from '../../components/VerticalRatingSlider';
import { stuntReels, getProfileUrl, getEmbedUrl, StuntReel } from '../../services/StuntListingService';
import { usePageTitle } from '../../hooks/usePageTitle';

const MAX_WIDTH = 960;
// How many of the most-recently-imported reels count as "this month's" set.
// Stunt reels don't carry a date in the source data; we sort by the numeric
// suffix on the id (which increases with import order) as a stand-in for
// "newest". This is what makes the monthly list a manageable subset rather
// than all 700+ reels. Admin-driven curation can replace this later.
const MONTHLY_LIMIT = 30;

// Single shared entry id for stunt-reel votes. We don't have a per-month
// admin curation flow yet, so all stunt votes live under one bucket — the
// reelId discriminates them. Switching from 'month' to 'all' view shows
// the same vote on the same reel.
const STUNT_ENTRY_ID = 'stunt-monthly';

function reelOrdinal(r: StuntReel): number {
  const n = parseInt((r.id || '').replace(/^\D+/, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export function StuntReelVotingScreen({ navigation, route }: any) {
  const scope: 'month' | 'all' = route?.params?.scope === 'all' ? 'all' : 'month';
  usePageTitle(scope === 'all' ? 'All Stunt Reels' : 'Stunt Reels of the Month');

  const { state, dispatch } = useAppState();

  const reels = useMemo<StuntReel[]>(() => {
    const playable = stuntReels.filter(r => r.thumb || r.youtubeId);
    const sorted = [...playable].sort((a, b) => reelOrdinal(b) - reelOrdinal(a));
    return scope === 'all' ? sorted : sorted.slice(0, MONTHLY_LIMIT);
  }, [scope]);

  const [activeReelIdx, setActiveReelIdx] = useState(0);
  useEffect(() => { setActiveReelIdx(0); }, [scope]);
  const activeReel = reels[Math.min(activeReelIdx, Math.max(reels.length - 1, 0))];

  const currentEmail = state.currentUser?.email || '';
  const existingVote = useMemo(
    () => (activeReel
      ? state.myReelVotes.find(v => v.entryId === STUNT_ENTRY_ID && v.reelId === activeReel.id)
      : undefined),
    [state.myReelVotes, activeReel],
  );

  const [rating, setRating] = useState<number>(existingVote?.rating ?? 0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const sliderForRef = useRef<{ entryId: string; reelId: string } | null>(null);
  const hasInteractedRef = useRef(false);

  // Sync slider when active reel changes — same pattern as the skill-reel
  // voting screen so a navigation between reels never auto-saves the wrong
  // value against the new reel.
  useEffect(() => {
    if (!activeReel) return;
    sliderForRef.current = { entryId: STUNT_ENTRY_ID, reelId: activeReel.id };
    hasInteractedRef.current = false;
    setRating(existingVote?.rating ?? 0);
  }, [activeReel?.id, existingVote?.rating]);

  useEffect(() => {
    if (!hasInteractedRef.current) return;
    if (!activeReel || !currentEmail) return;
    if (sliderForRef.current?.reelId !== activeReel.id) return;
    const t = setTimeout(() => {
      if (rating >= 1) {
        const nowIso = new Date().toISOString();
        dispatch({
          type: 'SET_REEL_VOTE',
          payload: {
            entryId: STUNT_ENTRY_ID,
            reelId: activeReel.id,
            userEmail: currentEmail,
            userName: state.activeProfile?.name || currentEmail.split('@')[0],
            experienceLevel: state.activeProfile?.experienceLevel || null,
            rating,
            createdAt: existingVote?.createdAt || nowIso,
            updatedAt: nowIso,
          },
        });
      } else {
        dispatch({
          type: 'CLEAR_REEL_VOTE',
          payload: { entryId: STUNT_ENTRY_ID, reelId: activeReel.id },
        });
      }
      setSavedAt(Date.now());
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rating]);

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
        <Text style={styles.fallbackBody}>Stunt reel voting is for StuntListing members. Sign in to rate reels.</Text>
      </View>
    );
  }

  if (reels.length === 0 || !activeReel) {
    return (
      <View style={styles.centered}>
        <Ionicons name="film-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.fallbackTitle}>No stunt reels yet</Text>
      </View>
    );
  }

  const embedUrl = getEmbedUrl(activeReel);
  const goPrev = () => setActiveReelIdx(i => Math.max(0, i - 1));
  const goNext = () => setActiveReelIdx(i => Math.min(reels.length - 1, i + 1));
  const canGoPrev = activeReelIdx > 0;
  const canGoNext = activeReelIdx < reels.length - 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.maxWidth}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{scope === 'all' ? 'Browse all reels' : 'New this month'}</Text>
            <Text style={styles.title}>{scope === 'all' ? 'All Stunt Reels' : 'Stunt Reels of the Month'}</Text>
            <Text style={styles.subtitle}>
              {reels.length} {reels.length === 1 ? 'reel' : 'reels'} · rate each reel individually
            </Text>
          </View>
          <View style={{ width: 40 }} />
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
                onPress={() => embedUrl && navigation.navigate('VideoPlayer', { embedUrl, title: activeReel.title, reelId: activeReel.id })}
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
                  <Text style={styles.saveText}>{rating >= 1 ? 'Saved' : 'Score cleared'}</Text>
                </>
              ) : (
                <Text style={styles.saveHint}>
                  {rating >= 1 ? 'Auto-saves as you slide' : 'Slide up to score · stays at No score otherwise'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Prev / Next */}
        <View style={styles.prevNextRow}>
          <TouchableOpacity
            style={[styles.prevNextBtn, !canGoPrev && styles.prevNextBtnDisabled]}
            onPress={goPrev}
            disabled={!canGoPrev}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={canGoPrev ? Colors.textPrimary : Colors.textMuted} />
            <Text style={[styles.prevNextText, !canGoPrev && styles.prevNextTextDisabled]}>Previous reel</Text>
          </TouchableOpacity>
          <Text style={styles.prevNextCounter}>
            {Math.min(activeReelIdx + 1, reels.length)} of {reels.length}
          </Text>
          <TouchableOpacity
            style={[styles.prevNextBtn, !canGoNext && styles.prevNextBtnDisabled]}
            onPress={goNext}
            disabled={!canGoNext}
            activeOpacity={0.7}
          >
            <Text style={[styles.prevNextText, !canGoNext && styles.prevNextTextDisabled]}>Next reel</Text>
            <Ionicons name="chevron-forward" size={18} color={canGoNext ? Colors.textPrimary : Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.activeMetaBlock}>
          <TouchableOpacity
            onPress={() => { if (Platform.OS === 'web') window.open(getProfileUrl(activeReel.alias), '_blank'); }}
          >
            <Text style={styles.performerName}>{activeReel.name}</Text>
          </TouchableOpacity>
          <Text style={styles.performerRole}>{activeReel.role === 'coordinator' ? 'Coordinator' : 'Performer'}</Text>
          {activeReel.title ? <Text style={styles.contextLine}>{activeReel.title}</Text> : null}
        </View>

        <Text style={styles.chooserLabel}>All {reels.length} reels in this {scope === 'all' ? 'list' : 'month'}</Text>
        <ReelChooser reels={reels} activeIdx={activeReelIdx} onSelect={setActiveReelIdx} />

        <Text style={styles.caption}>
          Your ratings are private · one rating per reel · you can change your votes anytime
        </Text>

        <TouchableOpacity
          style={styles.scopeToggle}
          onPress={() =>
            navigation.replace('StuntReelVoting', { scope: scope === 'all' ? 'month' : 'all' })
          }
        >
          <Text style={styles.scopeToggleText}>
            {scope === 'all' ? '← Back to this month' : 'View all stunt reels →'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ReelChooser({
  reels, activeIdx, onSelect,
}: {
  reels: StuntReel[];
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
  grid: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.md, alignItems: 'flex-start' },
  gridNarrow: { flexDirection: 'column' },
  playerWrap: { flex: 1, aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: BorderRadius.md, overflow: 'hidden' },
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
  prevNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  prevNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
  },
  prevNextBtnDisabled: { opacity: 0.4 },
  prevNextText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  prevNextTextDisabled: { color: Colors.textMuted },
  prevNextCounter: { color: Colors.textTertiary, fontSize: FontSize.xs },
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
  scopeToggle: { marginTop: Spacing.lg },
  scopeToggleText: { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  fallbackTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.md, textAlign: 'center' },
  fallbackBody: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm, textAlign: 'center' },
});
