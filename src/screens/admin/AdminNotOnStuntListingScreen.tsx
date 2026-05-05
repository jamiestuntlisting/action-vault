// Admin: list of YouTube-discovered stunt performers we couldn't find on
// StuntListing. Derived from /api/admin/match-stunt-reels (scope=all):
// any reel with no `match` and not `excluded` is shown here. No explicit
// "flag" — if we have an ID, they're on STLG; otherwise they're here.
// Each row carries an editable email field saved via the existing
// /api/admin/stunt-reel-overrides endpoint.

import React, { useEffect, useMemo, useState } from 'react';
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
  excluded: boolean;
  override: boolean;
  email?: string | null;
  match: null | { id: number; firstName: string | null; lastName: string | null };
  fallbackSearchUrl: string | null;
}

export function AdminNotOnStuntListingScreen({ navigation }: any) {
  usePageTitle('Admin · Not on StuntListing');
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [emailEdits, setEmailEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const userEmail = state.currentUser?.email?.toLowerCase() || '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  // The matcher endpoint returns ALL reels with their match status. Anyone
  // without a match (no auto-hit AND no manual override) AND not excluded
  // is on this list — that's the rule Jamie wants ("Either we have their
  // ID number or they are not on stuntlisting").
  const performers = useMemo(
    () => rows.filter(r => !r.excluded && !r.match),
    [rows]
  );

  async function fetchList() {
    if (!state.authToken) {
      setError('Not signed in');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/admin/match-stunt-reels?scope=all`, {
        headers: { Authorization: `Bearer ${state.authToken}` },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      const matches: MatchRow[] = j.matches || [];
      setRows(matches);
      // Seed the email-edit map with current values so the inputs render.
      const seeded: Record<string, string> = {};
      for (const m of matches) seeded[m.youtubeId] = m.email || '';
      setEmailEdits(seeded);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveEmail(youtubeId: string) {
    if (!state.authToken) return;
    setSavingId(youtubeId);
    try {
      const r = await fetch(`${API_BASE}/api/admin/stunt-reel-overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.authToken}` },
        body: JSON.stringify({ youtubeId, email: emailEdits[youtubeId] || '' }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      setRows(rs => rs.map(row => row.youtubeId === youtubeId ? { ...row, email: emailEdits[youtubeId] || null } : row));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }

  async function exclude(youtubeId: string) {
    if (!state.authToken) return;
    setSavingId(youtubeId);
    try {
      const r = await fetch(`${API_BASE}/api/admin/exclude-stunt-reel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.authToken}` },
        body: JSON.stringify({ youtubeId, excluded: true }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      // Mark excluded locally so the row drops out of the filter.
      setRows(rs => rs.map(row => row.youtubeId === youtubeId ? { ...row, excluded: true } : row));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, []);

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
            <Text style={styles.title}>Stunt people not on StuntListing</Text>
            <Text style={styles.subtitle}>
              {performers.length} performer{performers.length === 1 ? '' : 's'} with no StuntListing match.
              Add an email if you've found one — it lives alongside the override entry.
            </Text>
          </View>
          <TouchableOpacity onPress={fetchList} style={styles.refreshBtn}>
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

        {!loading && !error && performers.length === 0 && (
          <Text style={styles.empty}>
            No unmatched performers. Every reel either has a StuntListing ID or is excluded.
          </Text>
        )}

        {performers.map(p => {
          const editValue = emailEdits[p.youtubeId] ?? '';
          const dirty = editValue !== (p.email || '');
          const youtubeUrl = `https://www.youtube.com/watch?v=${p.youtubeId}`;
          return (
            <View key={p.youtubeId} style={styles.row}>
              <View style={styles.headerInfo}>
                {p.thumbnailUrl ? (
                  <Image source={{ uri: p.thumbnailUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: Colors.surfaceHighlight }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.performerName} numberOfLines={1}>
                    {p.channelName || '(unknown channel)'}
                  </Text>
                  <Text style={styles.reelTitle} numberOfLines={2}>{p.title || '(no title)'}</Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: 4, flexWrap: 'wrap' }}>
                    <TouchableOpacity onPress={() => Linking.openURL(youtubeUrl)}>
                      <Text style={styles.linkSmall}>Watch reel ↗</Text>
                    </TouchableOpacity>
                    {p.fallbackSearchUrl && (
                      <TouchableOpacity onPress={() => Linking.openURL(p.fallbackSearchUrl!)}>
                        <Text style={styles.linkSmall}>Search StuntListing ↗</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => exclude(p.youtubeId)} disabled={savingId === p.youtubeId}>
                      <Text style={[styles.linkSmall, { color: Colors.error }]}>
                        {savingId === p.youtubeId ? 'Saving…' : 'Exclude reel'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.emailBlock}>
                <Text style={styles.kLabel}>Email (optional)</Text>
                <View style={styles.emailRow}>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="performer@example.com"
                    placeholderTextColor={Colors.textMuted}
                    value={editValue}
                    onChangeText={t => setEmailEdits(s => ({ ...s, [p.youtubeId]: t }))}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TouchableOpacity
                    style={[styles.saveBtn, !dirty && styles.saveBtnDisabled]}
                    onPress={() => saveEmail(p.youtubeId)}
                    disabled={!dirty || savingId === p.youtubeId}
                  >
                    <Text style={styles.saveBtnText}>{savingId === p.youtubeId ? 'Saving…' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
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
  empty: { color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.xxl },
  row: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.md, gap: Spacing.md },
  headerInfo: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  thumb: { width: 96, height: 54, borderRadius: BorderRadius.sm },
  performerName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  reelTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  linkSmall: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  emailBlock: { gap: 6, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.surfaceHighlight },
  kLabel: { color: Colors.textTertiary, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: FontWeight.bold },
  emailRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  emailInput: { flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, padding: Spacing.sm, color: Colors.textPrimary, fontSize: FontSize.sm, borderWidth: 1, borderColor: Colors.divider },
  saveBtn: { backgroundColor: Colors.accent, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm },
  saveBtnDisabled: { backgroundColor: Colors.surfaceHighlight },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
});
