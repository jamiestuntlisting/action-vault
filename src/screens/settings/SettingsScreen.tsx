import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { StorageService } from '../../services/StorageService';
import { avatarMap } from '../../data/avatars';
import { TmdbService } from '../../services/TmdbService';
import { usePageTitle } from '../../hooks/usePageTitle';

const ADMIN_EMAILS = [
  'james.northrup@gmail.com',
  'warrenhullstunts@gmail.com',
  'greg@stuntlisting.com',
  'info@stuntlisting.com',
  'jamie@stuntlisting.com',
  'warren@stuntlisting.com',
];

export function SettingsScreen({ navigation }: any) {
  usePageTitle('Profile');
  const { state, dispatch } = useAppState();
  const profile = state.activeProfile;
  const avatar = profile ? avatarMap.get(profile.avatarKey) : null;
  const settings = state.settings;
  const [showChannelInput, setShowChannelInput] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');
  const [channelVideos, setChannelVideos] = useState<{ id: string; title: string; selected: boolean }[]>([]);
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [tmdbKey, setTmdbKey] = useState(TmdbService.getApiKey());
  const [tmdbStatus, setTmdbStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [submitCategory, setSubmitCategory] = useState('Behind the Scenes');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function updateSetting(key: string, value: any) {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  }

  function handleSignOut() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Are you sure you want to sign out?')) {
        StorageService.clearAll().then(() => {
          dispatch({ type: 'LOGOUT' });
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        });
      }
    } else {
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
  }

  function extractChannelId(url: string): string | null {
    // Support formats: @handle, channel URL, channel ID
    const handleMatch = url.match(/@([\w-]+)/);
    if (handleMatch) return handleMatch[1];
    const channelMatch = url.match(/youtube\.com\/(?:channel\/|c\/|user\/|@)([\w-]+)/);
    if (channelMatch) return channelMatch[1];
    // If it's just a plain string, treat as handle
    if (/^[\w-]+$/.test(url.trim())) return url.trim();
    return null;
  }

  async function handleLoadChannel() {
    const handle = extractChannelId(channelUrl);
    if (!handle) {
      Alert.alert('Invalid URL', 'Please enter a valid YouTube channel URL or @handle');
      return;
    }
    setLoadingChannel(true);
    try {
      // Use YouTube RSS feed to get recent videos
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${handle}`;
      // Since we can't directly fetch RSS in React Native easily,
      // we'll use a search-based approach with YouTube oembed
      // For now, prompt user to enter video URLs manually
      Alert.alert(
        'Add Videos',
        `To add videos from @${handle}, paste individual YouTube video URLs in the field below. We'll verify each one and add it to the public vault.`,
        [{ text: 'OK' }]
      );
      setLoadingChannel(false);
      setShowChannelInput(false);
      setChannelUrl('');
      // Switch to video URL entry mode
      dispatch({ type: 'UPDATE_SETTINGS', payload: { youtubeChannel: handle } });
    } catch (e) {
      Alert.alert('Error', 'Could not load channel. Please try again.');
      setLoadingChannel(false);
    }
  }

  function detectSubmissionType(url: string): 'video' | 'book' | 'podcast' | 'content' {
    const u = url.toLowerCase().trim();
    if (u.match(/(?:youtube\.com|youtu\.be)/)) return 'video';
    if (u.match(/(?:amazon\.|amzn\.|goodreads\.com|bookshop\.org)/)) return 'book';
    if (u.match(/(?:podcasts\.apple|spotify\.com\/show|open\.spotify|anchor\.fm|rss|feed|podcast)/)) return 'podcast';
    return 'content';
  }

  function extractTitleFromUrl(url: string, type: string): string {
    // Amazon: pull title from URL slug like /Stunt-Story-great-movie-stunt/dp/
    if (type === 'book') {
      const slugMatch = url.match(/amazon\.com\/([^/]+)\/dp\//);
      if (slugMatch) {
        return slugMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      const shortMatch = url.match(/amzn\.\w+\/([^/?]+)/);
      if (shortMatch) return shortMatch[1].replace(/-/g, ' ');
    }
    // Podcast: try to pull name from Apple/Spotify URL
    if (type === 'podcast') {
      const appleMatch = url.match(/podcasts\.apple\.com\/.*\/podcast\/([^/]+)/);
      if (appleMatch) return decodeURIComponent(appleMatch[1]).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const spotifyMatch = url.match(/spotify\.com\/show\/\w+/);
      if (spotifyMatch) return 'Podcast Submission';
    }
    return url;
  }

  function extractAsinFromUrl(url: string): string {
    const match = url.match(/\/dp\/(\w{10})/);
    return match ? match[1] : '';
  }

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function handleSubmitContent() {
    const url = channelUrl.trim();
    if (!url) return;

    const type = detectSubmissionType(url);
    setLoadingChannel(true);

    // YouTube video — fetch title via oembed
    const videoIdMatch = url.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!response.ok) throw new Error('Video not found');
        const data = await response.json();
        const submissions = state.settings.vaultSubmissions || [];
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            vaultSubmissions: [...submissions, {
              videoId,
              title: data.title,
              author: data.author_name,
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              submittedAt: new Date().toISOString(),
              category: submitCategory,
              status: 'pending' as const,
              submittedByEmail: state.currentUser?.email || 'unknown',
              contentType: 'video' as const,
            }]
          }
        });
        showToast(`Video submitted: "${data.title}"`);
        setChannelUrl('');
      } catch (e) {
        showToast('Could not find that video. Please check the URL.');
      }
      setLoadingChannel(false);
      return;
    }

    // Book, podcast, or other content
    const title = extractTitleFromUrl(url, type);
    const contentLabel = type === 'book' ? 'Book' : type === 'podcast' ? 'Podcast' : 'Content';
    const submissions = state.settings.vaultSubmissions || [];
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        vaultSubmissions: [...submissions, {
          videoId: url,
          title,
          author: '',
          thumbnailUrl: '',
          submittedAt: new Date().toISOString(),
          category: submitCategory,
          status: 'pending' as const,
          submittedByEmail: state.currentUser?.email || 'unknown',
          contentType: type as any,
        }]
      }
    });
    showToast(`${contentLabel} submitted: "${title}"\nOur team will review and add it.`);
    setChannelUrl('');
    setLoadingChannel(false);
  }

  async function handleTestTmdbKey() {
    if (!tmdbKey.trim()) return;
    setTmdbStatus('testing');
    TmdbService.setApiKey(tmdbKey.trim());
    try {
      await TmdbService.searchMovies('John Wick');
      setTmdbStatus('valid');
      dispatch({ type: 'UPDATE_SETTINGS', payload: { tmdbApiKey: tmdbKey.trim() } as any });
    } catch {
      setTmdbStatus('invalid');
      TmdbService.setApiKey('');
    }
  }

  // Restore TMDB key from settings on mount
  React.useEffect(() => {
    const savedKey = (settings as any).tmdbApiKey;
    if (savedKey && !TmdbService.hasApiKey()) {
      TmdbService.setApiKey(savedKey);
      setTmdbKey(savedKey);
      setTmdbStatus('valid');
    }
  }, []);

  const submissions = state.settings.vaultSubmissions || [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile section */}
      <View style={styles.profileCard}>
        <View style={[styles.avatarCircle, { borderColor: avatar?.color || Colors.primary }]}>
          <Text style={styles.avatarEmoji}>{avatar?.emoji || '🎬'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{state.currentUser?.email}</Text>
        </View>
      </View>

      {/* Quick links */}
      <View style={styles.section}>
        <SettingsRow icon="list-outline" label="My List" onPress={() => navigation.navigate('MyList')} />
      </View>

      {/* Submit Content */}
      <Text style={styles.sectionTitle}>Submit Content</Text>
      <View style={styles.section}>
        <View style={styles.channelInfo}>
          <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
          <Text style={styles.channelLabel}>Submit a video, book, or podcast to StuntListing TV. Our team will review and add it.</Text>
        </View>

        <View style={styles.urlInputRow}>
          <TextInput
            style={styles.urlInput}
            placeholder="Paste URL (YouTube, Amazon, podcast link)..."
            placeholderTextColor={Colors.inputPlaceholder}
            value={channelUrl}
            onChangeText={setChannelUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.addButton, !channelUrl.trim() && styles.addButtonDisabled]}
            onPress={handleSubmitContent}
            disabled={!channelUrl.trim() || loadingChannel}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>{loadingChannel ? '...' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: Colors.textMuted, fontSize: 12, marginBottom: 6, marginTop: 8 }}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {['Behind the Scenes', 'Fight Choreography', 'Car Stunts', 'High Falls', 'Fire Stunts', 'Wire Work', 'Stunt Training', 'Full BTS Featurette', 'Other'].map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSubmitCategory(cat)}
                style={{
                  paddingHorizontal: 10, paddingVertical: 5,
                  borderRadius: 12, borderWidth: 1,
                  borderColor: submitCategory === cat ? Colors.primary : Colors.divider,
                  backgroundColor: submitCategory === cat ? Colors.primary + '33' : 'transparent',
                }}
              >
                <Text style={{ color: submitCategory === cat ? Colors.primary : Colors.textSecondary, fontSize: 12 }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* StuntListing Plus Note */}
        <View style={styles.plusNote}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.plusNoteText}>
            Want to add your Stunt Reel or Skill Reel? You'll need to be a{' '}
            <Text style={styles.plusNoteHighlight}>StuntListing Plus</Text> member.
            Visit stuntlisting.com to upgrade.
          </Text>
        </View>

        {submissions.length > 0 && (
          <View style={styles.submissionsList}>
            <Text style={styles.submissionsTitle}>Your Submissions ({submissions.length})</Text>
            {submissions.slice(-5).reverse().map((sub: any, i: number) => (
              <View key={i} style={styles.submissionItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.submissionText} numberOfLines={1}>{sub.title}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Admin — only visible to admin users */}
      {state.currentUser?.email && ADMIN_EMAILS.includes(state.currentUser.email.toLowerCase()) && (
        <>
          <Text style={styles.sectionTitle}>Admin</Text>
          <View style={styles.section}>
            <SettingsRow icon="settings-outline" label="Admin Panel" onPress={() => navigation.navigate('Admin')} />
          </View>
        </>
      )}

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>

    {/* Toast notification */}
    {toastMessage && (
      <View style={styles.toastContainer}>
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
          <Text style={styles.toastText}>{toastMessage}</Text>
          <TouchableOpacity onPress={() => setToastMessage(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    )}
    </View>
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
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  channelLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  urlInput: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    height: 44,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  submissionsList: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  submissionsTitle: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  submissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  submissionText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  tmdbHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.md,
  },
  plusNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  plusNoteText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  plusNoteHighlight: {
    color: '#FFD700',
    fontWeight: FontWeight.bold,
  },
  signOutButton: {
    marginHorizontal: Spacing.screen, marginTop: Spacing.xxl,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.lg, alignItems: 'center',
  },
  signOutText: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
