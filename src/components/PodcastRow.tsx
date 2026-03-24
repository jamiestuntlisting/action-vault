import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { StuntPodcast } from '../data/podcasts';

const CARD_WIDTH = 200;

function PodcastCard({ podcast }: { podcast: StuntPodcast }) {
  function openLink(url: string) {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url);
    }
  }

  const firstLink = podcast.links.spotify || podcast.links.apple || podcast.links.youtube || podcast.links.website;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => firstLink && openLink(firstLink)}
      activeOpacity={0.8}
    >
      <View style={styles.coverContainer}>
        <View style={styles.coverFallback}>
          <Ionicons name="mic" size={32} color={Colors.primary} />
          <Text style={styles.coverTitle} numberOfLines={2}>{podcast.title}</Text>
        </View>
        {podcast.status === 'inactive' && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Inactive</Text>
          </View>
        )}
      </View>
      <Text style={styles.podcastTitle} numberOfLines={2}>{podcast.title}</Text>
      <Text style={styles.podcastHost} numberOfLines={1}>{podcast.hosts}</Text>
      <Text style={styles.podcastDesc} numberOfLines={2}>{podcast.description}</Text>

      {/* Platform links */}
      <View style={styles.linksRow}>
        {podcast.links.spotify && (
          <TouchableOpacity onPress={() => openLink(podcast.links.spotify!)} style={styles.linkIcon}>
            <Ionicons name={'logo-spotify' as any} size={16} color="#1DB954" />
          </TouchableOpacity>
        )}
        {podcast.links.apple && (
          <TouchableOpacity onPress={() => openLink(podcast.links.apple!)} style={styles.linkIcon}>
            <Ionicons name="logo-apple" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        {podcast.links.youtube && (
          <TouchableOpacity onPress={() => openLink(podcast.links.youtube!)} style={styles.linkIcon}>
            <Ionicons name="logo-youtube" size={16} color="#FF0000" />
          </TouchableOpacity>
        )}
        {podcast.links.website && (
          <TouchableOpacity onPress={() => openLink(podcast.links.website!)} style={styles.linkIcon}>
            <Ionicons name="globe-outline" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function PodcastSection({ podcasts }: { podcasts: StuntPodcast[] }) {
  if (podcasts.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="mic-outline" size={22} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Stunt Podcasts</Text>
      </View>
      <Text style={styles.sectionSubtitle}>
        Listen to stories from the stunt world
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {podcasts.map(pod => (
          <PodcastCard key={pod.id} podcast={pod} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    marginBottom: 4,
    gap: 8,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
  },
  coverContainer: {
    width: CARD_WIDTH,
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginBottom: 6,
  },
  coverFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a2e',
  },
  coverTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginTop: 6,
  },
  inactiveBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    color: Colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase' as const,
  },
  podcastTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: 18,
  },
  podcastHost: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  podcastDesc: {
    color: Colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  linkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
