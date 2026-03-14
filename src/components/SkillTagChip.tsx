import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, FontSize, Spacing, FontWeight } from '../theme';
import { SkillTag } from '../types';

interface SkillTagChipProps {
  tag: SkillTag;
  selected?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium';
}

export function SkillTagChip({ tag, selected, onPress, size = 'small' }: SkillTagChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipSelected,
        size === 'medium' && styles.chipMedium,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text style={[
        styles.text,
        selected && styles.textSelected,
        size === 'medium' && styles.textMedium,
      ]}>
        {tag.displayName}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.tagBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chipSelected: {
    backgroundColor: Colors.tagActiveBackground,
  },
  chipMedium: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  text: {
    color: Colors.tagText,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  textSelected: {
    color: Colors.tagActiveText,
  },
  textMedium: {
    fontSize: FontSize.md,
  },
});
