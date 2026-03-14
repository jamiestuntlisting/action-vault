import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing } from '../theme';

interface DifficultyBadgeProps {
  rating: number;
  size?: 'small' | 'medium';
}

const difficultyColors = [
  Colors.difficulty1,
  Colors.difficulty2,
  Colors.difficulty3,
  Colors.difficulty4,
  Colors.difficulty5,
];

export function DifficultyBadge({ rating, size = 'small' }: DifficultyBadgeProps) {
  const rounded = Math.round(rating);
  const color = difficultyColors[Math.min(rounded - 1, 4)];
  const iconSize = size === 'small' ? 12 : 16;
  const fontSize = size === 'small' ? FontSize.xs : FontSize.sm;

  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < rounded ? 'star' : 'star-outline'}
          size={iconSize}
          color={i < rounded ? color : Colors.textMuted}
        />
      ))}
      <Text style={[styles.text, { fontSize, color }]}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  text: {
    fontWeight: FontWeight.semibold,
    marginLeft: Spacing.xs,
  },
});
