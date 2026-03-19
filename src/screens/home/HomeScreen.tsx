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

export function HomeScreen({ navigation }: any) {
  const { state, dispatch, isInMyList, getContinueWatching } = useAppState();
  const [refreshing, setRefreshing] = React.useState(false);
  const [shuffleKey, setShuffleKey] = React.useState(Date.now());

  const overrides = state.settings.adminVideoOverrides || [];
  const hiddenIds = new Set(overrides.filter(o => o.hidden).map(o => o.videoId));
  const visibleVideos = useMemo(() => videos.filter(v => !hiddenIds.has(v.id)), [hiddenIds.size]);

  // Rotate featured videos daily using date as seed
  const featuredVideos = useMemo(() => {
    const pool = visibleVideos.filter(v => v.isFeatured);
    // If not enough featured, supplement with top viewed
    if (pool.length < 5) {
      const top = [...visibleVideos].sort((a, b) => b.viewCount - a.viewCount)
        .filter(v => !pool.some(f => f.id === v.id));
      pool.push(...top);
    }
    // Use today's date as a seed to shuffle deterministically per day
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = ((daySeed * (i + 1) * 2654435761) >>> 0) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 5);
  }, [visibleVideos]);
  const continueWatching = useMemo(() => {
    const entries = getContinueWatching();
    return entries.map(e => videoMap.get(e.videoId)).filter(Boolean) as Video[];
  }, [state.watchHistory]);

  const top10 = useMemo(() => {
    const thumbsUpCount = (videoId: string) =>
      state.ratings.filter(r => r.videoId === videoId && r.thumbs === 'up').length;
    return [...visibleVideos]
      .sort((a, b) => thumbsUpCount(b.id) - thumbsUpCount(a.id) || b.viewCount - a.viewCount)
      .slice(0, 10);
  }, [visibleVideos, state.ratings]);

  const newThisWeek = useMemo(() =>
    [...visibleVideos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10), [visibleVideos]);

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
        t.includes('atomic blonde') || t.includes('mission: impossible') || t.includes('matrix');
    }), [visibleVideos]);

  const tvBTS = useMemo(() =>
    visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('game of thrones') || t.includes('stranger things') ||
        t.includes('daredevil') || t.includes('walking dead') || t.includes('breaking bad') ||
        (t.includes('season') && v.skillTags.some(s => s.id === 'bts-featurette'));
    }), [visibleVideos]);

  const stuntDocs = useMemo(() =>
    visibleVideos.filter(v =>
      v.skillTags.some(s => s.id === 'interview') ||
      v.title.toLowerCase().includes('documentary') ||
      v.title.toLowerCase().includes('in praise of action') ||
      v.title.toLowerCase().includes('hal needham') ||
      v.title.toLowerCase().includes('fall guy')
    ), [visibleVideos]);

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
    // Exclude non-stunt categories
    const excludedSkills = new Set(['Acting/Actor', 'All Expected Abilities']);
    // Prioritize Expert/Advanced reels within each sub-category
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
              { label: 'Car Work', icon: 'car-outline', query: 'car' },
              { label: 'Falls & High Work', icon: 'arrow-down-outline', query: 'falls' },
              { label: 'Fire & Pyro', icon: 'flame-outline', query: 'fire' },
              { label: 'Action Actors', icon: 'star-outline', query: 'action star' },
              { label: 'Documentaries', icon: 'film-outline', query: 'documentary' },
              { label: 'Wire & Rigs', icon: 'resize-outline', query: 'wire rig' },
              { label: 'Training', icon: 'barbell-outline', query: 'training' },
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

        {continueWatching.length > 0 && (
          <ContentRow
            title="Continue Watching"
            videos={continueWatching}
            onVideoPress={navigateToVideo}
            showProgress
          />
        )}

        <ContentRow
          title="Top 10 This Week"
          videos={top10}
          onVideoPress={navigateToVideo}
          showRanks
          onSeeAll={() => navigateToCategory('Top 10 This Week', top10)}
        />

        <ContentRow
          title="Recently Added"
          videos={newThisWeek}
          onVideoPress={navigateToVideo}
          onSeeAll={() => navigateToCategory('Recently Added', newThisWeek)}
        />

        {atlasActionVideos.length > 0 && (
          <AtlasActionRow
            title="Atlas Action - Stunt Training"
            videos={atlasActionVideos}
            onVideoPress={(video: AtlasActionVideo) => navigation.navigate('AtlasActionDetail', { atlasVideoId: video.id })}
          />
        )}

        <ContentRow
          title="Popular in Fight Choreography"
          videos={fightChoreography}
          onVideoPress={navigateToVideo}
          onSeeAll={() => navigateToCategory('Fight Choreography', fightChoreography)}
        />

        <ContentRow
          title="Car Work & Driving"
          videos={carWork}
          onVideoPress={navigateToVideo}
          onSeeAll={() => navigateToCategory('Car Work & Driving', carWork)}
        />

        {classicStunts.length > 0 && (
          <ContentRow
            title="Classic Stunts"
            videos={classicStunts}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('Classic Stunts', classicStunts)}
          />
        )}

        {actionActors.length > 0 && (
          <ContentRow
            title="Action Actors"
            videos={actionActors}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('Action Actors', actionActors)}
          />
        )}

        {bondAndSpy.length > 0 && (
          <ContentRow
            title="Spy & Action Thrillers"
            videos={bondAndSpy}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('Spy & Action Thrillers', bondAndSpy)}
          />
        )}

        {marvelDC.length > 0 && (
          <ContentRow
            title="Superhero Stunts"
            videos={marvelDC}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('Superhero Stunts', marvelDC)}
          />
        )}

        {wireAndRigWork.length > 0 && (
          <ContentRow
            title="Wire & Rig Work"
            videos={wireAndRigWork}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('Wire & Rig Work', wireAndRigWork)}
          />
        )}

        {tvBTS.length > 0 && (
          <ContentRow
            title="TV Show Stunts: Behind the Scenes"
            videos={tvBTS}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('TV Show Stunts', tvBTS)}
          />
        )}

        {stuntDocs.length > 0 && (
          <ContentRow
            title="Stunt Documentaries & Interviews"
            videos={stuntDocs}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('Stunt Documentaries & Interviews', stuntDocs)}
          />
        )}

        {/* StuntListing Stunt Reels — randomly shuffled each load */}
        {shuffledStuntReels.length > 0 && (
          <ReelRow
            title="Stunt Reels"
            reels={shuffledStuntReels}
            onReelPress={(reel) => navigation.navigate('ReelDetail', { reelId: reel.id })}
            onSeeAll={() => navigation.navigate('ReelGrid', { title: 'Stunt Reels', reelIds: shuffledStuntReels.map(r => r.id) })}
          />
        )}

        {/* StuntListing Skill Reels — sub-categories randomly shuffled */}
        {skillReelSubCategories.map(([skillName, reels]) => (
          <ReelRow
            key={skillName}
            title={skillName}
            reels={reels}
            onReelPress={(reel) => navigation.navigate('ReelDetail', { reelId: reel.id })}
            onSeeAll={() => navigation.navigate('ReelGrid', { title: skillName, reelIds: reels.map(r => r.id) })}
          />
        ))}

        {atlantaStunts.length > 0 && (
          <ContentRow
            title="Atlanta Stunts"
            videos={atlantaStunts}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('Atlanta Stunts', atlantaStunts)}
          />
        )}

        {newYorkStunts.length > 0 && (
          <ContentRow
            title="New York Stunts"
            videos={newYorkStunts}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('New York Stunts', newYorkStunts)}
          />
        )}

        {chicagoStunts.length > 0 && (
          <ContentRow
            title="Chicago Stunts"
            videos={chicagoStunts}
            onVideoPress={navigateToVideo}
            onSeeAll={() => navigateToCategory('Chicago Stunts', chicagoStunts)}
          />
        )}

        <ContentRow
          title="Falls & High Work"
          videos={fallsVideos}
          onVideoPress={navigateToVideo}
          onSeeAll={() => navigateToCategory('Falls & High Work', fallsVideos)}
        />

        <ContentRow
          title="Fire & Pyro"
          videos={fireVideos}
          onVideoPress={navigateToVideo}
          onSeeAll={() => navigateToCategory('Fire & Pyro', fireVideos)}
        />

        <ContentRow
          title="Training & Safety"
          videos={trainingVideos}
          onVideoPress={navigateToVideo}
          onSeeAll={() => navigateToCategory('Training & Safety', trainingVideos)}
        />
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
