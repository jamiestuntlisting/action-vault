import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { videos, categories, categoryThumbnails, skillTags } from '../../data';
import { Video } from '../../types';
import { VideoCard } from '../../components/VideoCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CATEGORY_WIDTH = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md) / 2;

export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [recentSearches] = useState(['high falls', 'John Wick', 'fire burns', 'car stunts']);

  const results = useMemo(() => {
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

  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const items: { type: string; text: string; id?: string }[] = [];

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
  }, [query]);

  function navigateToVideo(video: Video) {
    navigation.navigate('VideoDetail', { videoId: video.id });
  }

  if (query.trim()) {
    return (
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos, skills, coordinators..."
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

        {suggestions.length > 0 && results.length === 0 && (
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
          data={results}
          numColumns={2}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultGrid}
          columnWrapperStyle={styles.resultRow}
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              onPress={() => navigateToVideo(item)}
              width={(SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md) / 2}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyResults}>
              <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
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
          placeholder="Search videos, skills, coordinators..."
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
  resultRow: {
    gap: Spacing.md,
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
