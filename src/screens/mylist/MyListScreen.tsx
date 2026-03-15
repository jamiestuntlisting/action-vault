import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap } from '../../data';
import { VideoCard } from '../../components/VideoCard';
import { Video } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md) / 2;

type Tab = 'mylist' | 'liked';
type SortMode = 'date' | 'alpha' | 'duration';

export function MyListScreen({ navigation }: any) {
  const { state, dispatch } = useAppState();
  const [tab, setTab] = useState<Tab>('mylist');
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
      default: return vids.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }
  }, [state.myList, sortMode]);

  const likedVideos = useMemo(() => {
    const liked = state.ratings.filter(r => r.thumbs === 'up');
    const vids = liked
      .map(r => {
        const v = videoMap.get(r.videoId);
        return v ? { ...v, ratedAt: r.createdAt } : null;
      })
      .filter(Boolean) as (Video & { ratedAt: string })[];

    switch (sortMode) {
      case 'alpha': return vids.sort((a, b) => a.title.localeCompare(b.title));
      case 'duration': return vids.sort((a, b) => a.durationSeconds - b.durationSeconds);
      default: return vids.sort((a, b) => new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime());
    }
  }, [state.ratings, sortMode]);

  const displayedVideos = tab === 'mylist' ? myVideos : likedVideos;

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
          {isEditing && selected.size > 0 && tab === 'mylist' && (
            <TouchableOpacity onPress={removeSelected}>
              <Text style={styles.removeText}>Remove ({selected.size})</Text>
            </TouchableOpacity>
          )}
          {tab === 'mylist' && (
            <TouchableOpacity onPress={() => { setIsEditing(!isEditing); setSelected(new Set()); }}>
              <Text style={styles.editText}>{isEditing ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'mylist' && styles.tabButtonActive]}
          onPress={() => { setTab('mylist'); setIsEditing(false); setSelected(new Set()); }}
        >
          <Ionicons name="bookmark-outline" size={16} color={tab === 'mylist' ? Colors.white : Colors.textTertiary} />
          <Text style={[styles.tabText, tab === 'mylist' && styles.tabTextActive]}>My List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'liked' && styles.tabButtonActive]}
          onPress={() => { setTab('liked'); setIsEditing(false); setSelected(new Set()); }}
        >
          <Ionicons name="thumbs-up-outline" size={16} color={tab === 'liked' ? Colors.white : Colors.textTertiary} />
          <Text style={[styles.tabText, tab === 'liked' && styles.tabTextActive]}>Liked Videos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sortBar}>
        {(['date', 'alpha', 'duration'] as SortMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.sortButton, sortMode === mode && styles.sortButtonActive]}
            onPress={() => setSortMode(mode)}
          >
            <Text style={[styles.sortText, sortMode === mode && styles.sortTextActive]}>
              {mode === 'date' ? 'Recent' : mode === 'alpha' ? 'A-Z' : 'Length'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayedVideos}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View>
            {isEditing && tab === 'mylist' && (
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
              onPress={() => isEditing && tab === 'mylist' ? toggleSelect(item.id) : navigation.navigate('VideoDetail', { videoId: item.id })}
              width={CARD_WIDTH}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name={tab === 'mylist' ? 'bookmark-outline' : 'thumbs-up-outline'} size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {tab === 'mylist' ? 'Your list is empty' : 'No liked videos yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'mylist'
                ? 'Add videos to your list to watch later'
                : 'Give a thumbs up to videos you enjoy'}
            </Text>
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
    marginBottom: Spacing.md,
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screen,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  tabText: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  tabTextActive: {
    color: Colors.black,
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
