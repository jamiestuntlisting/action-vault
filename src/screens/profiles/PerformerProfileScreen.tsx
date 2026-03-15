import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { performerMap, videos } from '../../data';
import { VideoCard } from '../../components/VideoCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PerformerProfileScreen({ route, navigation }: any) {
  const { performerId } = route.params;
  const performer = performerMap.get(performerId);
  const { dispatch, isFollowing } = useAppState();

  const perfVideos = useMemo(() =>
    videos.filter(v => v.performers.some(p => p.id === performerId)), [performerId]);

  if (!performer) return null;

  const following = isFollowing('performer', performerId);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        <Image source={{ uri: performer.photoUrl }} style={styles.avatar} contentFit="cover" />
        <Text style={styles.name}>{performer.name}</Text>
        <Text style={styles.role}>{performer.role === 'stunt_performer' ? 'Stunt Performer' : performer.role === 'stunt_legend' ? 'Stunt Legend' : 'Action Star'}</Text>
        <Text style={styles.bio}>{performer.bio}</Text>

        <View style={styles.specialties}>
          {performer.specialties.map((s, i) => (
            <View key={i} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{s}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.followButton, following && styles.followButtonActive]}
          onPress={() => dispatch({
            type: 'TOGGLE_FOLLOW',
            payload: { profileId: '', followableType: 'performer', followableId: performerId },
          })}
        >
          <Ionicons name={following ? 'checkmark' : 'add'} size={18} color={following ? Colors.black : Colors.white} />
          <Text style={[styles.followText, following && styles.followTextActive]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Videos ({perfVideos.length})</Text>
        <View style={styles.videoGrid}>
          {perfVideos.map(v => (
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
  container: { flex: 1, backgroundColor: Colors.background },
  backButton: {
    position: 'absolute', top: 50, left: Spacing.screen, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: Spacing.sm,
  },
  profileHeader: {
    alignItems: 'center', paddingTop: 100, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl,
  },
  avatar: {
    width: 100, height: 100, borderRadius: 50, marginBottom: Spacing.lg,
    borderWidth: 3, borderColor: Colors.accent,
  },
  name: { color: Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  role: { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 4 },
  bio: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22, marginTop: Spacing.md },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  specialtyTag: {
    backgroundColor: Colors.surfaceHighlight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  specialtyText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  followButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round, marginTop: Spacing.xl,
  },
  followButtonActive: { backgroundColor: Colors.white },
  followText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  followTextActive: { color: Colors.black },
  section: { paddingHorizontal: Spacing.screen, marginBottom: Spacing.xxl },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
});
