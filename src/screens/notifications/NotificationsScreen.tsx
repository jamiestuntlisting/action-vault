import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';

const typeIcons: Record<string, string> = {
  new_content: 'film-outline',
  followed_person: 'person-outline',
  trending: 'trending-up',
  weekly_digest: 'star-outline',
  system: 'information-circle-outline',
};

export function NotificationsScreen({ navigation }: any) {
  const { getProfileNotifications, dispatch } = useAppState();
  const notifications = getProfileNotifications();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notifItem, !item.read && styles.notifUnread]}
            onPress={() => {
              dispatch({ type: 'MARK_NOTIFICATION_READ', payload: item.id });
              if (item.deepLink) {
                // Navigate to deep link
              }
            }}
          >
            <View style={[styles.iconCircle, !item.read && styles.iconCircleUnread]}>
              <Ionicons name={(typeIcons[item.type] || 'notifications-outline') as any} size={20}
                color={!item.read ? Colors.primary : Colors.textTertiary} />
            </View>
            <View style={styles.notifContent}>
              <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>{item.title}</Text>
              <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.notifTime}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>Follow coordinators and performers to get notified</Text>
          </View>
        }
      />
    </View>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  backButton: { position: 'absolute', top: 50, left: Spacing.screen, zIndex: 10 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.screen, marginBottom: Spacing.lg,
  },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  markAllText: { color: Colors.primary, fontSize: FontSize.sm },
  list: { paddingBottom: 100 },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.screen, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  notifUnread: { backgroundColor: 'rgba(229,9,20,0.05)' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  iconCircleUnread: { backgroundColor: 'rgba(229,9,20,0.15)' },
  notifContent: { flex: 1 },
  notifTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  notifTitleUnread: { fontWeight: FontWeight.bold },
  notifBody: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2, lineHeight: 18 },
  notifTime: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 100, gap: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptySubtitle: { color: Colors.textTertiary, fontSize: FontSize.md, textAlign: 'center', paddingHorizontal: 40 },
});
