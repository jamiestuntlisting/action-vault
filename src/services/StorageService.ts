import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: '@actionvault_user',
  PROFILES: '@actionvault_profiles',
  ACTIVE_PROFILE: '@actionvault_active_profile',
  WATCH_HISTORY: '@actionvault_watch_history',
  MY_LIST: '@actionvault_my_list',
  RATINGS: '@actionvault_ratings',
  BOOKMARKS: '@actionvault_bookmarks',
  COLLECTIONS: '@actionvault_collections',
  FOLLOWS: '@actionvault_follows',
  NOTIFICATIONS: '@actionvault_notifications',
  SETTINGS: '@actionvault_settings',
  ONBOARDING_COMPLETE: '@actionvault_onboarding',
  VAULT_SUBMISSIONS: '@actionvault_vault_submissions',
  PURCHASED_ATLAS_VIDEOS: '@actionvault_purchased_atlas_videos',
  PURCHASED_ATLAS_COURSES: '@actionvault_purchased_atlas_courses',
  AUTH_TOKEN: '@actionvault_auth_token',
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
