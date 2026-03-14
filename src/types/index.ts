export type SourcePlatform = 'youtube' | 'vimeo' | 'other';
export type ExperienceLevel = 'professional' | 'training' | 'fan';
export type ThumbRating = 'up' | 'down' | null;
export type FollowableType = 'coordinator' | 'performer' | 'skill_tag';
export type BudgetTier = 'indie' | 'mid' | 'tentpole';
export type IntensityLevel = 1 | 2 | 3 | 4 | 5;
export type DifficultyRating = 1 | 2 | 3 | 4 | 5;

export interface SkillTag {
  id: string;
  name: string;
  displayName: string;
  category: string;
  icon?: string;
}

export interface Coordinator {
  id: string;
  name: string;
  bio: string;
  photoUrl: string;
  stuntlistingUrl?: string;
  knownFor: string[];
  videoCount: number;
}

export interface Performer {
  id: string;
  name: string;
  bio: string;
  photoUrl: string;
  specialties: string[];
  stuntlistingUrl?: string;
  videoCount: number;
}

export interface Production {
  id: string;
  title: string;
  year: number;
  studio: string;
  budgetTier: BudgetTier;
  posterUrl?: string;
}

export interface RigTag {
  id: string;
  name: string;
  displayName: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  sourcePlatform: SourcePlatform;
  sourceUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  language: string;
  publishedAt: string;
  createdAt: string;
  isFeatured: boolean;
  intensityLevel: IntensityLevel;
  skillTags: SkillTag[];
  coordinators: Coordinator[];
  performers: Performer[];
  productions: Production[];
  rigTags: RigTag[];
  averageDifficulty: number;
  totalRatings: number;
  viewCount: number;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  avatarKey: string;
  experienceLevel: ExperienceLevel;
  onboardingComplete: boolean;
  interests: SkillTag[];
}

export interface WatchHistoryEntry {
  profileId: string;
  videoId: string;
  progressSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
}

export interface Rating {
  profileId: string;
  videoId: string;
  thumbs: ThumbRating;
  difficultyRating: DifficultyRating | null;
  reviewText: string;
  createdAt: string;
}

export interface MyListEntry {
  profileId: string;
  videoId: string;
  addedAt: string;
}

export interface Bookmark {
  id: string;
  profileId: string;
  videoId: string;
  timestampSeconds: number;
  note: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  profileId: string;
  title: string;
  description: string;
  isPublic: boolean;
  isCoordinatorCurated: boolean;
  videoIds: string[];
  coverUrl?: string;
  createdAt: string;
}

export interface TrainingPath {
  id: string;
  title: string;
  description: string;
  skillTagId: string;
  videoIds: string[];
  thumbnailUrl: string;
  totalDuration: number;
}

export interface Annotation {
  id: string;
  videoId: string;
  profileId: string;
  profileName: string;
  timestampSeconds: number;
  text: string;
  createdAt: string;
}

export interface Follow {
  profileId: string;
  followableType: FollowableType;
  followableId: string;
}

export interface AppNotification {
  id: string;
  profileId: string;
  type: 'new_content' | 'followed_person' | 'trending' | 'weekly_digest' | 'system';
  title: string;
  body: string;
  deepLink?: string;
  read: boolean;
  createdAt: string;
}

export interface ContentRow {
  id: string;
  title: string;
  type: 'continue_watching' | 'trending' | 'top10' | 'new' | 'because_you_watched' | 'genre' | 'coordinator_spotlight' | 'training' | 'stunt_of_week' | 'recently_added';
  videos: Video[];
  relatedName?: string;
}

export interface StuntOfTheWeek {
  video: Video;
  writeup: string;
  whyNotable: string;
  weekOf: string;
}

// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  ProfilePicker: undefined;
  MainTabs: undefined;
  VideoDetail: { videoId: string };
  VideoPlayer: { videoId: string; startTime?: number };
  CoordinatorProfile: { coordinatorId: string };
  PerformerProfile: { performerId: string };
  ProductionPage: { productionId: string };
  TrainingPathDetail: { pathId: string };
  SideBySide: { videoId1: string; videoId2?: string };
  CollectionDetail: { collectionId: string };
  StuntOfTheWeek: undefined;
  Top10: undefined;
  ReviewModal: { videoId: string };
  AllNotifications: undefined;
  AllBookmarks: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  MyList: undefined;

  Profile: undefined;
};
