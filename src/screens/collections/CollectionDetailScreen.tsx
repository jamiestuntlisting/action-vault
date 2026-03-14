import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap } from '../../data';
import { VideoCard } from '../../components/VideoCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function CollectionDetailScreen({ route, navigation }: any) {
  const { collectionId } = route.params;
  const { state } = useAppState();
  const collection = state.collections.find(c => c.id === collectionId);

  if (!collection) return null;

  const collectionVideos = collection.videoIds.map(id => videoMap.get(id)).filter(Boolean);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{collection.title}</Text>
        <Text style={styles.description}>{collection.description}</Text>
        <Text style={styles.count}>{collectionVideos.length} videos</Text>
      </View>

      <View style={styles.videoGrid}>
        {collectionVideos.map(v => (
          <VideoCard
            key={v!.id}
            video={v!}
            onPress={() => navigation.navigate('VideoDetail', { videoId: v!.id })}
            width={(SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md) / 2}
          />
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backButton: {
    position: 'absolute', top: 50, left: Spacing.screen, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: Spacing.sm,
  },
  header: { paddingTop: 100, paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xxl },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm, lineHeight: 22 },
  count: { color: Colors.textTertiary, fontSize: FontSize.sm, marginTop: Spacing.sm },
  videoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md,
    paddingHorizontal: Spacing.screen, paddingBottom: 100,
  },
});
