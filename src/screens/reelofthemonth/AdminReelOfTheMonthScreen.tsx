import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { skillReels, skillReelSkills, getSkillReelsBySkill } from '../../services/StuntListingService';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { ReelOfMonthEntry, ReelOfMonthStatus } from '../../services/AppState';
import { ExperienceLevel } from '../../types';

const MAX_WIDTH = 960;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ADMIN_EMAILS = [
  'james.northrup@gmail.com',
  'warrenhullstunts@gmail.com',
  'greg@stuntlisting.com',
  'info@stuntlisting.com',
  'jamie@stuntlisting.com',
  'warren@stuntlisting.com',
];

const TIER_ORDER: Array<ExperienceLevel | 'unrated'> = ['professional', 'training', 'fan', 'unrated'];
const TIER_LABEL: Record<string, string> = {
  professional: 'Professional',
  training: 'Training',
  fan: 'Fan',
  unrated: 'Unrated',
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function addMonths(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return monthKey(d);
}

type PickerState = {
  open: boolean;
  month: string;
  editingId?: string;
};

export function AdminReelOfTheMonthScreen({ navigation }: any) {
  usePageTitle('Admin · Skill Reel of the Month');
  const { state, dispatch } = useAppState();

  const currentUserEmail = state.currentUser?.email;
  if (!currentUserEmail || !ADMIN_EMAILS.includes(currentUserEmail.toLowerCase())) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={64} color={Colors.textMuted} />
        <Text style={styles.fallbackTitle}>Access Denied</Text>
        <Text style={styles.fallbackBody}>Admin access is required for this page.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const entries = (state.settings.reelOfMonthEntries || []).filter(e => e.category === 'skill');
  const votes = state.settings.reelOfMonthVotes || [];

  const today = new Date();
  const thisMonth = monthKey(today);
  // Show 7 months: current + next 6
  const scheduleMonths = Array.from({ length: 7 }, (_, i) => addMonths(thisMonth, i));

  const liveEntry = useMemo(() => entries.find(e => e.status === 'live'), [entries]);

  const [picker, setPicker] = useState<PickerState>({ open: false, month: thisMonth });

  function upsertEntry(entry: ReelOfMonthEntry) {
    const next = (state.settings.reelOfMonthEntries || []).filter(e => !(e.category === 'skill' && e.month === entry.month));
    next.push(entry);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { reelOfMonthEntries: next } });
  }

  function deleteEntry(id: string) {
    const next = (state.settings.reelOfMonthEntries || []).filter(e => e.id !== id);
    dispatch({ type: 'UPDATE_SETTINGS', payload: { reelOfMonthEntries: next } });
  }

  function closeNow(entry: ReelOfMonthEntry) {
    const entryVotes = votes.filter(v => v.entryId === entry.id);
    const finalVoteCount = entryVotes.length;
    const finalAverage = finalVoteCount > 0 ? Math.round((entryVotes.reduce((s, v) => s + v.rating, 0) / finalVoteCount) * 100) / 100 : 0;
    upsertEntry({ ...entry, status: 'closed', finalAverage, finalVoteCount, updatedAt: new Date().toISOString() });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.maxWidth}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skill Reel of the Month · Admin</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.noteText}>
          Admin picks a <Text style={{ fontWeight: FontWeight.bold }}>skill</Text> each month (e.g. Stairfall, Fight Choreography). Every reel tagged to that skill is featured in the competition. Stunt reels are surfaced automatically on the homepage from recent activity and don&apos;t need to be scheduled.
        </Text>

        {/* Section 1: Live now */}
        <Text style={styles.sectionTitle}>Live now</Text>
        <View style={styles.liveGrid}>
          {(() => {
            if (!liveEntry) {
              return (
                <View style={styles.liveCard}>
                  <View style={styles.liveCardHeader}>
                    <Text style={styles.liveCardTitle}>Skill</Text>
                    <View style={[styles.pill, { backgroundColor: Colors.surfaceHighlight }]}>
                      <Text style={[styles.pillText, { color: Colors.textTertiary }]}>None live</Text>
                    </View>
                  </View>
                  <Text style={styles.liveCardBody}>
                    No skill is live this month.{' '}
                    <Text
                      style={styles.inlineLink}
                      onPress={() => setPicker({ open: true, month: thisMonth })}
                    >
                      Schedule one for {monthLabel(thisMonth)}
                    </Text>
                    {' '}or for any future month below.
                  </Text>
                </View>
              );
            }

            const entryVotes = votes.filter(v => v.entryId === liveEntry.id);
            const tierGroups: Record<string, typeof entryVotes> = { professional: [], training: [], fan: [], unrated: [] };
            entryVotes.forEach(v => {
              const key = v.experienceLevel || 'unrated';
              (tierGroups[key] ||= []).push(v);
            });
            Object.keys(tierGroups).forEach(k => tierGroups[k].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
            const totals = TIER_ORDER.map(t => `${tierGroups[t]?.length || 0} ${TIER_LABEL[t].toLowerCase()}`).join(' · ');
            const reelsForSkill = getSkillReelsBySkill(liveEntry.skill);
            const parentCategory = reelsForSkill[0]?.cat;

            return (
              <View style={styles.liveCard}>
                <View style={styles.liveCardHeader}>
                  <Text style={styles.liveCardTitle}>Skill · {monthLabel(liveEntry.month)}</Text>
                  <View style={[styles.pill, { backgroundColor: Colors.success + '33' }]}>
                    <Text style={[styles.pillText, { color: Colors.success }]}>Live</Text>
                  </View>
                </View>
                <Text style={styles.liveCardSubtitle}>{liveEntry.skill}</Text>
                <Text style={styles.liveCardMeta}>{reelsForSkill.length} {reelsForSkill.length === 1 ? 'reel' : 'reels'}{parentCategory ? ` · ${parentCategory}` : ''}</Text>
                <View style={styles.liveCardActions}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => setPicker({ open: true, month: liveEntry.month, editingId: liveEntry.id })}>
                    <Ionicons name="create-outline" size={14} color={Colors.textPrimary} />
                    <Text style={styles.smallBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: Colors.primary + '22' }]}
                    onPress={() => {
                      const go = () => closeNow(liveEntry);
                      if (Platform.OS === 'web') {
                        if (typeof window !== 'undefined' && window.confirm(`Close skill reel for ${monthLabel(liveEntry.month)} now? Final average and vote count will be frozen.`)) go();
                      } else {
                        Alert.alert('Close skill now?', 'Final average and vote count will be frozen.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Close now', onPress: go, style: 'destructive' },
                        ]);
                      }
                    }}
                  >
                    <Ionicons name="lock-closed-outline" size={14} color={Colors.primary} />
                    <Text style={[styles.smallBtnText, { color: Colors.primary }]}>Close now</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.voterBlock}>
                  <Text style={styles.voterTotal}>
                    {entryVotes.length} {entryVotes.length === 1 ? 'vote' : 'votes'} · {totals}
                  </Text>
                  <Text style={styles.voterHint}>Rating values hidden — you&apos;re kept unbiased until close.</Text>
                  {entryVotes.length === 0 ? (
                    <Text style={styles.voterEmpty}>No votes yet this month.</Text>
                  ) : (
                    TIER_ORDER.map(tier => {
                      const group = tierGroups[tier];
                      if (!group || group.length === 0) return null;
                      return (
                        <View key={tier} style={styles.voterGroup}>
                          <Text style={styles.voterGroupTitle}>{TIER_LABEL[tier]} ({group.length})</Text>
                          {group.map(v => (
                            <View key={v.userEmail} style={styles.voterRow}>
                              <View style={[styles.tierDot, { backgroundColor: tierColor(tier) }]} />
                              <Text style={styles.voterName} numberOfLines={1}>{v.userName}</Text>
                              <Text style={styles.voterTime}>{formatRelative(v.updatedAt)}</Text>
                            </View>
                          ))}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            );
          })()}
        </View>

        {/* Section 2: Scheduled */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>Scheduled</Text>
        <View style={styles.scheduledTable}>
          {scheduleMonths.map(mkey => {
            const entry = entries.find(e => e.month === mkey);
            return (
              <View key={mkey} style={styles.scheduledMonthBlock}>
                <Text style={styles.scheduledMonthLabel}>{monthLabel(mkey)}</Text>
                <View style={styles.scheduledRow}>
                  <Text style={styles.scheduledCat}>Skill</Text>
                  <Text style={styles.scheduledValue} numberOfLines={1}>
                    {entry ? entry.skill : 'Not set'}
                  </Text>
                  {entry && (
                    <View style={[styles.pill, statusPillStyle(entry.status)]}>
                      <Text style={[styles.pillText, statusPillTextStyle(entry.status)]}>{entry.status}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => setPicker({ open: true, month: mkey, editingId: entry?.id })}
                  >
                    <Text style={styles.smallBtnText}>{entry ? 'Edit' : 'Set'}</Text>
                  </TouchableOpacity>
                  {entry && (
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: Colors.primary + '22' }]}
                      onPress={() => {
                        const go = () => deleteEntry(entry.id);
                        if (Platform.OS === 'web') {
                          if (typeof window !== 'undefined' && window.confirm('Delete this scheduled entry?')) go();
                        } else {
                          Alert.alert('Delete entry?', '', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', onPress: go, style: 'destructive' },
                          ]);
                        }
                      }}
                    >
                      <Ionicons name="trash-outline" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Section 3: Archive link */}
        <TouchableOpacity
          style={styles.archiveLink}
          onPress={() => navigation.navigate('ReelOfTheMonthArchive')}
        >
          <Text style={styles.archiveLinkText}>
            {entries.filter(e => e.status === 'closed').length} past months archived · View archive →
          </Text>
        </TouchableOpacity>
      </View>

      <SkillPickerModal
        picker={picker}
        onClose={() => setPicker(p => ({ ...p, open: false }))}
        onSave={(entry) => {
          upsertEntry(entry);
          setPicker(p => ({ ...p, open: false }));
        }}
        thisMonth={thisMonth}
        existing={picker.editingId ? entries.find(e => e.id === picker.editingId) : undefined}
      />
    </ScrollView>
  );
}

function tierColor(tier: string) {
  switch (tier) {
    case 'professional': return Colors.accent;
    case 'training': return Colors.info;
    case 'fan': return Colors.warning;
    default: return Colors.textMuted;
  }
}

function statusPillStyle(status: ReelOfMonthStatus) {
  switch (status) {
    case 'scheduled': return { backgroundColor: Colors.info + '33' };
    case 'draft': return { backgroundColor: Colors.surfaceHighlight };
    case 'live': return { backgroundColor: Colors.success + '33' };
    case 'closed': return { backgroundColor: Colors.textMuted + '33' };
  }
}

function statusPillTextStyle(status: ReelOfMonthStatus) {
  switch (status) {
    case 'scheduled': return { color: Colors.info };
    case 'draft': return { color: Colors.textSecondary };
    case 'live': return { color: Colors.success };
    case 'closed': return { color: Colors.textSecondary };
  }
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SkillPickerModal({
  picker, onClose, onSave, existing, thisMonth,
}: {
  picker: PickerState;
  onClose: () => void;
  onSave: (entry: ReelOfMonthEntry) => void;
  existing?: ReelOfMonthEntry;
  thisMonth: string;
}) {
  const [query, setQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>(existing?.skill || '');

  React.useEffect(() => {
    if (picker.open) {
      setQuery('');
      setSelectedSkill(existing?.skill || '');
    }
  }, [picker.open, picker.editingId]);

  const skillRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? skillReelSkills.filter(s => s.toLowerCase().includes(q) || skillReels.some(r => r.skill === s && r.cat.toLowerCase().includes(q)))
      : skillReelSkills;
    return filtered.map(skill => {
      const reelsForSkill = getSkillReelsBySkill(skill);
      const first = reelsForSkill.find(r => r.thumb || r.youtubeId);
      const thumb = first?.thumb || (first?.youtubeId ? `https://i.ytimg.com/vi/${first.youtubeId}/hqdefault.jpg` : null);
      return {
        name: skill,
        count: reelsForSkill.length,
        parentCategory: reelsForSkill[0]?.cat || '',
        sampleThumb: thumb,
      };
    }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [query]);

  const selectedMeta = useMemo(() => {
    if (!selectedSkill) return null;
    const reels = getSkillReelsBySkill(selectedSkill);
    return { count: reels.length, parentCategory: reels[0]?.cat || '' };
  }, [selectedSkill]);

  const save = (status: ReelOfMonthStatus) => {
    if (!selectedSkill) return;
    const nowIso = new Date().toISOString();
    const isCurrentOrPast = picker.month <= thisMonth;
    const finalStatus: ReelOfMonthStatus = status === 'scheduled' && isCurrentOrPast ? 'live' : status;
    const entry: ReelOfMonthEntry = {
      id: existing?.id || `rom-skill-${picker.month}-${Date.now()}`,
      category: 'skill',
      month: picker.month,
      skill: selectedSkill,
      theme: selectedSkill,
      status: finalStatus,
      finalAverage: existing?.finalAverage ?? null,
      finalVoteCount: existing?.finalVoteCount ?? null,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };
    onSave(entry);
  };

  return (
    <Modal visible={picker.open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.panel}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>
              {existing ? 'Edit' : 'Pick'} skill · {monthLabel(picker.month)}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={modalStyles.search}
            placeholder="Search skills (or category)…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />

          <ScrollView style={modalStyles.results} contentContainerStyle={{ paddingVertical: 4 }}>
            {skillRows.map(row => {
              const selected = row.name === selectedSkill;
              return (
                <TouchableOpacity
                  key={row.name}
                  style={[modalStyles.resultRow, selected && modalStyles.resultRowSelected]}
                  onPress={() => setSelectedSkill(row.name)}
                >
                  {row.sampleThumb ? (
                    <Image source={{ uri: row.sampleThumb }} style={modalStyles.resultThumb} contentFit="cover" />
                  ) : (
                    <View style={[modalStyles.resultThumb, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceHighlight }]}>
                      <Ionicons name="pricetag-outline" size={20} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={modalStyles.resultName}>{row.name}</Text>
                    <Text style={modalStyles.resultSub}>
                      {row.count} {row.count === 1 ? 'reel' : 'reels'}{row.parentCategory ? ` · ${row.parentCategory}` : ''}
                    </Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedSkill && selectedMeta && (
            <Text style={modalStyles.preview}>
              Selected: {selectedSkill} · {selectedMeta.count} {selectedMeta.count === 1 ? 'reel' : 'reels'}{selectedMeta.parentCategory ? ` · ${selectedMeta.parentCategory}` : ''}
            </Text>
          )}

          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.ghostBtn} onPress={() => save('draft')} disabled={!selectedSkill}>
              <Text style={[modalStyles.ghostBtnText, !selectedSkill && { opacity: 0.4 }]}>Save as draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.primaryBtn, !selectedSkill && { opacity: 0.4 }]}
              onPress={() => save('scheduled')}
              disabled={!selectedSkill}
            >
              <Text style={modalStyles.primaryBtnText}>
                {picker.month <= thisMonth ? `Go live for ${monthLabel(picker.month)}` : `Schedule for ${monthLabel(picker.month)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, backgroundColor: Colors.background },
  maxWidth: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: Spacing.screen },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg, paddingTop: Platform.OS === 'web' ? Spacing.lg : 50 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, flex: 1, textAlign: 'center' },
  noteText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18, marginBottom: Spacing.lg, paddingHorizontal: 2 },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.md, marginTop: Spacing.sm },
  liveGrid: { gap: Spacing.md },
  liveCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.lg },
  liveCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveCardTitle: { color: Colors.textTertiary, fontSize: FontSize.sm, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  liveCardSubtitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: Spacing.sm },
  liveCardMeta: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  liveCardBody: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.sm, lineHeight: 20 },
  liveCardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  pill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.round },
  pillText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  inlineLink: { color: Colors.accent, fontWeight: FontWeight.semibold },
  smallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceHighlight, borderRadius: BorderRadius.sm,
  },
  smallBtnText: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  voterBlock: { marginTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  voterTotal: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  voterHint: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2, fontStyle: 'italic' },
  voterEmpty: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.md, fontStyle: 'italic' },
  voterGroup: { marginTop: Spacing.md },
  voterGroupTitle: { color: Colors.textTertiary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  voterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  voterName: { color: Colors.textPrimary, fontSize: FontSize.sm, flex: 1 },
  voterTime: { color: Colors.textMuted, fontSize: FontSize.xs },
  scheduledTable: { backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.sm },
  scheduledMonthBlock: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  scheduledMonthLabel: { color: Colors.textTertiary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, paddingHorizontal: Spacing.sm },
  scheduledRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6, paddingHorizontal: Spacing.sm },
  scheduledCat: { color: Colors.textSecondary, fontSize: FontSize.xs, width: 40, fontWeight: FontWeight.semibold },
  scheduledValue: { color: Colors.textPrimary, fontSize: FontSize.sm, flex: 1 },
  archiveLink: { marginTop: Spacing.xl, paddingVertical: Spacing.md, alignItems: 'center' },
  archiveLinkText: { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  fallbackTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.lg, textAlign: 'center' },
  fallbackBody: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.md, textAlign: 'center' },
  primaryBtn: { marginTop: Spacing.xl, backgroundColor: Colors.primary, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.md },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: Spacing.lg },
  panel: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    maxHeight: '90%',
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    padding: Spacing.xl,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold, flex: 1, paddingRight: Spacing.md },
  search: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    color: Colors.textPrimary, fontSize: FontSize.sm, marginBottom: Spacing.md,
  },
  results: { maxHeight: 360, borderRadius: BorderRadius.sm, backgroundColor: Colors.background },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.sm, borderRadius: BorderRadius.sm,
  },
  resultRowSelected: { backgroundColor: Colors.accent + '22' },
  resultThumb: { width: 64, height: 36, borderRadius: BorderRadius.xs, backgroundColor: Colors.surfaceHighlight },
  resultName: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  resultSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 1 },
  preview: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.md, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, justifyContent: 'flex-end' },
  ghostBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceHighlight },
  ghostBtnText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  primaryBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, backgroundColor: Colors.accent },
  primaryBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
