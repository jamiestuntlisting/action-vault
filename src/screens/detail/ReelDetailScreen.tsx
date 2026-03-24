import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Share, Linking } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { StuntReel, SkillReel, getEmbedUrl, getProfileUrl } from '../../services/StuntListingService';
import { stuntReels, skillReels } from '../../services/StuntListingService';
import { ReelRow } from '../../components/ReelRow';
import { usePageTitle } from '../../hooks/usePageTitle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 960;

export function ReelDetailScreen({ route, navigation }: any) {
  const { reelId } = route.params;
  const { state, dispatch } = useAppState();

  // Find the reel from both lists
  const allReels = [...stuntReels, ...skillReels];
  const reel = allReels.find(r => r.id === reelId);

  const reelTitle = reel ? ('skill' in reel ? (reel as SkillReel).skill : (reel as StuntReel).title) : undefined;
  usePageTitle(reelTitle);

  if (!reel) return null;

  const isSkill = 'skill' in reel;
  const skillReel = isSkill ? (reel as SkillReel) : null;
  const stuntReel = !isSkill ? (reel as StuntReel) : null;

  const title = skillReel ? skillReel.skill : stuntReel!.title;
  const thumbUrl = reel.thumb || (reel.youtubeId ? `https://i.ytimg.com/vi/${reel.youtubeId}/maxresdefault.jpg` : null);
  const embedUrl = getEmbedUrl(reel);
  const profileUrl = getProfileUrl(reel.alias);

  // Rating state — use reel ID as key
  const reelRatings = state.settings.reelRatings || {};
  const rating = reelRatings[reelId] || null;

  // More reels from same performer
  const moreFromPerformer = allReels
    .filter(r => r.id !== reelId && r.name === reel.name)
    .slice(0, 20);

  // More reels in same skill (for skill reels)
  const moreInSkill = skillReel
    ? skillReels.filter(r => r.id !== reelId && r.skill === skillReel.skill).slice(0, 20)
    : [];

  function handlePlay() {
    if (embedUrl) {
      navigation.navigate('VideoPlayer', { embedUrl, title, reelId });
    } else {
      Linking.openURL(reel!.url);
    }
  }

  function handleShare() {
    Share.share({
      message: `Check out "${title}" by ${reel!.name} on Action Vault! ${reel!.url}`,
      url: reel!.url,
    });
  }

  function handleThumb(direction: 'up' | 'down') {
    const existing = state.settings.reelRatings || {};
    const current = existing[reelId];
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        reelRatings: {
          ...existing,
          [reelId]: {
            thumbs: current?.thumbs === direction ? null : direction,
            ratedAt: new Date().toISOString(),
          },
        },
      },
    });
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.maxWidthWrapper}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>

        {/* Hero thumbnail */}
        <View style={styles.heroContainer}>
          {thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: Colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 48 }}>🎬</Text>
            </View>
          )}
          <LinearGradient colors={['transparent', 'rgba(10,10,10,0.8)', Colors.background]} style={styles.heroGradient} />
          <TouchableOpacity style={styles.playOverlay} onPress={handlePlay} activeOpacity={0.8}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={36} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.stlgBadge}>
              <Text style={styles.stlgBadgeText}>STLG</Text>
            </View>
            <Text style={styles.metaText}>{reel.role === 'coordinator' ? 'Coordinator' : 'Performer'}</Text>
            {skillReel && skillReel.level && skillReel.level !== 'Not rated' && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{skillReel.level}</Text>
              </View>
            )}
            {skillReel && skillReel.cat && (
              <Text style={styles.metaText}>{skillReel.cat}</Text>
            )}
            {reel.tier === 'plus' && (
              <View style={styles.plusBadge}>
                <Text style={styles.plusBadgeText}>PLUS</Text>
              </View>
            )}
          </View>

          {/* Play button */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.playButton} onPress={handlePlay} activeOpacity={0.8}>
              <Ionicons name="play" size={22} color={Colors.black} />
              <Text style={styles.playText}>Play</Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <ActionButton icon="thumbs-up-outline" label="Rate" onPress={() => handleThumb('up')} active={rating?.thumbs === 'up'} />
            <ActionButton icon="thumbs-down-outline" label="Not for me" onPress={() => handleThumb('down')} active={rating?.thumbs === 'down'} />
            <ActionButton icon="share-outline" label="Share" onPress={handleShare} />
            <ActionButton icon="open-outline" label="Source" onPress={() => Linking.openURL(reel.url)} />
          </View>

          {/* Description */}
          {skillReel?.desc ? (
            <Text style={styles.description}>{skillReel.desc}</Text>
          ) : null}

          {/* Performer info */}
          <View style={styles.creditSection}>
            <Text style={styles.creditLabel}>{reel.role === 'coordinator' ? 'Coordinator' : 'Performer'}</Text>
            <TouchableOpacity
              style={styles.performerCard}
              onPress={() => Linking.openURL(profileUrl)}
              activeOpacity={0.7}
            >
              {reel.photo ? (
                <Image source={{ uri: reel.photo }} style={styles.performerPhoto} contentFit="cover" />
              ) : (
                <View style={styles.performerPhotoPlaceholder}>
                  <Text style={styles.performerInitial}>{reel.name.charAt(0)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.performerName}>{reel.name}</Text>
                <Text style={styles.performerAlias}>@{reel.alias} · StuntListing</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* More from same performer */}
        {moreFromPerformer.length > 0 && (
          <ReelRow
            title={`More from ${reel.name}`}
            reels={moreFromPerformer}
            onReelPress={(r) => navigation.push('ReelDetail', { reelId: r.id })}
          />
        )}

        {/* More in same skill */}
        {moreInSkill.length > 0 && (
          <ReelRow
            title={`More ${skillReel!.skill} Reels`}
            reels={moreInSkill}
            onReelPress={(r) => navigation.push('ReelDetail', { reelId: r.id })}
          />
        )}

        <View style={{ height: 100 }} />
      </View>
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
  stlgBadge: {
    backgroundColor: '#E50914',
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stlgBadgeText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  levelBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  levelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  plusBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  plusBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
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
  creditSection: {
    marginBottom: Spacing.md,
  },
  creditLabel: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  performerPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
  },
  performerPhotoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  performerInitial: {
    color: Colors.textTertiary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  performerName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  performerAlias: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
});
