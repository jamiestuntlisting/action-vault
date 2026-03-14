import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { Colors, Spacing } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videos, videoMap } from '../../data';
import { HeroBanner } from '../../components/HeroBanner';
import { ContentRow } from '../../components/ContentRow';
import { Video } from '../../types';

const MAX_WIDTH = 960;

export function HomeScreen({ navigation }: any) {
  const { state, dispatch, isInMyList, getContinueWatching } = useAppState();
  const [refreshing, setRefreshing] = React.useState(false);

  const featured = useMemo(() => videos.find(v => v.isFeatured) || videos[0], []);
  const continueWatching = useMemo(() => {
    const entries = getContinueWatching();
    return entries.map(e => videoMap.get(e.videoId)).filter(Boolean) as Video[];
  }, [state.watchHistory]);

  const trending = useMemo(() =>
    [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10), []);

  const top10 = useMemo(() =>
    [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10), []);

  const newThisWeek = useMemo(() =>
    [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10), []);

  const fightChoreography = useMemo(() =>
    videos.filter(v => v.skillTags.some(t => t.category === 'Fight Choreography')), []);

  const carWork = useMemo(() =>
    videos.filter(v => v.skillTags.some(t => t.category === 'Car Work')), []);

  const trainingVideos = useMemo(() =>
    videos.filter(v => v.skillTags.some(t => t.id === 'training' || t.id === 'rig-breakdown' || t.id === 'safety-walkthrough')), []);

  const fallsVideos = useMemo(() =>
    videos.filter(v => v.skillTags.some(t => t.category === 'Falls')), []);

  const fireVideos = useMemo(() =>
    videos.filter(v => v.skillTags.some(t => t.category === 'Fire')), []);

  const classicStunts = useMemo(() =>
    videos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('buster keaton') || t.includes('1920s') || t.includes('ben-hur') ||
        t.includes('indiana jones') || t.includes('raiders') || t.includes('golden age') ||
        t.includes('classic');
    }), []);

  const legendaryPerformers = useMemo(() =>
    videos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('jackie chan') || t.includes('keanu') || t.includes('tom cruise') ||
        t.includes('tom holland');
    }), []);

  const wireAndRigWork = useMemo(() =>
    videos.filter(v => v.skillTags.some(t => t.category === 'Rigs' || t.id === 'wire-work')), []);

  const marvelDC = useMemo(() =>
    videos.filter(v =>
      v.title.toLowerCase().includes('marvel') ||
      v.title.toLowerCase().includes('shang') ||
      v.title.toLowerCase().includes('spider') ||
      v.productions.some(p => p.studio.toLowerCase().includes('marvel') || p.studio.toLowerCase().includes('dc'))
    ), []);

  const bondAndSpy = useMemo(() =>
    videos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('bond') || t.includes('007') || t.includes('no time to die') ||
        t.includes('atomic blonde') || t.includes('mission: impossible') || t.includes('matrix');
    }), []);

  const tvBTS = useMemo(() =>
    videos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('game of thrones') || t.includes('stranger things') ||
        t.includes('daredevil') || t.includes('walking dead') || t.includes('breaking bad') ||
        (t.includes('season') && v.skillTags.some(s => s.id === 'bts-featurette'));
    }), []);

  const stuntDocs = useMemo(() =>
    videos.filter(v =>
      v.skillTags.some(s => s.id === 'interview') ||
      v.title.toLowerCase().includes('documentary') ||
      v.title.toLowerCase().includes('in praise of action') ||
      v.title.toLowerCase().includes('hal needham') ||
      v.title.toLowerCase().includes('fall guy')
    ), []);

  function navigateToVideo(video: Video) {
    navigation.navigate('VideoDetail', { videoId: video.id });
  }

  function playVideo(video: Video) {
    navigation.navigate('VideoPlayer', { videoId: video.id });
  }

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.maxWidthWrapper}>
        <HeroBanner
          video={featured}
          onPlay={() => playVideo(featured)}
          onInfo={() => navigateToVideo(featured)}
          onAddToList={() => {
            if (isInMyList(featured.id)) {
              dispatch({ type: 'REMOVE_FROM_MY_LIST', payload: featured.id });
            } else {
              dispatch({ type: 'ADD_TO_MY_LIST', payload: featured.id });
            }
          }}
          isInList={isInMyList(featured.id)}
        />

        {continueWatching.length > 0 && (
          <ContentRow
            title="Continue Watching"
            videos={continueWatching}
            onVideoPress={navigateToVideo}
            showProgress
          />
        )}

        <ContentRow
          title="Trending Now"
          videos={trending}
          onVideoPress={navigateToVideo}
        />

        <ContentRow
          title="Top 10 This Week"
          videos={top10}
          onVideoPress={navigateToVideo}
          showRanks
        />

        <ContentRow
          title="New This Week"
          videos={newThisWeek}
          onVideoPress={navigateToVideo}
        />

        <ContentRow
          title="Popular in Fight Choreography"
          videos={fightChoreography}
          onVideoPress={navigateToVideo}
        />

        <ContentRow
          title="Car Work & Driving"
          videos={carWork}
          onVideoPress={navigateToVideo}
        />

        {classicStunts.length > 0 && (
          <ContentRow
            title="Classic Stunts"
            videos={classicStunts}
            onVideoPress={navigateToVideo}
          />
        )}

        {legendaryPerformers.length > 0 && (
          <ContentRow
            title="Legendary Stunt Performers"
            videos={legendaryPerformers}
            onVideoPress={navigateToVideo}
          />
        )}

        {bondAndSpy.length > 0 && (
          <ContentRow
            title="Spy & Action Thrillers"
            videos={bondAndSpy}
            onVideoPress={navigateToVideo}
          />
        )}

        {marvelDC.length > 0 && (
          <ContentRow
            title="Superhero Stunts"
            videos={marvelDC}
            onVideoPress={navigateToVideo}
          />
        )}

        {wireAndRigWork.length > 0 && (
          <ContentRow
            title="Wire & Rig Work"
            videos={wireAndRigWork}
            onVideoPress={navigateToVideo}
          />
        )}

        {tvBTS.length > 0 && (
          <ContentRow
            title="TV Show Stunts: Behind the Scenes"
            videos={tvBTS}
            onVideoPress={navigateToVideo}
          />
        )}

        {stuntDocs.length > 0 && (
          <ContentRow
            title="Stunt Documentaries & Interviews"
            videos={stuntDocs}
            onVideoPress={navigateToVideo}
          />
        )}

        <ContentRow
          title="Falls & High Work"
          videos={fallsVideos}
          onVideoPress={navigateToVideo}
        />

        <ContentRow
          title="Fire & Pyro"
          videos={fireVideos}
          onVideoPress={navigateToVideo}
        />

        <ContentRow
          title="Training & Safety"
          videos={trainingVideos}
          onVideoPress={navigateToVideo}
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
});
