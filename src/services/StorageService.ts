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
  MY_REEL_VOTES: '@actionvault_v2_my_reel_votes',
};

// Suffix added to per-user storage keys so two StuntListing accounts
// sharing one browser don't read/write the same blob. Returns the bare
// base key when no userId is given (used for legacy reads during migration).
function userKey(baseKey: string, userId: string | null | undefined): string {
  return userId ? `${baseKey}_user_${userId}` : baseKey;
}

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

// True if this user has completed onboarding before. Checks two sources
// because the two have historically been allowed to diverge:
//   1) the dedicated ONBOARDING_COMPLETE key
//   2) the user's first profile in the PROFILES array — finishOnboarding
//      flips its onboardingComplete to true at the same time
// Either source returning true means we should NOT show onboarding again.
async function isOnboardedFromStorage(userId: string): Promise<boolean> {
  try {
    const flag = await get<boolean>(userKey(KEYS.ONBOARDING_COMPLETE, userId));
    if (flag === true) return true;
    const profiles = await get<any[]>(userKey(KEYS.PROFILES, userId));
    if (Array.isArray(profiles) && profiles.some(p => p?.onboardingComplete === true)) return true;
    return false;
  } catch {
    return false;
  }
}

export const StorageService = {
  KEYS,
  userKey,
  get,
  set,
  remove,
  isOnboardedFromStorage,

  async clearAll() {
    await AsyncStorage.clear();
  },
};
