import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { VerticalRatingSlider } from '../../components/VerticalRatingSlider';
import { skillReels, stuntReels, getProfileUrl, getEmbedUrl, SkillReel, StuntReel } from '../../services/StuntListingService';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { ReelOfMonthCategory } from '../../services/AppState';

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

export function ReelOfTheMonthScreen({ navigation, route }: any) {
  const category: ReelOfMonthCategory = route?.params?.category === 'stunt' ? 'stunt' : 'skill';
  const categoryLabel = category === 'skill' ? 'Skill reel of the month' : 'Stunt reel of the month';
  usePageTitle(categoryLabel);

  const { state, dispatch } = useAppState();
  const entries = state.settings.reelOfMonthEntries || [];
  const votes = state.settings.reelOfMonthVotes || [];
  const liveEntry = useMemo(() => entries.find(e => e.category === category && e.status === 'live'), [entries, category]);

  const reel = useMemo(() => {
    if (!liveEntry) return null;
    if (category === 'skill') return skillReels.find(r => r.id === liveEntry.stuntListingReelId) || null;
    return stuntReels.find(r => r.id === liveEntry.stuntListingReelId) || null;
  }, [liveEntry, category]);

  const currentEmail = state.currentUser?.email || '';
  const existingVote = useMemo(
    () => (liveEntry ? votes.find(v => v.entryId === liveEntry.id && v.userEmail.toLowerCase() === currentEmail.toLowerCase()) : undefined),
    [votes, liveEntry, currentEmail],
  );

  const [rating, setRating] = useState<number>(existingVote?.rating ?? 5);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (existingVote) setRating(existingVote.rating);
  }, [existingVote?.rating]);

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
        <Text style={styles.fallbackBody}>Reel of the Month is for StuntListing members. Sign in to rate this month&apos;s featured reel.</Text>
      </View>
    );
  }

  if (!liveEntry || !reel) {
    const now = new Date();
    const nextMonth = MONTH_NAMES[(now.getMonth() + 1) % 12];
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.maxWidth}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.eyebrow}>{categoryLabel}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.fallbackCard}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.fallbackTitle}>No {category} reel is live right now</Text>
            <Text style={styles.fallbackBody}>
              The next {category} Reel of the Month goes up {nextMonth} 1.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('ReelOfTheMonthArchive', { category })}
            >
              <Text style={styles.primaryBtnText}>See past reels of the month</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const embedUrl = getEmbedUrl(reel);
  const daysLeft = daysLeftIn(liveEntry.month);
  const [y, m] = liveEntry.month.split('-').map(Number);
  const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;
  const nextRevealLabel = `${nextMonthLabel(liveEntry.month)} 1`;
  const skillReel = category === 'skill' ? (reel as SkillReel) : null;
  const stuntReel = category === 'stunt' ? (reel as StuntReel) : null;
  const title = category === 'skill' ? (liveEntry.theme || skillReel?.skill || 'Featured skill') : (stuntReel?.title || liveEntry.theme || 'Featured reel');

  const handleSubmit = () => {
    const nowIso = new Date().toISOString();
    const next = votes.filter(v => !(v.entryId === liveEntry.id && v.userEmail.toLowerCase() === currentEmail.toLowerCase()));
    next.push({
      entryId: liveEntry.id,
      userEmail: currentEmail,
      userName: state.activeProfile?.name || currentEmail.split('@')[0],
      experienceLevel: state.activeProfile?.experienceLevel || null,
      rating,
      createdAt: existingVote?.createdAt || nowIso,
      updatedAt: nowIso,
    });
    dispatch({ type: 'UPDATE_SETTINGS', payload: { reelOfMonthVotes: next } });
    setSubmitted(true);
    if (Platform.OS !== 'web') {
      Alert.alert('Rating saved', `You can update your rating any time until ${nextRevealLabel}.`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.maxWidth}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{monthLabel} · {categoryLabel}</Text>
            <Text style={styles.title}>{title}</Text>
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
                src={embedUrl}
                style={{ width: '100%', height: '100%', border: 0, borderRadius: 8 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <TouchableOpacity
                style={styles.nativeFallback}
                onPress={() => embedUrl && navigation.navigate('VideoPlayer', { embedUrl, title, reelId: reel.id })}
              >
                <Ionicons name="play-circle" size={64} color={Colors.accent} />
                <Text style={styles.nativeFallbackText}>Play reel</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.sliderPanel, narrow && styles.sliderPanelNarrow]}>
            <VerticalRatingSlider value={rating} onChange={(v) => { setRating(v); setSubmitted(false); }} height={300} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>{existingVote ? 'Update vote' : 'Submit vote'}</Text>
            </TouchableOpacity>
            {submitted && (
              <Text style={styles.confirm}>
                Thanks — your rating is saved. You can update it any time until {nextRevealLabel}.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.metaBlock}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'web') window.open(getProfileUrl(reel.alias), '_blank');
            }}
          >
            <Text style={styles.performerName}>{reel.name}</Text>
          </TouchableOpacity>
          <Text style={styles.performerRole}>{reel.role === 'coordinator' ? 'Coordinator' : 'Performer'} · StuntListing {reel.tier}</Text>
          {category === 'skill' && skillReel && (
            <Text style={styles.contextLine}>{skillReel.cat}{skillReel.level && skillReel.level !== 'Not rated' ? ` · ${skillReel.level}` : ''}{skillReel.desc ? ` · ${skillReel.desc}` : ''}</Text>
          )}
          <Text style={styles.caption}>
            One rating per member · scores hidden until {nextRevealLabel} · you can change your vote until then
          </Text>
          <TouchableOpacity
            style={styles.archiveLink}
            onPress={() => navigation.navigate('ReelOfTheMonthArchive', { category })}
          >
            <Text style={styles.archiveLinkText}>See past reels of the month →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  submitBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 160,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  confirm: { color: Colors.success, fontSize: FontSize.xs, marginTop: Spacing.md, textAlign: 'center', maxWidth: 180 },
  metaBlock: { marginTop: Spacing.xxl, paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  performerName: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  performerRole: { color: Colors.textTertiary, fontSize: FontSize.sm, marginTop: 2 },
  contextLine: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.sm },
  caption: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.md, fontStyle: 'italic' },
  archiveLink: { marginTop: Spacing.lg },
  archiveLinkText: { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  fallbackCard: { alignItems: 'center', padding: Spacing.xxxl, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, marginTop: Spacing.xl },
  fallbackTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.md, textAlign: 'center' },
  fallbackBody: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm, textAlign: 'center' },
  primaryBtn: { marginTop: Spacing.xl, backgroundColor: Colors.accent, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.md },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
