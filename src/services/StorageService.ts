import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: '@actionvault_v2_user',
  PROFILES: '@actionvault_v2_profiles',
  ACTIVE_PROFILE: '@actionvault_v2_active_profile',
  WATCH_HISTORY: '@actionvault_v2_watch_history',
  MY_LIST: '@actionvault_v2_my_list',
  RATINGS: '@actionvault_v2_ratings',
  BOOKMARKS: '@actionvault_v2_bookmarks',
  COLLECTIONS: '@actionvault_v2_collections',
  FOLLOWS: '@actionvault_v2_follows',
  NOTIFICATIONS: '@actionvault_v2_notifications',
  SETTINGS: '@actionvault_v2_settings',
  ONBOARDING_COMPLETE: '@actionvault_v2_onboarding',
  VAULT_SUBMISSIONS: '@actionvault_v2_vault_submissions',
  PURCHASED_ATLAS_VIDEOS: '@actionvault_v2_purchased_atlas_videos',
  PURCHASED_ATLAS_COURSES: '@actionvault_v2_purchased_atlas_courses',
  AUTH_TOKEN: '@actionvault_v2_auth_token',
};

async function get<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

async function set<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const StorageService = {
  KEYS,
  get,
  set,
  remove,

  async clearAll() {
    await AsyncStorage.clear();
  },
};
