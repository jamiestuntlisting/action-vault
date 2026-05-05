// Admin: aggregated voting results across all users for both Skill Reel of
// the Month and Stunt Reels of the Month. Reads /api/admin/voting-results
// (server-side aggregation; admin email allowlist enforced there too).
//
// View pivots BY PERSON NAME (Jamie's explicit request, May 2026): each
// entry shows a list of voters alphabetically, with each voter's votes
// (reel id + rating) underneath when expanded. The legacy reel-aggregate
// data still comes back from the API for the optional secondary view.

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

interface ReelSummary {
  reelId: string;
  count: number;
  average: number;
}

interface VoterSummary {
  userId: number;
  userName: string;
  userEmail: string;
  alias: string | null;
  unionStatus: string | null;
  votes: Array<{ reelId: string; rating: number; updatedAt: string }>;
  averageRating: number;
  lastUpdatedAt: string;
}

interface EntrySummary {
  entryId: string;
  totalVotes: number;
  uniqueVoters: number;
  reels: ReelSummary[];
  voters: VoterSummary[];
}

export function AdminVotingResultsScreen({ navigation }: any) {
  usePageTitle('Admin · Voting Results');
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ totalVotes: number; lastUpdatedAt: string; entries: EntrySummary[] } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
            <Text style={styles.eyebrow}>Admin · By Voter</Text>
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

        {data?.entries.map(entry => {
          // Per-entry reel-id → average map for the voter rows so they can
          // show "+X above avg" / "−Y below avg" context next to each rating.
          const reelAvg = new Map<string, number>();
          for (const r of entry.reels || []) reelAvg.set(r.reelId, r.average);
          return (
            <View key={entry.entryId} style={styles.entryBlock}>
              <Text style={styles.entryTitle}>{entry.entryId}</Text>
              <Text style={styles.entryMeta}>
                {entry.totalVotes} votes · {entry.uniqueVoters} unique voter{entry.uniqueVoters === 1 ? '' : 's'}
              </Text>

              {(!entry.voters || entry.voters.length === 0) ? (
                <Text style={styles.empty}>No votes for this entry yet.</Text>
              ) : (
                entry.voters.map(voter => {
                  const key = `${entry.entryId}/${voter.userId}`;
                  const open = !!expanded[key];
                  return (
                    <View key={key} style={styles.voterBlock}>
                      <TouchableOpacity
                        style={styles.voterHeader}
                        onPress={() => setExpanded(s => ({ ...s, [key]: !s[key] }))}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.voterName} numberOfLines={1}>
                            {voter.userName || '(unnamed)'}
                            {voter.unionStatus ? <Text style={styles.voterUnion}> · {voter.unionStatus}</Text> : null}
                          </Text>
                          <Text style={styles.voterMeta} numberOfLines={1}>
                            {voter.votes.length} rating{voter.votes.length === 1 ? '' : 's'}
                            {voter.alias ? ` · @${voter.alias}` : ''}
                          </Text>
                        </View>
                        <View style={styles.voterRight}>
                          <Text style={styles.voterAvg}>{voter.averageRating.toFixed(2)}</Text>
                          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
                        </View>
                      </TouchableOpacity>
                      {open && (
                        <View style={styles.votesList}>
                          {voter.votes.map(v => {
                            const avg = reelAvg.get(v.reelId);
                            const delta = avg != null ? Math.round((v.rating - avg) * 10) / 10 : null;
                            return (
                              <View key={v.reelId} style={styles.voteRow}>
                                <Text style={styles.voteReelId} numberOfLines={1}>{v.reelId}</Text>
                                {delta != null && delta !== 0 && (
                                  <Text style={[styles.voteDelta, { color: delta > 0 ? '#4ade80' : '#f87171' }]}>
                                    {delta > 0 ? '+' : ''}{delta.toFixed(1)} vs avg
                                  </Text>
                                )}
                                <Text style={styles.voteRating}>{v.rating}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          );
        })}

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
  voterBlock: { paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.surfaceHighlight },
  voterHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  voterName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  voterUnion: { color: Colors.textTertiary, fontSize: FontSize.sm, fontWeight: FontWeight.regular },
  voterMeta: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  voterRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  voterAvg: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: FontWeight.bold, minWidth: 44, textAlign: 'right' },
  votesList: { marginTop: Spacing.sm, paddingLeft: Spacing.md, gap: 2 },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  voteReelId: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
  voteDelta: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  voteRating: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, minWidth: 24, textAlign: 'right' },
});
