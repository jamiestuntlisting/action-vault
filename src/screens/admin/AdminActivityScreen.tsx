// Admin: user activity dashboard. Reads /api/admin/analytics-summary
// which aggregates the rolling buffer in data/analytics-events.json.
// Shows logged-in users with last-seen + watch / play counts, top
// videos, top pages visited, and a recent-events tail.

import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { usePageTitle } from '../../hooks/usePageTitle';

const API_BASE = Platform.OS === 'web' ? '' : 'https://action-vault-blond.vercel.app';

const ADMIN_EMAILS = [
  'james.northrup@gmail.com',
  'warrenhullstunts@gmail.com',
  'greg@stuntlisting.com',
  'info@stuntlisting.com',
  'jamie@stuntlisting.com',
  'warren@stuntlisting.com',
];

interface UserStat {
  userId: string;
  userEmail: string | null;
  totalEvents: number;
  videoPlays: number;
  pageViews: number;
  watchSeconds: number;
  firstSeen: string;
  lastSeen: string;
  sessionCount: number;
}

interface TopVideo { videoId: string; title: string | null; plays: number; uniqueViewers: number; }
interface TopPage  { screen: string; views: number; }
interface RecentEvent {
  userId: string;
  userEmail: string | null;
  eventType: string;
  eventData: any;
  sessionId: string | null;
  timestamp: string;
}

interface SummaryResponse {
  lastUpdatedAt: string | null;
  overview: {
    totalUsers: number;
    activeUsers7d: number;
    activeUsers30d: number;
    totalEvents: number;
    totalVideoPlays: number;
    totalPageViews: number;
  };
  users: UserStat[];
  topVideos: TopVideo[];
  topPages: TopPage[];
  eventCounts: Record<string, number>;
  recent: RecentEvent[];
}

function formatSeconds(s: number): string {
  if (!s || s < 60) return `${Math.round(s || 0)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

function relativeTime(iso: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

export function AdminActivityScreen({ navigation }: any) {
  usePageTitle('Admin · User Activity');
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummaryResponse | null>(null);

  const userEmail = state.currentUser?.email?.toLowerCase() || '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail) && !state.settings.adminViewAsUser;

  async function fetchSummary() {
    if (!state.authToken) {
      setError('Not signed in');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/admin/analytics-summary`, {
        headers: { Authorization: `Bearer ${state.authToken}` },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setData(j);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSummary(); /* eslint-disable-next-line */ }, []);

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed" size={48} color={Colors.textMuted} />
        <Text style={styles.title}>Admin only</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.maxWidth}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Admin</Text>
            <Text style={styles.title}>User Activity</Text>
            {data?.lastUpdatedAt && (
              <Text style={styles.subtitle}>Updated {relativeTime(data.lastUpdatedAt)}</Text>
            )}
          </View>
          <TouchableOpacity onPress={fetchSummary} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color={Colors.accent} style={{ marginTop: 32 }} />}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {data && (
          <>
            {/* Overview cards */}
            <View style={styles.statGrid}>
              <Stat label="Users" value={String(data.overview.totalUsers)} />
              <Stat label="Active 7d" value={String(data.overview.activeUsers7d)} />
              <Stat label="Active 30d" value={String(data.overview.activeUsers30d)} />
              <Stat label="Events" value={String(data.overview.totalEvents)} />
              <Stat label="Video plays" value={String(data.overview.totalVideoPlays)} />
              <Stat label="Page views" value={String(data.overview.totalPageViews)} />
            </View>

            {/* Users */}
            <Text style={styles.sectionTitle}>Users ({data.users.length})</Text>
            {data.users.length === 0 ? (
              <Text style={styles.empty}>No tracked users yet.</Text>
            ) : (
              data.users.map(u => (
                <View key={u.userId} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {u.userEmail || `user-${u.userId}`}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      Last seen {relativeTime(u.lastSeen)} · {u.sessionCount} session{u.sessionCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowStat}>{u.videoPlays} plays</Text>
                    <Text style={styles.rowMeta}>{formatSeconds(u.watchSeconds)} watched</Text>
                    <Text style={styles.rowMeta}>{u.pageViews} pages</Text>
                  </View>
                </View>
              ))
            )}

            {/* Top videos */}
            <Text style={styles.sectionTitle}>Top videos</Text>
            {data.topVideos.length === 0 ? (
              <Text style={styles.empty}>No video plays tracked yet.</Text>
            ) : (
              data.topVideos.map(v => (
                <View key={v.videoId} style={styles.row}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{v.title || v.videoId}</Text>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowStat}>{v.plays}</Text>
                    <Text style={styles.rowMeta}>{v.uniqueViewers} unique</Text>
                  </View>
                </View>
              ))
            )}

            {/* Top pages */}
            <Text style={styles.sectionTitle}>Top pages</Text>
            {data.topPages.length === 0 ? (
              <Text style={styles.empty}>No page views tracked yet.</Text>
            ) : (
              data.topPages.map(p => (
                <View key={p.screen} style={styles.row}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{p.screen}</Text>
                  <Text style={styles.rowStat}>{p.views}</Text>
                </View>
              ))
            )}

            {/* Recent activity */}
            <Text style={styles.sectionTitle}>Recent activity</Text>
            {data.recent.length === 0 ? (
              <Text style={styles.empty}>No recent events.</Text>
            ) : (
              data.recent.slice(0, 60).map((e, i) => (
                <View key={i} style={styles.eventRow}>
                  <Text style={styles.eventTime}>{relativeTime(e.timestamp)}</Text>
                  <Text style={styles.eventBody} numberOfLines={1}>
                    <Text style={styles.eventEmail}>{e.userEmail || `user-${e.userId}`}</Text>
                    {' · '}
                    <Text style={styles.eventType}>{e.eventType}</Text>
                    {e.eventData?.screen ? <Text> · {e.eventData.screen}</Text> : null}
                    {e.eventData?.title ? <Text> · {e.eventData.title}</Text> : null}
                    {e.eventData?.videoId && !e.eventData?.title ? <Text> · {e.eventData.videoId}</Text> : null}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, backgroundColor: Colors.background },
  maxWidth: { width: '100%', maxWidth: 960, alignSelf: 'center', paddingHorizontal: Spacing.screen },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Platform.OS === 'web' ? Spacing.xs : 50, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm },
  eyebrow: { color: Colors.textTertiary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, marginTop: 2 },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  btn: { marginTop: Spacing.lg, backgroundColor: Colors.accent, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  btnText: { color: '#fff', fontWeight: FontWeight.bold },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(238,45,36,0.15)', padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.lg },
  errorText: { color: Colors.error, flex: 1 },
  empty: { color: Colors.textMuted, fontStyle: 'italic', marginTop: Spacing.sm },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  statCard: { flexBasis: '32%', flexGrow: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'flex-start' },
  statValue: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.heavy },
  statLabel: { color: Colors.textTertiary, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.surfaceHighlight },
  rowTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium, flex: 1 },
  rowMeta: { color: Colors.textTertiary, fontSize: FontSize.xs },
  rowRight: { alignItems: 'flex-end' },
  rowStat: { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4, borderTopWidth: 1, borderTopColor: Colors.surfaceHighlight },
  eventTime: { color: Colors.textMuted, fontSize: FontSize.xs, width: 70 },
  eventBody: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
  eventEmail: { color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  eventType: { color: Colors.accent, fontWeight: FontWeight.semibold },
});
