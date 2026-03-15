import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput,
  Switch, Alert, FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../theme';
import { useAppState, AdminCategory, AdminVideoOverride } from '../../services/AppState';
import { videos as allVideos } from '../../data';
import { skillTags } from '../../data/skillTags';
import { Video } from '../../types';

const MAX_WIDTH = 960;

type AdminTab = 'videos' | 'categories' | 'tags' | 'bytag' | 'lists';

// Autocomplete tag input component
function TagInput({
  currentTags,
  allSuggestions,
  onAddTag,
  onRemoveTag,
  placeholder = 'Type to add tag...',
  tagColor = Colors.primary,
}: {
  currentTags: string[];
  allSuggestions: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
  tagColor?: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) return [];
    const q = inputValue.toLowerCase();
    return allSuggestions
      .filter(s => s.toLowerCase().includes(q) && !currentTags.includes(s))
      .slice(0, 8);
  }, [inputValue, allSuggestions, currentTags]);

  const handleSubmit = useCallback(() => {
    const value = inputValue.trim();
    if (value && !currentTags.includes(value)) {
      onAddTag(value);
      setInputValue('');
      setShowSuggestions(false);
    }
  }, [inputValue, currentTags, onAddTag]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    onAddTag(suggestion);
    setInputValue('');
    setShowSuggestions(false);
  }, [onAddTag]);

  return (
    <View>
      {/* Current tags as removable chips */}
      {currentTags.length > 0 && (
        <View style={tagInputStyles.tagRow}>
          {currentTags.map(tag => (
            <View key={tag} style={[tagInputStyles.tagChip, { borderColor: tagColor + '88' }]}>
              <Text style={[tagInputStyles.tagText, { color: tagColor }]}>{tag}</Text>
              <TouchableOpacity onPress={() => onRemoveTag(tag)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={14} color={tagColor} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {/* Input with autocomplete */}
      <View style={tagInputStyles.inputRow}>
        <TextInput
          style={tagInputStyles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={inputValue}
          onChangeText={(text) => { setInputValue(text); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
        {inputValue.trim() && (
          <TouchableOpacity onPress={handleSubmit} style={tagInputStyles.addBtn}>
            <Ionicons name="add-circle" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={tagInputStyles.suggestions}>
          {filteredSuggestions.map(s => (
            <TouchableOpacity key={s} style={tagInputStyles.suggestionItem} onPress={() => handleSelectSuggestion(s)}>
              <Text style={tagInputStyles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const tagInputStyles = StyleSheet.create({
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.round, borderWidth: 1,
    backgroundColor: 'transparent',
  },
  tagText: { fontSize: FontSize.xs },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.sm,
    paddingHorizontal: 10, paddingVertical: 6, color: Colors.textPrimary, fontSize: FontSize.sm,
  },
  addBtn: { padding: 2 },
  suggestions: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border, marginTop: 2, maxHeight: 200,
  },
  suggestionItem: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestionText: { color: Colors.textPrimary, fontSize: FontSize.sm },
});

export function AdminScreen({ navigation }: any) {
  const { state, dispatch } = useAppState();
  const [activeTab, setActiveTab] = useState<AdminTab>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatFilter, setNewCatFilter] = useState('');
  const [newCatType, setNewCatType] = useState<'tag' | 'title' | 'location' | 'custom'>('title');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<string>('featured');

  const overrides = state.settings.adminVideoOverrides || [];
  const categories = state.settings.adminCategories || [];

  // Build autocomplete lists from existing data
  const allSkillTagNames = useMemo(() => skillTags.map(t => t.displayName), []);
  const allLocationNames = ['Atlanta', 'New York', 'Chicago', 'Los Angeles', 'London', 'Vancouver', 'Prague'];
  const allMovieNames = useMemo(() => {
    const names = new Set<string>();
    allVideos.forEach(v => v.productions.forEach(p => names.add(p.title)));
    overrides.forEach(o => o.movieTags?.forEach(m => names.add(m)));
    return Array.from(names).sort();
  }, [overrides]);
  const allPerformerNames = useMemo(() => {
    const names = new Set<string>();
    allVideos.forEach(v => {
      v.performers.forEach(p => names.add(p.name));
      v.coordinators.forEach(c => names.add(c.name));
    });
    // Also include any custom names from overrides
    overrides.forEach(o => {
      o.tagOverrides?.forEach(t => names.add(t));
    });
    return Array.from(names).sort();
  }, [overrides]);

  const getOverride = (videoId: string) => overrides.find(o => o.videoId === videoId);

  const filteredVideos = useMemo(() => {
    if (!searchQuery) return allVideos;
    const q = searchQuery.toLowerCase();
    return allVideos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.skillTags.some(t => t.displayName.toLowerCase().includes(q)) ||
      v.performers.some(p => p.name.toLowerCase().includes(q)) ||
      v.coordinators.some(c => c.name.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  function toggleHideVideo(videoId: string) {
    const existing = getOverride(videoId);
    const updated = existing
      ? overrides.map(o => o.videoId === videoId ? { ...o, hidden: !o.hidden } : o)
      : [...overrides, { videoId, hidden: true }];
    dispatch({ type: 'UPDATE_SETTINGS', payload: { adminVideoOverrides: updated } });
  }

  function updateVideoTags(videoId: string, tagIds: string[]) {
    const existing = getOverride(videoId);
    const updated = existing
      ? overrides.map(o => o.videoId === videoId ? { ...o, tagOverrides: tagIds } : o)
      : [...overrides, { videoId, hidden: false, tagOverrides: tagIds }];
    dispatch({ type: 'UPDATE_SETTINGS', payload: { adminVideoOverrides: updated } });
  }

  function updateVideoPeople(videoId: string, people: string[]) {
    const existing = getOverride(videoId);
    const updated = existing
      ? overrides.map(o => o.videoId === videoId ? { ...o, peopleOverrides: people } : o)
      : [...overrides, { videoId, hidden: false, peopleOverrides: people }];
    dispatch({ type: 'UPDATE_SETTINGS', payload: { adminVideoOverrides: updated } });
  }

  function updateVideoMovies(videoId: string, movies: string[]) {
    const existing = getOverride(videoId);
    const updated = existing
      ? overrides.map(o => o.videoId === videoId ? { ...o, movieTags: movies } : o)
      : [...overrides, { videoId, hidden: false, movieTags: movies }];
    dispatch({ type: 'UPDATE_SETTINGS', payload: { adminVideoOverrides: updated } });
  }

  function toggleVideoInList(videoId: string, listName: string) {
    const existing = getOverride(videoId);
    const currentLists = existing?.curatedLists || [];
    const isInList = currentLists.includes(listName);
    const newLists = isInList ? currentLists.filter(l => l !== listName) : [...currentLists, listName];
    const updated = existing
      ? overrides.map(o => o.videoId === videoId ? { ...o, curatedLists: newLists } : o)
      : [...overrides, { videoId, hidden: false, curatedLists: newLists }];
    dispatch({ type: 'UPDATE_SETTINGS', payload: { adminVideoOverrides: updated } });
  }

  function isVideoInList(videoId: string, listName: string): boolean {
    const override = getOverride(videoId);
    return override?.curatedLists?.includes(listName) || false;
  }

  function getVideosInList(listName: string) {
    const videoIds = overrides.filter(o => o.curatedLists?.includes(listName)).map(o => o.videoId);
    return allVideos.filter(v => videoIds.includes(v.id));
  }

  function getVideosByTag(tagName: string) {
    return allVideos.filter(v => v.skillTags.some(t => t.displayName === tagName));
  }

  function updateVideoLocation(videoId: string, locations: string[]) {
    const existing = getOverride(videoId);
    const updated = existing
      ? overrides.map(o => o.videoId === videoId ? { ...o, locationTags: locations } : o)
      : [...overrides, { videoId, hidden: false, locationTags: locations }];
    dispatch({ type: 'UPDATE_SETTINGS', payload: { adminVideoOverrides: updated } });
  }

  function addCategory() {
    if (!newCatTitle.trim()) return;
    const newCat: AdminCategory = {
      id: 'cat-' + Date.now(),
      title: newCatTitle.trim(),
      filterType: newCatType,
      filterValue: newCatFilter.trim(),
      sortOrder: categories.length,
      enabled: true,
    };
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { adminCategories: [...categories, newCat] },
    });
    setNewCatTitle('');
    setNewCatFilter('');
  }

  function toggleCategory(catId: string) {
    const updated = categories.map(c => c.id === catId ? { ...c, enabled: !c.enabled } : c);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { adminCategories: updated } });
  }

  function moveCategory(catId: string, direction: 'up' | 'down') {
    const idx = categories.findIndex(c => c.id === catId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === categories.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...categories];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    updated.forEach((c, i) => c.sortOrder = i);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { adminCategories: updated } });
  }

  function deleteCategory(catId: string) {
    const updated = categories.filter(c => c.id !== catId);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { adminCategories: updated } });
  }

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [catSearchQuery, setCatSearchQuery] = useState('');

  // Build a unified list of ALL categories shown on HomeScreen with their videos
  const allCategoryDefinitions = useMemo(() => {
    const visibleVideos = allVideos.filter(v => {
      const ov = overrides.find(o => o.videoId === v.id);
      return !ov?.hidden;
    });

    const defs: { id: string; title: string; type: 'builtin' | 'custom'; videos: Video[]; filterInfo: string }[] = [];

    // Trending Now
    const trending = [...visibleVideos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
    defs.push({ id: 'builtin-trending', title: 'Trending Now', type: 'builtin', videos: trending, filterInfo: 'Top 10 by view count' });

    // Top 10
    const top10 = [...visibleVideos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
    defs.push({ id: 'builtin-top10', title: 'Top 10 This Week', type: 'builtin', videos: top10, filterInfo: 'Top 10 by view count' });

    // New This Week
    const newThisWeek = [...visibleVideos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    defs.push({ id: 'builtin-new', title: 'New This Week', type: 'builtin', videos: newThisWeek, filterInfo: 'Most recently added' });

    // Fight Choreography
    const fight = visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Fight Choreography'));
    defs.push({ id: 'builtin-fight', title: 'Popular in Fight Choreography', type: 'builtin', videos: fight, filterInfo: 'Skill category: Fight Choreography' });

    // Car Work
    const car = visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Car Work'));
    defs.push({ id: 'builtin-car', title: 'Car Work & Driving', type: 'builtin', videos: car, filterInfo: 'Skill category: Car Work' });

    // Classic Stunts
    const classic = visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('buster keaton') || t.includes('1920s') || t.includes('ben-hur') ||
        t.includes('indiana jones') || t.includes('raiders') || t.includes('golden age') || t.includes('classic');
    });
    defs.push({ id: 'builtin-classic', title: 'Classic Stunts', type: 'builtin', videos: classic, filterInfo: 'Title keywords: classic, buster keaton, etc.' });

    // Action Actors
    const actors = visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('jackie chan') || t.includes('keanu') || t.includes('tom cruise') ||
        t.includes('tom holland') || t.includes('harrison ford') || t.includes('buster keaton') ||
        v.performers.some(p => p.role === 'action_star');
    });
    defs.push({ id: 'builtin-actors', title: 'Action Actors', type: 'builtin', videos: actors, filterInfo: 'Title keywords + action_star performers' });

    // Spy & Action Thrillers
    const spy = visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('bond') || t.includes('007') || t.includes('no time to die') ||
        t.includes('atomic blonde') || t.includes('mission: impossible') || t.includes('matrix');
    });
    defs.push({ id: 'builtin-spy', title: 'Spy & Action Thrillers', type: 'builtin', videos: spy, filterInfo: 'Title keywords: bond, matrix, etc.' });

    // Superhero Stunts
    const marvel = visibleVideos.filter(v =>
      v.title.toLowerCase().includes('marvel') || v.title.toLowerCase().includes('shang') ||
      v.title.toLowerCase().includes('spider') ||
      v.productions.some(p => p.studio.toLowerCase().includes('marvel') || p.studio.toLowerCase().includes('dc'))
    );
    defs.push({ id: 'builtin-superhero', title: 'Superhero Stunts', type: 'builtin', videos: marvel, filterInfo: 'Marvel/DC studios + title keywords' });

    // Wire & Rig Work
    const wire = visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Rigs' || t?.id === 'wire-work'));
    defs.push({ id: 'builtin-wire', title: 'Wire & Rig Work', type: 'builtin', videos: wire, filterInfo: 'Skill category: Rigs + wire-work' });

    // TV Show Stunts
    const tv = visibleVideos.filter(v => {
      const t = v.title.toLowerCase();
      return t.includes('game of thrones') || t.includes('stranger things') ||
        t.includes('daredevil') || t.includes('walking dead') || t.includes('breaking bad') ||
        (t.includes('season') && v.skillTags.some(s => s.id === 'bts-featurette'));
    });
    defs.push({ id: 'builtin-tv', title: 'TV Show Stunts', type: 'builtin', videos: tv, filterInfo: 'Title keywords: GoT, Daredevil, etc.' });

    // Stunt Documentaries
    const docs = visibleVideos.filter(v =>
      v.skillTags.some(s => s.id === 'interview') ||
      v.title.toLowerCase().includes('documentary') ||
      v.title.toLowerCase().includes('in praise of action') ||
      v.title.toLowerCase().includes('hal needham') ||
      v.title.toLowerCase().includes('fall guy')
    );
    defs.push({ id: 'builtin-docs', title: 'Stunt Documentaries & Interviews', type: 'builtin', videos: docs, filterInfo: 'interview tag + title keywords' });

    // Falls & High Work
    const falls = visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Falls'));
    defs.push({ id: 'builtin-falls', title: 'Falls & High Work', type: 'builtin', videos: falls, filterInfo: 'Skill category: Falls' });

    // Fire & Pyro
    const fire = visibleVideos.filter(v => v.skillTags.some(t => t?.category === 'Fire'));
    defs.push({ id: 'builtin-fire', title: 'Fire & Pyro', type: 'builtin', videos: fire, filterInfo: 'Skill category: Fire' });

    // Training & Safety
    const training = visibleVideos.filter(v => v.skillTags.some(t => t?.id === 'training' || t?.id === 'rig-breakdown' || t?.id === 'safety-walkthrough'));
    defs.push({ id: 'builtin-training', title: 'Training & Safety', type: 'builtin', videos: training, filterInfo: 'Tags: training, rig-breakdown, safety-walkthrough' });

    // Location-based
    const locationNames = ['Atlanta', 'New York', 'Chicago'];
    locationNames.forEach(loc => {
      const locVids = visibleVideos.filter(v => {
        const ov = overrides.find(o => o.videoId === v.id);
        return ov?.locationTags?.includes(loc);
      });
      if (locVids.length > 0) {
        defs.push({ id: `builtin-loc-${loc}`, title: `${loc} Stunts`, type: 'builtin', videos: locVids, filterInfo: `Location tag: ${loc}` });
      }
    });

    // Custom admin categories
    categories.forEach(cat => {
      let catVideos: Video[] = [];
      if (cat.filterType === 'tag') {
        catVideos = visibleVideos.filter(v => v.skillTags.some(t => t.id === cat.filterValue || t.displayName === cat.filterValue));
      } else if (cat.filterType === 'title') {
        const keywords = cat.filterValue.toLowerCase().split(',').map(k => k.trim());
        catVideos = visibleVideos.filter(v => keywords.some(k => v.title.toLowerCase().includes(k)));
      } else if (cat.filterType === 'location') {
        catVideos = visibleVideos.filter(v => {
          const ov = overrides.find(o => o.videoId === v.id);
          return ov?.locationTags?.includes(cat.filterValue);
        });
      } else if (cat.filterType === 'custom') {
        const ids = cat.filterValue.split(',').map(id => id.trim());
        catVideos = visibleVideos.filter(v => ids.includes(v.id));
      }
      defs.push({
        id: cat.id,
        title: cat.title,
        type: 'custom',
        videos: catVideos,
        filterInfo: `${cat.filterType}: ${cat.filterValue}`,
      });
    });

    return defs;
  }, [overrides, categories]);

  function renderVideoItem(video: typeof allVideos[0]) {
    const override = getOverride(video.id);
    const isHidden = override?.hidden || false;
    const currentSkillTags = override?.tagOverrides || video.skillTags.map(t => t.displayName);
    const currentLocations = override?.locationTags || [];
    const currentMovies = override?.movieTags || video.productions.map(p => p.title);
    const addedMovies = override?.movieTags || [];
    const builtInPeople = [
      ...video.performers.map(p => p.name),
      ...video.coordinators.map(c => c.name),
    ];
    const addedPeople = override?.peopleOverrides || [];
    const allPeople = [...builtInPeople, ...addedPeople];

    return (
      <View key={video.id} style={[styles.videoItem, isHidden && styles.videoItemHidden]}>
        {/* Video title row with hide button */}
        <View style={styles.videoHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.videoTitle, isHidden && styles.textHidden]} numberOfLines={1}>
              {video.title}
            </Text>
          </View>
          <TouchableOpacity onPress={() => toggleHideVideo(video.id)} style={styles.iconBtn}>
            <Ionicons name={isHidden ? 'eye-off' : 'eye'} size={20} color={isHidden ? '#f44' : Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Three-column tag layout: Skill Tags | People | Locations */}
        <View style={styles.tagColumns}>
          {/* Skill Tags Column */}
          <View style={styles.tagColumn}>
            <Text style={styles.columnLabel}>Skills</Text>
            <TagInput
              currentTags={currentSkillTags}
              allSuggestions={allSkillTagNames}
              onAddTag={(tag) => updateVideoTags(video.id, [...currentSkillTags, tag])}
              onRemoveTag={(tag) => updateVideoTags(video.id, currentSkillTags.filter(t => t !== tag))}
              placeholder="Add skill..."
              tagColor={Colors.primary}
            />
          </View>

          {/* People Column */}
          <View style={styles.tagColumn}>
            <Text style={styles.columnLabel}>People</Text>
            <TagInput
              currentTags={allPeople}
              allSuggestions={allPerformerNames}
              onAddTag={(name) => updateVideoPeople(video.id, [...addedPeople, name])}
              onRemoveTag={(name) => {
                if (addedPeople.includes(name)) {
                  updateVideoPeople(video.id, addedPeople.filter(n => n !== name));
                }
              }}
              placeholder="Add person..."
              tagColor="#4fc3f7"
            />
          </View>

          {/* Location Column */}
          <View style={styles.tagColumn}>
            <Text style={styles.columnLabel}>Location</Text>
            <TagInput
              currentTags={currentLocations}
              allSuggestions={allLocationNames}
              onAddTag={(loc) => updateVideoLocation(video.id, [...currentLocations, loc])}
              onRemoveTag={(loc) => updateVideoLocation(video.id, currentLocations.filter(l => l !== loc))}
              placeholder="Add location..."
              tagColor="#4fc3f7"
            />
          </View>
        </View>

        {/* Movies row */}
        <View style={{ marginTop: Spacing.sm }}>
          <Text style={styles.columnLabel}>Movies / Productions</Text>
          <TagInput
            currentTags={currentMovies}
            allSuggestions={allMovieNames}
            onAddTag={(movie) => updateVideoMovies(video.id, [...currentMovies, movie])}
            onRemoveTag={(movie) => updateVideoMovies(video.id, currentMovies.filter(m => m !== movie))}
            placeholder="Add movie..."
            tagColor="#ab47bc"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.maxWidth}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
          {(['videos', 'bytag', 'lists', 'categories', 'tags'] as AdminTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'videos' ? 'Videos' : tab === 'bytag' ? 'By Tag' : tab === 'lists' ? 'Lists' : tab === 'categories' ? 'Categories' : 'Quick Tags'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'videos' && (
            <View>
              {/* Removal Requests */}
              {(state.settings.removalRequests || []).length > 0 && (
                <View style={styles.removalSection}>
                  <Text style={styles.sectionTitle}>Removal Requests</Text>
                  {(state.settings.removalRequests || []).map((req, i) => {
                    const vid = allVideos.find(v => v.id === req.videoId);
                    return (
                      <View key={i} style={styles.removalItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.videoTitle}>{vid?.title || req.videoId}</Text>
                          <Text style={styles.videoMeta}>
                            {req.reason === 'owner_request' ? '🔑 Owner request' : req.reason === 'doesnt_belong' ? '🚫 Doesn\'t belong' : req.reason === 'other' ? '📝 Other reason' : req.claimsOwnership ? '🔑 Claims ownership' : '📝 General request'} — {new Date(req.requestedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            toggleHideVideo(req.videoId);
                            const updated = (state.settings.removalRequests || []).filter((_, idx) => idx !== i);
                            dispatch({ type: 'UPDATE_SETTINGS', payload: { removalRequests: updated } });
                          }}
                          style={[styles.iconBtn, { backgroundColor: '#f4433633', borderRadius: 8 }]}
                        >
                          <Ionicons name="eye-off" size={18} color="#f44" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            const updated = (state.settings.removalRequests || []).filter((_, idx) => idx !== i);
                            dispatch({ type: 'UPDATE_SETTINGS', payload: { removalRequests: updated } });
                          }}
                          style={[styles.iconBtn, { backgroundColor: Colors.surface, borderRadius: 8 }]}
                        >
                          <Ionicons name="close" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              <TextInput
                style={styles.searchInput}
                placeholder="Search videos..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Text style={styles.countText}>
                {filteredVideos.length} videos ({overrides.filter(o => o.hidden).length} hidden)
              </Text>
              {filteredVideos.map(renderVideoItem)}
            </View>
          )}

          {activeTab === 'categories' && (
            <View>
              <Text style={styles.sectionTitle}>All Categories</Text>
              <Text style={styles.hint}>
                {allCategoryDefinitions.length} categories on the home screen. Tap to expand and see videos.
              </Text>

              {allCategoryDefinitions.map((catDef) => {
                const isExpanded = expandedCategory === catDef.id;
                const isCustom = catDef.type === 'custom';
                const adminCat = isCustom ? categories.find(c => c.id === catDef.id) : null;

                return (
                  <View key={catDef.id} style={styles.catCard}>
                    {/* Category header — tap to expand */}
                    <TouchableOpacity
                      style={styles.catCardHeader}
                      onPress={() => setExpandedCategory(isExpanded ? null : catDef.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.catTitle}>{catDef.title}</Text>
                          {isCustom && (
                            <View style={styles.customBadge}>
                              <Text style={styles.customBadgeText}>Custom</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.catFilter}>
                          {catDef.videos.length} videos • {catDef.filterInfo}
                        </Text>
                      </View>
                      {isCustom && adminCat && (
                        <Switch
                          value={adminCat.enabled}
                          onValueChange={() => toggleCategory(adminCat.id)}
                          trackColor={{ false: Colors.border, true: Colors.primary }}
                          style={{ marginRight: Spacing.sm }}
                        />
                      )}
                      {isCustom && (
                        <TouchableOpacity
                          onPress={() => deleteCategory(catDef.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ marginRight: Spacing.sm }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#f44" />
                        </TouchableOpacity>
                      )}
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>

                    {/* Expanded: show videos */}
                    {isExpanded && (
                      <View style={styles.catCardBody}>
                        {catDef.videos.length === 0 ? (
                          <Text style={styles.hint}>No videos in this category.</Text>
                        ) : (
                          catDef.videos.map((video, idx) => (
                            <View key={video.id} style={styles.catVideoRow}>
                              <Text style={styles.catVideoIndex}>{idx + 1}</Text>
                              <Text style={styles.catVideoTitle} numberOfLines={1}>{video.title}</Text>
                              <TouchableOpacity
                                onPress={() => toggleHideVideo(video.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons
                                  name={overrides.find(o => o.videoId === video.id)?.hidden ? 'eye-off' : 'eye'}
                                  size={16}
                                  color={overrides.find(o => o.videoId === video.id)?.hidden ? '#f44' : Colors.textMuted}
                                />
                              </TouchableOpacity>
                            </View>
                          ))
                        )}

                        {/* Search to add for custom categories */}
                        {isCustom && adminCat?.filterType === 'custom' && (
                          <View style={{ marginTop: Spacing.md }}>
                            <TextInput
                              style={styles.searchInput}
                              placeholder="Search videos to add..."
                              placeholderTextColor={Colors.textMuted}
                              value={catSearchQuery}
                              onChangeText={setCatSearchQuery}
                            />
                            {catSearchQuery.trim().length > 1 && (
                              <View>
                                {allVideos
                                  .filter(v => v.title.toLowerCase().includes(catSearchQuery.toLowerCase()))
                                  .filter(v => !catDef.videos.some(cv => cv.id === v.id))
                                  .slice(0, 8)
                                  .map(video => (
                                    <TouchableOpacity
                                      key={video.id}
                                      style={styles.byTagAddRow}
                                      onPress={() => {
                                        const currentIds = adminCat!.filterValue ? adminCat!.filterValue.split(',').map(s => s.trim()) : [];
                                        const newVal = [...currentIds, video.id].join(',');
                                        const updated = categories.map(c => c.id === adminCat!.id ? { ...c, filterValue: newVal } : c);
                                        dispatch({ type: 'UPDATE_SETTINGS', payload: { adminCategories: updated } });
                                        setCatSearchQuery('');
                                      }}
                                    >
                                      <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                                      <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
                                    </TouchableOpacity>
                                  ))
                                }
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Add new custom category */}
              <View style={styles.addCatSection}>
                <Text style={styles.sectionTitle}>Add Custom Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Category title (e.g. Atlanta Stunts)"
                  placeholderTextColor={Colors.textMuted}
                  value={newCatTitle}
                  onChangeText={setNewCatTitle}
                />
                <View style={styles.filterTypeRow}>
                  {(['title', 'tag', 'location', 'custom'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.filterTypeBtn, newCatType === type && styles.filterTypeBtnActive]}
                      onPress={() => setNewCatType(type)}
                    >
                      <Text style={[styles.filterTypeText, newCatType === type && styles.filterTypeTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={
                    newCatType === 'title' ? 'Keywords to match in title (e.g. atlanta, georgia)'
                      : newCatType === 'tag' ? 'Skill tag ID (e.g. fight-h2h)'
                      : newCatType === 'location' ? 'Location name (e.g. Atlanta)'
                      : 'Comma-separated video IDs (e.g. v1,v5,v12)'
                  }
                  placeholderTextColor={Colors.textMuted}
                  value={newCatFilter}
                  onChangeText={setNewCatFilter}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addCategory}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Add Category</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'tags' && (
            <View>
              <Text style={styles.sectionTitle}>Bulk Location Tagging</Text>
              <Text style={styles.hint}>Quickly tag multiple videos with a location.</Text>
              {allLocationNames.map(loc => {
                const taggedCount = overrides.filter(o => o.locationTags?.includes(loc)).length;
                return (
                  <View key={loc} style={styles.bulkTagRow}>
                    <Text style={styles.bulkTagName}>📍 {loc}</Text>
                    <Text style={styles.bulkTagCount}>{taggedCount} videos</Text>
                  </View>
                );
              })}

              <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>All Skill Tags</Text>
              <View style={styles.tagGrid}>
                {skillTags.map(tag => (
                  <View key={tag.id} style={styles.readOnlyTag}>
                    <Text style={styles.readOnlyTagText}>{tag.displayName}</Text>
                    <Text style={styles.readOnlyTagCategory}>{tag.category}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'bytag' && (
            <View>
              <Text style={styles.sectionTitle}>Videos by Skill Tag</Text>
              <Text style={styles.hint}>Select a tag to see and manage which videos are assigned to it.</Text>

              {/* Tag selector */}
              <View style={styles.tagGrid}>
                {skillTags.map(tag => {
                  const count = getVideosByTag(tag.displayName).length;
                  const isSelected = selectedTag === tag.displayName;
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.readOnlyTag, isSelected && { backgroundColor: Colors.primary + '33', borderWidth: 1, borderColor: Colors.primary }]}
                      onPress={() => setSelectedTag(isSelected ? null : tag.displayName)}
                    >
                      <Text style={[styles.readOnlyTagText, isSelected && { color: Colors.primary }]}>{tag.displayName}</Text>
                      <Text style={styles.readOnlyTagCategory}>{count} videos</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Videos for selected tag */}
              {selectedTag && (
                <View style={{ marginTop: Spacing.xl }}>
                  <Text style={styles.sectionTitle}>{selectedTag}</Text>
                  <Text style={styles.hint}>{getVideosByTag(selectedTag).length} videos have this tag. Tap ✕ to remove the tag from a video.</Text>
                  {getVideosByTag(selectedTag).map(video => {
                    const override = getOverride(video.id);
                    const currentTags = override?.tagOverrides || video.skillTags.map(t => t.displayName);
                    return (
                      <View key={video.id} style={styles.byTagVideoRow}>
                        <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            const newTags = currentTags.filter(t => t !== selectedTag);
                            updateVideoTags(video.id, newTags);
                          }}
                        >
                          <Ionicons name="close-circle" size={20} color="#f44" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {/* Add video to this tag */}
                  <Text style={[styles.hint, { marginTop: Spacing.lg }]}>Add a video to "{selectedTag}":</Text>
                  <View>
                    {allVideos
                      .filter(v => !getVideosByTag(selectedTag!).some(vt => vt.id === v.id))
                      .filter(v => searchQuery ? v.title.toLowerCase().includes(searchQuery.toLowerCase()) : false)
                      .slice(0, 10)
                      .map(video => (
                        <TouchableOpacity
                          key={video.id}
                          style={styles.byTagAddRow}
                          onPress={() => {
                            const override = getOverride(video.id);
                            const currentTags = override?.tagOverrides || video.skillTags.map(t => t.displayName);
                            if (!currentTags.includes(selectedTag!)) {
                              updateVideoTags(video.id, [...currentTags, selectedTag!]);
                            }
                          }}
                        >
                          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                          <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
                        </TouchableOpacity>
                      ))
                    }
                  </View>
                  <TextInput
                    style={[styles.searchInput, { marginTop: Spacing.sm }]}
                    placeholder="Search videos to add..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              )}
            </View>
          )}

          {activeTab === 'lists' && (
            <View>
              <Text style={styles.sectionTitle}>Curated Lists</Text>
              <Text style={styles.hint}>Manage which videos appear in Featured, Top 10, Editor's Picks, and other curated sections.</Text>

              {/* List selector */}
              <View style={styles.filterTypeRow}>
                {[
                  { key: 'featured', label: 'Featured' },
                  { key: 'top10', label: 'Top 10' },
                  { key: 'editors_pick', label: "Editor's Pick" },
                  { key: 'new_this_week', label: 'New This Week' },
                ].map(list => (
                  <TouchableOpacity
                    key={list.key}
                    style={[styles.filterTypeBtn, selectedList === list.key && styles.filterTypeBtnActive]}
                    onPress={() => setSelectedList(list.key)}
                  >
                    <Text style={[styles.filterTypeText, selectedList === list.key && styles.filterTypeTextActive]}>
                      {list.label} ({getVideosInList(list.key).length})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Videos in selected list */}
              <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
                {selectedList === 'featured' ? 'Featured' : selectedList === 'top10' ? 'Top 10' : selectedList === 'editors_pick' ? "Editor's Picks" : 'New This Week'}
              </Text>

              {getVideosInList(selectedList).length === 0 ? (
                <Text style={styles.hint}>No videos in this list yet. Search below to add videos.</Text>
              ) : (
                getVideosInList(selectedList).map(video => (
                  <View key={video.id} style={styles.byTagVideoRow}>
                    <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
                    <TouchableOpacity onPress={() => toggleVideoInList(video.id, selectedList)}>
                      <Ionicons name="close-circle" size={20} color="#f44" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Add video to list */}
              <TextInput
                style={[styles.searchInput, { marginTop: Spacing.lg }]}
                placeholder="Search videos to add to this list..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.trim().length > 1 && (
                <View>
                  {allVideos
                    .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter(v => !isVideoInList(v.id, selectedList))
                    .slice(0, 10)
                    .map(video => (
                      <TouchableOpacity
                        key={video.id}
                        style={styles.byTagAddRow}
                        onPress={() => toggleVideoInList(video.id, selectedList)}
                      >
                        <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                        <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
                      </TouchableOpacity>
                    ))
                  }
                </View>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  maxWidth: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, paddingTop: 60 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  tabs: { marginBottom: Spacing.md, maxHeight: 44 },
  tabsContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  tab: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.round, backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  searchInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, marginBottom: Spacing.md },
  countText: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.md },
  videoItem: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  videoItemHidden: { opacity: 0.5, borderLeftWidth: 3, borderLeftColor: '#f44' },
  videoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  videoTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  textHidden: { textDecorationLine: 'line-through' },
  videoMeta: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  videoActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  // Three-column tag layout
  tagColumns: { flexDirection: 'row', gap: Spacing.sm },
  tagColumn: { flex: 1 },
  columnLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  hint: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.lg },
  catItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  catReorder: { gap: 2 },
  catTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  catFilter: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  // Category cards
  catCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm, overflow: 'hidden',
  },
  catCardHeader: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm,
  },
  catCardBody: {
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  catVideoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border + '44',
  },
  catVideoIndex: { color: Colors.textMuted, fontSize: FontSize.xs, width: 24, textAlign: 'center' },
  catVideoTitle: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm },
  customBadge: {
    backgroundColor: Colors.primary + '33', paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: BorderRadius.round,
  },
  customBadgeText: { color: Colors.primary, fontSize: 9, fontWeight: FontWeight.semibold },
  addCatSection: { marginTop: Spacing.xxl },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, marginBottom: Spacing.md },
  filterTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  filterTypeBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.round, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterTypeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '33' },
  filterTypeText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  filterTypeTextActive: { color: Colors.primary },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm },
  addBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  bulkTagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  bulkTagName: { color: Colors.textPrimary, fontSize: FontSize.md },
  bulkTagCount: { color: Colors.textMuted, fontSize: FontSize.sm },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  readOnlyTag: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md, backgroundColor: Colors.surface },
  readOnlyTagText: { color: Colors.textPrimary, fontSize: FontSize.xs },
  readOnlyTagCategory: { color: Colors.textMuted, fontSize: 9 },
  removalSection: { marginBottom: Spacing.xl, padding: Spacing.md, backgroundColor: '#f4433611', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#f4433644' },
  removalItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },

  // By Tag & Lists views
  byTagVideoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    padding: Spacing.md, marginBottom: Spacing.xs, gap: Spacing.sm,
  },
  byTagAddRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
});
