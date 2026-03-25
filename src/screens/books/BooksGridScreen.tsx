import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { books, bookCategoryLabels, StuntBook } from '../../data/books';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAppState } from '../../services/AppState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = Math.max(3, Math.floor((SCREEN_WIDTH - 32) / 140));
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 32 - (NUM_COLUMNS - 1) * 12) / NUM_COLUMNS);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.5);

function BookGridCard({ book, onPress }: { book: StuntBook; onPress: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.coverContainer}>
        {!imgError ? (
          <Image
            source={{ uri: book.coverUrl }}
            style={styles.coverImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.coverFallback}>
            <Ionicons name="book" size={28} color={Colors.primary} />
            <Text style={styles.fallbackTitle} numberOfLines={3}>{book.title}</Text>
            <Text style={styles.fallbackAuthor} numberOfLines={1}>{book.author}</Text>
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {bookCategoryLabels[book.category] || book.category}
          </Text>
        </View>
      </View>
      <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
    </TouchableOpacity>
  );
}

export function BooksGridScreen({ navigation }: any) {
  usePageTitle('Stunt Books');
  const { state } = useAppState();
  const hiddenBookIds = new Set(state.settings.hiddenBooks || []);
  const visibleBooks = books.filter(b => !hiddenBookIds.has(b.id));
  const [filter, setFilter] = useState<string | null>(null);
  const filtered = filter ? visibleBooks.filter(b => b.category === filter) : visibleBooks;
  const categories = ['memoir', 'history', 'training', 'reference'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stunt Books</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !filter && styles.filterChipActive]}
          onPress={() => setFilter(null)}
        >
          <Text style={[styles.filterChipText, !filter && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(filter === cat ? null : cat)}
          >
            <Text style={[styles.filterChipText, filter === cat && styles.filterChipTextActive]}>
              {bookCategoryLabels[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        numColumns={NUM_COLUMNS}
        key={`grid-${NUM_COLUMNS}`}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <BookGridCard book={item} onPress={() => navigation.navigate('BookDetail', { bookId: item.id })} />
        )}
      />

      {/* Affiliate Disclosure */}
      <View style={styles.disclosureContainer}>
        <Ionicons name="information-circle-outline" size={12} color={Colors.textMuted} />
        <Text style={styles.disclosureText}>
          Links are affiliate links. Your price stays the same.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 50, paddingBottom: Spacing.md, paddingHorizontal: Spacing.screen,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold,
  },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.screen, gap: 8,
    marginBottom: Spacing.md, flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: FontWeight.semibold },
  filterChipTextActive: { color: '#fff' },
  grid: { paddingHorizontal: Spacing.screen, paddingBottom: 80 },
  row: { gap: 12, marginBottom: 16 },
  card: { flex: 1 },
  coverContainer: {
    width: '100%', height: CARD_HEIGHT, borderRadius: BorderRadius.md,
    overflow: 'hidden', backgroundColor: Colors.surface, marginBottom: 6,
  },
  coverImage: { width: '100%', height: '100%' },
  coverFallback: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10,
    backgroundColor: '#1a1a2e',
  },
  fallbackTitle: {
    color: Colors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold,
    textAlign: 'center', marginTop: 6,
  },
  fallbackAuthor: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 },
  categoryBadge: {
    position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 9, color: Colors.textSecondary, fontWeight: FontWeight.semibold,
    textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },
  bookTitle: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, lineHeight: 15 },
  bookAuthor: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  disclosureContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen,
    paddingVertical: 8, gap: 4, backgroundColor: Colors.surface,
  },
  disclosureText: { color: Colors.textMuted, fontSize: 10 },
});
