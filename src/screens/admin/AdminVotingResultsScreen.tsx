// Admin: aggregated voting results across all users for both Skill Reel of
// the Month and Stunt Reels of the Month. Reads /api/admin/voting-results
// (server-side aggregation; admin email allowlist enforced there too).

import React, { useEffect, useState, useMemo } from 'react';
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

interface VoteSummary {
  reelId: string;
  count: number;
  average: number;
  voters: Array<{
    userId: number;
    userName: string;
    userEmail: string;
    alias: string | null;
    unionStatus: string | null;
    rating: number;
    updatedAt: string;
  }>;
}

interface EntrySummary {
  entryId: string;
  totalVotes: number;
  uniqueVoters: number;
  reels: VoteSummary[];
}

export function AdminVotingResultsScreen({ navigation }: any) {
  usePageTitle('Admin · Voting Results');
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ totalVotes: number; lastUpdatedAt: string; entries: EntrySummary[] } | null>(null);
  const [showVoters, setShowVoters] = useState<Record<string, boolean>>({});

  const userEmail = state.currentUser?.email?.toLowerCase() || '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  async function fetchResults() {
    if (!state.authToken) {
      setError('Not signed in');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/admin/voting-results`, {
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

  useEffect(() => { fetchResults(); /* eslint-disable-next-line */ }, []);

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
            <Text style={styles.title}>Voting Results</Text>
            {data?.lastUpdatedAt && (
              <Text style={styles.subtitle}>{data.totalVotes} total votes · last updated {new Date(data.lastUpdatedAt).toLocaleString()}</Text>
            )}
          </View>
          <TouchableOpacity onPress={fetchResults} style={styles.refreshBtn}>
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

        {data?.entries.map(entry => (
          <View key={entry.entryId} style={styles.entryBlock}>
            <Text style={styles.entryTitle}>{entry.entryId}</Text>
            <Text style={styles.entryMeta}>
              {entry.totalVotes} votes · {entry.uniqueVoters} unique voter{entry.uniqueVoters === 1 ? '' : 's'}
            </Text>

            {entry.reels.length === 0 ? (
              <Text style={styles.empty}>No votes for this entry yet.</Text>
            ) : (
              entry.reels.map(reel => {
                const open = showVoters[`${entry.entryId}/${reel.reelId}`];
                return (
                  <View key={reel.reelId} style={styles.reelRow}>
                    <View style={styles.reelLeft}>
                      <Text style={styles.reelId} numberOfLines={1}>{reel.reelId}</Text>
                      <Text style={styles.reelMeta}>
                        {reel.count} vote{reel.count === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <View style={styles.reelRight}>
                      <Text style={styles.average}>{reel.average.toFixed(2)}</Text>
                      <TouchableOpacity
                        onPress={() => setShowVoters(s => ({ ...s, [`${entry.entryId}/${reel.reelId}`]: !s[`${entry.entryId}/${reel.reelId}`] }))}
                      >
                        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                    {open && (
                      <View style={styles.votersList}>
                        {reel.voters
                          .slice()
                          .sort((a, b) => b.rating - a.rating)
                          .map(v => (
                            <View key={v.userId} style={styles.voterRow}>
                              <Text style={styles.voterName} numberOfLines={1}>
                                {v.userName} {v.unionStatus ? `· ${v.unionStatus}` : ''}
                              </Text>
                              <Text style={styles.voterRating}>{v.rating}</Text>
                            </View>
                          ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ))}

        {!loading && !error && (data?.entries.length === 0 || !data) && (
          <Text style={styles.empty}>No votes recorded yet. Once members rate reels, results will appear here.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, backgroundColor: Colors.background },
  maxWidth: { width: '100%', maxWidth: 960, alignSelf: 'center', paddingHorizontal: Spacing.screen },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md, paddingTop: Platform.OS === 'web' ? Spacing.lg : 50 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm },
  eyebrow: { color: Colors.textTertiary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: FontWeight.heavy, marginTop: 2 },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  btn: { marginTop: Spacing.lg, backgroundColor: Colors.accent, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  btnText: { color: '#fff', fontWeight: FontWeight.bold },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(238,45,36,0.15)', padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.lg },
  errorText: { color: Colors.error, flex: 1 },
  entryBlock: { marginTop: Spacing.xl, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  entryTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  entryMeta: { color: Colors.textTertiary, fontSize: FontSize.sm, marginTop: 2, marginBottom: Spacing.md },
  empty: { color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.lg },
  reelRow: { paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.surfaceHighlight },
  reelLeft: { flexDirection: 'row', justifyContent: 'space-between' },
  reelId: { color: Colors.textPrimary, fontSize: FontSize.sm, flex: 1 },
  reelMeta: { color: Colors.textTertiary, fontSize: FontSize.xs },
  reelRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  average: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: FontWeight.bold, flex: 1 },
  votersList: { marginTop: Spacing.sm, paddingLeft: Spacing.md },
  voterRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  voterName: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
  voterRating: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginLeft: Spacing.md },
});
