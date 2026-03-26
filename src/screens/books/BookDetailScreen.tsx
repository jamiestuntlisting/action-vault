import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { books, bookCategoryLabels } from '../../data/books';
import { usePageTitle } from '../../hooks/usePageTitle';

export function BookDetailScreen({ route, navigation }: any) {
  const { bookId } = route.params;
  const { state, dispatch } = useAppState();
  const book = books.find(b => b.id === bookId);
  usePageTitle(book?.title);
  const [imgError, setImgError] = useState(false);

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Book not found</Text>
      </View>
    );
  }

  // Check if book is in user's list or marked as read
  const isInList = state.settings.bookList?.includes(book.id) ?? false;
  const isRead = state.settings.booksRead?.includes(book.id) ?? false;

  function toggleBookList() {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        bookList: isInList
          ? (state.settings.bookList || []).filter((id: string) => id !== book!.id)
          : [...(state.settings.bookList || []), book!.id],
      },
    });
  }

  function toggleRead() {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        booksRead: isRead
          ? (state.settings.booksRead || []).filter((id: string) => id !== book!.id)
          : [...(state.settings.booksRead || []), book!.id],
      },
    });
  }

  function openAmazon() {
    if (Platform.OS === 'web') {
      window.open(book!.amazonUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(book!.amazonUrl);
    }
  }

  function openEbay() {
    if (Platform.OS === 'web') {
      window.open(book!.ebaySearchUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(book!.ebaySearchUrl);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Book Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cover + Info */}
        <View style={styles.topSection}>
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
                <Ionicons name="book" size={40} color={Colors.primary} />
                <Text style={styles.fallbackTitle} numberOfLines={4}>{book.title}</Text>
              </View>
            )}
          </View>
          <View style={styles.infoSection}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>
                {bookCategoryLabels[book.category] || book.category}
              </Text>
            </View>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>by {book.author}</Text>

            {/* Status badges */}
            <View style={styles.statusRow}>
              {isRead && (
                <View style={styles.readBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.readBadgeText}>Read</Text>
                </View>
              )}
              {isInList && (
                <View style={styles.listBadge}>
                  <Ionicons name="bookmark" size={14} color={Colors.primary} />
                  <Text style={styles.listBadgeText}>In My List</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>About this Book</Text>
          <Text style={styles.description}>{book.description}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={[styles.actionButton, isInList && styles.actionButtonActive]} onPress={toggleBookList}>
            <Ionicons name={isInList ? 'bookmark' : 'bookmark-outline'} size={20} color={isInList ? Colors.primary : Colors.textPrimary} />
            <Text style={[styles.actionButtonText, isInList && styles.actionButtonTextActive]}>
              {isInList ? 'In My List' : 'Add to List'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, isRead && styles.actionButtonActive]} onPress={toggleRead}>
            <Ionicons name={isRead ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={isRead ? '#4CAF50' : Colors.textPrimary} />
            <Text style={[styles.actionButtonText, isRead && { color: '#4CAF50' }]}>
              {isRead ? 'Read' : 'Mark as Read'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buy Buttons */}
        <View style={styles.buySection}>
          <Text style={styles.buyTitle}>Purchase</Text>

          <TouchableOpacity style={styles.amazonButton} onPress={openAmazon}>
            <Text style={styles.amazonButtonText}>Buy on Amazon</Text>
            <Ionicons name="open-outline" size={16} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.ebayButton} onPress={openEbay}>
            <Text style={styles.ebayButtonText}>Search on eBay</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Affiliate Disclosure */}
        <View style={styles.disclosureContainer}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.disclosureText}>
            As an Amazon Associate, StuntListing earns from qualifying purchases. Links on this page are affiliate links — your price stays the same, but a small commission helps support StuntListing TV.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.screen,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    paddingBottom: 100,
  },
  topSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  coverContainer: {
    width: 150,
    height: 225,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
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
    backgroundColor: '#1a1a2e',
  },
  fallbackTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginTop: 8,
  },
  infoSection: {
    flex: 1,
    paddingTop: 4,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  categoryTagText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: 24,
    marginBottom: 6,
  },
  author: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  listBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(229,9,20,0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  listBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  descriptionSection: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xl,
  },
  descriptionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(229,9,20,0.08)',
  },
  actionButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  actionButtonTextActive: {
    color: Colors.primary,
  },
  buySection: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  buyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  amazonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FF9900',
  },
  amazonButtonText: {
    color: '#000',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  ebayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ebayButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  disclosureContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.screen,
    marginTop: Spacing.xl,
    gap: 6,
  },
  disclosureText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: 100,
  },
});
