// Admin: for each YouTube-discovered stunt reel, run StuntListing performer
// matching live and let the admin override mismatches by typing a
// StuntListing ID + alias. Reads /api/admin/match-stunt-reels and writes
// via /api/admin/stunt-reel-overrides.

import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, TextInput, Linking, Image } from 'react-native';
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

interface MatchRow {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  publishedAt: string;
  override: boolean;
  searchedNames: string[];
  match: null | {
    id: number;
    alias: string;
    firstName: string | null;
    lastName: string | null;
    instagram: string | null;
    profileUrl: string;
    reelOnProfile: boolean;
  };
  fallbackSearchUrl: string | null;
  otherCandidates?: Array<{ id: number; alias: string; firstName: string; lastName: string }>;
}

export function AdminStuntReelMatcherScreen({ navigation, route }: any) {
  usePageTitle('Admin · Stunt Reel Matcher');
  const { state } = useAppState();
  const [scope, setScope] = useState<'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [inputs, setInputs] = useState<Record<string, { id: string; alias: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const userEmail = state.currentUser?.email?.toLowerCase() || '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  async function fetchMatches(s: 'month' | 'all' = scope) {
    if (!state.authToken) {
      setError('Not signed in');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/admin/match-stunt-reels?scope=${s}`, {
        headers: { Authorization: `Bearer ${state.authToken}` },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setRows(j.matches || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveOverride(youtubeId: string, idStr: string, alias: string) {
    if (!state.authToken) return;
    setSavingId(youtubeId);
    try {
      const body = idStr || alias
        ? { youtubeId, stuntListingId: idStr ? Number(idStr) : null, alias: alias || null }
        : { youtubeId };
      const r = await fetch(`${API_BASE}/api/admin/stunt-reel-overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.authToken}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      // Refresh just this row by re-fetching everything (small, simpler than partial update).
      await fetchMatches();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => { fetchMatches(); /* eslint-disable-next-line */ }, [scope]);

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
            <Text style={styles.title}>Stunt Reel ↔ StuntListing Matcher</Text>
            <Text style={styles.subtitle}>{rows.length} reel{rows.length === 1 ? '' : 's'} · {scope === 'month' ? 'this month' : 'all discovered'}</Text>
          </View>
          <TouchableOpacity onPress={() => fetchMatches()} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.scopeRow}>
          <TouchableOpacity
            onPress={() => setScope('month')}
            style={[styles.scopeBtn, scope === 'month' && styles.scopeBtnActive]}
          >
            <Text style={[styles.scopeBtnText, scope === 'month' && styles.scopeBtnTextActive]}>This month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setScope('all')}
            style={[styles.scopeBtn, scope === 'all' && styles.scopeBtnActive]}
          >
            <Text style={[styles.scopeBtnText, scope === 'all' && styles.scopeBtnTextActive]}>All discovered</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color={Colors.accent} style={{ marginTop: 32 }} />}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {rows.map(row => {
          const cur = inputs[row.youtubeId] || { id: row.match?.id?.toString() || '', alias: row.match?.alias || '' };
          return (
            <View key={row.youtubeId} style={styles.row}>
              <View style={styles.rowHead}>
                {row.thumbnailUrl ? (
                  <Image source={{ uri: row.thumbnailUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: Colors.surfaceHighlight }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.reelTitle} numberOfLines={2}>{row.title}</Text>
                  <Text style={styles.reelChannel}>
                    {row.channelName} · {row.publishedAt.slice(0, 10)}
                  </Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${row.youtubeId}`)}>
                    <Text style={styles.linkSmall}>YouTube ↗</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Match status */}
              <View style={styles.matchBlock}>
                {row.match ? (
                  <>
                    <View style={styles.kvRow}>
                      <Text style={styles.kLabel}>On StuntListing</Text>
                      <Text style={styles.kValueGood}>Yes {row.override ? '(override)' : ''}</Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kLabel}>ID</Text>
                      <TouchableOpacity onPress={() => Linking.openURL(row.match!.profileUrl)}>
                        <Text style={styles.kLink}>
                          {row.match.id} · {row.match.firstName} {row.match.lastName} ↗
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kLabel}>Reel on profile?</Text>
                      <Text style={row.match.reelOnProfile ? styles.kValueGood : styles.kValueBad}>
                        {row.match.reelOnProfile ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kLabel}>Instagram</Text>
                      {row.match.instagram ? (
                        <TouchableOpacity onPress={() => {
                          const handle = row.match!.instagram!.replace(/^@/, '');
                          Linking.openURL(`https://www.instagram.com/${handle}`);
                        }}>
                          <Text style={styles.kLink}>{row.match.instagram} ↗</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.kValueMuted}>—</Text>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.kvRow}>
                      <Text style={styles.kLabel}>On StuntListing</Text>
                      <Text style={styles.kValueBad}>No match</Text>
                    </View>
                    {row.fallbackSearchUrl && (
                      <TouchableOpacity onPress={() => Linking.openURL(row.fallbackSearchUrl!)}>
                        <Text style={styles.kLink}>Search StuntListing for "{row.searchedNames.join(' / ')}" ↗</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>

              {/* Other candidates */}
              {row.otherCandidates && row.otherCandidates.length > 0 && (
                <View style={styles.candidatesBlock}>
                  <Text style={styles.candidatesLabel}>Other candidates from search:</Text>
                  {row.otherCandidates.map(c => (
                    <Text key={c.id} style={styles.candidate}>
                      · #{c.id} {c.firstName} {c.lastName} ({c.alias})
                    </Text>
                  ))}
                </View>
              )}

              {/* Manual override input */}
              <View style={styles.overrideBlock}>
                <Text style={styles.kLabel}>Manual override</Text>
                <View style={styles.overrideInputs}>
                  <TextInput
                    placeholder="StuntListing ID"
                    placeholderTextColor={Colors.inputPlaceholder}
                    value={cur.id}
                    onChangeText={(t) => setInputs(s => ({ ...s, [row.youtubeId]: { ...cur, id: t } }))}
                    keyboardType="number-pad"
                    style={[styles.input, { width: 130 }]}
                  />
                  <TextInput
                    placeholder="alias"
                    placeholderTextColor={Colors.inputPlaceholder}
                    value={cur.alias}
                    onChangeText={(t) => setInputs(s => ({ ...s, [row.youtubeId]: { ...cur, alias: t } }))}
                    autoCapitalize="none"
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    onPress={() => saveOverride(row.youtubeId, cur.id, cur.alias)}
                    disabled={savingId === row.youtubeId}
                    style={[styles.saveBtn, savingId === row.youtubeId && { opacity: 0.5 }]}
                  >
                    <Text style={styles.saveBtnText}>{savingId === row.youtubeId ? 'Saving…' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.hint}>Both ID and alias are needed to fully override the match (we need alias for profile lookup). Leave both blank and save to clear an override.</Text>
              </View>
            </View>
          );
        })}

        {!loading && !error && rows.length === 0 && (
          <Text style={styles.empty}>No reels in this scope yet.</Text>
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
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, marginTop: 2 },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  scopeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  scopeBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm },
  scopeBtnActive: { backgroundColor: Colors.accent },
  scopeBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  scopeBtnTextActive: { color: '#fff' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(238,45,36,0.15)', padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.lg },
  errorText: { color: Colors.error, flex: 1 },
  row: { marginTop: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  rowHead: { flexDirection: 'row', gap: Spacing.md },
  thumb: { width: 100, height: 56, borderRadius: BorderRadius.sm, backgroundColor: '#000' },
  reelTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, lineHeight: 18 },
  reelChannel: { color: Colors.textTertiary, fontSize: FontSize.xs, marginTop: 2 },
  linkSmall: { color: Colors.accent, fontSize: FontSize.xs, marginTop: 2 },
  matchBlock: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.surfaceHighlight, gap: 6 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kLabel: { color: Colors.textTertiary, fontSize: FontSize.sm },
  kValueGood: { color: Colors.success || '#4CAF50', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  kValueBad: { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  kValueMuted: { color: Colors.textMuted, fontSize: FontSize.sm },
  kLink: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  candidatesBlock: { marginTop: Spacing.sm, paddingLeft: Spacing.sm, borderLeftWidth: 2, borderLeftColor: Colors.surfaceHighlight },
  candidatesLabel: { color: Colors.textTertiary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  candidate: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  overrideBlock: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.surfaceHighlight },
  overrideInputs: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  input: { backgroundColor: Colors.inputBackground, borderColor: Colors.inputBorder, borderWidth: 1, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, color: Colors.textPrimary, fontSize: FontSize.sm },
  saveBtn: { backgroundColor: Colors.accent, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.semibold },
  hint: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.xs, fontStyle: 'italic' },
  empty: { color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.xl },
  btn: { marginTop: Spacing.lg, backgroundColor: Colors.accent, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  btnText: { color: '#fff', fontWeight: FontWeight.bold },
});
