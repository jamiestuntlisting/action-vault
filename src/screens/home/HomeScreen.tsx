import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Colors, Spacing } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videos, videoMap } from '../../data';
import { HeroBanner } from '../../components/HeroBanner';
import { ContentRow } from '../../components/ContentRow';
import { Video } from '../../types';

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
