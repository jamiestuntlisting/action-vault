import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videos, videoMap } from '../../data';
import { HeroCarousel } from '../../components/HeroCarousel';
import { ContentRow } from '../../components/ContentRow';
import { ReelRow } from '../../components/ReelRow';
import { AtlasActionRow } from '../../components/AtlasActionRow';
import { Video } from '../../types';
import { AtlasActionVideo } from '../../services/AppState';
import { skillTags } from '../../data/skillTags';
import { stuntReels, skillReels, getSkillReelsByCategory, SkillReel } from '../../services/StuntListingService';

const MAX_WIDTH = 960;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const ROTATING_ROWS_TO_SHOW = 7; // Show 7 rotating categories per day

// Deterministic shuffle using a seed (same seed = same order each day)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = ((seed * (i + 1) * 2654435761) >>> 0) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function HomeScreen({ navigation }: any) {
  const { state, dispatch, isInMyList, getContinueWatching } = useAppState();
  const [refreshing, setRefreshing] = React.useState(false);
  const [shuffleKey, setShuffleKey] = React.useState(Date.now());

  const overrides = state.settings.adminVideoOverrides || [];
  const hiddenIds = new Set(overrides.filter(o => o.hidden).map(o => o.videoId));
  const visibleVideos = useMemo(() => videos.filter(v => !hiddenIds.has(v.id)), [hiddenIds.size]);

  // Daily seed for deterministic rotation
  const daySeed = useMemo(() => {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  }, []);

  // Rotate featured videos daily using date as seed
  const featuredVideos = useMemo(() => {
    const pool = visibleVideos.filter(v => v.isFeatured);
    if (pool.length < 5) {
      const top = [...visibleVideos].sort((a, b) => b.viewCount - a.viewCount)
        .filter(v => !pool.some(f => f.id === v.id));
      pool.push(...top);
    }
    return seededShuffle(pool, daySeed).slice(0, 5);
  }, [visibleVideos, daySeed]);

  const continueWatching = useMemo(() => {
    const entries = getContinueWatching();
    return entries.map(e => videoMap.get(e.videoId)).filter(Boolean) as Video[];
  }, [state.watchHistory]);

  // Top 10: check if there are recent ratings (last 7 days) for "This Week", else "This Month"
  const top10Label = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const hasRecentRatings = state.ratings.some(r => new Date(r.ratedAt).getTime() > oneWeekAgo);
    return hasRecentRatings ? 'Top 10 This Week' : 'Top 10 This Month';
  }, [state.ratings]);

  const top10 = useMemo(() => {
    const thumbsUpCount = (videoId: string) =>
      state.ratings.filter(r => r.videoId === videoId && r.thumbs === 'up').length;
    return [...visibleVideos]
      .sort((a, b) => thumbsUpCount(b.id) - thumbsUpCount(a.id) || b.viewCount - a.viewCount)
      .slice(0, 10);
  }, [visibleVideos, state.ratings]);

  // Recently Added: only pin if there are videos added in the last 2 weeks
  const recentlyAdded = useMemo(() =>
    [...visibleVideos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    [visibleVideos]);

  const hasRecentVideos = useMemo(() => {
    const cutoff = Date.now() - TWO_WEEKS_MS;
    return recentlyAdded.length > 0 && new Date(recentlyAdded[0].createdAt).getTime() > cutoff;
  }, [recentlyAdded]);

  // ─── Category data (all computed, only rendered if selected by rotation) ───

  const fightChoreography = useMemo(() =>
    visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Fight Choreography')), [visibleVideos]);

  const carWork = useMemo(() =>
    visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Car Work')), [visibleVideos]);

  const trainingVideos = useMemo(() =>
    visibleVideos.filter(v => v.skillTags.some(t => t?.id === 'training' || t?.id === 'rig-breakdown' || t?.id === 'safety-walkthrough')), [visibleVideos]);

  const fallsVideos = useMemo(() =>
    visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Falls')), [visibleVideos]);

  const fireVideos = useMemo(() =>
    visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Fire')), [visibleVideos]);

  const classicStunts = useMemo(() =>
    visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('buster keaton') || t.includes('1920s') || t.includes('ben-hur') ||
        t.includes('indiana jones') || t.includes('raiders') || t.includes('golden age') ||
        t.includes('classic');
    }), [visibleVideos]);

  const actionActors = useMemo(() =>
    visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('jackie chan') || t.includes('keanu') || t.includes('tom cruise') ||
        t.includes('tom holland') || t.includes('harrison ford') || t.includes('buster keaton') ||
        v.performers.some(p => p.role === 'action_star');
    }), [visibleVideos]);

  const wireAndRigWork = useMemo(() =>
    visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Rigs' || t?.id === 'wire-work')), [visibleVideos]);

  const marvelDC = useMemo(() =>
    visibleVideos.filter(v =>
      v.title.toLowerCase().includes('marvel') ||
      v.title.toLowerCase().includes('shang') ||
      v.title.toLowerCase().includes('spider') ||
      v.productions.some(p => p.studio.toLowerCase().includes('marvel') || p.studio.toLowerCase().includes('dc'))
    ), [visibleVideos]);

  const bondAndSpy = useMemo(() =>
    visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('bond') || t.includes('007') || t.includes('no time to die') ||
        t.includes('skyfall') || t.includes('casino royale') ||
        t.includes('atomic blonde') || t.includes('mission') || t.includes('matrix') ||
        v.productions.some(p => ['prod-26', 'prod-33', 'prod-39', 'prod-24'].includes(p.id));
    }), [visibleVideos]);

  const tvBTS = useMemo(() =>
    visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('game of thrones') || t.includes('stranger things') ||
        t.includes('daredevil') || t.includes('walking dead') || t.includes('breaking bad') ||
        t.includes('house of the dragon') || t.includes('cobra kai') ||
        (t.includes('season') && v.skillTags.some(s => s.id === 'bts-featurette')) ||
        v.productions.some(p => ['prod-21', 'prod-22', 'prod-23', 'prod-31'].includes(p.id));
    }), [visibleVideos]);

  const stuntDocs = useMemo(() =>
    visibleVideos.filter(v =>
      v.skillTags.some(s => s.id === 'interview') ||
      v.title.toLowerCase().includes('documentary') ||
      v.title.toLowerCase().includes('in praise of action') ||
      v.title.toLowerCase().includes('hal needham') ||
      v.title.toLowerCase().includes('fall guy')
    ), [visibleVideos]);

  // Stuntmen React (Corridor Crew series)
  const stuntmenReact = useMemo(() =>
    visibleVideos.filter(v => v.title.toLowerCase().includes('stuntmen react') || v.title.toLowerCase().includes('stuntwomen react')), [visibleVideos]);

  // Martial Arts Masters
  const martialArts = useMemo(() =>
    visibleVideos.filter(v =>
      v.skillTags.some(t => t?.id === 'martial-arts') ||
      v.title.toLowerCase().includes('ip man') ||
      v.title.toLowerCase().includes('ong-bak') ||
      v.title.toLowerCase().includes('tony jaa') ||
      v.title.toLowerCase().includes('donnie yen') ||
      v.title.toLowerCase().includes('the raid') ||
      v.title.toLowerCase().includes('crouching tiger')
    ), [visibleVideos]);

  // Guns, Tactics & Gun-Fu
  const gunFu = useMemo(() =>
    visibleVideos.filter(v =>
      v.skillTags.some(t => t?.id === 'gun-fu') ||
      v.title.toLowerCase().includes('tactical') ||
      v.title.toLowerCase().includes('firearms')
    ), [visibleVideos]);

  // How Stunts Are Made (educational/breakdown content)
  const howStuntsAreMade = useMemo(() =>
    visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('how ') && (t.includes('stunt') || t.includes('fight') || t.includes('scene') || t.includes('chase') || t.includes('burn')) ||
        t.includes('breaks down') || t.includes('breakdown') || t.includes('movies insider') || t.includes('vanity fair');
    }), [visibleVideos]);

  // Location-based categories
  const atlantaStunts = useMemo(() =>
    visibleVideos.filter(v => {
      const overr = overrides.find(o => o.videoId === v.id);
      return overr?.locationTags?.includes('Atlanta');
    }), [visibleVideos, overrides]);

  const newYorkStunts = useMemo(() =>
    visibleVideos.filter(v => {
      const overr = overrides.find(o => o.videoId === v.id);
      return overr?.locationTags?.includes('New York');
    }), [visibleVideos, overrides]);

  const chicagoStunts = useMemo(() =>
    visibleVideos.filter(v => {
      const overr = overrides.find(o => o.videoId === v.id);
      return overr?.locationTags?.includes('Chicago');
    }), [visibleVideos, overrides]);

  // StuntListing Skill Reels — only "Stunt Skills" category, grouped by skill
  const skillReelSubCategories = useMemo(() => {
    const stuntSkillReels = skillReels.filter(r => r.cat === 'Stunt Skills');
    const skillMap = new Map<string, SkillReel[]>();
    stuntSkillReels.forEach(r => {
      const existing = skillMap.get(r.skill) || [];
      existing.push(r);
      skillMap.set(r.skill, existing);
    });
    const excludedSkills = new Set(['Acting/Actor', 'All Expected Abilities']);
    const levelOrder: Record<string, number> = { 'Expert': 0, 'Advanced': 1, 'Intermediate': 2, 'Beginner': 3 };
    return Array.from(skillMap.entries())
      .filter(([skill, reels]) => reels.length >= 3 && !excludedSkills.has(skill))
      .map(([skill, reels]) => [skill, reels.sort((a, b) =>
        (levelOrder[a.level] ?? 4) - (levelOrder[b.level] ?? 4)
      )] as [string, SkillReel[]])
      .sort((a, b) => b[1].length - a[1].length);
  }, []);

  // Shuffle stunt reels randomly each time the page loads or refreshes
  const shuffledStuntReels = useMemo(() => {
    const arr = [...stuntReels];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffleKey]);

  // Atlas Action videos from admin settings
  const atlasActionVideos = useMemo(() =>
    (state.settings.atlasActionVideos || []).filter(v => v.enabled).sort((a, b) => a.sortOrder - b.sortOrder),
    [state.settings.atlasActionVideos]);

  // ─── Rotating categories: pick a daily subset ───
  // Build all rotatable category rows (only those with content)
  const allRotatingRows = useMemo(() => {
    const rows: { key: string; title: string; videos: Video[] }[] = [];
    if (fightChoreography.length > 0) rows.push({ key: 'fight', title: 'Popular in Fight Choreography', videos: fightChoreography });
    if (carWork.length > 0) rows.push({ key: 'car', title: 'Car Work & Driving', videos: carWork });
    if (classicStunts.length > 0) rows.push({ key: 'classic', title: 'Classic Stunts', videos: classicStunts });
    if (actionActors.length > 0) rows.push({ key: 'actors', title: 'Action Actors', videos: actionActors });
    if (bondAndSpy.length > 0) rows.push({ key: 'spy', title: 'Spy & Action Thrillers', videos: bondAndSpy });
    if (marvelDC.length > 0) rows.push({ key: 'superhero', title: 'Superhero Stunts', videos: marvelDC });
    if (wireAndRigWork.length > 0) rows.push({ key: 'wire', title: 'Wire & Rig Work', videos: wireAndRigWork });
    if (tvBTS.length > 0) rows.push({ key: 'tv', title: 'TV Show Stunts: Behind the Scenes', videos: tvBTS });
    if (stuntDocs.length > 0) rows.push({ key: 'docs', title: 'Stunt Documentaries & Interviews', videos: stuntDocs });
    if (fallsVideos.length > 0) rows.push({ key: 'falls', title: 'Falls & High Work', videos: fallsVideos });
    if (fireVideos.length > 0) rows.push({ key: 'fire', title: 'Fire & Pyro', videos: fireVideos });
    if (trainingVideos.length > 0) rows.push({ key: 'training', title: 'Training & Safety', videos: trainingVideos });
    if (stuntmenReact.length > 0) rows.push({ key: 'stuntmenreact', title: 'Stuntmen React (Corridor Crew)', videos: stuntmenReact });
    if (martialArts.length > 0) rows.push({ key: 'martialarts', title: 'Martial Arts Masters', videos: martialArts });
    if (gunFu.length > 0) rows.push({ key: 'gunfu', title: 'Gun-Fu & Tactical Action', videos: gunFu });
    if (howStuntsAreMade.length > 0) rows.push({ key: 'howto', title: 'How Stunts Are Made', videos: howStuntsAreMade });
    if (atlantaStunts.length > 0) rows.push({ key: 'atlanta', title: 'Filmed in Atlanta', videos: atlantaStunts });
    if (newYorkStunts.length > 0) rows.push({ key: 'nyc', title: 'Filmed in New York', videos: newYorkStunts });
    if (chicagoStunts.length > 0) rows.push({ key: 'chicago', title: 'Filmed in Chicago', videos: chicagoStunts });
    return rows;
  }, [fightChoreography, carWork, classicStunts, actionActors, bondAndSpy, marvelDC, wireAndRigWork, tvBTS, stuntDocs, stuntmenReact, fallsVideos, fireVideos, trainingVideos, martialArts, gunFu, howStuntsAreMade, atlantaStunts, newYorkStunts, chicagoStunts]);

  // Pick today's rotating rows using the daily seed
  const todaysRows = useMemo(() => {
    if (allRotatingRows.length <= ROTATING_ROWS_TO_SHOW) return allRotatingRows;
    return seededShuffle(allRotatingRows, daySeed).slice(0, ROTATING_ROWS_TO_SHOW);
  }, [allRotatingRows, daySeed]);

  // Also rotate which skill reel rows to show (pick 3 per day)
  const todaysSkillReels = useMemo(() => {
    if (skillReelSubCategories.length <= 3) return skillReelSubCategories;
    return seededShuffle(skillReelSubCategories, daySeed + 1).slice(0, 3);
  }, [skillReelSubCategories, daySeed]);

  function navigateToVideo(video: Video) {
    navigation.navigate('VideoDetail', { videoId: video.id });
  }

  function navigateToCategory(title: string, vids: Video[]) {
    navigation.navigate('CategoryVideos', { title, videoIds: vids.map(v => v.id) });
  }

  function playVideo(video: Video) {
    navigation.navigate('VideoPlayer', { videoId: video.id });
  }

  function onRefresh() {
    setRefreshing(true);
    setShuffleKey(Date.now()); // re-shuffle reels on pull-to-refresh
    setTimeout(() => setRefreshing(false), 1000);
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.maxWidthWrapper}>
        {/* Branded header */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Action Vault</Text>
          <Text style={styles.headerSubtitle}> by StuntListing</Text>
        </View>

        <HeroCarousel
          videos={featuredVideos}
          onPlay={(v) => playVideo(v)}
          onInfo={(v) => navigateToVideo(v)}
          onAddToList={(v) => {
            if (isInMyList(v.id)) {
              dispatch({ type: 'REMOVE_FROM_MY_LIST', payload: v.id });
            } else {
              dispatch({ type: 'ADD_TO_MY_LIST', payload: v.id });
            }
          }}
          isInList={(videoId) => isInMyList(videoId)}
        />

        {/* Categories bar */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
            {[
              { label: 'Fight Choreography', icon: 'fitness-outline', query: 'fight' },
              { label: 'Martial Arts', icon: 'body-outline', query: 'martial arts' },
              { label: 'Car Work', icon: 'car-outline', query: 'car' },
              { label: 'Falls & High Work', icon: 'arrow-down-outline', query: 'falls' },
              { label: 'Fire & Burns', icon: 'flame-outline', query: 'fire burn' },
              { label: 'Action Stars', icon: 'star-outline', query: 'action star' },
              { label: 'Wire & Rigs', icon: 'resize-outline', query: 'wire rig' },
              { label: 'Gun-Fu & Tactical', icon: 'shield-outline', query: 'gun tactical' },
              { label: 'Documentaries', icon: 'film-outline', query: 'documentary' },
              { label: 'Training & Safety', icon: 'barbell-outline', query: 'training safety' },
              { label: 'Classic Stunts', icon: 'time-outline', query: 'classic' },
            ].map(cat => (
              <TouchableOpacity
                key={cat.label}
                style={styles.categoryPill}
                onPress={() => navigation.navigate('Search', { query: cat.query })}
              >
                <Ionicons name={cat.icon as any} size={16} color={Colors.textPrimary} />
                <Text style={styles.categoryPillText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── PINNED ROWS ─── */}

        {continueWatching.length > 0 && (
          <ContentRow
            title="Continue Watching"
            videos={continueWatching}
            onVideoPress={navigateToVideo}
            showProgress
          />
        )}

        <ContentRow
          title={top10Label}
          videos={top10}
          onVideoPress={navigateToVideo}
          showRanks
          onSeeAll={() => navigateToCategory(top10Label, top10)}
        />

        {hasRecentVideos && (
          <ContentRow
            title="Recently Added"
            videos={recentlyAdded}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('Recently Added', recentlyAdded)}
          />
        )}

        {atlasActionVideos.length > 0 && (
          <AtlasActionRow
            title="Atlas Action - Stunt Training"
            videos={atlasActionVideos}
            onVideoPress={(video: AtlasActionVideo) => navigation.navigate('AtlasActionDetail', { atlasVideoId: video.id })}
          />
        )}

        {/* ─── ROTATING CATEGORY ROWS (daily rotation) ─── */}

        {todaysRows.map(row => (
          <ContentRow
            key={row.key}
            title={row.title}
            videos={row.videos}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory(row.title, row.videos)}
          />
        ))}

        {/* StuntListing Stunt Reels — randomly shuffled each load */}
        {shuffledStuntReels.length > 0 && (
          <ReelRow
            title="Stunt Reels"
            reels={shuffledStuntReels}
            onReelPress={(reel) => navigation.navigate('ReelDetail', { reelId: reel.id })}
            onSeeAll={() => navigation.navigate('ReelGrid', { title: 'Stunt Reels', reelIds: shuffledStuntReels.map(r => r.id) })}
          />
        )}

        {/* StuntListing Skill Reels — rotated daily subset */}
        {todaysSkillReels.map(([skillName, reels]) => (
          <ReelRow
            key={skillName}
            title={skillName}
            reels={reels}
            onReelPress={(reel) => navigation.navigate('ReelDetail', { reelId: reel.id })}
            onSeeAll={() => navigation.navigate('ReelGrid', { title: skillName, reelIds: reels.map(r => r.id) })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  maxWidthWrapper: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.screen,
    paddingBottom: 10,
    paddingTop: Platform.OS === 'web' ? 16 : 54,
  },
  headerTitle: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  categoriesSection: {
    marginBottom: Spacing.xl,
  },
  categoriesList: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
