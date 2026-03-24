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
    // Week 1 — The Basics (13 sessions)
    { id: 'atlas-1', title: 'Week 1: Introduction', description: 'Brad Martin introduces the 101 Intro to Stunts course — what to expect, course structure, and how to get the most out of the training.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/RRWdgHTU1po', thumbnailUrl: 'https://i.ytimg.com/vi/RRWdgHTU1po/hqdefault.jpg', durationSeconds: 108, courseId: 'atlas-course-intro', price: 0, isFree: true, sortOrder: 1, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-2', title: 'Week 1: Session 4', description: 'Building your foundation as a stunt performer — core concepts and mindset.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/2iah0vibzfU', thumbnailUrl: 'https://i.ytimg.com/vi/2iah0vibzfU/hqdefault.jpg', durationSeconds: 95, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 2, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-3', title: 'Week 1: Session 5', description: 'Essential skills overview — what every aspiring stunt performer needs to know.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/c-u8CRRFkFo', thumbnailUrl: 'https://i.ytimg.com/vi/c-u8CRRFkFo/hqdefault.jpg', durationSeconds: 88, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 3, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-4', title: 'Week 1: Session 6', description: 'Industry knowledge — unions, protocols, and what makes a professional.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/cWvJ9UDxxYY', thumbnailUrl: 'https://i.ytimg.com/vi/cWvJ9UDxxYY/hqdefault.jpg', durationSeconds: 123, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 4, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-5', title: 'Week 1: Session 9', description: 'Career planning — networking and getting your first gig.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/lhM5O00wV60', thumbnailUrl: 'https://i.ytimg.com/vi/lhM5O00wV60/hqdefault.jpg', durationSeconds: 178, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 5, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-6', title: 'Week 1: Session 10', description: 'Understanding set etiquette and professionalism on a stunt set.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/FQJFjotz-gE', thumbnailUrl: 'https://i.ytimg.com/vi/FQJFjotz-gE/hqdefault.jpg', durationSeconds: 252, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 6, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-7', title: 'Week 1: Session 12', description: 'Physical conditioning and preparation for stunt work.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/K3-sBLjKNxk', thumbnailUrl: 'https://i.ytimg.com/vi/K3-sBLjKNxk/hqdefault.jpg', durationSeconds: 91, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 7, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-8', title: 'Week 1: Session 12b', description: 'Continued physical preparation — advanced conditioning techniques.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/VbaPr1sSEdE', thumbnailUrl: 'https://i.ytimg.com/vi/VbaPr1sSEdE/hqdefault.jpg', durationSeconds: 80, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 8, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-9', title: 'Week 1: Session 14', description: 'Safety fundamentals — protecting yourself and others on set.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/4JSgzCpEuFM', thumbnailUrl: 'https://i.ytimg.com/vi/4JSgzCpEuFM/hqdefault.jpg', durationSeconds: 112, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 9, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-10', title: 'Week 1: Session 15', description: 'Working with coordinators — what they expect and how to deliver.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/hfYACspjOR0', thumbnailUrl: 'https://i.ytimg.com/vi/hfYACspjOR0/hqdefault.jpg', durationSeconds: 107, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 10, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-11', title: 'Week 1: Session 16', description: 'Building your stunt resume and reel — what to include and how to stand out.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/tXqtfLjyDtQ', thumbnailUrl: 'https://i.ytimg.com/vi/tXqtfLjyDtQ/hqdefault.jpg', durationSeconds: 175, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 11, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-12', title: 'Week 1: Session 17', description: 'Demo reel best practices and common mistakes to avoid.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/mJY5wRyYuEI', thumbnailUrl: 'https://i.ytimg.com/vi/mJY5wRyYuEI/hqdefault.jpg', durationSeconds: 124, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 12, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-13', title: 'Week 1: Session 18', description: 'Week 1 wrap-up — key takeaways and preparation for Week 2.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Evfv71w-BEE', thumbnailUrl: 'https://i.ytimg.com/vi/Evfv71w-BEE/hqdefault.jpg', durationSeconds: 149, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 13, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    // Week 2 — Career Planning (13 sessions)
    { id: 'atlas-14', title: 'Week 2: Session 38', description: 'Week 2 begins — diving deeper into career planning and industry navigation.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/jsTsOucm-m4', thumbnailUrl: 'https://i.ytimg.com/vi/jsTsOucm-m4/hqdefault.jpg', durationSeconds: 227, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 14, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-15', title: 'Week 2: Session 39', description: 'Understanding the business side of stunts.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/SZGABE7ZZeY', thumbnailUrl: 'https://i.ytimg.com/vi/SZGABE7ZZeY/hqdefault.jpg', durationSeconds: 74, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 15, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-16', title: 'Week 2: Session 43', description: 'Negotiating rates and understanding pay structures.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Chgl_2oxcEg', thumbnailUrl: 'https://i.ytimg.com/vi/Chgl_2oxcEg/hqdefault.jpg', durationSeconds: 204, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 16, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-17', title: 'Week 2: Session 44', description: 'Working with agents and managers in the stunt industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/oCNfxn0OL-8', thumbnailUrl: 'https://i.ytimg.com/vi/oCNfxn0OL-8/hqdefault.jpg', durationSeconds: 231, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 17, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-18', title: 'Week 2: Session 45', description: 'Building relationships on set and in the community.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/gDn5WtjP_6A', thumbnailUrl: 'https://i.ytimg.com/vi/gDn5WtjP_6A/hqdefault.jpg', durationSeconds: 199, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 18, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-19', title: 'Week 2: Session 46', description: 'Social media and self-promotion for stunt performers.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Z9YKUpLQhWY', thumbnailUrl: 'https://i.ytimg.com/vi/Z9YKUpLQhWY/hqdefault.jpg', durationSeconds: 210, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 19, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-20', title: 'Week 2: Session 47', description: 'Types of stunt work — films, TV, commercials, and live events.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/DGlgi6WxSDw', thumbnailUrl: 'https://i.ytimg.com/vi/DGlgi6WxSDw/hqdefault.jpg', durationSeconds: 232, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 20, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-21', title: 'Week 2: Session 48', description: 'Insurance, liability, and protecting yourself legally.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/SOtOMDvbOh8', thumbnailUrl: 'https://i.ytimg.com/vi/SOtOMDvbOh8/hqdefault.jpg', durationSeconds: 244, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 21, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-22', title: 'Week 2: Session 50', description: 'Understanding contracts and deal-making in stunts.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/tcd4QWrFOWw', thumbnailUrl: 'https://i.ytimg.com/vi/tcd4QWrFOWw/hqdefault.jpg', durationSeconds: 107, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 22, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-23', title: 'Week 2: Session 51', description: 'Specializations and finding your niche in stunt work.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/tHVFqJukCDM', thumbnailUrl: 'https://i.ytimg.com/vi/tHVFqJukCDM/hqdefault.jpg', durationSeconds: 105, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 23, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-24', title: 'Week 2: Session 52', description: 'Cross-training and expanding your skill set.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/J10xC7fVius', thumbnailUrl: 'https://i.ytimg.com/vi/J10xC7fVius/hqdefault.jpg', durationSeconds: 158, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 24, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-25', title: 'Week 2: Session 53', description: 'Maintaining physical fitness for longevity in the industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/EUCPPvwPRO8', thumbnailUrl: 'https://i.ytimg.com/vi/EUCPPvwPRO8/hqdefault.jpg', durationSeconds: 150, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 25, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-26', title: 'Week 2: Session 54', description: 'Week 2 wrap-up — review and key takeaways.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/8qtxyYG32Jg', thumbnailUrl: 'https://i.ytimg.com/vi/8qtxyYG32Jg/hqdefault.jpg', durationSeconds: 207, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 26, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    // Week 3 — Essential Skills (13 sessions)
    { id: 'atlas-27', title: 'Week 3: Falls Part A', description: 'Introduction to falls — the foundation of stunt performance.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/7JmcO7-qw08', thumbnailUrl: 'https://i.ytimg.com/vi/7JmcO7-qw08/hqdefault.jpg', durationSeconds: 176, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 27, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-28', title: 'Week 3: Falls Part B', description: 'Progressive fall techniques and body mechanics.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/jyiNWOjQOMA', thumbnailUrl: 'https://i.ytimg.com/vi/jyiNWOjQOMA/hqdefault.jpg', durationSeconds: 174, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 28, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-29', title: 'Week 3: Falls Part C', description: 'Advanced fall variations and landing techniques.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/GcfiRM54wCM', thumbnailUrl: 'https://i.ytimg.com/vi/GcfiRM54wCM/hqdefault.jpg', durationSeconds: 172, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 29, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-30', title: 'Week 3: Falls Part D', description: 'Stair falls and elevated surface techniques.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/wPWHLsnsbm8', thumbnailUrl: 'https://i.ytimg.com/vi/wPWHLsnsbm8/hqdefault.jpg', durationSeconds: 184, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 30, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-31', title: 'Week 3: Falls Part E', description: 'Reaction falls — selling the hit on camera.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/LA4BRYojP2Q', thumbnailUrl: 'https://i.ytimg.com/vi/LA4BRYojP2Q/hqdefault.jpg', durationSeconds: 178, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 31, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-32', title: 'Week 3: Falls Part F', description: 'Combining falls with fight choreography.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/goC2oPNo7pA', thumbnailUrl: 'https://i.ytimg.com/vi/goC2oPNo7pA/hqdefault.jpg', durationSeconds: 165, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 32, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-33', title: 'Week 3: Session 65', description: 'Fight choreography basics — punches and reactions.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/P1i8Jr2XIOc', thumbnailUrl: 'https://i.ytimg.com/vi/P1i8Jr2XIOc/hqdefault.jpg', durationSeconds: 82, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 33, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-34', title: 'Week 3: Session 66', description: 'Selling the hit — camera angles and timing.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/dn_debwtjZQ', thumbnailUrl: 'https://i.ytimg.com/vi/dn_debwtjZQ/hqdefault.jpg', durationSeconds: 125, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 34, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-35', title: 'Week 3: Session 67', description: 'Kicks, knees, and body contact techniques.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/SBN2h6_uyZ0', thumbnailUrl: 'https://i.ytimg.com/vi/SBN2h6_uyZ0/hqdefault.jpg', durationSeconds: 146, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 35, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-36', title: 'Week 3: Session 68', description: 'Weapon work introduction — props and safety.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/5npw5ACQOXA', thumbnailUrl: 'https://i.ytimg.com/vi/5npw5ACQOXA/hqdefault.jpg', durationSeconds: 136, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 36, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-37', title: 'Week 3: Session 69', description: 'Ground fighting and grappling for camera.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Pv4wgk-bWiE', thumbnailUrl: 'https://i.ytimg.com/vi/Pv4wgk-bWiE/hqdefault.jpg', durationSeconds: 145, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 37, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-38', title: 'Week 3: Session 71', description: 'Wire work basics and harness introduction.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/W3pX6SEEG44', thumbnailUrl: 'https://i.ytimg.com/vi/W3pX6SEEG44/hqdefault.jpg', durationSeconds: 121, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 38, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-39', title: 'Week 3: Session 72', description: 'Week 3 recap — skills assessment and progress check.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/2ynEzk917Bg', thumbnailUrl: 'https://i.ytimg.com/vi/2ynEzk917Bg/hqdefault.jpg', durationSeconds: 133, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 39, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    // Week 4 — Industry Knowledge (12 sessions)
    { id: 'atlas-40', title: 'Week 4: Session 81', description: 'Advanced industry knowledge — navigating your first years.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/ZXtXkTlkZro', thumbnailUrl: 'https://i.ytimg.com/vi/ZXtXkTlkZro/hqdefault.jpg', durationSeconds: 101, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 40, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-41', title: 'Week 4: Session 82', description: 'Working across different markets — LA, Atlanta, New York, and international.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/8WEktvin2Pc', thumbnailUrl: 'https://i.ytimg.com/vi/8WEktvin2Pc/hqdefault.jpg', durationSeconds: 140, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 41, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-42', title: 'Week 4: Session 83', description: 'Stunt doubling — matching actors and the art of invisibility.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/vcmp_F168_A', thumbnailUrl: 'https://i.ytimg.com/vi/vcmp_F168_A/hqdefault.jpg', durationSeconds: 121, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 42, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-43', title: 'Week 4: Session 84', description: 'Adjustments and bumps — understanding stunt pay.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/3HXi0nToB8Y', thumbnailUrl: 'https://i.ytimg.com/vi/3HXi0nToB8Y/hqdefault.jpg', durationSeconds: 112, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 43, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-44', title: 'Week 4: Session 85', description: 'On-set communication and the chain of command.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/hsiDMpdst24', thumbnailUrl: 'https://i.ytimg.com/vi/hsiDMpdst24/hqdefault.jpg', durationSeconds: 123, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 44, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-45', title: 'Week 4: Session 86', description: 'Quick tips for your first day on a professional set.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/w_6RQL8ifZk', thumbnailUrl: 'https://i.ytimg.com/vi/w_6RQL8ifZk/hqdefault.jpg', durationSeconds: 63, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 45, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-46', title: 'Week 4: Session 87', description: 'Understanding the stunt coordinator role and how to become one.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/aNdV7kON5Eg', thumbnailUrl: 'https://i.ytimg.com/vi/aNdV7kON5Eg/hqdefault.jpg', durationSeconds: 112, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 46, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-47', title: 'Week 4: Session 88', description: 'Working with directors and second unit teams.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/nN_pjMVWfUA', thumbnailUrl: 'https://i.ytimg.com/vi/nN_pjMVWfUA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 47, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-48', title: 'Week 4: Session 89', description: 'Injury prevention and longevity in the stunt industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/-hiJCCzAt7U', thumbnailUrl: 'https://i.ytimg.com/vi/-hiJCCzAt7U/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 48, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-49', title: 'Week 4: Session 90', description: 'Mentorship and giving back to the next generation.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/_KellaiJcuE', thumbnailUrl: 'https://i.ytimg.com/vi/_KellaiJcuE/hqdefault.jpg', durationSeconds: 132, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 49, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-50', title: 'Week 4: Session 91', description: 'The future of stunts — technology, virtual production, and evolving techniques.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/bI1ugYtuopE', thumbnailUrl: 'https://i.ytimg.com/vi/bI1ugYtuopE/hqdefault.jpg', durationSeconds: 123, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 50, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-51', title: 'Week 4: Course Finale', description: 'Course wrap-up — final thoughts, next steps, and how to continue your stunt career journey.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/bsd2Ib_0twU', thumbnailUrl: 'https://i.ytimg.com/vi/bsd2Ib_0twU/hqdefault.jpg', durationSeconds: 113, courseId: 'atlas-course-intro', price: 0.99, isFree: false, sortOrder: 51, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
  ],
  atlasActionCourses: [
    {
      id: 'atlas-course-intro',
      title: '101 Intro to Stunts',
      description: 'A comprehensive 4-week, 51-lesson introduction to the stunt industry. Covers fundamentals, career planning, essential skills (falls, fights, wire work), and industry knowledge. Taught by veteran stunt coordinator Brad Martin.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/RRWdgHTU1po/hqdefault.jpg',
      price: 24.99,
      videoIds: ['atlas-1','atlas-2','atlas-3','atlas-4','atlas-5','atlas-6','atlas-7','atlas-8','atlas-9','atlas-10','atlas-11','atlas-12','atlas-13','atlas-14','atlas-15','atlas-16','atlas-17','atlas-18','atlas-19','atlas-20','atlas-21','atlas-22','atlas-23','atlas-24','atlas-25','atlas-26','atlas-27','atlas-28','atlas-29','atlas-30','atlas-31','atlas-32','atlas-33','atlas-34','atlas-35','atlas-36','atlas-37','atlas-38','atlas-39','atlas-40','atlas-41','atlas-42','atlas-43','atlas-44','atlas-45','atlas-46','atlas-47','atlas-48','atlas-49','atlas-50','atlas-51'],
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
  authToken: string | null;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN'; payload: { id: string; email: string; name?: string; token?: string } }
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
  authToken: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN':
      return { ...state, isAuthenticated: true, currentUser: { id: action.payload.id, email: action.payload.email }, authToken: action.payload.token || null };
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
