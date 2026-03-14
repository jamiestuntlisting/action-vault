import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Share, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap, videos } from '../../data';
import { SkillTagChip } from '../../components/SkillTagChip';
import { DifficultyBadge } from '../../components/DifficultyBadge';
import { ContentRow } from '../../components/ContentRow';
import { Video } from '../../types';
import { TmdbService, StuntCrewMember, posterUrl } from '../../services/TmdbService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function VideoDetailScreen({ route, navigation }: any) {
  const { videoId } = route.params;
  const video = videoMap.get(videoId);
  const { dispatch, isInMyList, getRating } = useAppState();
  const rating = getRating(videoId);

  const [tmdbCrew, setTmdbCrew] = useState<StuntCrewMember[]>([]);
  const [tmdbPoster, setTmdbPoster] = useState<string | null>(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  useEffect(() => {
    if (!video || !TmdbService.hasApiKey()) return;
    // Try to enrich with TMDB data if we have a production title
    const production = video.productions[0];
    if (production) {
      setTmdbLoading(true);
      TmdbService.enrichProduction(production.title, production.year)
        .then(data => {
          if (data) {
            setTmdbCrew(data.stuntCrew);
            if (data.posterUrl) setTmdbPoster(data.posterUrl);
          }
        })
        .finally(() => setTmdbLoading(false));
    }
  }, [videoId]);

  if (!video) return null;

  const relatedVideos = videos
    .filter(v => v.id !== videoId && v.skillTags.some(t => video.skillTags.some(vt => vt.id === t.id)))
    .slice(0, 10);

  const sameProduction = video.productions.length > 0
    ? videos.filter(v => v.id !== videoId && v.productions.some(p => video.productions.some(vp => vp.id === p.id)))
    : [];

  function handlePlay() {
    navigation.navigate('VideoPlayer', { videoId: video!.id });
  }

  function handleShare() {
    Share.share({
      message: `Check out "${video!.title}" on Action Vault! ${video!.sourceUrl}`,
      url: video!.sourceUrl,
    });
  }

  function toggleMyList() {
    if (isInMyList(videoId)) {
      dispatch({ type: 'REMOVE_FROM_MY_LIST', payload: videoId });
    } else {
      dispatch({ type: 'ADD_TO_MY_LIST', payload: videoId });
    }
  }

  function handleThumb(direction: 'up' | 'down') {
    dispatch({
      type: 'SET_RATING',
      payload: {
        profileId: '',
        videoId,
        thumbs: rating?.thumbs === direction ? null : direction,
        difficultyRating: rating?.difficultyRating || null,
        reviewText: rating?.reviewText || '',
        createdAt: new Date().toISOString(),
      },
    });
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.heroContainer}>
        <Image source={{ uri: video.thumbnailUrl }} style={styles.heroImage} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(10,10,10,0.8)', Colors.background]} style={styles.heroGradient} />
        <TouchableOpacity style={styles.playOverlay} onPress={handlePlay} activeOpacity={0.8}>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={36} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{video.title}</Text>

        <View style={styles.metaRow}>
          {video.productions[0] && <Text style={styles.metaText}>{video.productions[0].year}</Text>}
          <Text style={styles.metaText}>{formatDuration(video.durationSeconds)}</Text>
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{video.sourcePlatform.toUpperCase()}</Text>
          </View>
          <DifficultyBadge rating={video.averageDifficulty} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlay} activeOpacity={0.8}>
            <Ionicons name="play" size={22} color={Colors.black} />
            <Text style={styles.playText}>Play</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <ActionButton icon={isInMyList(videoId) ? 'checkmark' : 'add'} label="My List" onPress={toggleMyList} active={isInMyList(videoId)} />
          <ActionButton icon="thumbs-up-outline" label="Rate" onPress={() => handleThumb('up')} active={rating?.thumbs === 'up'} />
          <ActionButton icon="thumbs-down-outline" label="Not for me" onPress={() => handleThumb('down')} active={rating?.thumbs === 'down'} />
          <ActionButton icon="share-outline" label="Share" onPress={handleShare} />
        </View>

        <Text style={styles.description}>{video.description}</Text>

        <View style={styles.tags}>
          {video.skillTags.map(tag => (
            <SkillTagChip key={tag.id} tag={tag} onPress={() => {}} />
          ))}
        </View>

        {video.coordinators.length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditLabel}>Coordinator{video.coordinators.length > 1 ? 's' : ''}</Text>
            {video.coordinators.map(c => (
              <TouchableOpacity key={c.id} onPress={() => navigation.navigate('CoordinatorProfile', { coordinatorId: c.id })}>
                <Text style={styles.creditLink}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {video.performers.length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditLabel}>Performer{video.performers.length > 1 ? 's' : ''}</Text>
            {video.performers.map(p => (
              <TouchableOpacity key={p.id} onPress={() => navigation.navigate('PerformerProfile', { performerId: p.id })}>
                <Text style={styles.creditLink}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {video.productions.length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditLabel}>Production</Text>
            {video.productions.map(p => (
              <TouchableOpacity key={p.id} onPress={() => navigation.navigate('ProductionPage', { productionId: p.id })}>
                <Text style={styles.creditLink}>{p.title} ({p.year})</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TMDB Stunt Crew - auto-enriched */}
        {tmdbLoading && (
          <View style={styles.creditSection}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
        {tmdbCrew.length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditLabel}>Stunt Crew (via TMDB)</Text>
            {tmdbCrew.map((c, i) => (
              <View key={i} style={styles.tmdbCrewRow}>
                {c.photoUrl && (
                  <Image source={{ uri: c.photoUrl }} style={styles.tmdbCrewPhoto} contentFit="cover" />
                )}
                <View style={styles.tmdbCrewInfo}>
                  <Text style={styles.creditLink}>{c.name}</Text>
                  <Text style={styles.tmdbCrewJob}>{c.job}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {video.rigTags.length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditLabel}>Equipment</Text>
            <View style={styles.rigTags}>
              {video.rigTags.map(r => (
                <View key={r.id} style={styles.rigTag}>
                  <Ionicons name="construct-outline" size={12} color={Colors.accent} />
                  <Text style={styles.rigTagText}>{r.displayName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => navigation.navigate('ReviewModal', { videoId })}
        >
          <Ionicons name="star-outline" size={20} color={Colors.accent} />
          <Text style={styles.reviewButtonText}>Write a Review</Text>
        </TouchableOpacity>
      </View>

      {relatedVideos.length > 0 && (
        <ContentRow
          title="More Like This"
          videos={relatedVideos}
          onVideoPress={(v) => navigation.push('VideoDetail', { videoId: v.id })}
        />
      )}

      {sameProduction.length > 0 && (
        <ContentRow
          title="From the Same Production"
          videos={sameProduction}
          onVideoPress={(v) => navigation.push('VideoDetail', { videoId: v.id })}
        />
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function ActionButton({ icon, label, onPress, active }: { icon: string; label: string; onPress: () => void; active?: boolean }) {
  return (
    <TouchableOpacity style={actionStyles.button} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={24} color={active ? Colors.primary : Colors.textSecondary} />
      <Text style={[actionStyles.label, active && actionStyles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const actionStyles = StyleSheet.create({
  button: { alignItems: 'center', gap: 4 },
  label: { color: Colors.textSecondary, fontSize: FontSize.xs },
  labelActive: { color: Colors.primary },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: Spacing.screen,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: Spacing.sm,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.56,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(229,9,20,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  content: {
    padding: Spacing.screen,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  metaText: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  platformBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  platformText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  actions: {
    marginBottom: Spacing.lg,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    height: 44,
    gap: Spacing.sm,
  },
  playText: {
    color: Colors.black,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  creditSection: {
    marginBottom: Spacing.md,
  },
  creditLabel: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    marginBottom: 2,
  },
  creditLink: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  rigTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 4,
  },
  rigTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  rigTagText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  tmdbCrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  tmdbCrewPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
  },
  tmdbCrewInfo: {
    flex: 1,
  },
  tmdbCrewJob: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewButtonText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
