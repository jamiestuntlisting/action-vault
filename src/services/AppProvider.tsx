import React, { useReducer, useEffect, useMemo, ReactNode } from 'react';
import { Platform } from 'react-native';
import { AppContext, reducer, initialState, State } from './AppState';
import { StorageService } from './StorageService';
import { StripeService } from './StripeService';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadPersistedState();
  }, []);

  // Handle post-Stripe redirect: verify payment server-side before unlocking
  useEffect(() => {
    if (Platform.OS === 'web') {
      const params = new URLSearchParams(window.location.search);
      const purchase = params.get('purchase');
      const sessionId = params.get('session_id');

      if (purchase === 'success' && sessionId) {
        // Clean up URL params immediately
        window.history.replaceState({}, '', window.location.pathname);

        // Verify the purchase with Stripe via our server
        StripeService.verifyPurchase(sessionId).then((result) => {
          if (result.verified && result.id) {
            if (result.type === 'video') {
              dispatch({ type: 'PURCHASE_ATLAS_VIDEO', payload: result.id });
            } else if (result.type === 'course') {
              dispatch({ type: 'PURCHASE_ATLAS_COURSE', payload: result.id });
            }
            console.log(`Purchase verified: ${result.type}:${result.id}`);
          } else {
            console.warn('Purchase verification failed:', result.reason);
          }
        }).catch((err) => {
          console.error('Purchase verification error:', err);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      persistState();
    }
  }, [state.myList, state.watchHistory, state.ratings, state.bookmarks, state.collections, state.follows, state.notifications, state.settings, state.downloads, state.profiles, state.activeProfile, state.currentUser, state.onboardingComplete, state.purchasedAtlasVideos, state.purchasedAtlasCourses]);

  async function loadPersistedState() {
    try {
      const [user, profiles, activeProfile, watchHistory, myList, ratings, bookmarks, collections, follows, notifications, settings, onboarding, downloads, purchasedAtlasVideos, purchasedAtlasCourses] = await Promise.all([
        StorageService.get<{ id: string; email: string }>(StorageService.KEYS.USER),
        StorageService.get<any[]>(StorageService.KEYS.PROFILES),
        StorageService.get<any>(StorageService.KEYS.ACTIVE_PROFILE),
        StorageService.get<any[]>(StorageService.KEYS.WATCH_HISTORY),
        StorageService.get<any[]>(StorageService.KEYS.MY_LIST),
        StorageService.get<any[]>(StorageService.KEYS.RATINGS),
        StorageService.get<any[]>(StorageService.KEYS.BOOKMARKS),
        StorageService.get<any[]>(StorageService.KEYS.COLLECTIONS),
        StorageService.get<any[]>(StorageService.KEYS.FOLLOWS),
        StorageService.get<any[]>(StorageService.KEYS.NOTIFICATIONS),
        StorageService.get<any>(StorageService.KEYS.SETTINGS),
        StorageService.get<boolean>(StorageService.KEYS.ONBOARDING_COMPLETE),
        StorageService.get<string[]>(StorageService.KEYS.VAULT_SUBMISSIONS),
        StorageService.get<string[]>(StorageService.KEYS.PURCHASED_ATLAS_VIDEOS),
        StorageService.get<string[]>(StorageService.KEYS.PURCHASED_ATLAS_COURSES),
      ]);

      // Always use code-defined Atlas Action videos/courses (pricing & content
      // are controlled in code, not user-editable settings that should persist)
      const mergedSettings = settings
        ? {
            ...settings,
            atlasActionVideos: initialState.settings.atlasActionVideos,
            atlasActionCourses: initialState.settings.atlasActionCourses,
          }
        : initialState.settings;

      dispatch({
        type: 'LOAD_STATE',
        payload: {
          currentUser: user || null,
          isAuthenticated: !!user,
          profiles: profiles || [],
          activeProfile: activeProfile || null,
          watchHistory: watchHistory || [],
          myList: myList || [],
          ratings: ratings || [],
          bookmarks: bookmarks || [],
          collections: collections || [],
          follows: follows || [],
          notifications: notifications || [],
          settings: mergedSettings,
          onboardingComplete: onboarding || false,
          downloads: downloads || [],
          purchasedAtlasVideos: purchasedAtlasVideos || [],
          purchasedAtlasCourses: purchasedAtlasCourses || [],
        },
      });
    } catch (e) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  async function persistState() {
    try {
      await Promise.all([
        state.currentUser ? StorageService.set(StorageService.KEYS.USER, state.currentUser) : StorageService.remove(StorageService.KEYS.USER),
        StorageService.set(StorageService.KEYS.PROFILES, state.profiles),
        state.activeProfile ? StorageService.set(StorageService.KEYS.ACTIVE_PROFILE, state.activeProfile) : StorageService.remove(StorageService.KEYS.ACTIVE_PROFILE),
        StorageService.set(StorageService.KEYS.WATCH_HISTORY, state.watchHistory),
        StorageService.set(StorageService.KEYS.MY_LIST, state.myList),
        StorageService.set(StorageService.KEYS.RATINGS, state.ratings),
        StorageService.set(StorageService.KEYS.BOOKMARKS, state.bookmarks),
        StorageService.set(StorageService.KEYS.COLLECTIONS, state.collections),
        StorageService.set(StorageService.KEYS.FOLLOWS, state.follows),
        StorageService.set(StorageService.KEYS.NOTIFICATIONS, state.notifications),
        StorageService.set(StorageService.KEYS.SETTINGS, state.settings),
        StorageService.set(StorageService.KEYS.ONBOARDING_COMPLETE, state.onboardingComplete),
        StorageService.set(StorageService.KEYS.VAULT_SUBMISSIONS, state.downloads),
        StorageService.set(StorageService.KEYS.PURCHASED_ATLAS_VIDEOS, state.purchasedAtlasVideos),
        StorageService.set(StorageService.KEYS.PURCHASED_ATLAS_COURSES, state.purchasedAtlasCourses),
      ]);
    } catch (e) {
      // Silent fail
    }
  }

  const contextValue = useMemo(() => {
    const profileId = state.activeProfile?.id || '';
    return {
      state,
      dispatch,
      isInMyList: (videoId: string) =>
        state.myList.some(m => m.videoId === videoId && m.profileId === profileId),
      getRating: (videoId: string) =>
        state.ratings.find(r => r.videoId === videoId && r.profileId === profileId),
      getWatchProgress: (videoId: string) =>
        state.watchHistory.find(w => w.videoId === videoId && w.profileId === profileId),
      isFollowing: (type: string, id: string) =>
        state.follows.some(f => f.followableType === type && f.followableId === id && f.profileId === profileId),
      getProfileBookmarks: () =>
        state.bookmarks.filter(b => b.profileId === profileId),
      getProfileCollections: () =>
        state.collections.filter(c => c.profileId === profileId),
      getProfileNotifications: () =>
        state.notifications.filter(n => n.profileId === profileId),
      getContinueWatching: () =>
        state.watchHistory
          .filter(w => w.profileId === profileId && !w.completed && w.progressSeconds > 0)
          .sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()),
      isAtlasVideoUnlocked: (videoId: string) => {
        // Check if video is free
        const video = state.settings.atlasActionVideos.find(v => v.id === videoId);
        if (video?.isFree) return true;
        // Check individual purchase
        if (state.purchasedAtlasVideos.includes(videoId)) return true;
        // Check if purchased via course
        const course = state.settings.atlasActionCourses.find(
          c => c.videoIds.includes(videoId) && state.purchasedAtlasCourses.includes(c.id)
        );
        return !!course;
      },
    };
  }, [state]);

  return React.createElement(AppContext.Provider, { value: contextValue }, children);
}
