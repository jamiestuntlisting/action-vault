import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { StorageService } from './StorageService';
import {
  UserProfile,
  WatchHistoryEntry,
  MyListEntry,
  Rating,
  Bookmark,
  Collection,
  Follow,
  AppNotification,
  ThumbRating,
  DifficultyRating,
  ExperienceLevel,
  SkillTag,
} from '../types';
import { videos } from '../data';

export interface AppSettings {
  wifiStreamingQuality: 'auto' | 'low' | 'medium' | 'high';
  cellularStreamingQuality: 'auto' | 'low' | 'medium';
  downloadQuality: 'sd' | 'hd';
  cellularDataEnabled: boolean;
  autoplayPreviews: boolean;
  postPlayCountdown: boolean;
  notificationsEnabled: boolean;
  notifyNewContent: boolean;
  notifyFollowed: boolean;
  notifyTrending: boolean;
  notifyWeeklyDigest: boolean;
  intensityFilter: number; // 1-5, show up to this level
}

const defaultSettings: AppSettings = {
  wifiStreamingQuality: 'auto',
  cellularStreamingQuality: 'auto',
  downloadQuality: 'hd',
  cellularDataEnabled: true,
  autoplayPreviews: true,
  postPlayCountdown: true,
  notificationsEnabled: true,
  notifyNewContent: true,
  notifyFollowed: true,
  notifyTrending: true,
  notifyWeeklyDigest: true,
  intensityFilter: 5,
};

interface State {
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingComplete: boolean;
  currentUser: { id: string; email: string } | null;
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  watchHistory: WatchHistoryEntry[];
  myList: MyListEntry[];
  ratings: Rating[];
  bookmarks: Bookmark[];
  collections: Collection[];
  follows: Follow[];
  notifications: AppNotification[];
  settings: AppSettings;
  downloads: string[]; // video IDs
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN'; payload: { id: string; email: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_PROFILES'; payload: UserProfile[] }
  | { type: 'ADD_PROFILE'; payload: UserProfile }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'DELETE_PROFILE'; payload: string }
  | { type: 'SET_ACTIVE_PROFILE'; payload: UserProfile }
  | { type: 'ADD_TO_WATCH_HISTORY'; payload: WatchHistoryEntry }
  | { type: 'ADD_TO_MY_LIST'; payload: string }
  | { type: 'REMOVE_FROM_MY_LIST'; payload: string }
  | { type: 'SET_MY_LIST'; payload: MyListEntry[] }
  | { type: 'SET_RATING'; payload: Rating }
  | { type: 'ADD_BOOKMARK'; payload: Bookmark }
  | { type: 'REMOVE_BOOKMARK'; payload: string }
  | { type: 'ADD_COLLECTION'; payload: Collection }
  | { type: 'UPDATE_COLLECTION'; payload: Collection }
  | { type: 'DELETE_COLLECTION'; payload: string }
  | { type: 'TOGGLE_FOLLOW'; payload: Follow }
  | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_DOWNLOAD'; payload: string }
  | { type: 'REMOVE_DOWNLOAD'; payload: string }
  | { type: 'LOAD_STATE'; payload: Partial<State> };

const initialState: State = {
  isAuthenticated: false,
  isLoading: true,
  onboardingComplete: false,
  currentUser: null,
  profiles: [],
  activeProfile: null,
  watchHistory: [],
  myList: [],
  ratings: [],
  bookmarks: [],
  collections: [],
  follows: [],
  notifications: [],
  settings: defaultSettings,
  downloads: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN':
      return { ...state, isAuthenticated: true, currentUser: action.payload };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, onboardingComplete: action.payload };
    case 'SET_PROFILES':
      return { ...state, profiles: action.payload };
    case 'ADD_PROFILE':
      return { ...state, profiles: [...state.profiles, action.payload] };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profiles: state.profiles.map(p => p.id === action.payload.id ? action.payload : p),
        activeProfile: state.activeProfile?.id === action.payload.id ? action.payload : state.activeProfile,
      };
    case 'DELETE_PROFILE':
      return {
        ...state,
        profiles: state.profiles.filter(p => p.id !== action.payload),
        activeProfile: state.activeProfile?.id === action.payload ? null : state.activeProfile,
      };
    case 'SET_ACTIVE_PROFILE':
      return { ...state, activeProfile: action.payload };
    case 'ADD_TO_WATCH_HISTORY': {
      const existing = state.watchHistory.findIndex(
        w => w.videoId === action.payload.videoId && w.profileId === action.payload.profileId
      );
      if (existing >= 0) {
        const updated = [...state.watchHistory];
        updated[existing] = action.payload;
        return { ...state, watchHistory: updated };
      }
      return { ...state, watchHistory: [...state.watchHistory, action.payload] };
    }
    case 'ADD_TO_MY_LIST': {
      if (state.myList.some(m => m.videoId === action.payload && m.profileId === state.activeProfile?.id)) {
        return state;
      }
      return {
        ...state,
        myList: [...state.myList, {
          profileId: state.activeProfile?.id || '',
          videoId: action.payload,
          addedAt: new Date().toISOString(),
        }],
      };
    }
    case 'REMOVE_FROM_MY_LIST':
      return {
        ...state,
        myList: state.myList.filter(m => !(m.videoId === action.payload && m.profileId === state.activeProfile?.id)),
      };
    case 'SET_MY_LIST':
      return { ...state, myList: action.payload };
    case 'SET_RATING': {
      const existingIdx = state.ratings.findIndex(
        r => r.videoId === action.payload.videoId && r.profileId === action.payload.profileId
      );
      if (existingIdx >= 0) {
        const updated = [...state.ratings];
        updated[existingIdx] = action.payload;
        return { ...state, ratings: updated };
      }
      return { ...state, ratings: [...state.ratings, action.payload] };
    }
    case 'ADD_BOOKMARK':
      return { ...state, bookmarks: [...state.bookmarks, action.payload] };
    case 'REMOVE_BOOKMARK':
      return { ...state, bookmarks: state.bookmarks.filter(b => b.id !== action.payload) };
    case 'ADD_COLLECTION':
      return { ...state, collections: [...state.collections, action.payload] };
    case 'UPDATE_COLLECTION':
      return {
        ...state,
        collections: state.collections.map(c => c.id === action.payload.id ? action.payload : c),
      };
    case 'DELETE_COLLECTION':
      return { ...state, collections: state.collections.filter(c => c.id !== action.payload) };
    case 'TOGGLE_FOLLOW': {
      const exists = state.follows.some(
        f => f.followableId === action.payload.followableId &&
             f.followableType === action.payload.followableType &&
             f.profileId === action.payload.profileId
      );
      if (exists) {
        return {
          ...state,
          follows: state.follows.filter(f => !(
            f.followableId === action.payload.followableId &&
            f.followableType === action.payload.followableType &&
            f.profileId === action.payload.profileId
          )),
        };
      }
      return { ...state, follows: [...state.follows, action.payload] };
    }
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n),
      };
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_DOWNLOAD':
      return { ...state, downloads: [...state.downloads, action.payload] };
    case 'REMOVE_DOWNLOAD':
      return { ...state, downloads: state.downloads.filter(d => d !== action.payload) };
    case 'LOAD_STATE':
      return { ...state, ...action.payload, isLoading: false };
    default:
      return state;
  }
}

interface AppContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
  // Convenience helpers
  isInMyList: (videoId: string) => boolean;
  getRating: (videoId: string) => Rating | undefined;
  getWatchProgress: (videoId: string) => WatchHistoryEntry | undefined;
  isFollowing: (type: string, id: string) => boolean;
  getProfileBookmarks: () => Bookmark[];
  getProfileCollections: () => Collection[];
  getProfileNotifications: () => AppNotification[];
  getContinueWatching: () => WatchHistoryEntry[];
}

export const AppContext = createContext<AppContextType>({
  state: initialState,
  dispatch: () => {},
  isInMyList: () => false,
  getRating: () => undefined,
  getWatchProgress: () => undefined,
  isFollowing: () => false,
  getProfileBookmarks: () => [],
  getProfileCollections: () => [],
  getProfileNotifications: () => [],
  getContinueWatching: () => [],
});

export function useAppState() {
  return useContext(AppContext);
}

export { initialState, reducer, defaultSettings };
export type { State, Action };
