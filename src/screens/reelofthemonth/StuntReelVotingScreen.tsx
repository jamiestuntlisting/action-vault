import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { VerticalRatingSlider } from '../../components/VerticalRatingSlider';
import { usePageTitle } from '../../hooks/usePageTitle';
import discoveredData from '../../data/stunt-reels.json';

const MAX_WIDTH = 960;

// All stunt-reel votes share this entry id; the per-reel youtubeId
// discriminates them. Same scheme used by the skill flow.
const STUNT_ENTRY_ID = 'stunt-monthly';

// Same allowlist as AdminScreen / AdminReelOfTheMonthScreen. Used here to
// surface the "Remove video" admin action right on the voting page so the
// admin can cull a junk reel mid-rating without bouncing to the matcher.
const ADMIN_EMAILS = [
  'james.northrup@gmail.com',
  'warrenhullstunts@gmail.com',
  'greg@stuntlisting.com',
  'info@stuntlisting.com',
  'jamie@stuntlisting.com',
  'warren@stuntlisting.com',
];

const API_BASE = Platform.OS === 'web' ? '' : 'https://action-vault-blond.vercel.app';

// Shape of each entry in src/data/stunt-reels.json — written by the daily
// cron at api/cron/discover-stunt-reels (and seeded in this commit by the
// initial backfill). Stays in sync with the cron's output schema.
interface DiscoveredReel {
  youtubeId: string;
  title: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  durationSeconds: number;
  thumbnailUrl: string;
  description: string;
  viewCount: number;
  discoveredAt: string;
  excluded: boolean;
}

const ALL_DISCOVERED: DiscoveredReel[] = (discoveredData as any).reels || [];

function monthKey(iso: string): string {
  // YYYY-MM from an ISO timestamp.
  return iso.slice(0, 7);
}
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function StuntReelVotingScreen({ navigation, route }: any) {
  const scope: 'month' | 'all' = route?.params?.scope === 'all' ? 'all' : 'month';
  usePageTitle(scope === 'all' ? 'All Discovered Stunt Reels' : 'Stunt Reels of the Month');

  const { state, dispatch } = useAppState();

  // Filter the discovered set by scope. 'month' = current calendar month;
  // 'all' = everything the cron has ever pulled in. Excluded reels are
  // dropped in both views (admin can flip excluded=true via a future
  // admin endpoint that updates this same JSON file).
  const reels = useMemo<DiscoveredReel[]>(() => {
    const visible = ALL_DISCOVERED.filter(r => !r.excluded && (r.thumbnailUrl || r.youtubeId));
    const sorted = [...visible].sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    if (scope === 'all') return sorted;
    const cm = currentMonthKey();
    return sorted.filter(r => monthKey(r.publishedAt) === cm);
  }, [scope]);

  const [activeReelIdx, setActiveReelIdx] = useState(0);
  useEffect(() => { setActiveReelIdx(0); }, [scope]);
  const activeReel = reels[Math.min(activeReelIdx, Math.max(reels.length - 1, 0))];

  const currentEmail = state.currentUser?.email || '';
  const existingVote = useMemo(
    () => (activeReel
      ? state.myReelVotes.find(v => v.entryId === STUNT_ENTRY_ID && v.reelId === activeReel.youtubeId)
      : undefined),
    [state.myReelVotes, activeReel],
  );

  const [rating, setRating] = useState<number>(existingVote?.rating ?? 0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const sliderForRef = useRef<{ entryId: string; reelId: string } | null>(null);
  const hasInteractedRef = useRef(false);

  const isAdmin = ADMIN_EMAILS.includes((state.currentUser?.email || '').toLowerCase());

  // Admin-only: hide a reel from this voting list (and from the home
  // montage). Calls the same exclude endpoint the admin matcher uses.
  // Confirms first since this is destructive (visible to all users
  // after the next deploy).
  async function removeCurrentReel() {
    if (!activeReel || !state.authToken) return;
    const ok = Platform.OS === 'web'
      ? typeof window !== 'undefined' && window.confirm
        ? window.confirm(`Remove this reel from display and block it from showing again?\n\n${activeReel.title}`)
        : true
      : true;
    if (!ok) return;
    setRemovingId(activeReel.youtubeId);
    try {
      await fetch(`${API_BASE}/api/admin/exclude-stunt-reel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.authToken}` },
        body: JSON.stringify({ youtubeId: activeReel.youtubeId, excluded: true }),
      });
      // Optimistic local skip — advance to the next reel; the bundled JSON
      // catches up on next deploy.
      setActiveReelIdx(i => Math.min(reels.length - 2, i));
    } catch (e) {
      // Non-fatal — admin can retry from the matcher screen.
    } finally {
      setRemovingId(null);
    }
  }

  useEffect(() => {
    if (!activeReel) return;
    sliderForRef.current = { entryId: STUNT_ENTRY_ID, reelId: activeReel.youtubeId };
    hasInteractedRef.current = false;
    setRating(existingVote?.rating ?? 0);
  }, [activeReel?.youtubeId, existingVote?.rating]);

  useEffect(() => {
    if (!hasInteractedRef.current) return;
    if (!activeReel || !currentEmail) return;
    if (sliderForRef.current?.reelId !== activeReel.youtubeId) return;
    const t = setTimeout(() => {
      if (rating >= 1) {
        const nowIso = new Date().toISOString();
        dispatch({
          type: 'SET_REEL_VOTE',
          payload: {
            entryId: STUNT_ENTRY_ID,
            reelId: activeReel.youtubeId,
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
          payload: { entryId: STUNT_ENTRY_ID, reelId: activeReel.youtubeId },
        });
      }
      // Fire-and-forget server-side vote sync (admin aggregator reads from here).
      if (state.authToken) {
        fetch(`${API_BASE}/api/votes/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.authToken}` },
          body: JSON.stringify({ entryId: STUNT_ENTRY_ID, reelId: activeReel.youtubeId, rating }),
        }).catch(() => { /* offline / network error — local dispatch already saved */ });
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
    const now = new Date();
    const monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.maxWidth}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>{scope === 'all' ? 'Browse all' : 'New this month'}</Text>
              <Text style={styles.title}>{scope === 'all' ? 'All Discovered Stunt Reels' : 'Stunt Reels of the Month'}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.centeredCard}>
            <Ionicons name="film-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.fallbackTitle}>
              {scope === 'all' ? 'No stunt reels discovered yet' : `No new stunt reels found for ${monthName} yet`}
            </Text>
            <Text style={styles.fallbackBody}>
              The daily YouTube scan will surface new reels here as they're published. Check back tomorrow.
            </Text>
            {scope === 'month' && ALL_DISCOVERED.length > 0 && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.replace('StuntReelVoting', { scope: 'all' })}
              >
                <Text style={styles.primaryBtnText}>Browse all discovered reels</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  const embedUrl = activeReel.youtubeId ? `https://www.youtube.com/embed/${activeReel.youtubeId}` : null;
  const watchUrl = activeReel.youtubeId ? `https://www.youtube.com/watch?v=${activeReel.youtubeId}` : null;
  const goPrev = () => setActiveReelIdx(i => Math.max(0, i - 1));
  const atEnd = activeReelIdx >= reels.length - 1;
  const goNext = () => setActiveReelIdx(i => atEnd ? 0 : i + 1);
  const canGoPrev = activeReelIdx > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.maxWidth}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{scope === 'all' ? 'Browse all discovered' : 'New this month'}</Text>
            <Text style={styles.title}>{scope === 'all' ? 'All Discovered Stunt Reels' : 'Stunt Reels of the Month'}</Text>
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
                key={activeReel.youtubeId}
                src={embedUrl}
                style={{ width: '100%', height: '100%', border: 0, borderRadius: 8 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <TouchableOpacity
                style={styles.nativeFallback}
                onPress={() => embedUrl && navigation.navigate('VideoPlayer', { embedUrl, title: activeReel.title, reelId: activeReel.youtubeId })}
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
              ) : rating === 0 ? (
                <Text style={styles.saveHint}>Slide up to score · stays at No score otherwise</Text>
              ) : null}
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
            style={styles.prevNextBtn}
            onPress={goNext}
            activeOpacity={0.7}
          >
            <Text style={styles.prevNextText}>{atEnd ? 'Return to first reel' : 'Next reel'}</Text>
            <Ionicons name={atEnd ? 'refresh' : 'chevron-forward'} size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.activeMetaBlock}>
          <TouchableOpacity
            onPress={() => { if (Platform.OS === 'web' && watchUrl) window.open(watchUrl, '_blank'); }}
          >
            <Text style={styles.performerName}>{activeReel.channelName}</Text>
          </TouchableOpacity>
          <Text style={styles.performerRole}>
            {activeReel.publishedAt.slice(0, 10)} · {Math.round(activeReel.durationSeconds)}s · {activeReel.viewCount.toLocaleString()} views
          </Text>
          {activeReel.title ? <Text style={styles.contextLine}>{activeReel.title}</Text> : null}
          {isAdmin && (
            <TouchableOpacity
              onPress={removeCurrentReel}
              disabled={removingId === activeReel.youtubeId}
              style={styles.adminRemoveBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
              <Text style={styles.adminRemoveText}>
                {removingId === activeReel.youtubeId ? 'Removing…' : 'Admin: remove this video'}
              </Text>
            </TouchableOpacity>
          )}
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
            {scope === 'all' ? '← Back to this month' : 'View all discovered stunt reels →'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ReelChooser({
  reels, activeIdx, onSelect,
}: {
  reels: DiscoveredReel[];
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollXRef = useRef(0);
  const [scrollW, setScrollW] = useState(0);
  const [contentW, setContentW] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => { setAtEnd(contentW <= scrollW + 1); }, [contentW, scrollW]);

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
          const thumb = r.thumbnailUrl || (r.youtubeId ? `https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg` : null);
          const active = i === activeIdx;
          return (
            <TouchableOpacity
              key={r.youtubeId}
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
              <Text style={styles.chooserName} numberOfLines={1}>{r.channelName}</Text>
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
  centeredCard: { alignItems: 'center', padding: Spacing.xxxl, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, marginTop: Spacing.xl },
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
  adminRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(238,45,36,0.12)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(238,45,36,0.4)',
  },
  adminRemoveText: { color: Colors.error, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
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
  primaryBtn: { marginTop: Spacing.xl, backgroundColor: Colors.accent, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.md },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
