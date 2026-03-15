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

const MAX_WIDTH = 960;

type AdminTab = 'videos' | 'categories' | 'tags';

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
        <View style={styles.tabs}>
          {(['videos', 'categories', 'tags'] as AdminTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'videos' ? 'Videos' : tab === 'categories' ? 'Categories' : 'Quick Tags'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
                            {req.claimsOwnership ? 'Claims ownership' : 'General request'} - {new Date(req.requestedAt).toLocaleDateString()}
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
              <Text style={styles.sectionTitle}>Custom Categories</Text>
              <Text style={styles.hint}>Create and reorder categories shown on the home screen.</Text>

              {/* Existing categories */}
              {categories.map((cat, idx) => (
                <View key={cat.id} style={styles.catItem}>
                  <View style={styles.catReorder}>
                    <TouchableOpacity onPress={() => moveCategory(cat.id, 'up')} disabled={idx === 0}>
                      <Ionicons name="chevron-up" size={20} color={idx === 0 ? Colors.textMuted : Colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveCategory(cat.id, 'down')} disabled={idx === categories.length - 1}>
                      <Ionicons name="chevron-down" size={20} color={idx === categories.length - 1 ? Colors.textMuted : Colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catTitle}>{cat.title}</Text>
                    <Text style={styles.catFilter}>{cat.filterType}: {cat.filterValue}</Text>
                  </View>
                  <Switch
                    value={cat.enabled}
                    onValueChange={() => toggleCategory(cat.id)}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                  />
                  <TouchableOpacity onPress={() => deleteCategory(cat.id)} style={{ marginLeft: Spacing.sm }}>
                    <Ionicons name="trash-outline" size={20} color="#f44" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add new category */}
              <View style={styles.addCatSection}>
                <Text style={styles.sectionTitle}>Add Category</Text>
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
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
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
  catFilter: { color: Colors.textMuted, fontSize: FontSize.xs },
  addCatSection: { marginTop: Spacing.xxl },
  input: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, marginBottom: Spacing.md },
  filterTypeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
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
});
