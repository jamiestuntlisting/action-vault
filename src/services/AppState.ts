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
  vaultSubmissions: Array<{ videoId: string; title: string; author: string; thumbnailUrl: string; submittedAt: string; category?: string; status?: 'pending' | 'approved' | 'rejected'; submittedByEmail?: string; contentType?: 'video' | 'book' | 'podcast' | 'content' }>;
  adminCategories: AdminCategory[];
  adminVideoOverrides: AdminVideoOverride[];
  removalRequests: Array<{ videoId: string; requestedAt: string; claimsOwnership: boolean; reason?: string }>;
  personTags: Array<{ videoId: string; name: string; timestampSeconds: number; role: string; taggedAt: string }>;
  atlasActionVideos: AtlasActionVideo[];
  atlasActionCourses: AtlasActionCourse[];
  bookList: string[];
  booksRead: string[];
  blockedReviewers: string[];
  playlists: Array<{ id: string; name: string; videoIds: string[]; createdAt: string }>;
  hiddenBooks: string[];
  hiddenPodcasts: string[];
  adminBookOverrides: Array<{ bookId: string; title?: string; authors?: string[]; description?: string; category?: string }>;
  adminPodcastOverrides: Array<{ podcastId: string; title?: string; hosts?: string[]; description?: string; status?: string }>;
  userVideos: Array<{
    id: string;
    title: string;
    description: string;
    youtubeId: string;
    thumbnailUrl: string;
    category: string;
    submittedBy: string;
    submittedAt: string;
    durationSeconds: number;
  }>;
  userBooks: Array<{
    id: string;
    title: string;
    author: string;
    description: string;
    category: 'memoir' | 'history' | 'training' | 'reference';
    coverUrl: string;
    amazonUrl: string;
    asin: string;
    submittedBy: string;
    submittedAt: string;
  }>;
  userPodcasts: Array<{
    id: string;
    title: string;
    hosts: string;
    description: string;
    status: 'active' | 'inactive';
    coverUrl: string;
    links: { apple?: string; spotify?: string; youtube?: string; website?: string };
    submittedBy: string;
    submittedAt: string;
  }>;
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
    // Part 1 — Introduction & Overview (26 sessions)
    { id: 'atlas-1', title: 'Part 1.1: What Is This Class?', description: 'Brad Martin introduces the 101 Intro to Stunts course — what to expect, course structure, and how to get the most out of the training.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/RRWdgHTU1po', thumbnailUrl: 'https://i.ytimg.com/vi/RRWdgHTU1po/hqdefault.jpg', durationSeconds: 108, courseId: 'atlas-course-intro', price: 0, isFree: true, sortOrder: 1, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-2', title: 'Part 1.2: Who Is This Class For?', description: 'Defining the target audience — whether you\'re a complete beginner or transitioning from another discipline, this lesson sets expectations.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/2iah0vibzfU', thumbnailUrl: 'https://i.ytimg.com/vi/2iah0vibzfU/hqdefault.jpg', durationSeconds: 95, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 2, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-3', title: 'Part 1.3: How Is This Class Graded?', description: 'Understanding the course evaluation system — how your progress is measured and what milestones to aim for.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/c-u8CRRFkFo', thumbnailUrl: 'https://i.ytimg.com/vi/c-u8CRRFkFo/hqdefault.jpg', durationSeconds: 88, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 3, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-4', title: 'Part 1.4: Class Structure & Overview', description: 'A detailed walkthrough of the full course structure — topics covered, weekly breakdown, and how each section builds on the last.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/cWvJ9UDxxYY', thumbnailUrl: 'https://i.ytimg.com/vi/cWvJ9UDxxYY/hqdefault.jpg', durationSeconds: 123, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 4, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-52', title: 'Part 1.5: Myths About Stunts', description: 'Common misconceptions about stunt work — separating fact from fiction in the stunt industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/UtU0zFZW4Ro', thumbnailUrl: 'https://i.ytimg.com/vi/UtU0zFZW4Ro/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 5, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-5', title: 'Part 1.6: Entry Level Stunt Jobs', description: 'What entry-level stunt work actually looks like — the types of jobs available and how to get started.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/lhM5O00wV60', thumbnailUrl: 'https://i.ytimg.com/vi/lhM5O00wV60/hqdefault.jpg', durationSeconds: 178, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 6, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-6', title: 'Part 1.7: Multifaceted Role of Stunt Performers', description: 'Stunt performers wear many hats — acting, athletics, technical skills, and professionalism all in one package.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/FQJFjotz-gE', thumbnailUrl: 'https://i.ytimg.com/vi/FQJFjotz-gE/hqdefault.jpg', durationSeconds: 252, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 7, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-7', title: 'Part 1.8: Understanding the Difference Between Getting Hurt', description: 'The critical distinction between pain and injury in stunt work — knowing your limits and managing risk.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/K3-sBLjKNxk', thumbnailUrl: 'https://i.ytimg.com/vi/K3-sBLjKNxk/hqdefault.jpg', durationSeconds: 91, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 8, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-8', title: 'Part 1.9: Contracting Paces of a Stunt Performer\'s Life', description: 'The reality of freelance stunt work — feast and famine cycles, contract work, and managing an irregular schedule.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/VbaPr1sSEdE', thumbnailUrl: 'https://i.ytimg.com/vi/VbaPr1sSEdE/hqdefault.jpg', durationSeconds: 80, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 9, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-9', title: 'Part 1.10: Mental and Physical Grit Required in Stunts', description: 'The mental toughness and physical resilience needed to succeed — building grit for a demanding career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/4JSgzCpEuFM', thumbnailUrl: 'https://i.ytimg.com/vi/4JSgzCpEuFM/hqdefault.jpg', durationSeconds: 112, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 10, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-10', title: 'Part 1.11: Precision and Timing of Stunt Work', description: 'Why precision and timing separate professional stunt performers from amateurs — the science behind selling action.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/hfYACspjOR0', thumbnailUrl: 'https://i.ytimg.com/vi/hfYACspjOR0/hqdefault.jpg', durationSeconds: 107, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 11, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-11', title: 'Part 1.12: Imperative of Consistency in Stunt Performing', description: 'Consistency is key — delivering the same quality take after take and building a reputation for reliability.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/tXqtfLjyDtQ', thumbnailUrl: 'https://i.ytimg.com/vi/tXqtfLjyDtQ/hqdefault.jpg', durationSeconds: 175, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 12, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-12', title: 'Part 1.13: Mastering the Craft of Illusion and Control', description: 'The art of making dangerous action look real while maintaining complete control — the core skill of stunt performance.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/mJY5wRyYuEI', thumbnailUrl: 'https://i.ytimg.com/vi/mJY5wRyYuEI/hqdefault.jpg', durationSeconds: 124, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 13, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-13', title: 'Part 1.14: What is an Entry Level Stunt Job?', description: 'Deep dive into entry-level positions — background stunt work, utility stunts, and building your first credits.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Evfv71w-BEE', thumbnailUrl: 'https://i.ytimg.com/vi/Evfv71w-BEE/hqdefault.jpg', durationSeconds: 149, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 14, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-53', title: 'Part 1.15: The Mindset of a Stunt Person', description: 'The mental framework of a stunt performer — how to think like a professional from day one.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Jvc9V9uDlRQ', thumbnailUrl: 'https://i.ytimg.com/vi/Jvc9V9uDlRQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 15, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-54', title: 'Part 1.16: Other Stunt Roles & Opportunities', description: 'Beyond performing — exploring the diverse roles and career paths available in the stunt industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/iVUls51AB-M', thumbnailUrl: 'https://i.ytimg.com/vi/iVUls51AB-M/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 16, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-55', title: 'Part 1.17: Stunt Job Descriptions', description: 'Detailed breakdown of stunt job descriptions — what each role entails and what\'s expected of you.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/fvq9fnULSBE', thumbnailUrl: 'https://i.ytimg.com/vi/fvq9fnULSBE/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 17, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-56', title: 'Part 1.18: Stunt PA Role Overview', description: 'The stunt PA role explained — responsibilities, expectations, and how it\'s a gateway into the industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/lqxqsvHyvHQ', thumbnailUrl: 'https://i.ytimg.com/vi/lqxqsvHyvHQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 18, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-57', title: 'Part 1.19: Specialists Role Overview', description: 'Understanding the specialist role — what it means to specialize and how to develop a niche in stunts.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/E4SoBXA_RPM', thumbnailUrl: 'https://i.ytimg.com/vi/E4SoBXA_RPM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 19, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-58', title: 'Part 1.20: Water Safety Role Overview', description: 'Water safety in stunts — the critical role of water safety coordinators and what the job requires.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/lpoSITg65C8', thumbnailUrl: 'https://i.ytimg.com/vi/lpoSITg65C8/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 20, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-59', title: 'Part 1.21: Fight Coordinator Role Overview', description: 'The fight coordinator role — choreographing action sequences and managing combat scenes on set.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/1AZmx_1VLsQ', thumbnailUrl: 'https://i.ytimg.com/vi/1AZmx_1VLsQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 21, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-60', title: 'Part 1.22: Previz Shooter & Editor Role', description: 'Pre-visualization and editing roles in stunts — shooting and editing previz for action sequences.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/0Xql2Joq8Tw', thumbnailUrl: 'https://i.ytimg.com/vi/0Xql2Joq8Tw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 22, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-61', title: 'Part 1.23: Stunt Rigger Role Overview', description: 'The stunt rigger role — rigging wire work, descenders, and aerial systems for stunt sequences.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/1qQYGLSr6g0', thumbnailUrl: 'https://i.ytimg.com/vi/1qQYGLSr6g0/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 23, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-62', title: 'Part 1.24: Job Description - Stunt Coordinator', description: 'The stunt coordinator role — leading the stunt department, planning action, and managing safety.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/8QzGL-6Z69g', thumbnailUrl: 'https://i.ytimg.com/vi/8QzGL-6Z69g/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 24, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-63', title: 'Part 1.25: Pros and Cons of Doing Stunts', description: 'An honest look at the advantages and disadvantages of pursuing a career in stunt performing.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/_C8V3MQVmXA', thumbnailUrl: 'https://i.ytimg.com/vi/_C8V3MQVmXA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 25, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-64', title: 'Part 1.26: The Financial Landscape of Stunt Performing', description: 'Understanding the financial realities of stunt work — pay scales, negotiations, and career earnings.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/X8CQTbBw_Yg', thumbnailUrl: 'https://i.ytimg.com/vi/X8CQTbBw_Yg/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 26, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    // Part 2 — The Atlas Method (21 sessions)
    { id: 'atlas-14', title: 'Part 2.1: First Steps of a Stunt Performer', description: 'Beginning your journey — the critical first steps every aspiring stunt performer should take.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/jsTsOucm-m4', thumbnailUrl: 'https://i.ytimg.com/vi/jsTsOucm-m4/hqdefault.jpg', durationSeconds: 227, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 27, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-15', title: 'Part 2.2: First Steps - What You Need to Focus On', description: 'Narrowing your focus — the essential priorities when starting out in the stunt industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/SZGABE7ZZeY', thumbnailUrl: 'https://i.ytimg.com/vi/SZGABE7ZZeY/hqdefault.jpg', durationSeconds: 74, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 28, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-65', title: 'Part 2.3: Atlas Method - Agility', description: 'The agility component of the Atlas Method — developing speed, flexibility, and quick reflexes.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/4NlBLbFYndM', thumbnailUrl: 'https://i.ytimg.com/vi/4NlBLbFYndM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 29, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-16', title: 'Part 2.4: Atlas Method: Acting', description: 'The acting component of the Atlas Method — why stunt performers must also be actors.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Chgl_2oxcEg', thumbnailUrl: 'https://i.ytimg.com/vi/Chgl_2oxcEg/hqdefault.jpg', durationSeconds: 204, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 30, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-17', title: 'Part 2.5: Atlas Method: Driving', description: 'The driving component — precision driving skills every stunt performer should develop.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/oCNfxn0OL-8', thumbnailUrl: 'https://i.ytimg.com/vi/oCNfxn0OL-8/hqdefault.jpg', durationSeconds: 231, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 31, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-18', title: 'Part 2.6: Atlas Method: Work Ethic', description: 'The work ethic pillar — what separates those who make it from those who don\'t.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/gDn5WtjP_6A', thumbnailUrl: 'https://i.ytimg.com/vi/gDn5WtjP_6A/hqdefault.jpg', durationSeconds: 199, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 32, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-19', title: 'Part 2.7: Atlas Method: Toughness', description: 'Mental and physical toughness — developing the resilience needed for a career in stunts.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Z9YKUpLQhWY', thumbnailUrl: 'https://i.ytimg.com/vi/Z9YKUpLQhWY/hqdefault.jpg', durationSeconds: 210, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 33, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-20', title: 'Part 2.8: Atlas Method: Knowledge', description: 'The knowledge pillar — understanding the industry, the craft, and continuous learning.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/DGlgi6WxSDw', thumbnailUrl: 'https://i.ytimg.com/vi/DGlgi6WxSDw/hqdefault.jpg', durationSeconds: 232, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 34, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-21', title: 'Part 2.9: Atlas Method: Filmmaking', description: 'Understanding filmmaking fundamentals — camera angles, lenses, and how stunts serve the story.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/SOtOMDvbOh8', thumbnailUrl: 'https://i.ytimg.com/vi/SOtOMDvbOh8/hqdefault.jpg', durationSeconds: 244, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 35, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-22', title: 'Part 2.10: How Atlas Evaluates a Stunt Performer', description: 'The evaluation criteria Atlas uses to assess stunt performers — what they look for and how to measure up.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/tcd4QWrFOWw', thumbnailUrl: 'https://i.ytimg.com/vi/tcd4QWrFOWw/hqdefault.jpg', durationSeconds: 107, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 36, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-23', title: 'Part 2.11: All Expected Abilities - What Does That Mean?', description: 'Breaking down the full list of abilities expected of a professional stunt performer.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/tHVFqJukCDM', thumbnailUrl: 'https://i.ytimg.com/vi/tHVFqJukCDM/hqdefault.jpg', durationSeconds: 105, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 37, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-24', title: 'Part 2.12: The Essence of Humility in Stunts', description: 'Why humility is essential — how ego can be dangerous and why the best performers stay humble.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/J10xC7fVius', thumbnailUrl: 'https://i.ytimg.com/vi/J10xC7fVius/hqdefault.jpg', durationSeconds: 158, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 38, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-25', title: 'Part 2.13: How to Stay Humble', description: 'Practical advice on maintaining humility throughout your career — even as you gain experience and recognition.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/EUCPPvwPRO8', thumbnailUrl: 'https://i.ytimg.com/vi/EUCPPvwPRO8/hqdefault.jpg', durationSeconds: 150, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 39, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-26', title: 'Part 2.14: Mapping Out Your Stunt Training Journey', description: 'Creating your personalized training roadmap — setting goals, tracking progress, and planning your path forward.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/8qtxyYG32Jg', thumbnailUrl: 'https://i.ytimg.com/vi/8qtxyYG32Jg/hqdefault.jpg', durationSeconds: 207, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 40, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-66', title: 'Part 2.15: Gear Every Performer Needs', description: 'Essential gear for stunt performers — what to invest in and what you\'ll need on every job.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/B5XaY9p5Gmg', thumbnailUrl: 'https://i.ytimg.com/vi/B5XaY9p5Gmg/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 41, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-67', title: 'Part 2.16: Building Your Stunt Pad Bag', description: 'How to build your stunt pad bag — the essential pads and protective gear every performer carries.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/X2gzRPxCKpY', thumbnailUrl: 'https://i.ytimg.com/vi/X2gzRPxCKpY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 42, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-68', title: 'Part 2.17: Headshots', description: 'Getting professional headshots — what casting directors and coordinators look for.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/YgArm5GSP0w', thumbnailUrl: 'https://i.ytimg.com/vi/YgArm5GSP0w/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 43, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-69', title: 'Part 2.18: Your Stunt Resume', description: 'Crafting your stunt resume — format, credits, skills, and what to include to stand out.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/GmAzB-FSV9I', thumbnailUrl: 'https://i.ytimg.com/vi/GmAzB-FSV9I/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 44, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-70', title: 'Part 2.19: Building Your Stunt Reel', description: 'How to create an effective stunt reel — footage selection, editing, and presentation tips.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/C8nNXWSdf8c', thumbnailUrl: 'https://i.ytimg.com/vi/C8nNXWSdf8c/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 45, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-71', title: 'Part 2.20: First Goals & Milestones', description: 'Setting your first goals and milestones — realistic targets for your first year in stunts.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/hmWJuaWBYpI', thumbnailUrl: 'https://i.ytimg.com/vi/hmWJuaWBYpI/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 46, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-72', title: 'Part 2.21: Pro Tips for Getting Started', description: 'Expert tips for getting started in the stunt industry — actionable advice from working professionals.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/NTcxWIfsdP8', thumbnailUrl: 'https://i.ytimg.com/vi/NTcxWIfsdP8/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 47, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    // Part 3 — Mindset & Planning (13 sessions)
    { id: 'atlas-27', title: 'Part 3.1: Do One Thing Every Day to Improve', description: 'The Atlas mindset — committing to daily improvement and building momentum through consistent small actions.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/7JmcO7-qw08', thumbnailUrl: 'https://i.ytimg.com/vi/7JmcO7-qw08/hqdefault.jpg', durationSeconds: 176, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 48, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-28', title: 'Part 3.2: How to Design Your Week', description: 'Structuring your weekly training schedule — balancing physical training, skill development, and networking.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/jyiNWOjQOMA', thumbnailUrl: 'https://i.ytimg.com/vi/jyiNWOjQOMA/hqdefault.jpg', durationSeconds: 174, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 49, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-29', title: 'Part 3.3: Accountability Partner', description: 'The power of having an accountability partner — finding one, setting expectations, and pushing each other forward.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/GcfiRM54wCM', thumbnailUrl: 'https://i.ytimg.com/vi/GcfiRM54wCM/hqdefault.jpg', durationSeconds: 172, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 50, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-30', title: 'Part 3.4: How to Budget Your Money', description: 'Financial planning for stunt performers — managing irregular income, saving for dry spells, and investing in your career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/wPWHLsnsbm8', thumbnailUrl: 'https://i.ytimg.com/vi/wPWHLsnsbm8/hqdefault.jpg', durationSeconds: 184, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 51, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-31', title: 'Part 3.5: How to Track Your Progress Effectively', description: 'Methods for measuring your growth — journaling, video review, and setting measurable milestones.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/LA4BRYojP2Q', thumbnailUrl: 'https://i.ytimg.com/vi/LA4BRYojP2Q/hqdefault.jpg', durationSeconds: 178, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 52, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-32', title: 'Part 3.6: Atlas Action Workbook', description: 'Introduction to the Atlas Action Workbook — a hands-on tool for applying course concepts to your daily training.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/goC2oPNo7pA', thumbnailUrl: 'https://i.ytimg.com/vi/goC2oPNo7pA/hqdefault.jpg', durationSeconds: 165, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 53, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-33', title: 'Part 3.7: Challenges of a Stunt Performer', description: 'Real-world challenges you\'ll face — rejection, physical demands, financial uncertainty, and how to overcome them.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/P1i8Jr2XIOc', thumbnailUrl: 'https://i.ytimg.com/vi/P1i8Jr2XIOc/hqdefault.jpg', durationSeconds: 82, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 54, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-34', title: 'Part 3.8: Money Challenge', description: 'Tackling the financial challenge head-on — practical strategies for surviving financially while building your stunt career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/dn_debwtjZQ', thumbnailUrl: 'https://i.ytimg.com/vi/dn_debwtjZQ/hqdefault.jpg', durationSeconds: 125, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 55, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-35', title: 'Part 3.9: Journey to Becoming a Stunt Person: Challenges', description: 'The emotional and practical challenges on the path to becoming a working stunt performer.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/SBN2h6_uyZ0', thumbnailUrl: 'https://i.ytimg.com/vi/SBN2h6_uyZ0/hqdefault.jpg', durationSeconds: 146, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 56, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-36', title: 'Part 3.10: Three-Fold Challenges of Becoming a Stunt Person', description: 'The three major challenge areas — physical, mental, and professional — and strategies for conquering each.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/5npw5ACQOXA', thumbnailUrl: 'https://i.ytimg.com/vi/5npw5ACQOXA/hqdefault.jpg', durationSeconds: 136, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 57, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-37', title: 'Part 3.11: How to Join SAG-AFTRA and Elevate Your Stunt Career', description: 'The path to SAG-AFTRA membership — requirements, strategies, and why union membership matters for stunt performers.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Pv4wgk-bWiE', thumbnailUrl: 'https://i.ytimg.com/vi/Pv4wgk-bWiE/hqdefault.jpg', durationSeconds: 145, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 58, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-38', title: 'Part 3.12: Why Embracing Discomfort is Key', description: 'The uncomfortable truth about growth — why you need to seek out discomfort to advance your stunt career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/W3pX6SEEG44', thumbnailUrl: 'https://i.ytimg.com/vi/W3pX6SEEG44/hqdefault.jpg', durationSeconds: 121, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 59, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-39', title: 'Part 3.13: Power of Goals: Your Roadmap to Stunt Success', description: 'Setting effective goals — short-term and long-term planning for building a sustainable stunt career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/2ynEzk917Bg', thumbnailUrl: 'https://i.ytimg.com/vi/2ynEzk917Bg/hqdefault.jpg', durationSeconds: 133, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 60, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    // Part 4 — Networking (12 sessions)
    { id: 'atlas-40', title: 'Part 4.1: Understanding Networking: Climbing the Ladder', description: 'Why networking is the #1 skill for career advancement in stunts — and how to approach it authentically.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/ZXtXkTlkZro', thumbnailUrl: 'https://i.ytimg.com/vi/ZXtXkTlkZro/hqdefault.jpg', durationSeconds: 101, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 61, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-41', title: 'Part 4.2: Fine Art of Keeping In Touch: Networking Dos and Don\'ts', description: 'Maintaining relationships — the right and wrong ways to follow up and stay on people\'s radar.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/8WEktvin2Pc', thumbnailUrl: 'https://i.ytimg.com/vi/8WEktvin2Pc/hqdefault.jpg', durationSeconds: 140, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 62, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-42', title: 'Part 4.3: Cultivating Good Habits: The Right Way to Network', description: 'Building networking into your daily routine — habits that compound into career opportunities.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/vcmp_F168_A', thumbnailUrl: 'https://i.ytimg.com/vi/vcmp_F168_A/hqdefault.jpg', durationSeconds: 121, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 63, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-43', title: 'Part 4.4: Every Training Session is a Networking Opportunity', description: 'How to turn every gym session, class, and workshop into a networking opportunity without being pushy.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/3HXi0nToB8Y', thumbnailUrl: 'https://i.ytimg.com/vi/3HXi0nToB8Y/hqdefault.jpg', durationSeconds: 112, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 64, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-44', title: 'Part 4.5: Understanding Hierarchy and the Lay of the Land', description: 'Navigating the stunt industry hierarchy — who\'s who, chain of command, and respecting the structure.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/hsiDMpdst24', thumbnailUrl: 'https://i.ytimg.com/vi/hsiDMpdst24/hqdefault.jpg', durationSeconds: 123, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 65, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-45', title: 'Part 4.6: Expanding Your Circle: Diverse Avenues for Networking', description: 'Thinking beyond the obvious — film festivals, conventions, social media, and unconventional networking paths.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/w_6RQL8ifZk', thumbnailUrl: 'https://i.ytimg.com/vi/w_6RQL8ifZk/hqdefault.jpg', durationSeconds: 63, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 66, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-46', title: 'Part 4.7: Every Chat is a Chance: The Networking Power of Conversation', description: 'Making every conversation count — how casual chats can lead to your next big break.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/aNdV7kON5Eg', thumbnailUrl: 'https://i.ytimg.com/vi/aNdV7kON5Eg/hqdefault.jpg', durationSeconds: 112, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 67, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-47', title: 'Part 4.8: Art of Listening: The Unsung Skill of Effective Networking', description: 'Why listening is more powerful than talking — becoming someone people want to work with.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/nN_pjMVWfUA', thumbnailUrl: 'https://i.ytimg.com/vi/nN_pjMVWfUA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 68, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-48', title: 'Part 4.9: On-Set Etiquette: How to Network Without Overstepping', description: 'Professional boundaries on set — how to make connections while respecting the work environment.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/-hiJCCzAt7U', thumbnailUrl: 'https://i.ytimg.com/vi/-hiJCCzAt7U/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 69, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-49', title: 'Part 4.10: The Philosophy of Networking: More Than Just Contacts', description: 'Networking as relationship-building — creating genuine connections that support a lifelong career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/_KellaiJcuE', thumbnailUrl: 'https://i.ytimg.com/vi/_KellaiJcuE/hqdefault.jpg', durationSeconds: 132, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 70, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-50', title: 'Part 4.11: Finding a Mentor: A Shortcut to Success', description: 'The importance of mentorship — how to find a mentor, what to offer in return, and how it accelerates your career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/bI1ugYtuopE', thumbnailUrl: 'https://i.ytimg.com/vi/bI1ugYtuopE/hqdefault.jpg', durationSeconds: 123, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 71, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'atlas-51', title: 'Part 4.12: Get to Know the Community', description: 'Course finale — immersing yourself in the stunt community and taking your next steps as a professional.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/bsd2Ib_0twU', thumbnailUrl: 'https://i.ytimg.com/vi/bsd2Ib_0twU/hqdefault.jpg', durationSeconds: 113, courseId: 'atlas-course-intro', price: 1.99, isFree: false, sortOrder: 72, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
  ],
  atlasActionCourses: [
    {
      id: 'atlas-course-intro',
      title: '101 Intro to Stunts',
      description: 'A comprehensive 72-lesson introduction to the stunt industry in 4 parts: Introduction & Overview, The Atlas Method, Mindset & Planning, and Networking. Learn what it takes to break into stunts, develop the right habits, and build professional relationships. Taught by veteran stunt coordinator Brad Martin.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/RRWdgHTU1po/hqdefault.jpg',
      price: 49.75,
      videoIds: ['atlas-1','atlas-2','atlas-3','atlas-4','atlas-52','atlas-5','atlas-6','atlas-7','atlas-8','atlas-9','atlas-10','atlas-11','atlas-12','atlas-13','atlas-53','atlas-54','atlas-55','atlas-56','atlas-57','atlas-58','atlas-59','atlas-60','atlas-61','atlas-62','atlas-63','atlas-64','atlas-14','atlas-15','atlas-65','atlas-16','atlas-17','atlas-18','atlas-19','atlas-20','atlas-21','atlas-22','atlas-23','atlas-24','atlas-25','atlas-26','atlas-66','atlas-67','atlas-68','atlas-69','atlas-70','atlas-71','atlas-72','atlas-27','atlas-28','atlas-29','atlas-30','atlas-31','atlas-32','atlas-33','atlas-34','atlas-35','atlas-36','atlas-37','atlas-38','atlas-39','atlas-40','atlas-41','atlas-42','atlas-43','atlas-44','atlas-45','atlas-46','atlas-47','atlas-48','atlas-49','atlas-50','atlas-51'],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-course-first-day',
      title: '1st Day Primer',
      description: 'Prepares new stunt professionals for their first on-set experience. Covers punctuality, protocols, working with coordinators, reputation-building behaviors, and career-damaging mistakes to avoid.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/RRWdgHTU1po/hqdefault.jpg',
      price: 0,
      videoIds: [],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-course-essentials',
      title: 'Essentials for Stunts',
      description: 'Master the roadmap for your stunt craft. Learn the 8 ways a coordinator evaluates performers, common mistakes, and key principles for consistent stunt work. Over 90 lessons with interactive assignments.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/jsTsOucm-m4/hqdefault.jpg',
      price: 0,
      videoIds: [],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-course-fighting',
      title: 'Fighting for Film',
      description: 'Learn to execute fight choreography on camera. Covers the four components of a perfect strike, hiding punches from camera, daily training drills, and the Atlas Stunt Kata.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/Chgl_2oxcEg/hqdefault.jpg',
      price: 0,
      videoIds: [],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-course-coordinator',
      title: 'From Performer to Coordinator',
      description: 'Advance your career from performer to coordinator. Covers finding work, interviews, script breakdowns, and hiring the best team. Over 80 lessons with real production documents.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/8qtxyYG32Jg/hqdefault.jpg',
      price: 0,
      videoIds: [],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-course-actors',
      title: 'Action for Actors',
      description: 'Teaches actors how to excel in action entertainment. Master auditions, physical conditioning, creating high-production-value content, and the Modern Triple Threat. 54 lessons included.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/FQJFjotz-gE/hqdefault.jpg',
      price: 0,
      videoIds: [],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
  ],
  bookList: [],
  booksRead: [],
  blockedReviewers: [],
  playlists: [],
  hiddenBooks: [],
  hiddenPodcasts: [],
  adminBookOverrides: [],
  adminPodcastOverrides: [],
  userVideos: [],
  userBooks: [],
  userPodcasts: [],
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
