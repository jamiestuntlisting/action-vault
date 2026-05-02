import React, { useReducer, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import { AppContext, reducer, initialState, State } from './AppState';
import { StorageService } from './StorageService';
import { StripeService } from './StripeService';
import { AnalyticsService } from './AnalyticsService';

// Storage keys split by lifetime/scope.
//
// GLOBAL keys are read/written at the bare key — they describe the device
// or the active session, not "this user's stuff": who's logged in
// (USER, AUTH_TOKEN) and app-wide config like Atlas catalog overrides
// (SETTINGS).
//
// PER_USER keys are scoped by the logged-in StuntListing user.id (see
// StorageService.userKey) so two accounts sharing the same browser
// don't see each other's watch history, my-list, ratings, bookmarks,
// follows, profiles, purchases, etc.
const PER_USER_KEY_BASES = [
  StorageService.KEYS.PROFILES,
  StorageService.KEYS.ACTIVE_PROFILE,
  StorageService.KEYS.WATCH_HISTORY,
  StorageService.KEYS.MY_LIST,
  StorageService.KEYS.RATINGS,
  StorageService.KEYS.BOOKMARKS,
  StorageService.KEYS.COLLECTIONS,
  StorageService.KEYS.FOLLOWS,
  StorageService.KEYS.NOTIFICATIONS,
  StorageService.KEYS.ONBOARDING_COMPLETE,
  StorageService.KEYS.VAULT_SUBMISSIONS,
  StorageService.KEYS.PURCHASED_ATLAS_VIDEOS,
  StorageService.KEYS.PURCHASED_ATLAS_COURSES,
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Tracks which user.id we've finished hydrating per-user state for.
  // The persist effect skips writes while this lags state.currentUser?.id,
  // preventing the brief window between LOGIN dispatch and async user-data
  // load from clobbering the new user's stored data with empty arrays.
  // null means "no user loaded" — also valid (logged-out state).
  const hydratedForUserIdRef = useRef<string | null>(null);

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
  }, [state.myList, state.watchHistory, state.ratings, state.bookmarks, state.collections, state.follows, state.notifications, state.settings, state.downloads, state.profiles, state.activeProfile, state.currentUser, state.onboardingComplete, state.purchasedAtlasVideos, state.purchasedAtlasCourses, state.authToken]);

  // Reel of the Month: on load, promote scheduled → live and close live → closed as months elapse
  useEffect(() => {
    if (state.isLoading) return;
    const entries = state.settings.reelOfMonthEntries || [];
    if (entries.length === 0) return;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const votes = state.settings.reelOfMonthVotes || [];
    let changed = false;
    const updated = entries.map((e) => {
      if (e.status === 'live' && e.month < currentMonth) {
        const entryVotes = votes.filter(v => v.entryId === e.id);
        const finalVoteCount = entryVotes.length;
        const finalAverage = finalVoteCount > 0
          ? Math.round((entryVotes.reduce((s, v) => s + v.rating, 0) / finalVoteCount) * 100) / 100
          : 0;
        changed = true;
        return { ...e, status: 'closed' as const, finalAverage, finalVoteCount, updatedAt: new Date().toISOString() };
      }
      if (e.status === 'scheduled' && e.month <= currentMonth) {
        changed = true;
        return { ...e, status: 'live' as const, updatedAt: new Date().toISOString() };
      }
      return e;
    });
    if (changed) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { reelOfMonthEntries: updated } });
    }
  }, [state.isLoading]);

  // Initial app load: hydrate global state (currentUser, authToken, settings)
  // and, if a user is already logged in, their per-user state.
  async function loadPersistedState() {
    try {
      const [user, settings, authToken] = await Promise.all([
        StorageService.get<{ id: string; email: string }>(StorageService.KEYS.USER),
        StorageService.get<any>(StorageService.KEYS.SETTINGS),
        StorageService.get<string>(StorageService.KEYS.AUTH_TOKEN),
      ]);

      const mergedSettings = mergeSettings(settings);

      const userId = user?.id || null;
      const perUser = userId
        ? await loadPerUserData(userId)
        : emptyPerUserSlice();

      // Mark hydration complete BEFORE the LOAD_STATE dispatch so the persist
      // effect that fires after this render sees a matching ref and runs.
      hydratedForUserIdRef.current = userId;

      dispatch({
        type: 'LOAD_STATE',
        payload: {
          currentUser: user || null,
          isAuthenticated: !!user,
          settings: mergedSettings,
          authToken: authToken || null,
          ...perUser,
        },
      });

      if (authToken) {
        AnalyticsService.init(authToken);
      }
    } catch (e) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  // Read all per-user keys for the given user.id. Falls back to a one-time
  // migration of legacy unscoped keys (everyone shared one blob before this
  // change) — the assumption is that whoever's currently logged in is the
  // owner of that legacy data.
  async function loadPerUserData(userId: string) {
    const reads = await Promise.all(
      PER_USER_KEY_BASES.map(base => StorageService.get<any>(StorageService.userKey(base, userId)))
    );

    const noScopedDataYet = reads.every(v => v === null);
    if (noScopedDataYet) {
      const legacyReads = await Promise.all(
        PER_USER_KEY_BASES.map(base => StorageService.get<any>(base))
      );
      const hasLegacyData = legacyReads.some(v => v !== null);
      if (hasLegacyData) {
        await Promise.all(
          PER_USER_KEY_BASES.map(async (base, i) => {
            const v = legacyReads[i];
            if (v !== null) {
              await StorageService.set(StorageService.userKey(base, userId), v);
              await StorageService.remove(base);
            }
          })
        );
        return shapePerUserSlice(legacyReads);
      }
    }

    return shapePerUserSlice(reads);
  }

  function shapePerUserSlice(values: any[]) {
    const [profiles, activeProfile, watchHistory, myList, ratings, bookmarks, collections, follows, notifications, onboarding, downloads, purchasedAtlasVideos, purchasedAtlasCourses] = values;
    return {
      profiles: profiles || [],
      activeProfile: activeProfile || null,
      watchHistory: watchHistory || [],
      myList: myList || [],
      ratings: ratings || [],
      bookmarks: bookmarks || [],
      collections: collections || [],
      follows: follows || [],
      notifications: notifications || [],
      onboardingComplete: onboarding || false,
      downloads: downloads || [],
      purchasedAtlasVideos: purchasedAtlasVideos || [],
      purchasedAtlasCourses: purchasedAtlasCourses || [],
    };
  }

  function emptyPerUserSlice() {
    return shapePerUserSlice([]);
  }

  function mergeSettings(settings: any) {
    if (!settings) return initialState.settings;
    return {
      ...settings,
      atlasActionVideos: initialState.settings.atlasActionVideos.map(codeVideo => {
        const saved = (settings.atlasActionVideos || []).find((v: any) => v.id === codeVideo.id);
        if (!saved) return codeVideo;
        return { ...codeVideo, isFree: saved.isFree, price: saved.price, enabled: saved.enabled };
      }),
      atlasActionCourses: initialState.settings.atlasActionCourses.map(codeCourse => {
        const saved = (settings.atlasActionCourses || []).find((c: any) => c.id === codeCourse.id);
        if (!saved) return codeCourse;
        // Always use code-defined price (formula: videos × $1.99 × 60%); only persist enabled state
        return { ...codeCourse, enabled: saved.enabled };
      }),
    };
  }

  async function persistState() {
    try {
      const userId = state.currentUser?.id || null;

      // Skip persistence while the in-memory per-user slice doesn't yet
      // belong to state.currentUser — otherwise the brief window after LOGIN
      // (before the user-id watcher reloads the new user's data) would
      // overwrite the new user's stored blob with empty arrays.
      const userMismatch = userId !== hydratedForUserIdRef.current;

      const writes: Promise<void>[] = [
        // Global keys: always written.
        state.currentUser
          ? StorageService.set(StorageService.KEYS.USER, state.currentUser)
          : StorageService.remove(StorageService.KEYS.USER),
        StorageService.set(StorageService.KEYS.SETTINGS, state.settings),
        state.authToken
          ? StorageService.set(StorageService.KEYS.AUTH_TOKEN, state.authToken)
          : StorageService.remove(StorageService.KEYS.AUTH_TOKEN),
      ];

      if (userId && !userMismatch) {
        // Per-user keys: only when logged in AND the in-memory slice is the
        // hydrated one for this user.
        writes.push(
          StorageService.set(StorageService.userKey(StorageService.KEYS.PROFILES, userId), state.profiles),
          state.activeProfile
            ? StorageService.set(StorageService.userKey(StorageService.KEYS.ACTIVE_PROFILE, userId), state.activeProfile)
            : StorageService.remove(StorageService.userKey(StorageService.KEYS.ACTIVE_PROFILE, userId)),
          StorageService.set(StorageService.userKey(StorageService.KEYS.WATCH_HISTORY, userId), state.watchHistory),
          StorageService.set(StorageService.userKey(StorageService.KEYS.MY_LIST, userId), state.myList),
          StorageService.set(StorageService.userKey(StorageService.KEYS.RATINGS, userId), state.ratings),
          StorageService.set(StorageService.userKey(StorageService.KEYS.BOOKMARKS, userId), state.bookmarks),
          StorageService.set(StorageService.userKey(StorageService.KEYS.COLLECTIONS, userId), state.collections),
          StorageService.set(StorageService.userKey(StorageService.KEYS.FOLLOWS, userId), state.follows),
          StorageService.set(StorageService.userKey(StorageService.KEYS.NOTIFICATIONS, userId), state.notifications),
          StorageService.set(StorageService.userKey(StorageService.KEYS.ONBOARDING_COMPLETE, userId), state.onboardingComplete),
          StorageService.set(StorageService.userKey(StorageService.KEYS.VAULT_SUBMISSIONS, userId), state.downloads),
          StorageService.set(StorageService.userKey(StorageService.KEYS.PURCHASED_ATLAS_VIDEOS, userId), state.purchasedAtlasVideos),
          StorageService.set(StorageService.userKey(StorageService.KEYS.PURCHASED_ATLAS_COURSES, userId), state.purchasedAtlasCourses),
        );
      }

      await Promise.all(writes);
    } catch (e) {
      // Silent fail
    }
  }

  // Watch for user.id changes (login, logout, account switch). On switch
  // to a different logged-in user, reload that user's per-user data from
  // storage so the UI reflects their state, not the previous user's.
  useEffect(() => {
    if (state.isLoading) return; // initial load handled by loadPersistedState
    const userId = state.currentUser?.id || null;
    if (userId === hydratedForUserIdRef.current) return;

    if (!userId) {
      // Logout: nothing to load. The LOGOUT reducer already cleared the
      // in-memory per-user slice; mark hydrated so persist resumes (it'll
      // skip per-user writes since there's no user).
      hydratedForUserIdRef.current = null;
      return;
    }

    // Fresh login or user switch: hydrate from storage (with legacy migration).
    let cancelled = false;
    (async () => {
      const perUser = await loadPerUserData(userId);
      if (cancelled) return;
      hydratedForUserIdRef.current = userId;
      dispatch({ type: 'LOAD_STATE', payload: perUser });
    })();

    return () => { cancelled = true; };
  }, [state.currentUser?.id, state.isLoading]);

  // Analytics-aware dispatch: intercepts actions to track events
  const analyticsDispatch = useCallback((action: any) => {
    dispatch(action);
    try {
      switch (action.type) {
        case 'LOGIN':
          AnalyticsService.init(action.payload?.authToken || null);
          AnalyticsService.track('login', { email: action.payload?.currentUser?.email });
          break;
        case 'ADD_TO_WATCH_HISTORY':
          AnalyticsService.videoProgress(
            action.payload?.videoId, action.payload?.progressSeconds || 0,
            action.payload?.durationSeconds || 0, action.payload?.completed || false
          );
          break;
        case 'ADD_TO_MY_LIST':
          AnalyticsService.favorite(action.payload?.videoId || action.payload, true);
          break;
        case 'REMOVE_FROM_MY_LIST':
          AnalyticsService.favorite(action.payload?.videoId || action.payload, false);
          break;
        case 'SET_RATING':
          AnalyticsService.rating(action.payload?.videoId, action.payload?.thumbs, action.payload?.difficultyRating, action.payload?.bestOfBest || false);
          break;
        case 'TOGGLE_FOLLOW':
          AnalyticsService.follow(action.payload?.followableType, action.payload?.followableId, 'toggle');
          break;
        case 'ADD_BOOKMARK':
          AnalyticsService.bookmark(action.payload?.videoId, action.payload?.timestampSeconds || 0);
          break;
        case 'PURCHASE_ATLAS_VIDEO':
          AnalyticsService.purchase('video', action.payload, '', 1.99);
          break;
        case 'PURCHASE_ATLAS_COURSE':
          AnalyticsService.purchase('course', action.payload, '', 0);
          break;
        case 'TOGGLE_WATCHED':
          AnalyticsService.track('video_marked_watched', { videoId: action.payload?.videoId });
          break;
      }
    } catch {}
  }, []);

  const contextValue = useMemo(() => {
    const profileId = state.activeProfile?.id || '';
    return {
      state,
      dispatch: analyticsDispatch,
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
