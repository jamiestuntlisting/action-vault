import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { StuntBook, bookCategoryLabels } from '../data/books';

const CARD_WIDTH = 140;
const CARD_HEIGHT = 210;

function BookCard({ book }: { book: StuntBook }) {
  const [imgError, setImgError] = useState(false);

  function handlePress() {
    if (Platform.OS === 'web') {
      window.open(book.amazonUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(book.amazonUrl);
    }
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
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
            <Ionicons name="book" size={36} color={Colors.textMuted} />
            <Text style={styles.fallbackTitle} numberOfLines={3}>{book.title}</Text>
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {book.category === 'memoir' ? '📖' : book.category === 'history' ? '📚' : book.category === 'training' ? '🎓' : '📘'}
          </Text>
        </View>
      </View>
      <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
      <View style={styles.amazonBadge}>
        <Text style={styles.amazonText}>View on Amazon</Text>
        <Ionicons name="open-outline" size={10} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

interface BookRowProps {
  books: StuntBook[];
  category?: string;
  showAll?: boolean;
}

export function BookRow({ books, category, showAll }: BookRowProps) {
  const filtered = category ? books.filter(b => b.category === category) : books;
  if (filtered.length === 0) return null;

  const title = category ? bookCategoryLabels[category] || category : 'Stunt Books';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="book-outline" size={20} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filtered.map(book => (
          <BookCard key={book.id} book={book} />
        ))}
      </ScrollView>
    </View>
  );
}

export function BooksSection({ books }: { books: StuntBook[] }) {
  return (
    <View style={styles.booksSection}>
      <View style={styles.booksSectionHeader}>
        <Ionicons name="library-outline" size={24} color={Colors.primary} />
        <Text style={styles.booksSectionTitle}>Stunt Books</Text>
      </View>
      <Text style={styles.booksSectionSubtitle}>
        Essential reading for stunt performers, coordinators, and action fans
      </Text>

      <BookRow books={books} category="memoir" />
      <BookRow books={books} category="history" />
      <BookRow books={books} category="training" />
      <BookRow books={books} category="reference" />

      {/* Affiliate Disclosure */}
      <View style={styles.disclosureContainer}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.disclosureText}>
          As an Amazon Associate, StuntListing earns from qualifying purchases. Book links on this page are affiliate links — your purchase price stays the same, but a small commission helps support Action Vault.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  booksSection: {
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  booksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    marginBottom: 4,
    gap: 8,
  },
  booksSectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  booksSectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
  },
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
  },
  coverContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginBottom: 6,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surfaceLight,
  },
  fallbackTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  categoryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 12,
  },
  bookTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: 16,
  },
  bookAuthor: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  amazonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  amazonText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  disclosureContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.screen,
    marginTop: Spacing.lg,
    gap: 6,
  },
  disclosureText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
