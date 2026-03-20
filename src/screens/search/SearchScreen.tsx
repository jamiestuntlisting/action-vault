import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { videos, categories, categoryThumbnails, skillTags, coordinators, performers } from '../../data';
import { Video, Coordinator, Performer } from '../../types';
import { VideoCard } from '../../components/VideoCard';
import { ReelCard } from '../../components/ReelCard';
import { stuntReels, skillReels, StuntReel, SkillReel } from '../../services/StuntListingService';

// Build browseable categories from every skill tag + curated genre categories
function buildCategories(): { label: string; query: string; thumbnail: string; icon: string }[] {
  const iconMap: Record<string, string> = {
    'arrow-down': 'arrow-down-outline', 'flame': 'flame-outline', 'car': 'car-outline',
    'fitness': 'fitness-outline', 'resize': 'resize-outline', 'flash': 'flash-outline',
    'water': 'water-outline', 'paw': 'paw-outline', 'bicycle': 'bicycle-outline',
    'speedometer': 'speedometer-outline', 'body': 'body-outline', 'videocam': 'videocam-outline',
    'film': 'film-outline', 'mic': 'mic-outline', 'barbell': 'barbell-outline',
    'construct': 'construct-outline', 'shield-checkmark': 'shield-checkmark-outline',
    'walk': 'walk-outline', 'airplane': 'airplane-outline',
  };

  // Generate a category for each skill tag
  const skillCategories = skillTags.map(tag => {
    const v = videos.find(v => v.skillTags.some(t => t.id === tag.id));
    return {
      label: tag.displayName,
      query: tag.displayName.toLowerCase(),
      icon: iconMap[tag.icon] || 'fitness-outline',
      thumbnail: v?.thumbnailUrl || 'https://img.youtube.com/vi/I7lYjYnPOyU/hqdefault.jpg',
    };
  });

  // Add curated genre categories
  const genreCategories = [
    { label: 'Stuntmen React', query: 'stuntmen react', icon: 'videocam-outline', thumbnail: 'https://img.youtube.com/vi/OL83p4GxAvw/hqdefault.jpg' },
    { label: 'Stuntwomen React', query: 'stuntwomen react', icon: 'videocam-outline', thumbnail: 'https://img.youtube.com/vi/SgGpPRBTBTI/hqdefault.jpg' },
    { label: 'Stunt Rigging Toolbox', query: 'stunt rigging toolbox', icon: 'construct-outline', thumbnail: 'https://img.youtube.com/vi/Y8Kzgpwgfwc/hqdefault.jpg' },
    { label: 'Superhero Stunts', query: 'marvel spider shang', icon: 'shield-outline', thumbnail: 'https://img.youtube.com/vi/Oh7svEBK6I8/hqdefault.jpg' },
    { label: 'Spy & Action Thrillers', query: 'bond mission impossible matrix', icon: 'eye-outline', thumbnail: 'https://img.youtube.com/vi/mLvu5oyQZek/hqdefault.jpg' },
  ];

  return [...skillCategories, ...genreCategories];
}

const ALL_CATEGORIES = buildCategories();

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function SearchScreen({ navigation, route }: any) {
  const [query, setQuery] = useState(route?.params?.query || '');
  const [recentSearches] = useState(['high falls', 'John Wick', 'fire burns', 'car stunts']);

  const allReels = useMemo(() => [...stuntReels, ...skillReels], []);

  const videoResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return videos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.skillTags.some(t => t.displayName.toLowerCase().includes(q)) ||
      v.coordinators.some(c => c.name.toLowerCase().includes(q)) ||
      v.performers.some(p => p.name.toLowerCase().includes(q)) ||
      v.productions.some(p => p.title.toLowerCase().includes(q))
    );
  }, [query]);

  const reelResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allReels.filter(r =>
      r.name.toLowerCase().includes(q) ||
      ('skill' in r && (r as SkillReel).skill.toLowerCase().includes(q)) ||
      ('title' in r && (r as StuntReel).title.toLowerCase().includes(q)) ||
      ('cat' in r && (r as SkillReel).cat.toLowerCase().includes(q)) ||
      ('desc' in r && (r as SkillReel).desc.toLowerCase().includes(q)) ||
      r.alias.toLowerCase().includes(q)
    );
  }, [query, allReels]);

  // Deduplicate reel results by performer for stunt reels
  const dedupedReelResults = useMemo(() => {
    const seen = new Set<string>();
    return reelResults.filter(r => {
      // For stunt reels, show one per performer in search results
      if (!('skill' in r)) {
        if (seen.has(r.name)) return false;
        seen.add(r.name);
      }
      return true;
    });
  }, [reelResults]);

  const hasResults = videoResults.length > 0 || dedupedReelResults.length > 0;

  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const items: { type: string; text: string; id?: string }[] = [];

    // Performer names from reels
    const seenPerformers = new Set<string>();
    allReels.forEach(r => {
      if (r.name.toLowerCase().includes(q) && !seenPerformers.has(r.name)) {
        seenPerformers.add(r.name);
        items.push({ type: 'Performer', text: r.name });
      }
    });

    skillTags.forEach(t => {
      if (t.displayName.toLowerCase().includes(q)) items.push({ type: 'Skill', text: t.displayName, id: t.id });
    });
    videos.forEach(v => {
      if (v.title.toLowerCase().includes(q)) items.push({ type: 'Video', text: v.title, id: v.id });
    });
    videos.flatMap(v => v.coordinators).forEach(c => {
      if (c.name.toLowerCase().includes(q) && !items.some(i => i.text === c.name))
        items.push({ type: 'Coordinator', text: c.name, id: c.id });
    });

    return items.slice(0, 8);
  }, [query, allReels]);

  function navigateToVideo(video: Video) {
    navigation.navigate('VideoDetail', { videoId: video.id });
  }

  function navigateToReel(reel: StuntReel | SkillReel) {
    navigation.navigate('ReelDetail', { reelId: reel.id });
  }

  const numColumns = SCREEN_WIDTH > 700 ? 5 : SCREEN_WIDTH > 500 ? 4 : 3;
  const reelCardWidth = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.sm * (numColumns - 1)) / numColumns;

  if (query.trim()) {
    // Build combined list of sections
    const sections: any[] = [];
    if (videoResults.length > 0) {
      sections.push({ type: 'header', title: 'Videos' });
      sections.push({ type: 'videos', data: videoResults });
    }
    if (dedupedReelResults.length > 0) {
      sections.push({ type: 'header', title: 'Reels & Performers' });
      sections.push({ type: 'reels', data: dedupedReelResults });
    }

    return (
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos, performers, skills..."
            placeholderTextColor={Colors.inputPlaceholder}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {suggestions.length > 0 && !hasResults && (
          <View style={styles.suggestions}>
            {suggestions.map((s, i) => (
              <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => setQuery(s.text)}>
                <Ionicons name="search" size={16} color={Colors.textTertiary} />
                <Text style={styles.suggestionText}>{s.text}</Text>
                <Text style={styles.suggestionType}>{s.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <FlatList
          data={sections}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.resultGrid}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text style={styles.resultSectionTitle}>{item.title}</Text>
              );
            }
            if (item.type === 'videos') {
              return (
                <View style={styles.videoResultGrid}>
                  {item.data.map((v: Video) => (
                    <VideoCard
                      key={v.id}
                      video={v}
                      onPress={() => navigateToVideo(v)}
                      width={(SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md) / 2}
                    />
                  ))}
                </View>
              );
            }
            if (item.type === 'reels') {
              return (
                <View style={styles.reelResultGrid}>
                  {item.data.map((r: StuntReel | SkillReel) => (
                    <ReelCard
                      key={r.id}
                      reel={r}
                      onPress={() => navigateToReel(r)}
                      width={reelCardWidth}
                    />
                  ))}
                </View>
              );
            }
            return null;
          }}
          ListEmptyComponent={
            !hasResults ? (
              <View style={styles.emptyResults}>
                <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No results for "{query}"</Text>
              </View>
            ) : null
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos, performers, skills..."
          placeholderTextColor={Colors.inputPlaceholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView contentContainerStyle={styles.browseContent} showsVerticalScrollIndicator={false}>
        {/* Recent Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.recentList}>
            {recentSearches.map((s, i) => (
              <TouchableOpacity key={i} style={styles.recentItem} onPress={() => setQuery(s)}>
                <Ionicons name="time-outline" size={16} color={Colors.textTertiary} />
                <Text style={styles.recentText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Browse People */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People</Text>
          <Text style={styles.peopleSectionLabel}>Stunt Coordinators</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleRow} contentContainerStyle={styles.peopleRowContent}>
            {coordinators.map(c => {
              const count = videos.filter(v => v.coordinators.some(vc => vc.id === c.id)).length;
              if (count === 0) return null;
              return (
                <TouchableOpacity key={c.id} style={styles.personChip} onPress={() => setQuery(c.name)}>
                  <View style={styles.personAvatar}>
                    <Ionicons name="person" size={16} color={Colors.accent} />
                  </View>
                  <View style={styles.personInfo}>
                    <Text style={styles.personName} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.personCount}>{count} video{count !== 1 ? 's' : ''}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={styles.peopleSectionLabel}>Performers & Action Stars</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleRow} contentContainerStyle={styles.peopleRowContent}>
            {performers.map(p => {
              const count = videos.filter(v => v.performers.some(vp => vp.id === p.id)).length;
              if (count === 0) return null;
              return (
                <TouchableOpacity key={p.id} style={styles.personChip} onPress={() => setQuery(p.name)}>
                  <View style={[styles.personAvatar, { backgroundColor: 'rgba(255,107,0,0.15)' }]}>
                    <Ionicons name="star" size={16} color="#ff6b00" />
                  </View>
                  <View style={styles.personInfo}>
                    <Text style={styles.personName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.personCount}>{count} video{count !== 1 ? 's' : ''}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* All Categories — full-width wide cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
        </View>
        <View style={styles.categoryList}>
          {ALL_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.label}
              style={styles.categoryCard}
              onPress={() => setQuery(cat.query)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: cat.thumbnail }}
                style={styles.categoryImage}
                contentFit="cover"
              />
              <View style={styles.categoryOverlay} />
              <View style={styles.categoryContent}>
                <Ionicons name={cat.icon as any} size={20} color={Colors.white} />
                <Text style={styles.categoryName}>{cat.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.screen,
    paddingHorizontal: Spacing.lg,
    height: 44,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  browseContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  recentList: {
    gap: Spacing.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  recentText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  categoryList: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
  },
  categoryCard: {
    width: '100%',
    height: 110,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  categoryContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  categoryName: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    flex: 1,
  },
  suggestions: {
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  suggestionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    flex: 1,
  },
  suggestionType: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  resultGrid: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 100,
  },
  resultSectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  videoResultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  reelResultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  emptyResults: {
    alignItems: 'center',
    paddingTop: Spacing.section,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: FontSize.lg,
  },
  peopleSectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  peopleRow: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.screen,
  },
  peopleRowContent: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    minWidth: 150,
  },
  personAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229,9,20,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  personCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
