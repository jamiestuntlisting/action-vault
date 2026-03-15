import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap } from '../../data';

const MAX_REVIEW_CHARS = 1000;

export function ReviewModalScreen({ route, navigation }: any) {
  const { videoId } = route.params;
  const video = videoMap.get(videoId);
  const { dispatch, getRating } = useAppState();
  const existing = getRating(videoId);

  const [thumbs, setThumbs] = useState(existing?.thumbs || null);
  const [bestOfBest, setBestOfBest] = useState(existing?.bestOfBest || false);
  const [reviewText, setReviewText] = useState(existing?.reviewText || '');

  if (!video) return null;

  function handleSubmit() {
    dispatch({
      type: 'SET_RATING',
      payload: {
        profileId: '',
        videoId,
        thumbs,
        difficultyRating: null,
        bestOfBest,
        reviewText: reviewText.trim(),
        createdAt: new Date().toISOString(),
      },
    });
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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

      {/* Best of the Best */}
      <Text style={styles.sectionLabel}>Is this one of the best?</Text>
      <TouchableOpacity
        style={[styles.bestOfBestButton, bestOfBest && styles.bestOfBestActive]}
        onPress={() => setBestOfBest(!bestOfBest)}
        activeOpacity={0.7}
      >
        <Ionicons name={bestOfBest ? 'trophy' : 'trophy-outline'} size={24} color={bestOfBest ? '#FFD700' : Colors.textTertiary} />
        <Text style={[styles.bestOfBestText, bestOfBest && styles.bestOfBestTextActive]}>
          Best of the Best
        </Text>
        {bestOfBest && (
          <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
        )}
      </TouchableOpacity>
      <Text style={styles.bestOfBestHint}>
        Tag this video as an all-time great — the kind of stunt content everyone should see.
      </Text>

      {/* Review text */}
      <Text style={styles.sectionLabel}>Review (optional)</Text>
      <TextInput
        style={styles.reviewInput}
        placeholder="Share your thoughts..."
        placeholderTextColor={Colors.inputPlaceholder}
        value={reviewText}
        onChangeText={t => setReviewText(t.slice(0, MAX_REVIEW_CHARS))}
        multiline
        maxLength={MAX_REVIEW_CHARS}
      />
      <Text style={styles.charCount}>{reviewText.length}/{MAX_REVIEW_CHARS}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.xxl, paddingTop: 60, paddingBottom: 100 },
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
  bestOfBestButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.lg, gap: Spacing.md, borderWidth: 2, borderColor: Colors.border,
  },
  bestOfBestActive: {
    borderColor: '#FFD700', backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  bestOfBestText: {
    color: Colors.textSecondary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold,
  },
  bestOfBestTextActive: {
    color: '#FFD700',
  },
  bestOfBestHint: {
    color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center',
    marginTop: Spacing.sm, marginBottom: Spacing.xxl,
  },
  reviewInput: {
    backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.inputBorder, padding: Spacing.lg, color: Colors.textPrimary,
    fontSize: FontSize.md, minHeight: 120, textAlignVertical: 'top',
  },
  charCount: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'right', marginTop: Spacing.xs },
});
