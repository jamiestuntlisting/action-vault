import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { StuntBook, bookCategoryLabels } from '../data/books';

const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;

function BookCard({ book, onPress }: { book: StuntBook; onPress: () => void }) {
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

interface BooksSectionProps {
  books: StuntBook[];
  navigation?: any;
}

export function BooksSection({ books, navigation }: BooksSectionProps) {
  function handleBookPress(book: StuntBook) {
    if (navigation) {
      navigation.navigate('BookDetail', { bookId: book.id });
    }
  }

  return (
    <View style={styles.booksSection}>
      <View style={styles.booksSectionHeader}>
        <Ionicons name="library-outline" size={22} color={Colors.primary} />
        <Text style={styles.booksSectionTitle}>Stunt Books</Text>
      </View>
      <Text style={styles.booksSectionSubtitle}>
        Essential reading for stunt performers, coordinators, and action fans
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {books.map(book => (
          <BookCard key={book.id} book={book} onPress={() => handleBookPress(book)} />
        ))}
      </ScrollView>

      {/* Affiliate Disclosure */}
      <View style={styles.disclosureContainer}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.disclosureText}>
          As an Amazon Associate, StuntListing earns from qualifying purchases. Book links are affiliate links — your price stays the same, but a small commission helps support Action Vault.
        </Text>
      </View>
    </View>
  );
}

// Also export BookRow for backward compat
export function BookRow({ books, navigation }: { books: StuntBook[]; navigation?: any }) {
  return <BooksSection books={books} navigation={navigation} />;
}

const styles = StyleSheet.create({
  booksSection: {
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
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
    padding: 10,
    backgroundColor: '#1a1a2e',
  },
  fallbackTitle: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginTop: 6,
  },
  fallbackAuthor: {
    color: Colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  categoryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  bookTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: 15,
  },
  bookAuthor: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
