import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Share, ActivityIndicator, Alert, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap, videos } from '../../data';
import { SkillTagChip } from '../../components/SkillTagChip';
import { ContentRow } from '../../components/ContentRow';
import { Video } from '../../types';
import { TmdbService, StuntCrewMember, posterUrl } from '../../services/TmdbService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 960;
const CONTENT_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);

export function VideoDetailScreen({ route, navigation }: any) {
  const { videoId } = route.params;
  const video = videoMap.get(videoId);
  const { state, dispatch, isInMyList, getRating } = useAppState();
  const rating = getRating(videoId);

  const [tmdbCrew, setTmdbCrew] = useState<StuntCrewMember[]>([]);
  const [tmdbPoster, setTmdbPoster] = useState<string | null>(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [showAllCrew, setShowAllCrew] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

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

  function handleRemoveVideo() {
    setShowRemoveModal(true);
  }

  function submitRemovalRequest(reason: string, claimsOwnership: boolean) {
    const existing = state.settings.removalRequests || [];
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        removalRequests: [
          ...existing,
          { videoId, requestedAt: new Date().toISOString(), claimsOwnership, reason },
        ],
      },
    });
    setShowRemoveModal(false);
    Alert.alert('Request Submitted', 'Your removal request has been flagged for admin review. Thank you for your feedback.');
  }

  function handleThumb(direction: 'up' | 'down') {
    dispatch({
      type: 'SET_RATING',
      payload: {
        profileId: '',
        videoId,
        thumbs: rating?.thumbs === direction ? null : direction,
        difficultyRating: rating?.difficultyRating || null,
        bestOfBest: rating?.bestOfBest || false,
        reviewText: rating?.reviewText || '',
        createdAt: new Date().toISOString(),
      },
    });
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.maxWidthWrapper}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.removeButton} onPress={handleRemoveVideo}>
        <Ionicons name="flag-outline" size={22} color={Colors.white} />
        <Text style={styles.removeButtonText}>Remove</Text>
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
          <ActionButton icon="flag-outline" label="Flag" onPress={handleRemoveVideo} />
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

        {video.performers.filter(p => p.role === 'stunt_performer' || p.role === 'stunt_legend').length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditLabel}>Stunt Performer{video.performers.filter(p => p.role === 'stunt_performer' || p.role === 'stunt_legend').length > 1 ? 's' : ''}</Text>
            {video.performers.filter(p => p.role === 'stunt_performer' || p.role === 'stunt_legend').map(p => (
              <TouchableOpacity key={p.id} onPress={() => navigation.navigate('PerformerProfile', { performerId: p.id })}>
                <Text style={styles.creditLink}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {video.performers.filter(p => p.role === 'action_star').length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditLabel}>Action Star{video.performers.filter(p => p.role === 'action_star').length > 1 ? 's' : ''}</Text>
            {video.performers.filter(p => p.role === 'action_star').map(p => (
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
        {tmdbCrew.length > 0 && (() => {
          // Group by job role
          const grouped = tmdbCrew.reduce((acc, c) => {
            const job = c.job || 'Stunts';
            if (!acc[job]) acc[job] = [];
            acc[job].push(c);
            return acc;
          }, {} as Record<string, StuntCrewMember[]>);
          // Sort roles: Coordinators first, then Choreographers, then Stunts
          const roleOrder = ['Stunt Coordinator', 'Fight Choreographer', 'Stunts'];
          const sortedRoles = Object.keys(grouped).sort((a, b) => {
            const ai = roleOrder.indexOf(a);
            const bi = roleOrder.indexOf(b);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          });
          const INITIAL_SHOW = 6;
          const totalCount = tmdbCrew.length;
          const visibleCrew = showAllCrew ? tmdbCrew : tmdbCrew.slice(0, INITIAL_SHOW);
          const visibleGrouped = visibleCrew.reduce((acc, c) => {
            const job = c.job || 'Stunts';
            if (!acc[job]) acc[job] = [];
            acc[job].push(c);
            return acc;
          }, {} as Record<string, StuntCrewMember[]>);
          const visibleRoles = Object.keys(visibleGrouped).sort((a, b) => {
            const ai = roleOrder.indexOf(a);
            const bi = roleOrder.indexOf(b);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          });

          return (
            <View style={styles.creditSection}>
              <Text style={styles.creditLabel}>Stunt Crew (via TMDB)</Text>
              <View style={styles.tmdbCrewGrid}>
                {visibleRoles.map(role => (
                  <View key={role}>
                    <Text style={styles.tmdbRoleLabel}>{role}</Text>
                    <View style={styles.tmdbCrewChips}>
                      {visibleGrouped[role].map((c, i) => (
                        <View key={i} style={styles.tmdbCrewChip}>
                          {c.photoUrl ? (
                            <Image source={{ uri: c.photoUrl }} style={styles.tmdbCrewPhoto} contentFit="cover" />
                          ) : (
                            <View style={styles.tmdbCrewPhotoPlaceholder}>
                              <Text style={styles.tmdbCrewInitial}>{c.name.charAt(0)}</Text>
                            </View>
                          )}
                          <Text style={styles.tmdbCrewName} numberOfLines={1}>{c.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
              {totalCount > INITIAL_SHOW && (
                <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllCrew(!showAllCrew)}>
                  <Text style={styles.showMoreText}>
                    {showAllCrew ? 'Show less' : `Show all ${totalCount} crew members`}
                  </Text>
                  <Ionicons name={showAllCrew ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          );
        })()}

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
      </View>

      {/* Remove Video Modal */}
      <Modal visible={showRemoveModal} transparent animationType="fade" onRequestClose={() => setShowRemoveModal(false)}>
        <TouchableOpacity style={removeModalStyles.overlay} activeOpacity={1} onPress={() => setShowRemoveModal(false)}>
          <View style={removeModalStyles.container}>
            <Text style={removeModalStyles.title}>Why should this video be removed?</Text>
            <Text style={removeModalStyles.subtitle}>Please select a reason:</Text>

            <TouchableOpacity style={removeModalStyles.option} onPress={() => submitRemovalRequest('broken_link', false)}>
              <Ionicons name="link-outline" size={22} color={Colors.textSecondary} />
              <Text style={removeModalStyles.optionText}>This link is broken</Text>
            </TouchableOpacity>

            <TouchableOpacity style={removeModalStyles.option} onPress={() => submitRemovalRequest('doesnt_belong', false)}>
              <Ionicons name="close-circle-outline" size={22} color={Colors.textSecondary} />
              <Text style={removeModalStyles.optionText}>This video doesn't belong on this site</Text>
            </TouchableOpacity>

            <TouchableOpacity style={removeModalStyles.option} onPress={() => submitRemovalRequest('owner_request', true)}>
              <Ionicons name="person-outline" size={22} color={Colors.textSecondary} />
              <Text style={removeModalStyles.optionText}>I am the video owner and want it removed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={removeModalStyles.option} onPress={() => submitRemovalRequest('other', false)}>
              <Ionicons name="ellipsis-horizontal-outline" size={22} color={Colors.textSecondary} />
              <Text style={removeModalStyles.optionText}>Other reason</Text>
            </TouchableOpacity>

            <TouchableOpacity style={removeModalStyles.cancelButton} onPress={() => setShowRemoveModal(false)}>
              <Text style={removeModalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  removeButton: {
    position: 'absolute',
    top: 50,
    right: Spacing.screen,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  maxWidthWrapper: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  heroContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
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
  tmdbCrewGrid: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  tmdbRoleLabel: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  tmdbCrewChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tmdbCrewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    paddingRight: Spacing.md,
    paddingVertical: 4,
    paddingLeft: 4,
    gap: Spacing.sm,
  },
  tmdbCrewPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
  },
  tmdbCrewPhotoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tmdbCrewInitial: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  tmdbCrewName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    maxWidth: 140,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  showMoreText: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
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

const removeModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    flex: 1,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  cancelText: {
    color: Colors.textTertiary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
