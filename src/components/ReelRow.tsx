import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { Colors, FontSize, Spacing, FontWeight } from '../theme';
import { StuntReel, SkillReel, getEmbedUrl } from '../services/StuntListingService';
import { ReelCard } from './ReelCard';

interface ReelRowProps {
  title: string;
  subtitle?: string;
  reels: (StuntReel | SkillReel)[];
  onReelPress?: (reel: StuntReel | SkillReel) => void;
}

export function ReelRow({ title, subtitle, reels, onReelPress }: ReelRowProps) {
  if (reels.length === 0) return null;

  function handlePress(reel: StuntReel | SkillReel) {
    if (onReelPress) {
      onReelPress(reel);
    } else {
      // Default: open the reel URL
      Linking.openURL(reel.url);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <FlatList
        data={reels}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ReelCard reel={item} onPress={() => handlePress(item)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: Spacing.screen,
  },
});
