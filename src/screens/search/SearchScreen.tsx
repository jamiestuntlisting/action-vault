import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { videos, categories, categoryThumbnails, skillTags } from '../../data';
import { Video } from '../../types';
import { VideoCard } from '../../components/VideoCard';
import { ReelCard } from '../../components/ReelCard';
import { stuntReels, skillReels, StuntReel, SkillReel } from '../../services/StuntListingService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CATEGORY_WIDTH = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md) / 2;

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

      <FlatList
        data={[{ type: 'recent' }, { type: 'trending' }, ...categories.map(c => ({ type: 'category', name: c }))]}
        keyExtractor={(item, i) => i.toString()}
        contentContainerStyle={styles.browseContent}
        renderItem={({ item }: any) => {
          if (item.type === 'recent') {
            return (
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
            );
          }
          if (item.type === 'trending') {
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Browse Categories</Text>
              </View>
            );
          }
          return null;
        }}
        ListFooterComponent={
          <View style={styles.categoryGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.categoryCard}
                onPress={() => {
                  navigation.navigate('Search', { category: cat });
                  setQuery(cat.toLowerCase());
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: categoryThumbnails[cat] || 'https://via.placeholder.com/300x170' }}
                  style={styles.categoryImage}
                  contentFit="cover"
                />
                <View style={styles.categoryOverlay} />
                <Text style={styles.categoryName}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
      />
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.screen,
    gap: Spacing.md,
  },
  categoryCard: {
    width: CATEGORY_WIDTH,
    height: 100,
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
  categoryName: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    padding: Spacing.md,
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
});
