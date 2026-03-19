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

export interface AdminCategory {
  id: string;
  title: string;
  filterType: 'tag' | 'title' | 'location' | 'custom';
  filterValue: string; // tag id, keyword, or comma-separated video ids
  sortOrder: number;
  enabled: boolean;
}

export interface AdminVideoOverride {
  videoId: string;
  hidden: boolean;
  tagOverrides?: string[]; // skill tag ids to replace existing tags
  locationTags?: string[]; // city/location tags
  peopleOverrides?: string[]; // additional people names added via admin
  movieTags?: string[]; // movie/production names
  curatedLists?: string[]; // e.g. 'featured', 'top10', 'editors_pick'
}

export interface AtlasActionVideo {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  youtubeEmbedUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  courseId: string | null;
  price: number;
  isFree: boolean;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
}

export interface AtlasActionCourse {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  thumbnailUrl: string;
  price: number;
  videoIds: string[];
  enabled: boolean;
  createdAt: string;
}

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
  youtubeChannel: string;
  vaultSubmissions: Array<{ videoId: string; title: string; author: string; thumbnailUrl: string; submittedAt: string }>;
  adminCategories: AdminCategory[];
  adminVideoOverrides: AdminVideoOverride[];
  removalRequests: Array<{ videoId: string; requestedAt: string; claimsOwnership: boolean; reason?: string }>;
  personTags: Array<{ videoId: string; name: string; timestampSeconds: number; role: string; taggedAt: string }>;
  atlasActionVideos: AtlasActionVideo[];
  atlasActionCourses: AtlasActionCourse[];
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
  youtubeChannel: '',
  vaultSubmissions: [],
  adminCategories: [],
  adminVideoOverrides: [],
  removalRequests: [],
  personTags: [],
  atlasActionVideos: [
    {
      id: 'atlas-1',
      title: 'Intro to Stunts: The Basics',
      description: 'Learn the fundamentals of the stunt industry from veteran stunt coordinator Brad Martin. Covers essential skills, safety principles, and what it takes to get started.',
      instructorName: 'Brad Martin',
      youtubeEmbedUrl: 'https://www.youtube.com/embed/RRWdgHTU1po',
      thumbnailUrl: 'https://i.ytimg.com/vi/RRWdgHTU1po/hqdefault.jpg',
      durationSeconds: 420,
      courseId: 'atlas-course-intro',
      price: 0,
      isFree: true,
      sortOrder: 1,
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-2',
      title: 'Intro to Stunts: Career Planning',
      description: 'Brad Martin shares insights on building a career in stunts — from networking to getting your first gig as a stunt performer.',
      instructorName: 'Brad Martin',
      youtubeEmbedUrl: 'https://www.youtube.com/embed/2iah0vibzfU',
      thumbnailUrl: 'https://i.ytimg.com/vi/2iah0vibzfU/hqdefault.jpg',
      durationSeconds: 480,
      courseId: 'atlas-course-intro',
      price: 3.99,
      isFree: false,
      sortOrder: 2,
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-3',
      title: 'Intro to Stunts: Essential Skills',
      description: 'Explore the core skills every stunt performer needs — from falls and fights to wire work and driving. Brad Martin breaks down what coordinators look for.',
      instructorName: 'Brad Martin',
      youtubeEmbedUrl: 'https://www.youtube.com/embed/c-u8CRRFkFo',
      thumbnailUrl: 'https://i.ytimg.com/vi/c-u8CRRFkFo/hqdefault.jpg',
      durationSeconds: 510,
      courseId: 'atlas-course-intro',
      price: 3.99,
      isFree: false,
      sortOrder: 3,
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-4',
      title: 'Intro to Stunts: Industry Knowledge',
      description: 'Understanding the stunt industry from the inside — unions, safety protocols, set etiquette, and what makes a professional stunt performer stand out.',
      instructorName: 'Brad Martin',
      youtubeEmbedUrl: 'https://www.youtube.com/embed/cWvJ9UDxxYY',
      thumbnailUrl: 'https://i.ytimg.com/vi/cWvJ9UDxxYY/hqdefault.jpg',
      durationSeconds: 450,
      courseId: 'atlas-course-intro',
      price: 3.99,
      isFree: false,
      sortOrder: 4,
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
  ],
  atlasActionCourses: [
    {
      id: 'atlas-course-intro',
      title: 'Intro to Stunts',
      description: 'A comprehensive introduction to the stunt industry covering basics, career planning, essential skills, and industry knowledge. Taught by veteran stunt coordinator Brad Martin.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/RRWdgHTU1po/hqdefault.jpg',
      price: 99,
      videoIds: ['atlas-1', 'atlas-2', 'atlas-3', 'atlas-4'],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
  ],
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
  purchasedAtlasVideos: string[];
  purchasedAtlasCourses: string[];
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
  | { type: 'PURCHASE_ATLAS_VIDEO'; payload: string }
  | { type: 'PURCHASE_ATLAS_COURSE'; payload: string }
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
  purchasedAtlasVideos: [],
  purchasedAtlasCourses: [],
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
    case 'PURCHASE_ATLAS_VIDEO':
      if (state.purchasedAtlasVideos.includes(action.payload)) return state;
      return { ...state, purchasedAtlasVideos: [...state.purchasedAtlasVideos, action.payload] };
    case 'PURCHASE_ATLAS_COURSE':
      if (state.purchasedAtlasCourses.includes(action.payload)) return state;
      return { ...state, purchasedAtlasCourses: [...state.purchasedAtlasCourses, action.payload] };
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
  isAtlasVideoUnlocked: (videoId: string) => boolean;
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
  isAtlasVideoUnlocked: () => false,
});

export function useAppState() {
  return useContext(AppContext);
}

export { initialState, reducer, defaultSettings };
export type { State, Action };
