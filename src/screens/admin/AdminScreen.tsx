import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput,
  Switch, Alert, FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../theme';
import { useAppState, AdminCategory, AdminVideoOverride, AtlasActionVideo, AtlasActionCourse } from '../../services/AppState';
import { videos as allVideos, videoMap } from '../../data';
import { skillTags } from '../../data/skillTags';
import { Video } from '../../types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { books as allBooks, bookCategoryLabels } from '../../data/books';
import { podcasts as allPodcasts } from '../../data/podcasts';

const MAX_WIDTH = 960;

type AdminTab = 'videos' | 'categories' | 'bytag' | 'byproduction' | 'lists' | 'atlas' | 'books' | 'podcasts' | 'submissions' | 'reviews' | 'stats' | 'flags';

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

const ADMIN_EMAILS = [
  'james.northrup@gmail.com',
  'warrenhullstunts@gmail.com',
  'greg@stuntlisting.com',
  'info@stuntlisting.com',
  'jamie@stuntlisting.com',
  'warren@stuntlisting.com',
];

export function AdminScreen({ navigation }: any) {
  usePageTitle('Admin Panel');
  const { state, dispatch } = useAppState();

  // Admin email check
  const currentUserEmail = state.currentUser?.email;
  if (!currentUserEmail || !ADMIN_EMAILS.includes(currentUserEmail)) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
        <Ionicons name="lock-closed" size={64} color={Colors.textMuted} />
        <Text style={{ color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.lg, textAlign: 'center' }}>
          Access Denied
        </Text>
        <Text style={{ color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.md, textAlign: 'center' }}>
          You do not have permission to access the admin panel.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: Spacing.xl, backgroundColor: Colors.primary, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.md }}
        >
          <Text style={{ color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [activeTab, setActiveTab] = useState<AdminTab>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatFilter, setNewCatFilter] = useState('');
  const [newCatType, setNewCatType] = useState<'tag' | 'title' | 'location' | 'custom'>('title');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<string>('featured');
  const [selectedProduction, setSelectedProduction] = useState<string | null>(null);

  // Reviews tab state
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewSort, setReviewSort] = useState<'newest' | 'oldest'>('newest');

  // Flags tab state
  const [flagSearch, setFlagSearch] = useState('');

  // TMDB state
  const [tmdbKey, setTmdbKey] = useState('');
  const [tmdbStatus, setTmdbStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');

  // Atlas Action state
  const [atlasMode, setAtlasMode] = useState<'videos' | 'courses'>('videos');
  const [atlasVideoTitle, setAtlasVideoTitle] = useState('');
  const [atlasVideoDesc, setAtlasVideoDesc] = useState('');
  const [atlasVideoInstructor, setAtlasVideoInstructor] = useState('Brad Martin');
  const [atlasVideoYoutube, setAtlasVideoYoutube] = useState('');
  const [atlasVideoThumb, setAtlasVideoThumb] = useState('');
  const [atlasVideoDuration, setAtlasVideoDuration] = useState('');
  const [atlasVideoPrice, setAtlasVideoPrice] = useState('1.99');
  const [atlasVideoIsFree, setAtlasVideoIsFree] = useState(false);
  const [atlasVideoCourseId, setAtlasVideoCourseId] = useState('');
  const [atlasCourseTitle, setAtlasCourseTitle] = useState('');
  const [atlasCourseDesc, setAtlasCourseDesc] = useState('');
  const [atlasCourseInstructor, setAtlasCourseInstructor] = useState('Brad Martin');
  const [atlasCourseThumb, setAtlasCourseThumb] = useState('');
  const [atlasCoursePrice, setAtlasCoursePrice] = useState('');
  const [editingAtlasVideoId, setEditingAtlasVideoId] = useState<string | null>(null);
  const [editingAtlasCourseId, setEditingAtlasCourseId] = useState<string | null>(null);

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
      o.peopleOverrides?.forEach(n => names.add(n));
    });
    // Include book authors and podcast hosts
    allBooks.forEach(b => b.author.split(/,|&/).map(a => a.trim()).filter(Boolean).forEach(a => names.add(a)));
    allPodcasts.forEach(p => p.hosts.split(/,|&/).map(h => h.trim()).filter(Boolean).forEach(h => names.add(h)));
    // Include overridden authors/hosts
    const bookOvr = state.settings.adminBookOverrides || [];
    bookOvr.forEach(o => o.authors?.forEach(a => names.add(a)));
    const podOvr = state.settings.adminPodcastOverrides || [];
    podOvr.forEach(o => o.hosts?.forEach(h => names.add(h)));
    return Array.from(names).sort();
  }, [overrides, state.settings.adminBookOverrides, state.settings.adminPodcastOverrides]);

  // Group videos by production/movie
  const productionGroups = useMemo(() => {
    const groups: Record<string, { production: string; videos: typeof allVideos }> = {};
    const noProduction: typeof allVideos = [];
    allVideos.forEach(v => {
      const override = overrides.find(o => o.videoId === v.id);
      const movieNames = override?.movieTags || v.productions.map(p => p.title);
      if (movieNames.length === 0) {
        noProduction.push(v);
      } else {
        movieNames.forEach(name => {
          if (!groups[name]) groups[name] = { production: name, videos: [] };
          groups[name].videos.push(v);
        });
      }
    });
    const sorted = Object.values(groups).sort((a, b) => b.videos.length - a.videos.length);
    if (noProduction.length > 0) {
      sorted.push({ production: 'Uncategorized', videos: noProduction });
    }
    return sorted;
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
          {(() => {
            const pendingCount = (state.settings.vaultSubmissions || []).filter(s => !s.status || s.status === 'pending').length;
            return ([
              { key: 'videos' as AdminTab, label: 'Videos', icon: 'videocam-outline' as const },
              { key: 'submissions' as AdminTab, label: `Submissions${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: 'cloud-upload-outline' as const },
              { key: 'byproduction' as AdminTab, label: 'By Production', icon: 'film-outline' as const },
              { key: 'bytag' as AdminTab, label: 'By Tag', icon: 'pricetag-outline' as const },
              { key: 'lists' as AdminTab, label: 'Lists', icon: 'list-outline' as const },
              { key: 'categories' as AdminTab, label: 'Categories', icon: 'grid-outline' as const },
              { key: 'atlas' as AdminTab, label: 'Atlas Action', icon: 'globe-outline' as const },
              { key: 'books' as AdminTab, label: 'Books', icon: 'book-outline' as const },
              { key: 'podcasts' as AdminTab, label: 'Podcasts', icon: 'mic-outline' as const },
              { key: 'reviews' as AdminTab, label: 'Reviews', icon: 'chatbubbles-outline' as const },
              { key: 'stats' as AdminTab, label: 'Stats', icon: 'stats-chart-outline' as const },
              { key: 'flags' as AdminTab, label: 'Flags', icon: 'flag-outline' as const },
            ]).map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive,
                  tab.key === 'submissions' && pendingCount > 0 && activeTab !== tab.key && { borderColor: '#f59e0b', borderWidth: 1 }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? '#fff' : tab.key === 'submissions' && pendingCount > 0 ? '#f59e0b' : Colors.textSecondary} />
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive,
                    tab.key === 'submissions' && pendingCount > 0 && activeTab !== tab.key && { color: '#f59e0b' }]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ));
          })()}
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
                            {req.reason === 'broken_link' ? '🔗 Broken link' : req.reason === 'owner_request' ? '🔑 Owner request' : req.reason === 'doesnt_belong' ? '🚫 Doesn\'t belong' : req.reason === 'other' ? '📝 Other reason' : req.claimsOwnership ? '🔑 Claims ownership' : '📝 General request'} — {new Date(req.requestedAt).toLocaleDateString()}
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

          {activeTab === 'byproduction' && (
            <View>
              <Text style={styles.sectionTitle}>Videos by Movie / Production</Text>
              <Text style={styles.hint}>
                {productionGroups.length} productions. Tap a production to see its videos.
              </Text>

              {/* Production search */}
              <TextInput
                style={styles.searchInput}
                placeholder="Search productions..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {/* Production grid */}
              <View style={styles.tagGrid}>
                {productionGroups
                  .filter(g => !searchQuery || g.production.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(group => {
                    const isSelected = selectedProduction === group.production;
                    return (
                      <TouchableOpacity
                        key={group.production}
                        style={[
                          styles.readOnlyTag,
                          isSelected && { backgroundColor: '#ab47bc33', borderWidth: 1, borderColor: '#ab47bc' },
                        ]}
                        onPress={() => setSelectedProduction(isSelected ? null : group.production)}
                      >
                        <Text style={[styles.readOnlyTagText, isSelected && { color: '#ab47bc' }]} numberOfLines={1}>
                          {group.production}
                        </Text>
                        <Text style={styles.readOnlyTagCategory}>{group.videos.length} videos</Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>

              {/* Videos for selected production */}
              {selectedProduction && (() => {
                const group = productionGroups.find(g => g.production === selectedProduction);
                if (!group) return null;
                return (
                  <View style={{ marginTop: Spacing.xl }}>
                    <Text style={styles.sectionTitle}>{selectedProduction}</Text>
                    <Text style={styles.hint}>{group.videos.length} videos in this production.</Text>
                    {group.videos.map(video => {
                      const override = getOverride(video.id);
                      const isHidden = override?.hidden;
                      return (
                        <View key={video.id} style={[styles.byTagVideoRow, isHidden && { opacity: 0.4 }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                            <Text style={styles.videoMeta}>
                              {video.skillTags.map(t => t.displayName).join(', ')}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => toggleHideVideo(video.id)} style={{ marginLeft: 8 }}>
                            <Ionicons name={isHidden ? 'eye-off' : 'eye'} size={20} color={isHidden ? '#f44' : Colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    {/* Add video to this production */}
                    <Text style={[styles.hint, { marginTop: Spacing.lg }]}>Add a video to "{selectedProduction}":</Text>
                    <TextInput
                      style={[styles.searchInput, { marginTop: Spacing.sm }]}
                      placeholder="Search videos to add..."
                      placeholderTextColor={Colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.trim().length > 1 && (
                      <View>
                        {allVideos
                          .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
                          .filter(v => !group.videos.some(gv => gv.id === v.id))
                          .slice(0, 10)
                          .map(video => (
                            <TouchableOpacity
                              key={video.id}
                              style={styles.byTagAddRow}
                              onPress={() => {
                                const override = getOverride(video.id);
                                const currentMovies = override?.movieTags || video.productions.map(p => p.title);
                                if (!currentMovies.includes(selectedProduction!)) {
                                  updateVideoMovies(video.id, [...currentMovies, selectedProduction!]);
                                }
                              }}
                            >
                              <Ionicons name="add-circle-outline" size={18} color="#ab47bc" />
                              <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
                            </TouchableOpacity>
                          ))
                        }
                      </View>
                    )}
                  </View>
                );
              })()}
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

          {activeTab === 'lists' && (() => {
            const visibleVideos = allVideos.filter(v => {
              const ov = overrides.find(o => o.videoId === v.id);
              return !ov?.hidden;
            });

            const autoLists = [
              {
                key: 'trending',
                label: 'Trending Now',
                description: 'Auto-generated: Top 10 videos sorted by view count.',
                videos: [...visibleVideos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10),
              },
              {
                key: 'top10',
                label: 'Top 10 This Week',
                description: 'Auto-generated: Top 10 videos sorted by view count.',
                videos: [...visibleVideos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10),
              },
              {
                key: 'new_this_week',
                label: 'New This Week',
                description: 'Auto-generated: Most recently added videos.',
                videos: [...visibleVideos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
              },
              {
                key: 'most_discussed',
                label: 'Most Discussed',
                description: 'Auto-generated: Videos with the most reviews.',
                videos: (() => {
                  const reviewCounts: Record<string, number> = {};
                  state.ratings.filter(r => r.reviewText && r.reviewText.trim().length > 0)
                    .forEach(r => { reviewCounts[r.videoId] = (reviewCounts[r.videoId] || 0) + 1; });
                  return visibleVideos
                    .filter(v => reviewCounts[v.id])
                    .sort((a, b) => (reviewCounts[b.id] || 0) - (reviewCounts[a.id] || 0))
                    .slice(0, 10);
                })(),
              },
            ];

            return (
              <View>
                <Text style={styles.sectionTitle}>Auto-Generated Lists</Text>
                <Text style={styles.hint}>
                  These lists are automatically populated based on video view counts and engagement data. No manual curation needed.
                </Text>

                {/* List selector */}
                <View style={styles.filterTypeRow}>
                  {autoLists.map(list => (
                    <TouchableOpacity
                      key={list.key}
                      style={[styles.filterTypeBtn, selectedList === list.key && styles.filterTypeBtnActive]}
                      onPress={() => setSelectedList(list.key)}
                    >
                      <Text style={[styles.filterTypeText, selectedList === list.key && styles.filterTypeTextActive]}>
                        {list.label} ({list.videos.length})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Show selected list */}
                {(() => {
                  const currentList = autoLists.find(l => l.key === selectedList) || autoLists[0];
                  return (
                    <View>
                      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>{currentList.label}</Text>
                      <Text style={[styles.hint, { fontStyle: 'italic' }]}>{currentList.description}</Text>

                      {currentList.videos.length === 0 ? (
                        <Text style={styles.hint}>No videos match the criteria for this list.</Text>
                      ) : (
                        currentList.videos.map((video, idx) => (
                          <View key={video.id} style={styles.byTagVideoRow}>
                            <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, width: 28 }}>{idx + 1}.</Text>
                            <Text style={[styles.videoTitle, { flex: 1 }]} numberOfLines={1}>{video.title}</Text>
                            <Text style={styles.videoMeta}>{video.viewCount.toLocaleString()} views</Text>
                          </View>
                        ))
                      )}
                    </View>
                  );
                })()}
              </View>
            );
          })()}

          {activeTab === 'atlas' && (
            <View>
              {/* Mode toggle */}
              <View style={styles.filterTypeRow}>
                {[
                  { key: 'videos' as const, label: 'Videos' },
                  { key: 'courses' as const, label: 'Courses' },
                ].map(m => (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.filterTypeBtn, atlasMode === m.key && styles.filterTypeBtnActive]}
                    onPress={() => setAtlasMode(m.key)}
                  >
                    <Text style={[styles.filterTypeText, atlasMode === m.key && styles.filterTypeTextActive]}>
                      {m.label} ({m.key === 'videos' ? (state.settings.atlasActionVideos || []).length : (state.settings.atlasActionCourses || []).length})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {atlasMode === 'videos' && (
                <View>
                  <Text style={styles.sectionTitle}>{editingAtlasVideoId ? 'Edit Video' : 'Add Video'}</Text>
                  <TextInput style={styles.input} placeholder="Title" placeholderTextColor={Colors.textMuted} value={atlasVideoTitle} onChangeText={setAtlasVideoTitle} />
                  <TextInput style={styles.input} placeholder="Description" placeholderTextColor={Colors.textMuted} value={atlasVideoDesc} onChangeText={setAtlasVideoDesc} multiline />
                  <TextInput style={styles.input} placeholder="Instructor Name" placeholderTextColor={Colors.textMuted} value={atlasVideoInstructor} onChangeText={setAtlasVideoInstructor} />
                  <TextInput style={styles.input} placeholder="YouTube Embed URL" placeholderTextColor={Colors.textMuted} value={atlasVideoYoutube} onChangeText={setAtlasVideoYoutube} />
                  <TextInput style={styles.input} placeholder="Thumbnail URL" placeholderTextColor={Colors.textMuted} value={atlasVideoThumb} onChangeText={setAtlasVideoThumb} />
                  <TextInput style={styles.input} placeholder="Duration (seconds)" placeholderTextColor={Colors.textMuted} value={atlasVideoDuration} onChangeText={setAtlasVideoDuration} keyboardType="numeric" />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md }}>
                    <Text style={{ color: Colors.textPrimary }}>Free:</Text>
                    <Switch value={atlasVideoIsFree} onValueChange={setAtlasVideoIsFree} />
                    {!atlasVideoIsFree && (
                      <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Price" placeholderTextColor={Colors.textMuted} value={atlasVideoPrice} onChangeText={setAtlasVideoPrice} keyboardType="numeric" />
                    )}
                  </View>
                  {/* Course assignment */}
                  <View style={{ marginBottom: Spacing.md }}>
                    <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 4 }}>Assign to Course (optional):</Text>
                    <View style={styles.filterTypeRow}>
                      <TouchableOpacity
                        style={[styles.filterTypeBtn, !atlasVideoCourseId && styles.filterTypeBtnActive]}
                        onPress={() => setAtlasVideoCourseId('')}
                      >
                        <Text style={[styles.filterTypeText, !atlasVideoCourseId && styles.filterTypeTextActive]}>None</Text>
                      </TouchableOpacity>
                      {(state.settings.atlasActionCourses || []).map(c => (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.filterTypeBtn, atlasVideoCourseId === c.id && styles.filterTypeBtnActive]}
                          onPress={() => setAtlasVideoCourseId(c.id)}
                        >
                          <Text style={[styles.filterTypeText, atlasVideoCourseId === c.id && styles.filterTypeTextActive]}>{c.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                      if (!atlasVideoTitle.trim() || !atlasVideoYoutube.trim()) return;
                      const existing = state.settings.atlasActionVideos || [];
                      if (editingAtlasVideoId) {
                        // Update existing
                        const updated = existing.map(v => v.id === editingAtlasVideoId ? {
                          ...v,
                          title: atlasVideoTitle, description: atlasVideoDesc,
                          instructorName: atlasVideoInstructor, youtubeEmbedUrl: atlasVideoYoutube,
                          thumbnailUrl: atlasVideoThumb, durationSeconds: parseInt(atlasVideoDuration) || 0,
                          price: parseFloat(atlasVideoPrice) || 1.99, isFree: atlasVideoIsFree,
                          courseId: atlasVideoCourseId || null,
                        } : v);
                        // Update course videoIds
                        const courses = (state.settings.atlasActionCourses || []).map(c => {
                          const ids = c.videoIds.filter(id => id !== editingAtlasVideoId);
                          if (c.id === atlasVideoCourseId) ids.push(editingAtlasVideoId);
                          return { ...c, videoIds: ids };
                        });
                        dispatch({ type: 'UPDATE_SETTINGS', payload: { atlasActionVideos: updated, atlasActionCourses: courses } });
                        setEditingAtlasVideoId(null);
                      } else {
                        // Add new
                        const newVideo: AtlasActionVideo = {
                          id: `atlas_v_${Date.now()}`,
                          title: atlasVideoTitle, description: atlasVideoDesc,
                          instructorName: atlasVideoInstructor, youtubeEmbedUrl: atlasVideoYoutube,
                          thumbnailUrl: atlasVideoThumb, durationSeconds: parseInt(atlasVideoDuration) || 0,
                          courseId: atlasVideoCourseId || null,
                          price: parseFloat(atlasVideoPrice) || 1.99, isFree: atlasVideoIsFree,
                          sortOrder: existing.length, enabled: true, createdAt: new Date().toISOString(),
                        };
                        const updatedVideos = [...existing, newVideo];
                        // If course assigned, add to course videoIds
                        let courses = state.settings.atlasActionCourses || [];
                        if (atlasVideoCourseId) {
                          courses = courses.map(c => c.id === atlasVideoCourseId ? { ...c, videoIds: [...c.videoIds, newVideo.id] } : c);
                        }
                        dispatch({ type: 'UPDATE_SETTINGS', payload: { atlasActionVideos: updatedVideos, atlasActionCourses: courses } });
                      }
                      // Reset form
                      setAtlasVideoTitle(''); setAtlasVideoDesc(''); setAtlasVideoYoutube('');
                      setAtlasVideoThumb(''); setAtlasVideoDuration(''); setAtlasVideoPrice('0.99');
                      setAtlasVideoIsFree(false); setAtlasVideoCourseId('');
                    }}
                  >
                    <Text style={styles.addBtnText}>{editingAtlasVideoId ? 'Update Video' : 'Add Video'}</Text>
                  </TouchableOpacity>
                  {editingAtlasVideoId && (
                    <TouchableOpacity
                      style={[styles.addBtn, { backgroundColor: Colors.surface, marginTop: Spacing.sm }]}
                      onPress={() => {
                        setEditingAtlasVideoId(null);
                        setAtlasVideoTitle(''); setAtlasVideoDesc(''); setAtlasVideoYoutube('');
                        setAtlasVideoThumb(''); setAtlasVideoDuration(''); setAtlasVideoPrice('0.99');
                        setAtlasVideoIsFree(false); setAtlasVideoCourseId('');
                      }}
                    >
                      <Text style={[styles.addBtnText, { color: Colors.textPrimary }]}>Cancel Edit</Text>
                    </TouchableOpacity>
                  )}

                  {/* Existing videos */}
                  <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>
                    Videos ({(state.settings.atlasActionVideos || []).length})
                  </Text>
                  {(state.settings.atlasActionVideos || []).map(v => (
                    <View key={v.id} style={[styles.videoItem, !v.enabled && styles.videoItemHidden]}>
                      <View style={styles.videoHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.videoTitle}>{v.title}</Text>
                          <Text style={styles.videoMeta}>
                            {v.instructorName} · {v.isFree ? 'FREE' : `$${v.price.toFixed(2)}`} · {Math.floor(v.durationSeconds / 60)}m
                            {v.courseId && ` · Course: ${(state.settings.atlasActionCourses || []).find(c => c.id === v.courseId)?.title || 'Unknown'}`}
                          </Text>
                        </View>
                        <View style={styles.videoActions}>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => {
                            setEditingAtlasVideoId(v.id);
                            setAtlasVideoTitle(v.title); setAtlasVideoDesc(v.description);
                            setAtlasVideoInstructor(v.instructorName); setAtlasVideoYoutube(v.youtubeEmbedUrl);
                            setAtlasVideoThumb(v.thumbnailUrl); setAtlasVideoDuration(String(v.durationSeconds));
                            setAtlasVideoPrice(String(v.price)); setAtlasVideoIsFree(v.isFree);
                            setAtlasVideoCourseId(v.courseId || '');
                          }}>
                            <Ionicons name="pencil" size={18} color={Colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => {
                            const updated = (state.settings.atlasActionVideos || []).map(
                              vid => vid.id === v.id ? { ...vid, enabled: !vid.enabled } : vid
                            );
                            dispatch({ type: 'UPDATE_SETTINGS', payload: { atlasActionVideos: updated } });
                          }}>
                            <Ionicons name={v.enabled ? 'eye' : 'eye-off'} size={18} color={v.enabled ? Colors.primary : Colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => {
                            const updated = (state.settings.atlasActionVideos || []).filter(vid => vid.id !== v.id);
                            // Also remove from any courses
                            const courses = (state.settings.atlasActionCourses || []).map(c => ({
                              ...c, videoIds: c.videoIds.filter(id => id !== v.id),
                            }));
                            dispatch({ type: 'UPDATE_SETTINGS', payload: { atlasActionVideos: updated, atlasActionCourses: courses } });
                          }}>
                            <Ionicons name="trash" size={18} color="#f44" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {atlasMode === 'courses' && (
                <View>
                  <Text style={styles.sectionTitle}>{editingAtlasCourseId ? 'Edit Course' : 'Add Course'}</Text>
                  <TextInput style={styles.input} placeholder="Course Title" placeholderTextColor={Colors.textMuted} value={atlasCourseTitle} onChangeText={setAtlasCourseTitle} />
                  <TextInput style={styles.input} placeholder="Description" placeholderTextColor={Colors.textMuted} value={atlasCourseDesc} onChangeText={setAtlasCourseDesc} multiline />
                  <TextInput style={styles.input} placeholder="Instructor Name" placeholderTextColor={Colors.textMuted} value={atlasCourseInstructor} onChangeText={setAtlasCourseInstructor} />
                  <TextInput style={styles.input} placeholder="Thumbnail URL" placeholderTextColor={Colors.textMuted} value={atlasCourseThumb} onChangeText={setAtlasCourseThumb} />
                  <TextInput style={styles.input} placeholder="Bundle Price (e.g. 29.99)" placeholderTextColor={Colors.textMuted} value={atlasCoursePrice} onChangeText={setAtlasCoursePrice} keyboardType="numeric" />

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                      if (!atlasCourseTitle.trim() || !atlasCoursePrice.trim()) return;
                      const existing = state.settings.atlasActionCourses || [];
                      if (editingAtlasCourseId) {
                        const updated = existing.map(c => c.id === editingAtlasCourseId ? {
                          ...c,
                          title: atlasCourseTitle, description: atlasCourseDesc,
                          instructorName: atlasCourseInstructor, thumbnailUrl: atlasCourseThumb,
                          price: parseFloat(atlasCoursePrice) || 0,
                        } : c);
                        dispatch({ type: 'UPDATE_SETTINGS', payload: { atlasActionCourses: updated } });
                        setEditingAtlasCourseId(null);
                      } else {
                        const newCourse: AtlasActionCourse = {
                          id: `atlas_c_${Date.now()}`,
                          title: atlasCourseTitle, description: atlasCourseDesc,
                          instructorName: atlasCourseInstructor, thumbnailUrl: atlasCourseThumb,
                          price: parseFloat(atlasCoursePrice) || 0, videoIds: [],
                          enabled: true, createdAt: new Date().toISOString(),
                        };
                        dispatch({ type: 'UPDATE_SETTINGS', payload: { atlasActionCourses: [...existing, newCourse] } });
                      }
                      setAtlasCourseTitle(''); setAtlasCourseDesc('');
                      setAtlasCourseThumb(''); setAtlasCoursePrice('');
                    }}
                  >
                    <Text style={styles.addBtnText}>{editingAtlasCourseId ? 'Update Course' : 'Add Course'}</Text>
                  </TouchableOpacity>
                  {editingAtlasCourseId && (
                    <TouchableOpacity
                      style={[styles.addBtn, { backgroundColor: Colors.surface, marginTop: Spacing.sm }]}
                      onPress={() => {
                        setEditingAtlasCourseId(null);
                        setAtlasCourseTitle(''); setAtlasCourseDesc('');
                        setAtlasCourseThumb(''); setAtlasCoursePrice('');
                      }}
                    >
                      <Text style={[styles.addBtnText, { color: Colors.textPrimary }]}>Cancel Edit</Text>
                    </TouchableOpacity>
                  )}

                  {/* Existing courses */}
                  <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>
                    Courses ({(state.settings.atlasActionCourses || []).length})
                  </Text>
                  {(state.settings.atlasActionCourses || []).map(c => (
                    <View key={c.id} style={[styles.catCard, !c.enabled && { opacity: 0.5 }]}>
                      <View style={styles.catCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.catTitle}>{c.title}</Text>
                          <Text style={styles.catFilter}>
                            {c.instructorName} · ${c.price.toFixed(2)} · {c.videoIds.length} videos
                          </Text>
                        </View>
                        <View style={styles.videoActions}>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => {
                            setEditingAtlasCourseId(c.id);
                            setAtlasCourseTitle(c.title); setAtlasCourseDesc(c.description);
                            setAtlasCourseInstructor(c.instructorName); setAtlasCourseThumb(c.thumbnailUrl);
                            setAtlasCoursePrice(String(c.price));
                          }}>
                            <Ionicons name="pencil" size={18} color={Colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => {
                            const updated = (state.settings.atlasActionCourses || []).map(
                              cr => cr.id === c.id ? { ...cr, enabled: !cr.enabled } : cr
                            );
                            dispatch({ type: 'UPDATE_SETTINGS', payload: { atlasActionCourses: updated } });
                          }}>
                            <Ionicons name={c.enabled ? 'eye' : 'eye-off'} size={18} color={c.enabled ? Colors.primary : Colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => {
                            // Remove videos from course first, then delete
                            const updatedVideos = (state.settings.atlasActionVideos || []).map(
                              v => v.courseId === c.id ? { ...v, courseId: null } : v
                            );
                            const updated = (state.settings.atlasActionCourses || []).filter(cr => cr.id !== c.id);
                            dispatch({ type: 'UPDATE_SETTINGS', payload: { atlasActionCourses: updated, atlasActionVideos: updatedVideos } });
                          }}>
                            <Ionicons name="trash" size={18} color="#f44" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {c.videoIds.length > 0 && (
                        <View style={styles.catCardBody}>
                          {c.videoIds.map((vid, idx) => {
                            const video = (state.settings.atlasActionVideos || []).find(v => v.id === vid);
                            return (
                              <View key={vid} style={styles.catVideoRow}>
                                <Text style={styles.catVideoIndex}>{idx + 1}</Text>
                                <Text style={styles.catVideoTitle}>{video?.title || vid}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'reviews' && (() => {
            const allReviews = state.ratings.filter(r => r.reviewText && r.reviewText.trim().length > 0);
            const q = reviewSearch.toLowerCase();
            const filtered = q
              ? allReviews.filter(r => {
                  const vid = videoMap.get(r.videoId);
                  return r.reviewText.toLowerCase().includes(q) || (vid?.title || '').toLowerCase().includes(q);
                })
              : allReviews;
            const sorted = [...filtered].sort((a, b) =>
              reviewSort === 'newest'
                ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return (
              <View>
                <Text style={styles.sectionTitle}>Reviews ({allReviews.length})</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search reviews by text or video title..."
                  placeholderTextColor={Colors.textMuted}
                  value={reviewSearch}
                  onChangeText={setReviewSearch}
                />
                <View style={styles.filterTypeRow}>
                  {([{ key: 'newest' as const, label: 'Newest First' }, { key: 'oldest' as const, label: 'Oldest First' }]).map(s => (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.filterTypeBtn, reviewSort === s.key && styles.filterTypeBtnActive]}
                      onPress={() => setReviewSort(s.key)}
                    >
                      <Text style={[styles.filterTypeText, reviewSort === s.key && styles.filterTypeTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {reviewSearch.length > 0 && (
                  <Text style={styles.countText}>{sorted.length} result{sorted.length !== 1 ? 's' : ''} found</Text>
                )}
                {sorted.map((r, idx) => {
                  const vid = videoMap.get(r.videoId);
                  return (
                    <View key={`${r.videoId}-${r.profileId}-${idx}`} style={styles.reviewCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.videoTitle}>{vid?.title || r.videoId}</Text>
                        <Text style={styles.reviewText}>{r.reviewText}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs }}>
                          <Text style={{ fontSize: 16 }}>{r.thumbs === 'up' ? '\ud83d\udc4d' : '\ud83d\udc4e'}</Text>
                          {r.bestOfBest && (
                            <View style={styles.customBadge}>
                              <Text style={styles.customBadgeText}>Best of the Best</Text>
                            </View>
                          )}
                          <Text style={styles.videoMeta}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                        </View>
                      </View>
                      <View style={styles.videoActions}>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: '#f4433622', borderRadius: BorderRadius.sm }]}
                          onPress={() => Alert.alert('Delete Review', 'In production, this would remove the review from the database.')}
                        >
                          <Ionicons name="trash" size={18} color="#f44" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: '#e91e6322', borderRadius: BorderRadius.sm }]}
                          onPress={() => Alert.alert(
                            'Block User',
                            `Are you sure you want to block the user who posted this review? They will no longer be able to post reviews or interact with content.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Block User', style: 'destructive', onPress: () => Alert.alert('User Blocked', 'In production, this user would be blocked from the platform.') },
                            ]
                          )}
                        >
                          <Ionicons name="ban" size={18} color="#e91e63" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: '#ffb30022', borderRadius: BorderRadius.sm }]}
                          onPress={() => Alert.alert('Flagged', 'Review flagged')}
                        >
                          <Ionicons name="flag" size={18} color="#ffb300" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                {sorted.length === 0 && (
                  <Text style={styles.countText}>No reviews found.</Text>
                )}
              </View>
            );
          })()}

          {activeTab === 'stats' && (() => {
            const totalVideos = allVideos.length;
            const hiddenOverrides = (state.settings.adminVideoOverrides || []).filter(o => o.hidden);
            const hiddenCount = hiddenOverrides.length;
            const visibleCount = totalVideos - hiddenCount;

            const totalRatings = state.ratings.length;
            const thumbsUp = state.ratings.filter(r => r.thumbs === 'up').length;
            const thumbsDown = state.ratings.filter(r => r.thumbs === 'down').length;
            const totalReviews = state.ratings.filter(r => r.reviewText && r.reviewText.trim().length > 0).length;
            const totalBookmarks = state.bookmarks.length;
            const totalWatchHistory = state.watchHistory.length;
            const totalMyList = state.myList.length;

            const removalRequests = state.settings.removalRequests || [];

            const personTags = state.settings.personTags || [];

            const atlasVideos = state.settings.atlasActionVideos || [];
            const atlasCourses = state.settings.atlasActionCourses || [];

            // Most watched (by viewCount from static data)
            const topWatched = [...allVideos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

            // Most rated
            const ratingCountMap: Record<string, number> = {};
            state.ratings.forEach(r => { ratingCountMap[r.videoId] = (ratingCountMap[r.videoId] || 0) + 1; });
            const topRated = Object.entries(ratingCountMap)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([id, count]) => ({ video: videoMap.get(id), count }));

            // Most bookmarked
            const bookmarkCountMap: Record<string, number> = {};
            state.bookmarks.forEach(b => { bookmarkCountMap[b.videoId] = (bookmarkCountMap[b.videoId] || 0) + 1; });
            const topBookmarked = Object.entries(bookmarkCountMap)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([id, count]) => ({ video: videoMap.get(id), count }));

            return (
              <View>
                <Text style={styles.sectionTitle}>App Statistics</Text>

                {/* Video counts */}
                <View style={styles.statSection}>
                  <Text style={styles.statSectionTitle}>Videos</Text>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Total Videos</Text><Text style={styles.statValue}>{totalVideos}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Visible</Text><Text style={styles.statValue}>{visibleCount}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Hidden</Text><Text style={styles.statValue}>{hiddenCount}</Text></View>
                </View>

                {/* Engagement counts */}
                <View style={styles.statSection}>
                  <Text style={styles.statSectionTitle}>Engagement</Text>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Total Ratings</Text><Text style={styles.statValue}>{totalRatings}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>{'\ud83d\udc4d'} Thumbs Up</Text><Text style={styles.statValue}>{thumbsUp}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>{'\ud83d\udc4e'} Thumbs Down</Text><Text style={styles.statValue}>{thumbsDown}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Reviews (with text)</Text><Text style={styles.statValue}>{totalReviews}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Bookmarks</Text><Text style={styles.statValue}>{totalBookmarks}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Watch History Entries</Text><Text style={styles.statValue}>{totalWatchHistory}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>My List Items</Text><Text style={styles.statValue}>{totalMyList}</Text></View>
                </View>

                {/* Top watched */}
                <View style={styles.statSection}>
                  <Text style={styles.statSectionTitle}>Most Watched (by View Count)</Text>
                  {topWatched.map((v, i) => (
                    <View key={v.id} style={styles.statRow}>
                      <Text style={styles.statLabel} numberOfLines={1}>{i + 1}. {v.title}</Text>
                      <Text style={styles.statValue}>{v.viewCount.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                {/* Top rated */}
                {topRated.length > 0 && (
                  <View style={styles.statSection}>
                    <Text style={styles.statSectionTitle}>Most Rated (by Rating Count)</Text>
                    {topRated.map((item, i) => (
                      <View key={item.video?.id || i} style={styles.statRow}>
                        <Text style={styles.statLabel} numberOfLines={1}>{i + 1}. {item.video?.title || 'Unknown'}</Text>
                        <Text style={styles.statValue}>{item.count}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Top bookmarked */}
                {topBookmarked.length > 0 && (
                  <View style={styles.statSection}>
                    <Text style={styles.statSectionTitle}>Most Bookmarked</Text>
                    {topBookmarked.map((item, i) => (
                      <View key={item.video?.id || i} style={styles.statRow}>
                        <Text style={styles.statLabel} numberOfLines={1}>{i + 1}. {item.video?.title || 'Unknown'}</Text>
                        <Text style={styles.statValue}>{item.count}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Other stats */}
                <View style={styles.statSection}>
                  <Text style={styles.statSectionTitle}>Other</Text>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Removal Requests</Text><Text style={styles.statValue}>{removalRequests.length}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Person Tags</Text><Text style={styles.statValue}>{personTags.length}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Atlas Action Videos</Text><Text style={styles.statValue}>{atlasVideos.length}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statLabel}>Atlas Action Courses</Text><Text style={styles.statValue}>{atlasCourses.length}</Text></View>
                </View>

                {/* TMDB Integration */}
                <View style={styles.statSection}>
                  <Text style={styles.statSectionTitle}>TMDB Integration</Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
                    Connect TMDB to auto-lookup stunt coordinators, movie details, and crew credits
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={[styles.searchInput, { flex: 1, marginBottom: 0 }]}
                      placeholder="TMDB API Key (v3)"
                      placeholderTextColor={Colors.textMuted}
                      value={tmdbKey}
                      onChangeText={(t) => { setTmdbKey(t); setTmdbStatus('idle'); }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                    />
                    <TouchableOpacity
                      style={{ backgroundColor: tmdbStatus === 'valid' ? '#2ecc71' : tmdbStatus === 'invalid' ? '#e74c3c' : Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
                      onPress={async () => {
                        if (!tmdbKey.trim()) return;
                        setTmdbStatus('testing');
                        try {
                          const res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${tmdbKey}`);
                          setTmdbStatus(res.ok ? 'valid' : 'invalid');
                        } catch { setTmdbStatus('invalid'); }
                      }}
                      disabled={!tmdbKey.trim() || tmdbStatus === 'testing'}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>
                        {tmdbStatus === 'testing' ? '...' : tmdbStatus === 'valid' ? '✓' : tmdbStatus === 'invalid' ? '✗' : 'Test'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: Colors.textMuted, fontSize: 11, marginTop: 4 }}>Free at themoviedb.org/settings/api</Text>
                </View>
              </View>
            );
          })()}

          {activeTab === 'books' && (() => {
            const hiddenBooks: string[] = state.settings.hiddenBooks || [];
            const bookOverrides: Array<{ bookId: string; title?: string; authors?: string[]; description?: string; category?: string }> = state.settings.adminBookOverrides || [];
            const getBookOverride = (id: string) => bookOverrides.find(o => o.bookId === id);
            const toggleHideBook = (id: string) => {
              const updated = hiddenBooks.includes(id)
                ? hiddenBooks.filter(b => b !== id)
                : [...hiddenBooks, id];
              dispatch({ type: 'UPDATE_SETTINGS', payload: { hiddenBooks: updated } });
            };
            const updateBookField = (bookId: string, field: string, value: any) => {
              const existing = getBookOverride(bookId);
              if (existing) {
                const updated = bookOverrides.map(o => o.bookId === bookId ? { ...o, [field]: value } : o);
                dispatch({ type: 'UPDATE_SETTINGS', payload: { adminBookOverrides: updated } });
              } else {
                dispatch({ type: 'UPDATE_SETTINGS', payload: { adminBookOverrides: [...bookOverrides, { bookId, [field]: value }] } });
              }
            };
            const bq = searchQuery.toLowerCase();
            const categoryFilter = ['memoir', 'history', 'training', 'reference'].includes(bq) ? bq : null;
            const filteredBooks = allBooks.filter(b => {
              if (categoryFilter) return b.category === categoryFilter;
              if (bq) return b.title.toLowerCase().includes(bq) || b.author.toLowerCase().includes(bq);
              return true;
            });
            return (
              <View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search books or filter by category (memoir, history, training, reference)..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Text style={styles.countText}>
                  {filteredBooks.length} books ({hiddenBooks.length} hidden)
                </Text>
                {filteredBooks.map(book => {
                  const isHidden = hiddenBooks.includes(book.id);
                  const override = getBookOverride(book.id);
                  return (
                    <View key={book.id} style={[styles.videoItem, isHidden && styles.videoItemHidden]}>
                      <View style={styles.videoHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.videoTitle, isHidden && styles.textHidden]} numberOfLines={1}>
                            {override?.title || book.title}
                          </Text>
                          <Text style={styles.videoMeta}>
                            {(override?.authors && override.authors.length > 0) ? override.authors.join(', ') : book.author}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
                            <View style={styles.customBadge}>
                              <Text style={styles.customBadgeText}>{bookCategoryLabels[override?.category || book.category] || book.category}</Text>
                            </View>
                            <Text style={styles.videoMeta}>ASIN: {book.asin}</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => toggleHideBook(book.id)} style={styles.iconBtn}>
                          <Ionicons name={isHidden ? 'eye-off' : 'eye'} size={20} color={isHidden ? '#f44' : Colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      {/* Editable fields */}
                      <View style={styles.tagColumns}>
                        <View style={[styles.tagColumn, { flex: 2 }]}>
                          <Text style={styles.columnLabel}>Title</Text>
                          <TextInput
                            style={styles.editInput}
                            value={override?.title || book.title}
                            onChangeText={(v) => updateBookField(book.id, 'title', v)}
                            placeholderTextColor={Colors.textMuted}
                          />
                        </View>
                        <View style={styles.tagColumn}>
                          <Text style={styles.columnLabel}>Author</Text>
                          <TagInput
                            currentTags={override?.authors || book.author.split(/,\s*|&\s*/).map(a => a.trim()).filter(Boolean)}
                            allSuggestions={allPerformerNames}
                            onAddTag={(name) => {
                              const current = override?.authors || book.author.split(/,\s*|&\s*/).map(a => a.trim()).filter(Boolean);
                              updateBookField(book.id, 'authors', [...current, name]);
                            }}
                            onRemoveTag={(name) => {
                              const current = override?.authors || book.author.split(/,\s*|&\s*/).map(a => a.trim()).filter(Boolean);
                              updateBookField(book.id, 'authors', current.filter(a => a !== name));
                            }}
                            placeholder="Add author..."
                            tagColor="#4fc3f7"
                          />
                        </View>
                        <View style={styles.tagColumn}>
                          <Text style={styles.columnLabel}>Category</Text>
                          <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                            {['memoir', 'history', 'training', 'reference'].map(cat => (
                              <TouchableOpacity
                                key={cat}
                                onPress={() => updateBookField(book.id, 'category', cat)}
                                style={[styles.filterTypeBtn, { paddingHorizontal: 8, paddingVertical: 3 },
                                  (override?.category || book.category) === cat && styles.filterTypeBtnActive]}
                              >
                                <Text style={[styles.filterTypeText, { fontSize: 10 },
                                  (override?.category || book.category) === cat && styles.filterTypeTextActive]}>
                                  {bookCategoryLabels[cat]}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                      <View style={{ marginTop: Spacing.sm }}>
                        <Text style={styles.columnLabel}>Description</Text>
                        <TextInput
                          style={[styles.editInput, { minHeight: 50 }]}
                          value={override?.description || book.description}
                          onChangeText={(v) => updateBookField(book.id, 'description', v)}
                          multiline
                          placeholderTextColor={Colors.textMuted}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}

          {activeTab === 'podcasts' && (() => {
            const hiddenPodcasts: string[] = state.settings.hiddenPodcasts || [];
            const podcastOverrides: Array<{ podcastId: string; title?: string; hosts?: string[]; description?: string; status?: string }> = state.settings.adminPodcastOverrides || [];
            const getPodcastOverride = (id: string) => podcastOverrides.find(o => o.podcastId === id);
            const toggleHidePodcast = (id: string) => {
              const updated = hiddenPodcasts.includes(id)
                ? hiddenPodcasts.filter(p => p !== id)
                : [...hiddenPodcasts, id];
              dispatch({ type: 'UPDATE_SETTINGS', payload: { hiddenPodcasts: updated } });
            };
            const updatePodcastField = (podcastId: string, field: string, value: any) => {
              const existing = getPodcastOverride(podcastId);
              if (existing) {
                const updated = podcastOverrides.map(o => o.podcastId === podcastId ? { ...o, [field]: value } : o);
                dispatch({ type: 'UPDATE_SETTINGS', payload: { adminPodcastOverrides: updated } });
              } else {
                dispatch({ type: 'UPDATE_SETTINGS', payload: { adminPodcastOverrides: [...podcastOverrides, { podcastId, [field]: value }] } });
              }
            };
            const pq = searchQuery.toLowerCase();
            const filteredPodcasts = pq
              ? allPodcasts.filter(p => p.title.toLowerCase().includes(pq) || p.hosts.toLowerCase().includes(pq))
              : allPodcasts;
            return (
              <View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search podcasts..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Text style={styles.countText}>
                  {filteredPodcasts.length} podcasts ({hiddenPodcasts.length} hidden)
                </Text>
                {filteredPodcasts.map(podcast => {
                  const isHidden = hiddenPodcasts.includes(podcast.id);
                  const override = getPodcastOverride(podcast.id);
                  const currentStatus = override?.status || podcast.status;
                  return (
                    <View key={podcast.id} style={[styles.videoItem, isHidden && styles.videoItemHidden]}>
                      <View style={styles.videoHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.videoTitle, isHidden && styles.textHidden]} numberOfLines={1}>
                            {override?.title || podcast.title}
                          </Text>
                          <Text style={styles.videoMeta}>
                            Hosted by {(override?.hosts && override.hosts.length > 0) ? override.hosts.join(', ') : podcast.hosts}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
                            <View style={[styles.customBadge, { backgroundColor: currentStatus === 'active' ? '#1DB95433' : Colors.surface }]}>
                              <Text style={[styles.customBadgeText, { color: currentStatus === 'active' ? '#1DB954' : Colors.textMuted }]}>
                                {currentStatus === 'active' ? 'Active' : 'Archived'}
                              </Text>
                            </View>
                            {podcast.links.spotify && <Text style={styles.videoMeta}>Spotify ✓</Text>}
                            {podcast.links.apple && <Text style={styles.videoMeta}>Apple ✓</Text>}
                            {podcast.links.youtube && <Text style={styles.videoMeta}>YouTube ✓</Text>}
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => toggleHidePodcast(podcast.id)} style={styles.iconBtn}>
                          <Ionicons name={isHidden ? 'eye-off' : 'eye'} size={20} color={isHidden ? '#f44' : Colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      {/* Editable fields */}
                      <View style={styles.tagColumns}>
                        <View style={[styles.tagColumn, { flex: 2 }]}>
                          <Text style={styles.columnLabel}>Title</Text>
                          <TextInput
                            style={styles.editInput}
                            value={override?.title || podcast.title}
                            onChangeText={(v) => updatePodcastField(podcast.id, 'title', v)}
                            placeholderTextColor={Colors.textMuted}
                          />
                        </View>
                        <View style={styles.tagColumn}>
                          <Text style={styles.columnLabel}>Hosts</Text>
                          <TagInput
                            currentTags={override?.hosts || podcast.hosts.split(/,\s*|&\s*/).map(h => h.trim()).filter(Boolean)}
                            allSuggestions={allPerformerNames}
                            onAddTag={(name) => {
                              const current = override?.hosts || podcast.hosts.split(/,\s*|&\s*/).map(h => h.trim()).filter(Boolean);
                              updatePodcastField(podcast.id, 'hosts', [...current, name]);
                            }}
                            onRemoveTag={(name) => {
                              const current = override?.hosts || podcast.hosts.split(/,\s*|&\s*/).map(h => h.trim()).filter(Boolean);
                              updatePodcastField(podcast.id, 'hosts', current.filter(h => h !== name));
                            }}
                            placeholder="Add host..."
                            tagColor="#4fc3f7"
                          />
                        </View>
                        <View style={styles.tagColumn}>
                          <Text style={styles.columnLabel}>Status</Text>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            {['active', 'inactive'].map(s => (
                              <TouchableOpacity
                                key={s}
                                onPress={() => updatePodcastField(podcast.id, 'status', s)}
                                style={[styles.filterTypeBtn, { paddingHorizontal: 8, paddingVertical: 3 },
                                  currentStatus === s && styles.filterTypeBtnActive]}
                              >
                                <Text style={[styles.filterTypeText, { fontSize: 10 },
                                  currentStatus === s && styles.filterTypeTextActive]}>
                                  {s === 'active' ? 'Active' : 'Archived'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                      <View style={{ marginTop: Spacing.sm }}>
                        <Text style={styles.columnLabel}>Description</Text>
                        <TextInput
                          style={[styles.editInput, { minHeight: 50 }]}
                          value={override?.description || podcast.description}
                          onChangeText={(v) => updatePodcastField(podcast.id, 'description', v)}
                          multiline
                          placeholderTextColor={Colors.textMuted}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}

          {activeTab === 'submissions' && (() => {
            const submissions = state.settings.vaultSubmissions || [];
            const pending = submissions.filter(s => !s.status || s.status === 'pending');
            const approved = submissions.filter(s => s.status === 'approved');
            const rejected = submissions.filter(s => s.status === 'rejected');

            // Track which submission is being edited (by index)
            const [editingSubIndex, setEditingSubIndex] = React.useState<number | null>(null);
            const [editSubTitle, setEditSubTitle] = React.useState('');
            const [editSubDescription, setEditSubDescription] = React.useState('');
            const [editSubCategory, setEditSubCategory] = React.useState('');
            const [editSubTags, setEditSubTags] = React.useState<string[]>([]);
            const [editSubPeople, setEditSubPeople] = React.useState<string[]>([]);
            const [editSubMovies, setEditSubMovies] = React.useState<string[]>([]);

            const startEditingSubmission = (index: number) => {
              const sub = submissions[index];
              setEditingSubIndex(index);
              setEditSubTitle(sub.title);
              setEditSubDescription(sub.author || '');
              setEditSubCategory(sub.category || 'Behind the Scenes');
              setEditSubTags(sub.category ? [sub.category] : []);
              setEditSubPeople([]);
              setEditSubMovies([]);
            };

            const saveSubmissionEdits = (index: number) => {
              const updatedSubs = submissions.map((s, i) => i === index ? {
                ...s,
                title: editSubTitle,
                category: editSubCategory,
              } : s);
              dispatch({ type: 'UPDATE_SETTINGS', payload: { vaultSubmissions: updatedSubs } });
              setEditingSubIndex(null);
            };

            const approveSubmission = (index: number) => {
              const sub = submissions[index];
              const isEditing = editingSubIndex === index;
              const finalTitle = isEditing ? editSubTitle : sub.title;
              const finalCategory = isEditing ? editSubCategory : (sub.category || 'Behind the Scenes');
              const finalTags = isEditing && editSubTags.length > 0 ? editSubTags : [finalCategory];
              const finalPeople = isEditing ? editSubPeople : [];
              const finalMovies = isEditing ? editSubMovies : [];
              const finalDescription = isEditing ? editSubDescription : `Submitted by ${sub.submittedByEmail || 'a user'}`;

              // Create a user video entry (hidden by default)
              const userVideos = state.settings.userVideos || [];
              const newVideoId = `user-${sub.videoId}`;
              const newVideo = {
                id: newVideoId,
                title: finalTitle,
                description: finalDescription,
                youtubeId: sub.videoId,
                thumbnailUrl: sub.thumbnailUrl,
                category: finalCategory,
                submittedBy: sub.submittedByEmail || 'unknown',
                submittedAt: sub.submittedAt,
                durationSeconds: 0,
              };
              // Add to hidden video overrides with tags, people, movies
              const currentOverrides = state.settings.adminVideoOverrides || [];
              const newOverride: AdminVideoOverride = {
                videoId: newVideoId,
                hidden: true,
                tagOverrides: finalTags,
                peopleOverrides: finalPeople.length > 0 ? finalPeople : undefined,
                movieTags: finalMovies.length > 0 ? finalMovies : undefined,
              };
              // Mark submission as approved
              const updatedSubs = submissions.map((s, i) => i === index ? { ...s, status: 'approved' as const, title: finalTitle, category: finalCategory } : s);
              dispatch({
                type: 'UPDATE_SETTINGS',
                payload: {
                  userVideos: [...userVideos, newVideo],
                  adminVideoOverrides: [...currentOverrides, newOverride],
                  vaultSubmissions: updatedSubs,
                }
              });
              setEditingSubIndex(null);
            };

            const rejectSubmission = (index: number) => {
              const updatedSubs = submissions.map((s, i) => i === index ? { ...s, status: 'rejected' as const } : s);
              dispatch({ type: 'UPDATE_SETTINGS', payload: { vaultSubmissions: updatedSubs } });
              setEditingSubIndex(null);
            };

            const removeSubmission = (index: number) => {
              const updatedSubs = submissions.filter((_, i) => i !== index);
              dispatch({ type: 'UPDATE_SETTINGS', payload: { vaultSubmissions: updatedSubs } });
            };

            const categoryOptions = ['Behind the Scenes', 'Fight Choreography', 'Car Stunts', 'High Falls', 'Fire Stunts', 'Wire Work', 'Stunt Training', 'Full BTS Featurette', 'Other'];

            return (
              <View>
                <Text style={styles.sectionTitle}>Video Submissions</Text>
                <Text style={styles.countText}>
                  {pending.length} pending · {approved.length} approved · {rejected.length} rejected
                </Text>

                {pending.length > 0 && (
                  <View style={{ marginBottom: Spacing.lg }}>
                    <Text style={[styles.columnLabel, { fontSize: FontSize.md, marginBottom: Spacing.sm }]}>Pending Review — Edit info before approving</Text>
                    {submissions.map((sub, index) => {
                      if (sub.status && sub.status !== 'pending') return null;
                      const isEditing = editingSubIndex === index;
                      return (
                        <View key={index} style={styles.videoItem}>
                          <View style={styles.videoHeader}>
                            <View style={{ flex: 1 }}>
                              {!isEditing ? (
                                <>
                                  <Text style={styles.videoTitle}>{sub.title}</Text>
                                  <Text style={styles.videoMeta}>
                                    {(sub as any).contentType === 'book' ? '📚' : (sub as any).contentType === 'podcast' ? '🎙️' : '🎬'}{' '}
                                    {(sub as any).contentType || 'video'} · {sub.author || 'Unknown'} · {sub.category || 'Uncategorized'}
                                  </Text>
                                  <Text style={styles.videoMeta}>
                                    Submitted by {sub.submittedByEmail || 'unknown'} · {new Date(sub.submittedAt).toLocaleDateString()}
                                  </Text>
                                </>
                              ) : (
                                <View style={{ gap: Spacing.sm }}>
                                  <Text style={styles.columnLabel}>Title</Text>
                                  <TextInput
                                    style={styles.editInput}
                                    value={editSubTitle}
                                    onChangeText={setEditSubTitle}
                                    placeholder="Video title"
                                    placeholderTextColor={Colors.textMuted}
                                  />
                                  <Text style={styles.columnLabel}>Description</Text>
                                  <TextInput
                                    style={[styles.editInput, { height: 60 }]}
                                    value={editSubDescription}
                                    onChangeText={setEditSubDescription}
                                    placeholder="Video description"
                                    placeholderTextColor={Colors.textMuted}
                                    multiline
                                  />
                                  <Text style={styles.columnLabel}>Category</Text>
                                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                      {categoryOptions.map(cat => (
                                        <TouchableOpacity
                                          key={cat}
                                          onPress={() => setEditSubCategory(cat)}
                                          style={{
                                            paddingHorizontal: 10, paddingVertical: 5,
                                            borderRadius: 12, borderWidth: 1,
                                            borderColor: editSubCategory === cat ? Colors.primary : Colors.divider,
                                            backgroundColor: editSubCategory === cat ? Colors.primary + '33' : 'transparent',
                                          }}
                                        >
                                          <Text style={{ color: editSubCategory === cat ? Colors.primary : Colors.textSecondary, fontSize: 12 }}>{cat}</Text>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                  </ScrollView>
                                  <Text style={styles.columnLabel}>Tags</Text>
                                  <TagInput
                                    currentTags={editSubTags}
                                    allSuggestions={allSkillTagNames}
                                    onAddTag={(tag) => setEditSubTags(prev => [...prev, tag])}
                                    onRemoveTag={(tag) => setEditSubTags(prev => prev.filter(t => t !== tag))}
                                    placeholder="Add skill tags..."
                                  />
                                  <Text style={styles.columnLabel}>People</Text>
                                  <TagInput
                                    currentTags={editSubPeople}
                                    allSuggestions={allPerformerNames}
                                    onAddTag={(name) => setEditSubPeople(prev => [...prev, name])}
                                    onRemoveTag={(name) => setEditSubPeople(prev => prev.filter(n => n !== name))}
                                    placeholder="Add stunt performers..."
                                    tagColor="#22c55e"
                                  />
                                  <Text style={styles.columnLabel}>Movie / Production</Text>
                                  <TagInput
                                    currentTags={editSubMovies}
                                    allSuggestions={allMovieNames}
                                    onAddTag={(name) => setEditSubMovies(prev => [...prev, name])}
                                    onRemoveTag={(name) => setEditSubMovies(prev => prev.filter(n => n !== name))}
                                    placeholder="Add movie or production title..."
                                    tagColor="#f59e0b"
                                  />
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' }}>
                            {!isEditing ? (
                              <TouchableOpacity
                                onPress={() => startEditingSubmission(index)}
                                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.primary + '33' }}
                              >
                                <Text style={{ color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>✎ Edit Info</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                onPress={() => saveSubmissionEdits(index)}
                                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.primary + '33' }}
                              >
                                <Text style={{ color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>✓ Save Edits</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => approveSubmission(index)}
                              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#22c55e33' }}
                            >
                              <Text style={{ color: '#22c55e', fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>✓ Approve (Hidden)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => rejectSubmission(index)}
                              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f4433633' }}
                            >
                              <Text style={{ color: '#f44', fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>✗ Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                if (typeof window !== 'undefined') {
                                  window.open(`https://www.youtube.com/watch?v=${sub.videoId}`, '_blank');
                                }
                              }}
                              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surface }}
                            >
                              <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>▶ Preview</Text>
                            </TouchableOpacity>
                            {isEditing && (
                              <TouchableOpacity
                                onPress={() => setEditingSubIndex(null)}
                                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surface }}
                              >
                                <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>Cancel</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {approved.length > 0 && (
                  <View style={{ marginBottom: Spacing.lg }}>
                    <Text style={[styles.columnLabel, { fontSize: FontSize.md, marginBottom: Spacing.sm }]}>Approved (go to Videos tab to unhide)</Text>
                    {submissions.map((sub, index) => {
                      if (sub.status !== 'approved') return null;
                      return (
                        <View key={index} style={[styles.videoItem, { borderLeftWidth: 3, borderLeftColor: '#22c55e' }]}>
                          <View style={styles.videoHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.videoTitle}>{sub.title}</Text>
                              <Text style={styles.videoMeta}>{sub.author} · {sub.category || 'Uncategorized'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeSubmission(index)} style={styles.iconBtn}>
                              <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {rejected.length > 0 && (
                  <View>
                    <Text style={[styles.columnLabel, { fontSize: FontSize.md, marginBottom: Spacing.sm }]}>Rejected</Text>
                    {submissions.map((sub, index) => {
                      if (sub.status !== 'rejected') return null;
                      return (
                        <View key={index} style={[styles.videoItem, { opacity: 0.5, borderLeftWidth: 3, borderLeftColor: '#f44' }]}>
                          <View style={styles.videoHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.videoTitle}>{sub.title}</Text>
                              <Text style={styles.videoMeta}>{sub.author}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeSubmission(index)} style={styles.iconBtn}>
                              <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {submissions.length === 0 && (
                  <Text style={styles.countText}>No video submissions yet.</Text>
                )}
              </View>
            );
          })()}

          {activeTab === 'flags' && (() => {
            const allRequests = state.settings.removalRequests || [];
            const fq = flagSearch.toLowerCase();
            const filtered = fq
              ? allRequests.filter(req => {
                  const vid = videoMap.get(req.videoId);
                  return (vid?.title || '').toLowerCase().includes(fq);
                })
              : allRequests;
            return (
              <View>
                <Text style={styles.sectionTitle}>Removal Requests & Flags ({allRequests.length})</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by video title..."
                  placeholderTextColor={Colors.textMuted}
                  value={flagSearch}
                  onChangeText={setFlagSearch}
                />
                {filtered.length === 0 && (
                  <Text style={styles.countText}>{allRequests.length === 0 ? 'No removal requests.' : 'No matching requests.'}</Text>
                )}
                {filtered.map((req, i) => {
                  const vid = videoMap.get(req.videoId);
                  const reasonLabel = req.reason === 'broken_link' ? '\ud83d\udd17 Broken Link'
                    : req.reason === 'owner_request' ? '\ud83d\udd11 Owner Request'
                    : req.reason === 'doesnt_belong' ? '\ud83d\udeab Doesn\'t Belong'
                    : req.reason === 'other' ? '\ud83d\udcdd Other'
                    : req.claimsOwnership ? '\ud83d\udd11 Claims Ownership'
                    : '\ud83d\udcdd General Request';
                  return (
                    <View key={`${req.videoId}-${i}`} style={styles.flagCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.videoTitle}>{vid?.title || req.videoId}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs }}>
                          <Text style={styles.videoMeta}>{reasonLabel}</Text>
                          {req.claimsOwnership && (
                            <View style={[styles.customBadge, { backgroundColor: '#f4433633' }]}>
                              <Text style={[styles.customBadgeText, { color: '#f44' }]}>Claims Ownership</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.videoMeta}>{new Date(req.requestedAt).toLocaleDateString()}</Text>
                      </View>
                      <View style={styles.videoActions}>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: Colors.primary + '22', borderRadius: BorderRadius.sm }]}
                          onPress={() => {
                            const updated = (state.settings.removalRequests || []).filter((_, idx) => idx !== i);
                            dispatch({ type: 'UPDATE_SETTINGS', payload: { removalRequests: updated } });
                          }}
                        >
                          <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconBtn, { backgroundColor: '#f4433622', borderRadius: BorderRadius.sm }]}
                          onPress={() => {
                            // Hide the video and remove the request
                            const existingOverrides = state.settings.adminVideoOverrides || [];
                            const overrideIdx = existingOverrides.findIndex(o => o.videoId === req.videoId);
                            let updatedOverrides: AdminVideoOverride[];
                            if (overrideIdx >= 0) {
                              updatedOverrides = existingOverrides.map((o, oi) =>
                                oi === overrideIdx ? { ...o, hidden: true } : o
                              );
                            } else {
                              updatedOverrides = [...existingOverrides, { videoId: req.videoId, hidden: true }];
                            }
                            const updatedRequests = (state.settings.removalRequests || []).filter((_, idx) => idx !== i);
                            dispatch({ type: 'UPDATE_SETTINGS', payload: { removalRequests: updatedRequests, adminVideoOverrides: updatedOverrides } });
                            Alert.alert('Done', 'Video hidden and request resolved.');
                          }}
                        >
                          <Ionicons name="eye-off" size={18} color="#f44" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}

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
  editInput: { backgroundColor: Colors.background, borderRadius: BorderRadius.sm, padding: Spacing.sm, color: Colors.textPrimary, fontSize: FontSize.sm, borderWidth: 1, borderColor: Colors.divider, marginTop: 4 },
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

  // Reviews tab
  reviewCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  reviewText: {
    color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs, lineHeight: 20,
  },

  // Flags tab
  flagCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: '#ffb300',
  },

  // Stats tab
  statSection: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  statSectionTitle: {
    color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs,
  },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  statLabel: {
    color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1,
  },
  statValue: {
    color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold,
    marginLeft: Spacing.sm,
  },
});
