import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../theme';
import { StuntBook, bookCategoryLabels } from '../data/books';

const isWeb = Platform.OS === 'web';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const flatListRef = useRef<FlatList>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [isHovered, setIsHovered] = useState(false);

  const SCROLL_AMOUNT = containerWidth * 0.75;
  const canScrollLeft = scrollOffset > 10;
  const canScrollRight = contentWidth > containerWidth && scrollOffset < contentWidth - containerWidth - 10;

  const scrollLeft = useCallback(() => {
    const newOffset = Math.max(0, scrollOffset - SCROLL_AMOUNT);
    flatListRef.current?.scrollToOffset({ offset: newOffset, animated: true });
  }, [scrollOffset, SCROLL_AMOUNT]);

  const scrollRight = useCallback(() => {
    const maxOffset = contentWidth - containerWidth;
    const newOffset = Math.min(maxOffset, scrollOffset + SCROLL_AMOUNT);
    flatListRef.current?.scrollToOffset({ offset: newOffset, animated: true });
  }, [scrollOffset, contentWidth, containerWidth, SCROLL_AMOUNT]);

  const handleScroll = useCallback((event: any) => {
    setScrollOffset(event.nativeEvent.contentOffset.x);
  }, []);

  const handleContentSizeChange = useCallback((w: number) => {
    setContentWidth(w);
  }, []);

  const handleLayout = useCallback((event: any) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  function handleBookPress(book: StuntBook) {
    if (navigation) {
      navigation.navigate('BookDetail', { bookId: book.id });
    }
  }

  function handleSeeAll() {
    if (navigation) {
      navigation.navigate('BooksGrid');
    }
  }

  const hoverProps = isWeb ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  const showArrows = isWeb && isHovered;

  return (
    <View style={styles.booksSection} {...(hoverProps as any)}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSeeAll} style={styles.titleTouchable}>
          <Ionicons name="library-outline" size={22} color={Colors.primary} />
          <Text style={styles.booksSectionTitle}>Stunt Books</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} style={{ marginLeft: 4, marginTop: 2 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.booksSectionSubtitle}>
        Essential reading for stunt performers, coordinators, and action fans
      </Text>

      <View style={styles.listContainer} onLayout={handleLayout}>
        <FlatList
          ref={flatListRef}
          data={books}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyExtractor={item => item.id}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <BookCard book={item} onPress={() => handleBookPress(item)} />
          )}
        />

        {/* Left Arrow */}
        {showArrows && canScrollLeft && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowLeft]}
            onPress={scrollLeft}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Right Arrow */}
        {showArrows && canScrollRight && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowRight]}
            onPress={scrollRight}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-forward" size={28} color="#fff" />
          </TouchableOpacity>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    marginBottom: 4,
  },
  titleTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  booksSectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  seeAll: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  booksSectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
  },
  listContainer: {
    position: 'relative',
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
  arrowButton: {
    position: 'absolute',
    top: 0,
    bottom: 30,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  arrowLeft: {
    left: 0,
    borderTopRightRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  arrowRight: {
    right: 0,
    borderTopLeftRadius: BorderRadius.sm,
    borderBottomLeftRadius: BorderRadius.sm,
  },
});
