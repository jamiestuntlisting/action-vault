import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap } from '../../data';
import { VideoCard } from '../../components/VideoCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md) / 2;

type SortMode = 'date' | 'alpha' | 'duration' | 'difficulty';

export function MyListScreen({ navigation }: any) {
  const { state, dispatch } = useAppState();
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const myVideos = useMemo(() => {
    const profileId = state.activeProfile?.id || '';
    const entries = state.myList.filter(m => m.profileId === profileId);
    const vids = entries.map(e => ({ ...videoMap.get(e.videoId)!, addedAt: e.addedAt })).filter(v => v.id);

    switch (sortMode) {
      case 'alpha': return vids.sort((a, b) => a.title.localeCompare(b.title));
      case 'duration': return vids.sort((a, b) => a.durationSeconds - b.durationSeconds);
      case 'difficulty': return vids.sort((a, b) => b.averageDifficulty - a.averageDifficulty);
      default: return vids.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }
  }, [state.myList, sortMode]);

  function toggleSelect(videoId: string) {
    const next = new Set(selected);
    if (next.has(videoId)) next.delete(videoId); else next.add(videoId);
    setSelected(next);
  }

  function removeSelected() {
    selected.forEach(id => dispatch({ type: 'REMOVE_FROM_MY_LIST', payload: id }));
    setSelected(new Set());
    setIsEditing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My List</Text>
        <View style={styles.headerRight}>
          {isEditing && selected.size > 0 && (
            <TouchableOpacity onPress={removeSelected}>
              <Text style={styles.removeText}>Remove ({selected.size})</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => { setIsEditing(!isEditing); setSelected(new Set()); }}>
            <Text style={styles.editText}>{isEditing ? 'Done' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sortBar}>
        {(['date', 'alpha', 'duration', 'difficulty'] as SortMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.sortButton, sortMode === mode && styles.sortButtonActive]}
            onPress={() => setSortMode(mode)}
          >
            <Text style={[styles.sortText, sortMode === mode && styles.sortTextActive]}>
              {mode === 'date' ? 'Recent' : mode === 'alpha' ? 'A-Z' : mode === 'duration' ? 'Length' : 'Difficulty'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={myVideos}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View>
            {isEditing && (
              <TouchableOpacity style={styles.selectCircle} onPress={() => toggleSelect(item.id)}>
                <Ionicons
                  name={selected.has(item.id) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={selected.has(item.id) ? Colors.primary : Colors.textTertiary}
                />
              </TouchableOpacity>
            )}
            <VideoCard
              video={item}
              onPress={() => isEditing ? toggleSelect(item.id) : navigation.navigate('VideoDetail', { videoId: item.id })}
              width={CARD_WIDTH}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Your list is empty</Text>
            <Text style={styles.emptySubtitle}>Add videos to your list to watch later</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  editText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  removeText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sortButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
  },
  sortButtonActive: {
    backgroundColor: Colors.white,
  },
  sortText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  sortTextActive: {
    color: Colors.black,
    fontWeight: FontWeight.semibold,
  },
  grid: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 100,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  selectCircle: {
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 100,
    gap: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  emptySubtitle: {
    color: Colors.textTertiary,
    fontSize: FontSize.md,
  },
});
