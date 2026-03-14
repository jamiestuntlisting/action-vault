import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { coordinatorMap, videos } from '../../data';
import { VideoCard } from '../../components/VideoCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function CoordinatorProfileScreen({ route, navigation }: any) {
  const { coordinatorId } = route.params;
  const coordinator = coordinatorMap.get(coordinatorId);
  const { dispatch, isFollowing } = useAppState();

  const coordVideos = useMemo(() =>
    videos.filter(v => v.coordinators.some(c => c.id === coordinatorId)), [coordinatorId]);

  if (!coordinator) return null;

  const following = isFollowing('coordinator', coordinatorId);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        <Image source={{ uri: coordinator.photoUrl }} style={styles.avatar} contentFit="cover" />
        <Text style={styles.name}>{coordinator.name}</Text>
        <Text style={styles.role}>Stunt Coordinator</Text>
        <Text style={styles.bio}>{coordinator.bio}</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{coordVideos.length}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{coordinator.knownFor.length}</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.followButton, following && styles.followButtonActive]}
            onPress={() => dispatch({
              type: 'TOGGLE_FOLLOW',
              payload: { profileId: '', followableType: 'coordinator', followableId: coordinatorId },
            })}
          >
            <Ionicons name={following ? 'checkmark' : 'add'} size={18} color={following ? Colors.black : Colors.white} />
            <Text style={[styles.followText, following && styles.followTextActive]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>

          {coordinator.stuntlistingUrl && (
            <TouchableOpacity style={styles.stuntlistingButton} onPress={() => Linking.openURL(coordinator.stuntlistingUrl!)}>
              <Text style={styles.stuntlistingText}>StuntListing Profile</Text>
              <Ionicons name="open-outline" size={14} color={Colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Known For</Text>
        <View style={styles.knownForList}>
          {coordinator.knownFor.map((title, i) => (
            <View key={i} style={styles.knownForItem}>
              <Ionicons name="film-outline" size={16} color={Colors.textTertiary} />
              <Text style={styles.knownForText}>{title}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Videos ({coordVideos.length})</Text>
        <View style={styles.videoGrid}>
          {coordVideos.map(v => (
            <VideoCard
              key={v.id}
              video={v}
              onPress={() => navigation.navigate('VideoDetail', { videoId: v.id })}
              width={(SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md) / 2}
            />
          ))}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

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
  profileHeader: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.lg,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
  },
  role: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginTop: 4,
  },
  bio: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.section,
    marginTop: Spacing.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  followButtonActive: {
    backgroundColor: Colors.white,
  },
  followText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  followTextActive: {
    color: Colors.black,
  },
  stuntlistingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  stuntlistingText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  section: {
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  knownForList: {
    gap: Spacing.sm,
  },
  knownForItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  knownForText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
});
