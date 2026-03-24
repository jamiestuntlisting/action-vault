import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { podcasts } from '../../data/podcasts';

export function PodcastDetailScreen({ route, navigation }: any) {
  const { podcastId } = route.params;
  const podcast = podcasts.find(p => p.id === podcastId);

  if (!podcast) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Podcast not found</Text>
      </View>
    );
  }

  function openLink(url: string) {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Podcast</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cover Art */}
        <View style={styles.coverSection}>
          <View style={styles.coverContainer}>
            <View style={styles.coverFallback}>
              <Ionicons name="mic" size={48} color={Colors.primary} />
              <Text style={styles.coverTitle}>{podcast.title}</Text>
            </View>
            {podcast.status === 'active' ? (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            ) : (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Archived</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{podcast.title}</Text>
          <Text style={styles.hosts}>Hosted by {podcast.hosts}</Text>
          <Text style={styles.description}>{podcast.description}</Text>
        </View>

        {/* Listen On */}
        <View style={styles.linksSection}>
          <Text style={styles.linksTitle}>Listen On</Text>

          {podcast.links.spotify && (
            <TouchableOpacity style={styles.linkButton} onPress={() => openLink(podcast.links.spotify!)}>
              <View style={[styles.linkIconCircle, { backgroundColor: '#1DB954' }]}>
                <Ionicons name={'logo-spotify' as any} size={22} color="#fff" />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkName}>Spotify</Text>
                <Text style={styles.linkUrl}>Open in Spotify</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          {podcast.links.apple && (
            <TouchableOpacity style={styles.linkButton} onPress={() => openLink(podcast.links.apple!)}>
              <View style={[styles.linkIconCircle, { backgroundColor: '#9933CC' }]}>
                <Ionicons name="logo-apple" size={22} color="#fff" />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkName}>Apple Podcasts</Text>
                <Text style={styles.linkUrl}>Open in Apple Podcasts</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          {podcast.links.youtube && (
            <TouchableOpacity style={styles.linkButton} onPress={() => openLink(podcast.links.youtube!)}>
              <View style={[styles.linkIconCircle, { backgroundColor: '#FF0000' }]}>
                <Ionicons name="logo-youtube" size={22} color="#fff" />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkName}>YouTube</Text>
                <Text style={styles.linkUrl}>Watch on YouTube</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          {podcast.links.website && (
            <TouchableOpacity style={styles.linkButton} onPress={() => openLink(podcast.links.website!)}>
              <View style={[styles.linkIconCircle, { backgroundColor: Colors.surface }]}>
                <Ionicons name="globe-outline" size={22} color={Colors.textPrimary} />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkName}>Website</Text>
                <Text style={styles.linkUrl} numberOfLines={1}>{podcast.links.website}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.screen,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    paddingBottom: 100,
  },
  coverSection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.screen,
  },
  coverContainer: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  coverFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a2e',
  },
  coverTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginTop: 12,
  },
  activeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(29,185,84,0.9)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  inactiveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inactiveBadgeText: {
    color: Colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase' as const,
  },
  infoSection: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: 6,
  },
  hosts: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  linksSection: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  linksTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  linkIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTextContainer: {
    flex: 1,
  },
  linkName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  linkUrl: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: 100,
  },
});
