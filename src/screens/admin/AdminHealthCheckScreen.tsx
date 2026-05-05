// Admin health-check page. Hits /api/admin/health-check, which runs a
// battery of checks against every backend the app depends on
// (auth proxy, YouTube API, StuntListing GraphQL + DB, GitHub PAT, cron
// heartbeat, data-file freshness) and returns pass/fail per check.

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

interface CheckResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  detail: string;
  durationMs: number;
}
interface HealthResponse {
  summary: { total: number; pass: number; fail: number; warn: number; skip: number; durationMs: number; runAt: string };
  checks: CheckResult[];
}

export function AdminHealthCheckScreen({ navigation }: any) {
  usePageTitle('Admin · Health Check');
  const { state } = useAppState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HealthResponse | null>(null);

  const userEmail = state.currentUser?.email?.toLowerCase() || '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  async function run() {
    if (!state.authToken) {
      setError('Not signed in');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/admin/health-check`, {
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

  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

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

  // Group checks by category for readability.
  const grouped: Record<string, CheckResult[]> = {};
  for (const c of data?.checks || []) {
    grouped[c.category] = grouped[c.category] || [];
    grouped[c.category].push(c);
  }

  function statusIcon(status: CheckResult['status']) {
    switch (status) {
      case 'pass': return { name: 'checkmark-circle', color: Colors.success || '#4CAF50' };
      case 'fail': return { name: 'close-circle', color: Colors.error };
      case 'warn': return { name: 'alert-circle', color: '#E0A800' };
      default:     return { name: 'remove-circle', color: Colors.textMuted };
    }
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
            <Text style={styles.title}>App Health Check</Text>
            <Text style={styles.subtitle}>End-to-end verification that every backing service is reachable.</Text>
          </View>
          <TouchableOpacity onPress={run} style={styles.refreshBtn} disabled={loading}>
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
            <View style={[
              styles.summary,
              data.summary.fail > 0 ? styles.summaryFail : data.summary.warn > 0 ? styles.summaryWarn : styles.summaryPass,
            ]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryHeadline}>
                  {data.summary.fail > 0 ? '❌ Failures detected' : data.summary.warn > 0 ? '⚠ Warnings' : '✅ All checks passing'}
                </Text>
                <Text style={styles.summaryMeta}>
                  {data.summary.pass}/{data.summary.total} pass · {data.summary.warn} warn · {data.summary.fail} fail · ran in {data.summary.durationMs}ms · {new Date(data.summary.runAt).toLocaleString()}
                </Text>
              </View>
            </View>

            {Object.entries(grouped).map(([cat, checks]) => (
              <View key={cat} style={styles.group}>
                <Text style={styles.groupTitle}>{cat}</Text>
                {checks.map((c, i) => {
                  const icon = statusIcon(c.status);
                  return (
                    <View key={i} style={styles.check}>
                      <Ionicons name={icon.name as any} size={20} color={icon.color} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.checkName}>{c.name}</Text>
                        <Text style={styles.checkDetail}>{c.detail}</Text>
                      </View>
                      <Text style={styles.checkDuration}>{c.durationMs}ms</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        )}
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
  summary: { padding: Spacing.lg, borderRadius: BorderRadius.md, marginTop: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1 },
  summaryPass: { backgroundColor: 'rgba(76,175,80,0.10)', borderColor: 'rgba(76,175,80,0.45)' },
  summaryWarn: { backgroundColor: 'rgba(224,168,0,0.12)',  borderColor: 'rgba(224,168,0,0.5)' },
  summaryFail: { backgroundColor: 'rgba(238,45,36,0.12)',  borderColor: 'rgba(238,45,36,0.5)' },
  summaryHeadline: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  summaryMeta: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 4 },
  group: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.md },
  groupTitle: { color: Colors.textTertiary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  check: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.surfaceHighlight },
  checkName: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  checkDetail: { color: Colors.textTertiary, fontSize: FontSize.xs, marginTop: 2 },
  checkDuration: { color: Colors.textMuted, fontSize: FontSize.xs },
});
