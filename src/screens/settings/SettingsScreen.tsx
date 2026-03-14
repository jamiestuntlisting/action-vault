import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { StorageService } from '../../services/StorageService';
import { avatarMap } from '../../data/avatars';

export function SettingsScreen({ navigation }: any) {
  const { state, dispatch } = useAppState();
  const profile = state.activeProfile;
  const avatar = profile ? avatarMap.get(profile.avatarKey) : null;
  const settings = state.settings;

  function updateSetting(key: string, value: any) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await StorageService.clearAll();
          dispatch({ type: 'LOGOUT' });
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile section */}
      <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('ProfilePicker')}>
        <View style={[styles.avatarCircle, { borderColor: avatar?.color || Colors.primary }]}>
          <Text style={styles.avatarEmoji}>{avatar?.emoji || '🎬'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{state.currentUser?.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
      </TouchableOpacity>

      {/* Quick links */}
      <View style={styles.section}>
        <SettingsRow icon="bookmark-outline" label="My Bookmarks" onPress={() => navigation.navigate('AllBookmarks')} />
        <SettingsRow icon="notifications-outline" label="Notifications" onPress={() => navigation.navigate('AllNotifications')} />
        <SettingsRow icon="people-outline" label="Manage Profiles" onPress={() => navigation.navigate('ProfilePicker')} />
      </View>

      {/* Video Quality */}
      <Text style={styles.sectionTitle}>Video Quality</Text>
      <View style={styles.section}>
        <SettingsRow icon="wifi" label="Wi-Fi Streaming" value={settings.wifiStreamingQuality} />
        <SettingsRow icon="cellular" label="Cellular Streaming" value={settings.cellularStreamingQuality} />
        <SettingsRow icon="download-outline" label="Download Quality" value={settings.downloadQuality.toUpperCase()} />
        <SettingsToggle
          icon="swap-horizontal"
          label="Cellular Data"
          value={settings.cellularDataEnabled}
          onToggle={(v) => updateSetting('cellularDataEnabled', v)}
        />
      </View>

      {/* Playback */}
      <Text style={styles.sectionTitle}>Playback</Text>
      <View style={styles.section}>
        <SettingsToggle
          icon="play-circle-outline"
          label="Autoplay Previews"
          value={settings.autoplayPreviews}
          onToggle={(v) => updateSetting('autoplayPreviews', v)}
        />
        <SettingsToggle
          icon="timer-outline"
          label="Post-Play Countdown"
          value={settings.postPlayCountdown}
          onToggle={(v) => updateSetting('postPlayCountdown', v)}
        />
      </View>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.section}>
        <SettingsToggle
          icon="notifications-outline"
          label="Push Notifications"
          value={settings.notificationsEnabled}
          onToggle={(v) => updateSetting('notificationsEnabled', v)}
        />
        <SettingsToggle icon="film-outline" label="New Content" value={settings.notifyNewContent}
          onToggle={(v) => updateSetting('notifyNewContent', v)} />
        <SettingsToggle icon="person-outline" label="Followed People" value={settings.notifyFollowed}
          onToggle={(v) => updateSetting('notifyFollowed', v)} />
        <SettingsToggle icon="trending-up" label="Trending" value={settings.notifyTrending}
          onToggle={(v) => updateSetting('notifyTrending', v)} />
        <SettingsToggle icon="calendar-outline" label="Weekly Digest" value={settings.notifyWeeklyDigest}
          onToggle={(v) => updateSetting('notifyWeeklyDigest', v)} />
      </View>

      {/* Content */}
      <Text style={styles.sectionTitle}>Content</Text>
      <View style={styles.section}>
        <SettingsRow icon="shield-outline" label="Intensity Filter" value={`Level ${settings.intensityFilter}`} />
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.section}>
        <SettingsRow icon="information-circle-outline" label="App Version" value="1.0.0" />
        <SettingsRow icon="document-text-outline" label="Terms of Service" />
        <SettingsRow icon="lock-closed-outline" label="Privacy Policy" />
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={() => Alert.alert('Delete Account', 'Contact support to delete your account.')}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function SettingsRow({ icon, label, value, onPress }: { icon: string; label: string; value?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={Colors.textTertiary} />
      <Text style={rowStyles.label}>{label}</Text>
      {value && <Text style={rowStyles.value}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

function SettingsToggle({ icon, label, value, onToggle }: { icon: string; label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={rowStyles.row}>
      <Ionicons name={icon as any} size={20} color={Colors.textTertiary} />
      <Text style={rowStyles.label}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: Colors.primary, false: Colors.surfaceHighlight }} thumbColor={Colors.white} />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  label: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  value: { color: Colors.textTertiary, fontSize: FontSize.sm },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    marginHorizontal: Spacing.screen, marginBottom: Spacing.xxl,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg,
  },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  avatarEmoji: { fontSize: 28 },
  profileInfo: { flex: 1 },
  profileName: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  profileEmail: { color: Colors.textTertiary, fontSize: FontSize.sm, marginTop: 2 },
  sectionTitle: {
    color: Colors.textTertiary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    paddingHorizontal: Spacing.screen, marginTop: Spacing.xl, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  section: {
    paddingHorizontal: Spacing.screen,
  },
  signOutButton: {
    marginHorizontal: Spacing.screen, marginTop: Spacing.xxl,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.lg, alignItems: 'center',
  },
  signOutText: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  deleteButton: {
    marginHorizontal: Spacing.screen, marginTop: Spacing.md,
    padding: Spacing.lg, alignItems: 'center',
  },
  deleteText: { color: Colors.textMuted, fontSize: FontSize.md },
});
