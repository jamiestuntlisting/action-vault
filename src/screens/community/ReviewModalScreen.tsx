import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap } from '../../data';
import { DifficultyRating } from '../../types';

export function ReviewModalScreen({ route, navigation }: any) {
  const { videoId } = route.params;
  const video = videoMap.get(videoId);
  const { dispatch, getRating } = useAppState();
  const existing = getRating(videoId);

  const [thumbs, setThumbs] = useState(existing?.thumbs || null);
  const [difficulty, setDifficulty] = useState<DifficultyRating | null>(existing?.difficultyRating || null);
  const [reviewText, setReviewText] = useState(existing?.reviewText || '');

  if (!video) return null;

  function handleSubmit() {
    dispatch({
      type: 'SET_RATING',
      payload: {
        profileId: '',
        videoId,
        thumbs,
        difficultyRating: difficulty,
        reviewText: reviewText.trim(),
        createdAt: new Date().toISOString(),
      },
    });
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rate & Review</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>

      {/* Thumbs */}
      <Text style={styles.sectionLabel}>Did you enjoy this?</Text>
      <View style={styles.thumbsRow}>
        <TouchableOpacity
          style={[styles.thumbButton, thumbs === 'up' && styles.thumbButtonActive]}
          onPress={() => setThumbs(thumbs === 'up' ? null : 'up')}
        >
          <Ionicons name="thumbs-up" size={32} color={thumbs === 'up' ? Colors.success : Colors.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.thumbButton, thumbs === 'down' && styles.thumbButtonActive]}
          onPress={() => setThumbs(thumbs === 'down' ? null : 'down')}
        >
          <Ionicons name="thumbs-down" size={32} color={thumbs === 'down' ? Colors.error : Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Difficulty */}
      <Text style={styles.sectionLabel}>Difficulty Rating</Text>
      <View style={styles.starsRow}>
        {([1, 2, 3, 4, 5] as DifficultyRating[]).map(n => (
          <TouchableOpacity key={n} onPress={() => setDifficulty(difficulty === n ? null : n)}>
            <Ionicons
              name={difficulty && n <= difficulty ? 'star' : 'star-outline'}
              size={36}
              color={difficulty && n <= difficulty ? Colors.warning : Colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Review text */}
      <Text style={styles.sectionLabel}>Review (optional)</Text>
      <TextInput
        style={styles.reviewInput}
        placeholder="Share your thoughts... (280 chars)"
        placeholderTextColor={Colors.inputPlaceholder}
        value={reviewText}
        onChangeText={t => setReviewText(t.slice(0, 280))}
        multiline
        maxLength={280}
      />
      <Text style={styles.charCount}>{reviewText.length}/280</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xxl, paddingTop: 60 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xxl,
  },
  title: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  cancelText: { color: Colors.textTertiary, fontSize: FontSize.md },
  submitText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  videoTitle: { color: Colors.textSecondary, fontSize: FontSize.lg, marginBottom: Spacing.xxl, textAlign: 'center' },
  sectionLabel: {
    color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginBottom: Spacing.md,
  },
  thumbsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.section, marginBottom: Spacing.xxl },
  thumbButton: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  thumbButtonActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceLight },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  reviewInput: {
    backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.inputBorder, padding: Spacing.lg, color: Colors.textPrimary,
    fontSize: FontSize.md, minHeight: 100, textAlignVertical: 'top',
  },
  charCount: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'right', marginTop: Spacing.xs },
});
