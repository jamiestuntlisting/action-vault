import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';

const MAX_WIDTH = 960;
const API_BASE = Platform.OS === 'web' ? '' : 'https://actionvault.stuntlisting.com';

type Tab = 'overview' | 'users' | 'content' | 'engagement' | 'purchases' | 'live';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; }
}

function formatDateTime(d: string): string {
  try { return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return d; }
}

export function AnalyticsScreen() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [storedPassword, setStoredPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);

  const fetchData = useCallback(async (query: string, extra?: any) => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/analytics-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: storedPassword, query, ...extra }),
      });
      if (resp.status === 403) { setAuthenticated(false); return null; }
      const json = await resp.json();
      return json.data;
    } catch { return null; }
    finally { setLoading(false); }
  }, [storedPassword]);

  const handleLogin = async () => {
    setAuthError('');
    try {
      const resp = await fetch(`${API_BASE}/api/analytics-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, query: 'overview' }),
      });
      if (resp.status === 403) { setAuthError('Invalid password'); return; }
      const json = await resp.json();
      setStoredPassword(password);
      setAuthenticated(true);
      setData(json.data);
    } catch { setAuthError('Connection error'); }
  };

  useEffect(() => {
    if (!authenticated) return;
    const query = activeTab === 'live' ? 'recent_events'
      : activeTab === 'content' ? 'popular_content'
      : activeTab;
    fetchData(query).then(d => d && setData(d));
  }, [activeTab, authenticated, fetchData]);

  // Auto-refresh live tab
  useEffect(() => {
    if (!authenticated || activeTab !== 'live') return;
    const interval = setInterval(() => {
      fetchData('recent_events').then(d => d && setData(d));
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, authenticated, fetchData]);

  const loadUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    const d = await fetchData('user_detail', { userId });
    setUserDetail(d);
  };

  // ─── Password Gate ───
  if (!authenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.loginBox}>
          <Ionicons name="analytics" size={48} color={Colors.primary} />
          <Text style={styles.loginTitle}>Analytics</Text>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            autoCapitalize="none"
          />
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Enter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── User Detail Modal ───
  if (selectedUserId && userDetail) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.maxWidth}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setSelectedUserId(null); setUserDetail(null); }}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>User: {selectedUserId}</Text>
          </View>
          {(userDetail.events || []).map((e: any, i: number) => (
            <View key={i} style={styles.eventRow}>
              <View style={[styles.eventBadge, { backgroundColor: eventColor(e.event_type) }]}>
                <Text style={styles.eventBadgeText}>{e.event_type}</Text>
              </View>
              <Text style={styles.eventTime}>{formatDateTime(e.created_at)}</Text>
              <Text style={styles.eventDetail} numberOfLines={1}>{summarizeEvent(e)}</Text>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    );
  }

  // ─── Dashboard ───
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'stats-chart' },
    { key: 'users', label: 'Users', icon: 'people' },
    { key: 'content', label: 'Content', icon: 'play-circle' },
    { key: 'engagement', label: 'Engagement', icon: 'trending-up' },
    { key: 'purchases', label: 'Purchases', icon: 'card' },
    { key: 'live', label: 'Live', icon: 'pulse' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {
        const q = activeTab === 'live' ? 'recent_events' : activeTab === 'content' ? 'popular_content' : activeTab;
        fetchData(q).then(d => d && setData(d));
      }} tintColor={Colors.primary} />}
    >
      <View style={styles.maxWidth}>
        <View style={styles.header}>
          <Ionicons name="analytics" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Ionicons name={t.icon as any} size={16} color={activeTab === t.key ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && !data ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.content}>
            {activeTab === 'overview' && data && <OverviewTab data={data} />}
            {activeTab === 'users' && data && <UsersTab data={data} onSelectUser={loadUserDetail} />}
            {activeTab === 'content' && data && <ContentTab data={data} />}
            {activeTab === 'engagement' && data && <EngagementTab data={data} />}
            {activeTab === 'purchases' && data && <PurchasesTab data={data} />}
            {activeTab === 'live' && data && <LiveTab data={data} />}
          </View>
        )}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

// ─── Tab Components ───

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OverviewTab({ data }: { data: any }) {
  return (
    <View style={styles.statGrid}>
      <StatCard label="Total Users" value={data.totalUsers || 0} icon="people" />
      <StatCard label="Active (7d)" value={data.activeUsers7d || 0} icon="person" />
      <StatCard label="Active (30d)" value={data.activeUsers30d || 0} icon="person-add" />
      <StatCard label="Total Events" value={data.totalEvents || 0} icon="pulse" />
      <StatCard label="Video Plays" value={data.totalPlays || 0} icon="play" />
      <StatCard label="Watch Time" value={formatDuration(data.totalWatchSeconds || 0)} icon="time" />
      <StatCard label="Sessions" value={data.totalSessions || 0} icon="log-in" />
      <StatCard label="Purchases" value={data.totalPurchases || 0} icon="card" />
      <StatCard label="Revenue" value={`$${(data.totalRevenue || 0).toFixed(2)}`} icon="cash" />
    </View>
  );
}

function UsersTab({ data, onSelectUser }: { data: any; onSelectUser: (id: string) => void }) {
  const users = data.users || [];
  return (
    <View>
      <Text style={styles.sectionTitle}>{users.length} Users</Text>
      {users.map((u: any, i: number) => (
        <TouchableOpacity key={i} style={styles.userRow} onPress={() => onSelectUser(u.user_id)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userEmail}>{u.user_email || u.user_id}</Text>
            <Text style={styles.userMeta}>
              {u.total_events} events | {u.video_plays || 0} plays | {u.favorites || 0} favs | {u.purchases || 0} purchases
            </Text>
            <Text style={styles.userMeta}>
              Watch time: {formatDuration(parseFloat(u.watch_seconds) || 0)} | Last active: {formatDate(u.last_active)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ContentTab({ data }: { data: any }) {
  const videos = data.topVideos || [];
  const searches = data.topSearches || [];
  const favs = data.topFavorited || [];
  return (
    <View>
      <Text style={styles.sectionTitle}>Top Videos by Plays</Text>
      {videos.map((v: any, i: number) => (
        <View key={i} style={styles.contentRow}>
          <Text style={styles.rank}>#{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.contentTitle}>{cleanJson(v.title) || cleanJson(v.video_id)}</Text>
            <Text style={styles.contentMeta}>{v.play_count} plays | {v.unique_viewers} unique viewers</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Top Searches</Text>
      {searches.map((s: any, i: number) => (
        <View key={i} style={styles.contentRow}>
          <Text style={styles.rank}>#{i + 1}</Text>
          <Text style={styles.contentTitle}>{cleanJson(s.search_query)}</Text>
          <Text style={styles.contentMeta}>{s.search_count}x</Text>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Most Favorited</Text>
      {favs.map((f: any, i: number) => (
        <View key={i} style={styles.contentRow}>
          <Text style={styles.rank}>#{i + 1}</Text>
          <Text style={styles.contentTitle}>{cleanJson(f.video_id)}</Text>
          <Text style={styles.contentMeta}>{f.fav_count} favs</Text>
        </View>
      ))}
    </View>
  );
}

function EngagementTab({ data }: { data: any }) {
  const daily = data.daily || [];
  const maxUsers = Math.max(...daily.map((d: any) => d.active_users), 1);
  const maxPlays = Math.max(...daily.map((d: any) => d.video_plays), 1);

  return (
    <View>
      <Text style={styles.sectionTitle}>Daily Active Users (30 days)</Text>
      <View style={styles.chartContainer}>
        {daily.map((d: any, i: number) => (
          <View key={i} style={styles.barWrapper}>
            <View style={[styles.bar, { height: Math.max((d.active_users / maxUsers) * 100, 2), backgroundColor: Colors.primary }]} />
            {i % 5 === 0 && <Text style={styles.barLabel}>{new Date(d.date).getDate()}</Text>}
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Daily Video Plays</Text>
      <View style={styles.chartContainer}>
        {daily.map((d: any, i: number) => (
          <View key={i} style={styles.barWrapper}>
            <View style={[styles.bar, { height: Math.max((d.video_plays / maxPlays) * 100, 2), backgroundColor: '#22c55e' }]} />
            {i % 5 === 0 && <Text style={styles.barLabel}>{new Date(d.date).getDate()}</Text>}
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Daily Breakdown</Text>
      {daily.slice().reverse().map((d: any, i: number) => (
        <View key={i} style={styles.contentRow}>
          <Text style={styles.contentTitle}>{formatDate(d.date)}</Text>
          <Text style={styles.contentMeta}>{d.active_users} users | {d.video_plays} plays | {d.total_events} events</Text>
        </View>
      ))}
    </View>
  );
}

function PurchasesTab({ data }: { data: any }) {
  const purchases = data.purchases || [];
  let totalRevenue = 0;
  return (
    <View>
      <Text style={styles.sectionTitle}>Purchase Log ({purchases.length})</Text>
      {purchases.map((p: any, i: number) => {
        const ed = typeof p.event_data === 'string' ? JSON.parse(p.event_data) : p.event_data;
        totalRevenue += parseFloat(ed?.price) || 0;
        return (
          <View key={i} style={styles.contentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.contentTitle}>{ed?.title || ed?.itemId || 'Unknown'}</Text>
              <Text style={styles.contentMeta}>{p.user_email} | {ed?.type} | ${(ed?.price || 0).toFixed(2)}</Text>
              <Text style={styles.contentMeta}>{formatDateTime(p.created_at)}</Text>
            </View>
          </View>
        );
      })}
      {purchases.length > 0 && (
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
      )}
    </View>
  );
}

function LiveTab({ data }: { data: any }) {
  const events = data.events || [];
  return (
    <View>
      <Text style={styles.sectionTitle}>Recent Events (auto-refreshes)</Text>
      {events.map((e: any, i: number) => (
        <View key={i} style={styles.eventRow}>
          <View style={[styles.eventBadge, { backgroundColor: eventColor(e.event_type) }]}>
            <Text style={styles.eventBadgeText}>{e.event_type}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventDetail} numberOfLines={1}>{e.user_email} — {summarizeEvent(e)}</Text>
            <Text style={styles.eventTime}>{formatDateTime(e.created_at)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Helpers ───

function cleanJson(val: any): string {
  if (!val) return '';
  const s = String(val);
  return s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s;
}

function eventColor(type: string): string {
  switch (type) {
    case 'video_play': case 'video_progress': return '#3b82f6';
    case 'purchase': return '#22c55e';
    case 'login': case 'session_start': return '#8b5cf6';
    case 'favorite_add': case 'favorite_remove': return '#f59e0b';
    case 'search': return '#06b6d4';
    case 'page_view': return '#6b7280';
    case 'rating': return '#ec4899';
    default: return Colors.textMuted;
  }
}

function summarizeEvent(e: any): string {
  const d = typeof e.event_data === 'string' ? JSON.parse(e.event_data) : (e.event_data || {});
  switch (e.event_type) {
    case 'page_view': return `Viewed ${d.screen || 'page'}`;
    case 'video_play': return `Played ${d.title || d.videoId || 'video'}`;
    case 'video_progress': return `Watched ${formatDuration(d.progressSeconds || 0)}${d.completed ? ' (completed)' : ''}`;
    case 'search': return `Searched "${d.query}" (${d.resultCount} results)`;
    case 'purchase': return `Purchased ${d.title || d.itemId} ($${d.price})`;
    case 'favorite_add': return `Favorited ${d.videoId}`;
    case 'favorite_remove': return `Unfavorited ${d.videoId}`;
    case 'category_browse': return `Browsed ${d.categoryName}`;
    case 'login': return 'Logged in';
    case 'session_start': return `Session started (${d.platform})`;
    case 'rating': return `Rated ${d.videoId} ${d.thumbs || ''}`;
    case 'follow': return `${d.action} ${d.followableType} ${d.followableId}`;
    case 'bookmark_add': return `Bookmarked ${d.videoId} at ${formatDuration(d.timestampSeconds || 0)}`;
    default: return JSON.stringify(d).slice(0, 60);
  }
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  maxWidth: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: Spacing.screen },

  // Login
  loginBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loginTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.md, marginBottom: Spacing.xl },
  passwordInput: {
    width: '100%', maxWidth: 320, backgroundColor: Colors.surface, color: Colors.textPrimary,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border || '#333',
  },
  errorText: { color: '#ef4444', fontSize: FontSize.sm, marginTop: Spacing.sm },
  loginButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: 40, paddingVertical: 14, marginTop: Spacing.lg,
  },
  loginButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingTop: 60, paddingBottom: Spacing.md,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold },

  // Tabs
  tabBar: { marginBottom: Spacing.lg },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    marginRight: 4, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  tabActive: { backgroundColor: 'rgba(239,68,68,0.15)' },
  tabText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.primary },
  content: { minHeight: 300 },

  // Stats
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, minWidth: 140, flex: 1, alignItems: 'center', gap: 4,
  },
  statValue: { color: Colors.textPrimary, fontSize: 24, fontWeight: FontWeight.bold },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs },

  // Sections
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md, marginTop: Spacing.sm },

  // Users
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  userEmail: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  userMeta: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  // Content
  contentRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    padding: Spacing.sm, marginBottom: 4,
  },
  rank: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold, width: 30, textAlign: 'center' },
  contentTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, flex: 1 },
  contentMeta: { color: Colors.textMuted, fontSize: FontSize.xs },

  // Charts
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 2, paddingHorizontal: 4 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '80%', borderRadius: 2, minWidth: 3 },
  barLabel: { color: Colors.textMuted, fontSize: 8, marginTop: 2 },

  // Events
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  eventBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.xs, minWidth: 80, alignItems: 'center' },
  eventBadgeText: { color: '#fff', fontSize: 9, fontWeight: FontWeight.bold },
  eventTime: { color: Colors.textMuted, fontSize: FontSize.xs, minWidth: 90 },
  eventDetail: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
});
