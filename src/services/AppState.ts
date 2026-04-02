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
    // atlas-course-first-day videos
    { id: 'fdp-1', title: 'Part 1: About This Course', description: 'Introduction to the First Day Primer course — what you\'ll learn and why it matters for your career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/NXZm2NysASo', thumbnailUrl: 'https://i.ytimg.com/vi/NXZm2NysASo/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 0, isFree: true, sortOrder: 1, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-2', title: 'Part 2: Quick Tips - A General Overview Of The Day', description: 'A quick overview of what to expect on your first day — the rhythm, people, and key moments.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/2k8WFiH4DWI', thumbnailUrl: 'https://i.ytimg.com/vi/2k8WFiH4DWI/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 2, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-3', title: 'Part 3: The Night Before', description: 'Preparation starts the night before — what to pack, plan, and mentally prepare for.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/4yKepiiGV9Y', thumbnailUrl: 'https://i.ytimg.com/vi/4yKepiiGV9Y/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 3, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-4', title: 'Part 4: What Is Going To Happen', description: 'What to expect when you arrive on set — the flow of the day from call time to wrap.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/X8wN9vD_0pA', thumbnailUrl: 'https://i.ytimg.com/vi/X8wN9vD_0pA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 4, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-5', title: 'Part 5: Interacting With The Coordinator', description: 'How to communicate with the stunt coordinator — making a great first impression and showing professionalism.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/KNvWP0Cy6Ak', thumbnailUrl: 'https://i.ytimg.com/vi/KNvWP0Cy6Ak/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 5, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-6', title: 'Part 6: Bonus Points', description: 'Extra ways to stand out on your first day — going above and beyond to build your reputation.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/cj0Zfqmk90g', thumbnailUrl: 'https://i.ytimg.com/vi/cj0Zfqmk90g/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 6, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-7', title: 'Part 7: How To End Your Career On Day One', description: 'Career-ending mistakes to avoid on your first day — common pitfalls that can destroy your reputation.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/_NUkC5QQOjc', thumbnailUrl: 'https://i.ytimg.com/vi/_NUkC5QQOjc/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 7, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-8', title: 'Part 8: After You Work', description: 'What to do after wrap — following up, reflecting, and setting yourself up for the next job.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/3Vbiai5loZY', thumbnailUrl: 'https://i.ytimg.com/vi/3Vbiai5loZY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 8, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-9', title: 'Part 9: Homework', description: 'Assignments to reinforce what you\'ve learned — practical exercises to prepare for your first day.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/nqVJhGBwZKc', thumbnailUrl: 'https://i.ytimg.com/vi/nqVJhGBwZKc/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 9, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-10', title: 'Part 10: How To Start Your Career On Day One', description: 'Actionable steps to launch your career from day one — building momentum from your very first job.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/qGwCKbSW--E', thumbnailUrl: 'https://i.ytimg.com/vi/qGwCKbSW--E/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 10, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fdp-11', title: 'Part 11: Conclusion', description: 'Course wrap-up — key takeaways and your roadmap for a successful first day on set.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/0bZQpzDSJLk', thumbnailUrl: 'https://i.ytimg.com/vi/0bZQpzDSJLk/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-first-day', price: 1.99, isFree: false, sortOrder: 11, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    // atlas-course-coordinator videos
    { id: 'coord-1', title: 'Intro 1: Who Is This Class For', description: 'Defining the audience for the 301 course — who should take it and what experience level is expected.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/CZb6saKKEzs', thumbnailUrl: 'https://i.ytimg.com/vi/CZb6saKKEzs/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 0, isFree: true, sortOrder: 1, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-2', title: 'Intro 2: Course Objectives', description: 'The goals and objectives of the Performer to Coordinator course — what you\'ll achieve by the end.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/xSm9LIGaEp8', thumbnailUrl: 'https://i.ytimg.com/vi/xSm9LIGaEp8/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 2, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-3', title: 'Intro 3: How To Get The Most Out Of This Course', description: 'Tips for maximizing your learning — how to approach this course for the best results.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/qKVz9bRjnAE', thumbnailUrl: 'https://i.ytimg.com/vi/qKVz9bRjnAE/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 3, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-4', title: 'Part 1.1: Course Structure', description: 'Overview of the course structure — modules, pacing, and how the content builds progressively.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/z8Lg4dlR3Ao', thumbnailUrl: 'https://i.ytimg.com/vi/z8Lg4dlR3Ao/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 4, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-5', title: 'Part 1.2: The Importance Of Mentors', description: 'Why mentorship is essential for aspiring coordinators — finding and learning from experienced professionals.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/B4D2szWl1TI', thumbnailUrl: 'https://i.ytimg.com/vi/B4D2szWl1TI/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 5, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-6', title: 'Part 1.3: The Importance Of Your Own Philosophy', description: 'Developing your personal coordination philosophy — what drives your approach to the craft.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/2gDCn7AFldY', thumbnailUrl: 'https://i.ytimg.com/vi/2gDCn7AFldY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 6, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-7', title: 'Part 1.4: Who Is Stunt Coordinating For?', description: 'Understanding who you serve as a coordinator — directors, actors, producers, and your team.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/4kPUG442-vg', thumbnailUrl: 'https://i.ytimg.com/vi/4kPUG442-vg/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 7, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-8', title: 'Part 1.5: The Pros And Cons Of Stunt Coordinating', description: 'An honest look at the rewards and challenges of the coordinator role.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/sIHOGoQF9_I', thumbnailUrl: 'https://i.ytimg.com/vi/sIHOGoQF9_I/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 8, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-9', title: 'Part 1.6: The Ethos Of Stunt Coordinating', description: 'The ethical foundation of coordination — safety, integrity, and professionalism.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/7U8fsItkWCo', thumbnailUrl: 'https://i.ytimg.com/vi/7U8fsItkWCo/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 9, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-10', title: 'Part 2.1: Ways Of Getting Hired', description: 'How coordinators find work — the different paths to landing coordination jobs.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/S8XKCUkcefw', thumbnailUrl: 'https://i.ytimg.com/vi/S8XKCUkcefw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 10, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-11', title: 'Part 2.2: The Interview Process And Pitching', description: 'Mastering the interview and pitch process — selling your vision to directors and producers.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/uXt5S6ud1cY', thumbnailUrl: 'https://i.ytimg.com/vi/uXt5S6ud1cY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 11, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-12', title: 'Part 2.3: How To Lose Out On A Job', description: 'Common mistakes that cost coordinators jobs — what not to do during the hiring process.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/cWCbJ1sbNs0', thumbnailUrl: 'https://i.ytimg.com/vi/cWCbJ1sbNs0/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 12, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-13', title: 'Part 2.4: How To Prep', description: 'The essentials of pre-production preparation for stunt coordinators.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/iF8xiNb9c7M', thumbnailUrl: 'https://i.ytimg.com/vi/iF8xiNb9c7M/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 13, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-14', title: 'Part 2.5: Breaking Down The Script', description: 'How to analyze a script for action — identifying stunt needs, safety concerns, and creative opportunities.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/8R8VsD2dHZw', thumbnailUrl: 'https://i.ytimg.com/vi/8R8VsD2dHZw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 14, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-15', title: 'Part 2.6: Why Is Every Movie Made In Prep', description: 'Why pre-production is where movies are truly made — the importance of thorough preparation.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/CK_CKcCzToU', thumbnailUrl: 'https://i.ytimg.com/vi/CK_CKcCzToU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 15, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-16', title: 'Part 2.7: Brad\'s Breakdown Of The Script', description: 'A real-world example of Brad\'s script breakdown process — seeing theory in practice.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/4NAr9Dz66lU', thumbnailUrl: 'https://i.ytimg.com/vi/4NAr9Dz66lU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 16, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-17', title: 'Part 2.8: Needs Vs Wants In Prep', description: 'Prioritizing during prep — distinguishing between what\'s essential and what\'s nice to have.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/T_fpUxPEl0I', thumbnailUrl: 'https://i.ytimg.com/vi/T_fpUxPEl0I/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 17, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-18', title: 'Part 2.9: Different Levels Of Production', description: 'Understanding the differences between indie, TV, and feature film productions.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/No7TJfbmJ1E', thumbnailUrl: 'https://i.ytimg.com/vi/No7TJfbmJ1E/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 18, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-19', title: 'Part 2.10: Who Do You Work With As Coordinator', description: 'The key relationships and departments a coordinator interacts with on set.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/d2tsqpjPEW8', thumbnailUrl: 'https://i.ytimg.com/vi/d2tsqpjPEW8/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 19, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-20', title: 'Part 2.11: What To Delegate', description: 'Knowing what to handle yourself and what to delegate to your team.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Oo16Ao_oePU', thumbnailUrl: 'https://i.ytimg.com/vi/Oo16Ao_oePU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 20, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-21', title: 'Part 2.12: Who Are You As A Coordinator', description: 'Defining your identity and leadership style as a stunt coordinator.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/TfGZKWwYQmQ', thumbnailUrl: 'https://i.ytimg.com/vi/TfGZKWwYQmQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 21, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-22', title: 'Part 2.13: Coordinator Rates', description: 'Understanding the pay structure — what coordinators earn and how to negotiate.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/aMPbpG55I6Q', thumbnailUrl: 'https://i.ytimg.com/vi/aMPbpG55I6Q/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 22, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-23', title: 'Part 3.1: Budget Pitfalls', description: 'Common budgeting mistakes and how to avoid them as a coordinator.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/l4susOCgsd8', thumbnailUrl: 'https://i.ytimg.com/vi/l4susOCgsd8/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 23, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-24', title: 'Part 3.2: Intro To Brad\'s Budget', description: 'Brad introduces his budgeting approach — real-world methods for stunt departments.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/lYcy61j9VxM', thumbnailUrl: 'https://i.ytimg.com/vi/lYcy61j9VxM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 24, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-25', title: 'Part 3.3: Brad\'s Budget In Detail Part 1', description: 'Deep dive into Brad\'s actual stunt budget — line items and allocation strategies.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/p6kHVRVU448', thumbnailUrl: 'https://i.ytimg.com/vi/p6kHVRVU448/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 25, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-26', title: 'Part 3.4: Brad\'s Budget In Detail Part 2', description: 'Continuation of the budget deep dive — advanced line items and contingencies.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/HkUknrRrfJQ', thumbnailUrl: 'https://i.ytimg.com/vi/HkUknrRrfJQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 26, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-27', title: 'Part 3.5: Brad\'s Budget Scene By Scene', description: 'Scene-by-scene budget breakdown — how to estimate costs for each action sequence.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Rp7DCmV83l8', thumbnailUrl: 'https://i.ytimg.com/vi/Rp7DCmV83l8/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 27, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-28', title: 'Part 3.6: Budget And Scheduling', description: 'The relationship between budget and schedule — how they impact each other.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/EwbXEsxIbFU', thumbnailUrl: 'https://i.ytimg.com/vi/EwbXEsxIbFU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 28, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-29', title: 'Part 3.7: Scheduling', description: 'Creating effective stunt schedules — timing, logistics, and flexibility.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/JLS3EoeZ3fY', thumbnailUrl: 'https://i.ytimg.com/vi/JLS3EoeZ3fY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 29, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-30', title: 'Part 3.8: What Needs To Be In The Budget', description: 'Essential budget items every coordinator must include — nothing should be left out.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/wO2inkUsiwY', thumbnailUrl: 'https://i.ytimg.com/vi/wO2inkUsiwY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 30, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-31', title: 'Part 3.9: Don\'t Be Too Detailed On Your Budget', description: 'Finding the right level of budget detail — when too much specificity works against you.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/_RPxldCIQ7g', thumbnailUrl: 'https://i.ytimg.com/vi/_RPxldCIQ7g/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 31, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-32', title: 'Part 3.10: How To Estimate Stunt Adjustments', description: 'Estimating stunt performer adjustments — pay bumps for hazardous work.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/RyVpUJv7RgY', thumbnailUrl: 'https://i.ytimg.com/vi/RyVpUJv7RgY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 32, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-33', title: 'Part 3.11: Brad\'s Budgeting Process', description: 'Brad\'s complete budgeting workflow from script to final numbers.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/AVhf_HecZFQ', thumbnailUrl: 'https://i.ytimg.com/vi/AVhf_HecZFQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 33, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-34', title: 'Part 3.12: TV Budget', description: 'TV-specific budgeting — how episodic schedules and budgets differ from features.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/r8msUwwnRYs', thumbnailUrl: 'https://i.ytimg.com/vi/r8msUwwnRYs/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 34, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-35', title: 'Part 4.1: Introduction', description: 'Introduction to the hiring and team management module.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/ylVXQhmKlAY', thumbnailUrl: 'https://i.ytimg.com/vi/ylVXQhmKlAY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 35, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-36', title: 'Part 4.2: Challenges Of Hiring', description: 'The unique challenges of hiring stunt performers — availability, skills, and fit.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/O5zCrvRmS3Q', thumbnailUrl: 'https://i.ytimg.com/vi/O5zCrvRmS3Q/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 36, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-37', title: 'Part 4.3: Hiring People You Know And Don\'t Know - Part 1', description: 'Balancing your trusted team with new talent — part 1 of hiring strategies.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/ICdop9_DMXc', thumbnailUrl: 'https://i.ytimg.com/vi/ICdop9_DMXc/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 37, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-38', title: 'Part 4.4: Hiring People You Know And Don\'t Know - Part 2', description: 'Continuation of hiring strategies — evaluating new performers and building trust.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/L4K2a9L9wxw', thumbnailUrl: 'https://i.ytimg.com/vi/L4K2a9L9wxw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 38, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-39', title: 'Part 4.5: Hiring Basics', description: 'Fundamental hiring practices for stunt coordinators.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/oNUDExZnrfw', thumbnailUrl: 'https://i.ytimg.com/vi/oNUDExZnrfw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 39, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-40', title: 'Part 4.6: Hiring To Specific Roles - Part 1', description: 'Matching performers to specific stunt roles — part 1.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/1oKG3ZuuO3I', thumbnailUrl: 'https://i.ytimg.com/vi/1oKG3ZuuO3I/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 40, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-41', title: 'Part 4.7: Hiring To Specific Roles - Part 2', description: 'Matching performers to specific stunt roles — part 2.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/wys_g-E26yA', thumbnailUrl: 'https://i.ytimg.com/vi/wys_g-E26yA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 41, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-42', title: 'Part 4.9: Stacking Your Team', description: 'Building a well-rounded stunt team — complementary skills and chemistry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/PDqLQN1S9hE', thumbnailUrl: 'https://i.ytimg.com/vi/PDqLQN1S9hE/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 42, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-43', title: 'Part 4.11: Managing Your Team', description: 'Leadership and management principles for running your stunt team effectively.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/EemdsG6rbDU', thumbnailUrl: 'https://i.ytimg.com/vi/EemdsG6rbDU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 43, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-44', title: 'Part 5.1: Pitching Your Ideas', description: 'How to pitch action ideas to directors and producers effectively.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/X5q6ZRfab3Q', thumbnailUrl: 'https://i.ytimg.com/vi/X5q6ZRfab3Q/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 44, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-45', title: 'Part 5.2: The Most Common Script Issues', description: 'Common script problems coordinators encounter and how to address them.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/PD0npuroBiM', thumbnailUrl: 'https://i.ytimg.com/vi/PD0npuroBiM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 45, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-46', title: 'Part 5.4: Example Improving A Story', description: 'A practical example of how a coordinator can improve the story through action.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/AVmEtwGkBxk', thumbnailUrl: 'https://i.ytimg.com/vi/AVmEtwGkBxk/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 46, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-47', title: 'Part 5.3: Improving The Story', description: 'How coordinators can enhance the narrative through better action design.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/-Fq0aCLONJU', thumbnailUrl: 'https://i.ytimg.com/vi/-Fq0aCLONJU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 47, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-48', title: 'Part 5.5: Using The Rule Of 3', description: 'Applying the rule of three to action sequences for maximum impact.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/1ZYFU4vhdao', thumbnailUrl: 'https://i.ytimg.com/vi/1ZYFU4vhdao/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 48, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-49', title: 'Part 5.6: Improving Your Ideas', description: 'Refining and elevating your action concepts through iteration.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/sL7fwgpNhds', thumbnailUrl: 'https://i.ytimg.com/vi/sL7fwgpNhds/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 49, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-50', title: 'Part 5.7: Where Do Ideas Come From', description: 'Sources of inspiration for action sequences — building a creative toolkit.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/0LASf2E4q-Y', thumbnailUrl: 'https://i.ytimg.com/vi/0LASf2E4q-Y/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 50, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-51', title: 'Part 5.8: Pitching Tricks & Tips', description: 'Advanced pitching techniques for coordinators — selling your vision.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/M5GtlMTWT_0', thumbnailUrl: 'https://i.ytimg.com/vi/M5GtlMTWT_0/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 51, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-52', title: 'Part 6.1: Case Studies From Course Participants', description: 'Real case studies from students who took the course and applied the lessons.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/5uo3572tmsk', thumbnailUrl: 'https://i.ytimg.com/vi/5uo3572tmsk/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 52, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-53', title: 'Part 6.2: Case Studies From The Course Instructor', description: 'Brad shares his own case studies from real productions.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/OnrrE6Zy82M', thumbnailUrl: 'https://i.ytimg.com/vi/OnrrE6Zy82M/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 53, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-54', title: 'Part 6.3: Departmental Hierarchy On Film Sets', description: 'Understanding the chain of command across all departments on a film set.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Q-Dwv5ytFxU', thumbnailUrl: 'https://i.ytimg.com/vi/Q-Dwv5ytFxU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 54, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-55', title: 'Part 6.4: Overlap Between Departments', description: 'Where stunt coordination intersects with other departments — navigation and collaboration.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/TuN9T3dZtoQ', thumbnailUrl: 'https://i.ytimg.com/vi/TuN9T3dZtoQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 55, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-56', title: 'Part 6.5: Taking On Responsibility Beyond Your Department', description: 'When and how to step up beyond your core responsibilities.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/WCg4Dsckrx0', thumbnailUrl: 'https://i.ytimg.com/vi/WCg4Dsckrx0/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 56, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-57', title: 'Part 6.6: Relationships And Politics On A Set', description: 'Navigating interpersonal dynamics and politics in the film industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/PuNurcljK9k', thumbnailUrl: 'https://i.ytimg.com/vi/PuNurcljK9k/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 57, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-58', title: 'Part 6.7: Cooperating With People In Other Departments', description: 'Building collaborative relationships with other department heads.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/pEPBAQ9blGc', thumbnailUrl: 'https://i.ytimg.com/vi/pEPBAQ9blGc/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 58, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-59', title: 'Part 7.1: Earning Actors\' Trust From The Start', description: 'How to build trust with actors from your very first interaction.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/oyP_Sw6teKQ', thumbnailUrl: 'https://i.ytimg.com/vi/oyP_Sw6teKQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 59, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-60', title: 'Part 7.2: Researching Actors', description: 'Preparing for actor meetings — understanding their abilities, comfort levels, and preferences.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/5La0vfNHJFA', thumbnailUrl: 'https://i.ytimg.com/vi/5La0vfNHJFA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 60, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-61', title: 'Part 7.3: Power Dynamics In The Movie Business', description: 'Understanding the power structures in film — how they affect your work as coordinator.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/rsYVbgbQv5w', thumbnailUrl: 'https://i.ytimg.com/vi/rsYVbgbQv5w/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 61, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-62', title: 'Part 7.4: Knowing Actors\' Personality', description: 'Reading and adapting to different actor personalities for better collaboration.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/mp0giqcSogs', thumbnailUrl: 'https://i.ytimg.com/vi/mp0giqcSogs/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 62, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-63', title: 'Part 7.5: Goals For The First Meeting', description: 'What to accomplish in your first meeting with an actor — setting the tone for the project.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/5PTalLlnHI4', thumbnailUrl: 'https://i.ytimg.com/vi/5PTalLlnHI4/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 63, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-64', title: 'Part 7.6: The Power Of Star Actors', description: 'Working with high-profile actors — managing expectations and leveraging their influence.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/N2OVu0Zmbc0', thumbnailUrl: 'https://i.ytimg.com/vi/N2OVu0Zmbc0/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 64, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-65', title: 'Part 7.7: Other Types Of Actors', description: 'Working with different categories of actors — day players, background, and specialty performers.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/ho5UMSeVcMU', thumbnailUrl: 'https://i.ytimg.com/vi/ho5UMSeVcMU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 65, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-66', title: 'Part 7.8: Working With Actors On Set', description: 'Day-to-day collaboration with actors during production.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/gGGv-8wdKmk', thumbnailUrl: 'https://i.ytimg.com/vi/gGGv-8wdKmk/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 66, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-67', title: 'Part 8.1: Arriving To Set', description: 'How to arrive on set as a coordinator — first impressions and preparation.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/wV3XV6GnaVY', thumbnailUrl: 'https://i.ytimg.com/vi/wV3XV6GnaVY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 67, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-68', title: 'Part 8.2: Prepping For Set', description: 'On-set preparation routines for coordinators before cameras roll.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/LyASkwPyxb4', thumbnailUrl: 'https://i.ytimg.com/vi/LyASkwPyxb4/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 68, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-69', title: 'Part 8.3: Your Moves And Timing On Set', description: 'Moving efficiently on set — positioning yourself and your team for success.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/f-KmtH1Ljrw', thumbnailUrl: 'https://i.ytimg.com/vi/f-KmtH1Ljrw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 69, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-70', title: 'Part 8.4: Never Waiting On Stunts', description: 'Ensuring production is never held up by the stunt department.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/KiF9QySHHCI', thumbnailUrl: 'https://i.ytimg.com/vi/KiF9QySHHCI/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 70, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-71', title: 'Part 8.5: Director - Stunt Coordinator Dynamics', description: 'The critical relationship between director and stunt coordinator.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/ZpeiL8H0q5U', thumbnailUrl: 'https://i.ytimg.com/vi/ZpeiL8H0q5U/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 71, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-72', title: 'Part 8.6: Communicating Notes To Your Team', description: 'Effective communication of director notes and adjustments to your stunt team.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/ANZ4vBk5pLs', thumbnailUrl: 'https://i.ytimg.com/vi/ANZ4vBk5pLs/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 72, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-73', title: 'Part 8.7: Taking Over Set', description: 'When the coordinator needs to take charge — leading action sequences confidently.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/6W4l8UZ9EHQ', thumbnailUrl: 'https://i.ytimg.com/vi/6W4l8UZ9EHQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 73, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-74', title: 'Part 8.8: Monitoring The Quality Of Scenes', description: 'Quality control during shooting — ensuring every take meets the standard.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/5DzY9Wx_b_w', thumbnailUrl: 'https://i.ytimg.com/vi/5DzY9Wx_b_w/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 74, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-75', title: 'Part 8.9: Leading Your Team', description: 'Leadership principles for coordinators — motivating and directing your team.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/foaJLr6bJDE', thumbnailUrl: 'https://i.ytimg.com/vi/foaJLr6bJDE/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 75, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'coord-76', title: 'Part 8.10: Course Wrap Up', description: 'Final thoughts and key takeaways from the Performer to Coordinator course.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/DBcvkNNCrPQ', thumbnailUrl: 'https://i.ytimg.com/vi/DBcvkNNCrPQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-coordinator', price: 1.99, isFree: false, sortOrder: 76, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    // atlas-course-actors videos
    { id: 'actors-1', title: 'Part 1.1: What This Course Is About', description: 'Introduction to the Action for Actors course — what you\'ll learn and how it applies to your acting career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/rRRoE7a42i8', thumbnailUrl: 'https://i.ytimg.com/vi/rRRoE7a42i8/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 0, isFree: true, sortOrder: 1, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-2', title: 'Part 1.2: Introducing The Modern Triple Threat', description: 'The modern triple threat — acting, physical ability, and camera awareness for action performers.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Sc9c_ta5Lb4', thumbnailUrl: 'https://i.ytimg.com/vi/Sc9c_ta5Lb4/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 2, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-3', title: 'Part 1.3: There Is An Unrealized Niche For Stunt Actors', description: 'The untapped market for actors who can do their own action — a major career opportunity.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/sp3HnKRA4WM', thumbnailUrl: 'https://i.ytimg.com/vi/sp3HnKRA4WM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 3, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-4', title: 'Part 1.4: Set Goals', description: 'Setting clear goals for your action acting career — short-term and long-term planning.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/x6wKkH3k9Vg', thumbnailUrl: 'https://i.ytimg.com/vi/x6wKkH3k9Vg/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 4, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-5', title: 'Part 1.5: All Expected Abilities For An Actor', description: 'The complete skill set expected of a modern action actor.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/STr0w0DQRRw', thumbnailUrl: 'https://i.ytimg.com/vi/STr0w0DQRRw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 5, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-6', title: 'Part 1.6: Myths', description: 'Common myths about action acting — separating fact from fiction.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/PAjXUZU9Se0', thumbnailUrl: 'https://i.ytimg.com/vi/PAjXUZU9Se0/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 6, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-7', title: 'Part 1.7: Mentality', description: 'The mindset needed to succeed as an action actor — mental preparation and resilience.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/yhjKONKXJPw', thumbnailUrl: 'https://i.ytimg.com/vi/yhjKONKXJPw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 7, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-8', title: 'Part 1.8: What To Train', description: 'What physical skills to focus on as an action actor — building your training plan.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/cYeZjXVxA48', thumbnailUrl: 'https://i.ytimg.com/vi/cYeZjXVxA48/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 8, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-9', title: 'Part 2.1: Types Of Training To Focus On', description: 'The different types of training that build a well-rounded action actor.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/4YOuvxiq6Ys', thumbnailUrl: 'https://i.ytimg.com/vi/4YOuvxiq6Ys/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 9, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-10', title: 'Part 2.2: What To Avoid', description: 'Training pitfalls and habits that can hurt your action acting career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/JVKii6G0B8s', thumbnailUrl: 'https://i.ytimg.com/vi/JVKii6G0B8s/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 10, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-11', title: 'Part 2.3: What Does Hollywood Want?', description: 'What the industry actually looks for in action actors — insider perspective.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/UhAFQJnxcIc', thumbnailUrl: 'https://i.ytimg.com/vi/UhAFQJnxcIc/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 11, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-12', title: 'Part 2.4: Why Physical Training Matters For Actors', description: 'The importance of physical fitness for actors pursuing action roles.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/u7Kfxqg8pN0', thumbnailUrl: 'https://i.ytimg.com/vi/u7Kfxqg8pN0/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 12, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-13', title: 'Part 2.5: Emotional Truth In Action', description: 'Bringing emotional authenticity to action sequences — acting through the action.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/xBEPEUNvYFY', thumbnailUrl: 'https://i.ytimg.com/vi/xBEPEUNvYFY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 13, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-14', title: 'Part 2.6: Building Your Action Brand', description: 'Creating a recognizable brand as an action actor — standing out in the market.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/M15n-gLQWgI', thumbnailUrl: 'https://i.ytimg.com/vi/M15n-gLQWgI/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 14, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-15', title: 'Part 2.7: Auditions And Self-Tapes For Action Roles', description: 'Nailing auditions and self-tapes for action roles — what casting directors want to see.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/_3cwRewKON4', thumbnailUrl: 'https://i.ytimg.com/vi/_3cwRewKON4/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 15, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-16', title: 'Part 2.8: Working With Stunt Coordinators', description: 'How actors can build great working relationships with stunt coordinators.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/lCqbMUFNOHw', thumbnailUrl: 'https://i.ytimg.com/vi/lCqbMUFNOHw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 16, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-17', title: 'Part 2.9: On-Set Etiquette For Action Actors', description: 'Professional behavior on set — the do\'s and don\'ts for action actors.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/vu_-VN_X_T0', thumbnailUrl: 'https://i.ytimg.com/vi/vu_-VN_X_T0/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 17, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-18', title: 'Part 2.10: Safety Basics Every Actor Should Know', description: 'Essential safety knowledge for actors performing action scenes.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/sGvBYIKdF28', thumbnailUrl: 'https://i.ytimg.com/vi/sGvBYIKdF28/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 18, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-19', title: 'Part 2.11: Sells And Reactions', description: 'Selling hits and reactions — the actor\'s key skill in fight choreography.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Vg2o2XHLGWg', thumbnailUrl: 'https://i.ytimg.com/vi/Vg2o2XHLGWg/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 19, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-20', title: 'Part 2.12: Camera Awareness In Fight Scenes', description: 'Understanding camera angles and positioning during fight sequences.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/BEQhY-s1YYo', thumbnailUrl: 'https://i.ytimg.com/vi/BEQhY-s1YYo/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 20, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-21', title: 'Part 2.13: Falls And Hits For Actors', description: 'Basic falls and hit reactions every action actor should master.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/iWuekSrw86M', thumbnailUrl: 'https://i.ytimg.com/vi/iWuekSrw86M/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 21, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-22', title: 'Part 2.14: Building Screen Combat Skills', description: 'Developing your screen combat toolkit — progressive skill building.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/FXFjFDi4Q78', thumbnailUrl: 'https://i.ytimg.com/vi/FXFjFDi4Q78/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 22, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-23', title: 'Part 3.1: Make Your First Action Reel', description: 'Creating a compelling action reel — footage selection, editing, and presentation.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/sN2rfkpQmrc', thumbnailUrl: 'https://i.ytimg.com/vi/sN2rfkpQmrc/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 23, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-24', title: 'Part 3.2: Getting An Agent As An Action Actor', description: 'How to find and land an agent who understands action acting.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/UgZvGHZuWcY', thumbnailUrl: 'https://i.ytimg.com/vi/UgZvGHZuWcY/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 24, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-25', title: 'Part 3.3: Social Media Strategy For Actors', description: 'Using social media effectively to promote your action acting career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/AKBLl4LJKBA', thumbnailUrl: 'https://i.ytimg.com/vi/AKBLl4LJKBA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 25, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-26', title: 'Part 3.4: Networking In The Action Community', description: 'Building relationships in the action and stunt community as an actor.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/i23uaZZ9B5g', thumbnailUrl: 'https://i.ytimg.com/vi/i23uaZZ9B5g/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 26, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-27', title: 'Part 3.5: How To Approach Coordinators', description: 'The right way to reach out to stunt coordinators for opportunities.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/YZf2MeW6guw', thumbnailUrl: 'https://i.ytimg.com/vi/YZf2MeW6guw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 27, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-28', title: 'Part 3.6: Setting Realistic Career Expectations', description: 'Managing expectations — the realistic timeline for building an action acting career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/WQWBX2XWwas', thumbnailUrl: 'https://i.ytimg.com/vi/WQWBX2XWwas/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 28, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-29', title: 'Part 3.7: Dealing With Rejection', description: 'Handling rejection in the action acting industry — staying motivated through setbacks.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Z-kCQhyRQI4', thumbnailUrl: 'https://i.ytimg.com/vi/Z-kCQhyRQI4/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 29, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-30', title: 'Part 3.8: Building Long-Term Relationships', description: 'Creating lasting professional relationships that sustain your career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/v-h3q-WP1Wg', thumbnailUrl: 'https://i.ytimg.com/vi/v-h3q-WP1Wg/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 30, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-31', title: 'Part 3.9: The Mental Game', description: 'The psychology of success in action acting — mental strategies for longevity.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/v2X5mvlz_-A', thumbnailUrl: 'https://i.ytimg.com/vi/v2X5mvlz_-A/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 31, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-32', title: 'Part 4.1: Advanced Movement For Camera', description: 'Advanced physical techniques specifically designed for camera work.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/wAx-E-JgX1E', thumbnailUrl: 'https://i.ytimg.com/vi/wAx-E-JgX1E/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 32, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-33', title: 'Part 4.2: Weapons Handling For Actors', description: 'Safe and realistic weapons handling for action scenes.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/S5q62Cj7mxo', thumbnailUrl: 'https://i.ytimg.com/vi/S5q62Cj7mxo/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 33, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-34', title: 'Part 4.3: Wire Work Basics', description: 'Introduction to wire work for actors — what to expect and how to prepare.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/bZ8zMDu4J-o', thumbnailUrl: 'https://i.ytimg.com/vi/bZ8zMDu4J-o/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 34, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-35', title: 'Part 4.4: Working With Vehicles', description: 'Vehicle work for actors — safety, technique, and camera considerations.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Z8iREDj6mbQ', thumbnailUrl: 'https://i.ytimg.com/vi/Z8iREDj6mbQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 35, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-36', title: 'Part 4.5: Emotional Preparation For Intense Scenes', description: 'Preparing emotionally for physically and mentally demanding action scenes.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/3IA2N-c3Cz4', thumbnailUrl: 'https://i.ytimg.com/vi/3IA2N-c3Cz4/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 36, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-37', title: 'Part 4.6: Working Internationally', description: 'Action acting opportunities abroad — navigating international productions.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/8gHCCt8Y6kk', thumbnailUrl: 'https://i.ytimg.com/vi/8gHCCt8Y6kk/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 37, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-38', title: 'Part 4.7: Handling Injuries And Recovery', description: 'Managing injuries and recovery as an action actor — staying in the game.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/xHdQ3W7oLEM', thumbnailUrl: 'https://i.ytimg.com/vi/xHdQ3W7oLEM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 38, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-39', title: 'Part 4.8: Insurance And Legal Basics', description: 'Understanding insurance and legal considerations for action actors.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/kkAC1Ef3iHo', thumbnailUrl: 'https://i.ytimg.com/vi/kkAC1Ef3iHo/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 39, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-40', title: 'Part 4.9: When To Say No', description: 'Knowing your limits — when and how to decline action work safely.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/lGLSn8aSh7w', thumbnailUrl: 'https://i.ytimg.com/vi/lGLSn8aSh7w/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 40, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-41', title: 'Part 4.10: Maintaining Your Body', description: 'Long-term body maintenance for action actors — staying healthy over a career.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/5kDhHxPFb7o', thumbnailUrl: 'https://i.ytimg.com/vi/5kDhHxPFb7o/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 41, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-42', title: 'Part 5.1: The Future Of Action Acting', description: 'Where the action acting industry is headed — emerging trends and opportunities.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/PYjnkVSqoEQ', thumbnailUrl: 'https://i.ytimg.com/vi/PYjnkVSqoEQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 42, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-43', title: 'Part 5.2: Motion Capture And Virtual Production', description: 'Motion capture and virtual production — the future of action performance.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/3E4QnKKB9qk', thumbnailUrl: 'https://i.ytimg.com/vi/3E4QnKKB9qk/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 43, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-44', title: 'Part 5.3: Creating Your Own Content', description: 'Producing your own action content — building your brand independently.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/DXcMm6Eecz4', thumbnailUrl: 'https://i.ytimg.com/vi/DXcMm6Eecz4/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 44, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-45', title: 'Part 5.4: Teaching And Giving Back', description: 'Sharing your knowledge — teaching action skills and mentoring others.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/vXIcIbWRF9I', thumbnailUrl: 'https://i.ytimg.com/vi/vXIcIbWRF9I/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 45, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-46', title: 'Part 5.5: Building A Team', description: 'Assembling your own team of collaborators for action projects.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/7XK3EyBXbPM', thumbnailUrl: 'https://i.ytimg.com/vi/7XK3EyBXbPM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 46, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-47', title: 'Part 5.6: Diversifying Your Income', description: 'Multiple income streams for action actors — beyond on-camera work.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/rUXnqn2v2fk', thumbnailUrl: 'https://i.ytimg.com/vi/rUXnqn2v2fk/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 47, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-48', title: 'Part 5.7: Staying Relevant', description: 'Keeping your career fresh and relevant in a changing industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Xo2PvNxiYdk', thumbnailUrl: 'https://i.ytimg.com/vi/Xo2PvNxiYdk/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 48, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-49', title: 'Part 5.8: Legacy And Impact', description: 'Building a lasting legacy in the action entertainment industry.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/lmWaGPOBRqA', thumbnailUrl: 'https://i.ytimg.com/vi/lmWaGPOBRqA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 49, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-50', title: 'Part 5.9: Your Action Actor Toolkit - Recap', description: 'Recap of all essential tools and skills covered in the course.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/rFuXwD3Bdbw', thumbnailUrl: 'https://i.ytimg.com/vi/rFuXwD3Bdbw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 50, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-51', title: 'Part 5.10: Final Thoughts And Next Steps', description: 'Course conclusion — your roadmap for continued growth as an action actor.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/z0tz0d_uCX4', thumbnailUrl: 'https://i.ytimg.com/vi/z0tz0d_uCX4/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 51, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-52', title: 'Bonus: Q&A With Working Action Actors', description: 'Bonus Q&A session with working action actors sharing real-world advice.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/b4NrQVA4gk8', thumbnailUrl: 'https://i.ytimg.com/vi/b4NrQVA4gk8/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 52, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'actors-53', title: 'Conclusion', description: 'Final wrap-up and encouragement for your action acting journey.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/LWfUr6BNd-8', thumbnailUrl: 'https://i.ytimg.com/vi/LWfUr6BNd-8/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-actors', price: 1.99, isFree: false, sortOrder: 53, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    // atlas-course-fighting videos
    { id: 'fight-1', title: '4 Parts Of A Punch', description: 'Breaking down the four components that make a screen punch look real and sell on camera.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/DGWRCbvmV78', thumbnailUrl: 'https://i.ytimg.com/vi/DGWRCbvmV78/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 0, isFree: true, sortOrder: 1, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-2', title: 'About Atlas Action', description: 'Introduction to Atlas Action and its mission to educate stunt performers and action actors.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Kiv8zP1wZm4', thumbnailUrl: 'https://i.ytimg.com/vi/Kiv8zP1wZm4/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 2, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-3', title: 'About Your Instructor', description: 'Meet your instructor — background, experience, and teaching philosophy.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/VCF_s8xW9xQ', thumbnailUrl: 'https://i.ytimg.com/vi/VCF_s8xW9xQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 3, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-4', title: 'Part 1: Warm Up', description: 'Essential warm-up techniques before fight choreography — preventing injury and maximizing performance.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/Skli0-bGIyQ', thumbnailUrl: 'https://i.ytimg.com/vi/Skli0-bGIyQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 4, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-5', title: 'Part 1A: Warm Up Demo', description: 'Demonstration of the complete warm-up routine for fight work.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/iMAeb6__ILA', thumbnailUrl: 'https://i.ytimg.com/vi/iMAeb6__ILA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 5, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-6', title: 'Part 2: Strikes With Demos', description: 'Learning screen-ready strikes — technique and demonstration for camera-friendly punches and kicks.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/zam0FofbHnM', thumbnailUrl: 'https://i.ytimg.com/vi/zam0FofbHnM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 6, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-7', title: 'Part 3: Defensive Moves', description: 'Defensive techniques for screen combat — blocks, parries, and evasions that sell on camera.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/ThXxIgwbPHI', thumbnailUrl: 'https://i.ytimg.com/vi/ThXxIgwbPHI/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 7, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-8', title: 'Part 3B: Blocks - Practical Tips', description: 'Practical tips for executing convincing blocks in fight choreography.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/HromjX6-Jss', thumbnailUrl: 'https://i.ytimg.com/vi/HromjX6-Jss/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 8, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-9', title: 'Part 3C: Evasions - Practical Tips', description: 'Practical tips for realistic evasions — slips, ducks, and dodges for camera.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/wKpFktFN3zQ', thumbnailUrl: 'https://i.ytimg.com/vi/wKpFktFN3zQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 9, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-10', title: 'Part 4: Style And Form', description: 'Developing your fighting style for film — making it look good and feel authentic.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/wd4glWizjhM', thumbnailUrl: 'https://i.ytimg.com/vi/wd4glWizjhM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 10, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-11', title: 'Part 5: Positioning And Footwork', description: 'The foundation of screen fighting — positioning and footwork for camera.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/8D-60rb-TYM', thumbnailUrl: 'https://i.ytimg.com/vi/8D-60rb-TYM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 11, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-12', title: 'Part 5B: Footwork Demo', description: 'Demonstration of footwork techniques for film fighting.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/x5NjcGKH50c', thumbnailUrl: 'https://i.ytimg.com/vi/x5NjcGKH50c/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 12, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-13', title: 'Part 6: Combinations', description: 'Building effective combinations — stringing moves together for dynamic fight sequences.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/R5aL9fMHMCg', thumbnailUrl: 'https://i.ytimg.com/vi/R5aL9fMHMCg/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 13, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-14', title: 'Part 7: Camera Awareness', description: 'Understanding camera angles and how they affect fight choreography.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/bMRYcWd10IA', thumbnailUrl: 'https://i.ytimg.com/vi/bMRYcWd10IA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 14, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-15', title: 'Part 8: Selling Hits And Reactions', description: 'The art of selling hits — reactions that make fight scenes believable.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/b0QhzYVVJNQ', thumbnailUrl: 'https://i.ytimg.com/vi/b0QhzYVVJNQ/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 15, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-16', title: 'Part 8B: Selling Punches', description: 'Advanced techniques for selling punches convincingly on camera.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/xDt0SWjY4n0', thumbnailUrl: 'https://i.ytimg.com/vi/xDt0SWjY4n0/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 16, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-17', title: 'Part 9: Timing And Distance', description: 'Mastering timing and distance — the core skills of safe and believable screen combat.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/OlREzKD-pFw', thumbnailUrl: 'https://i.ytimg.com/vi/OlREzKD-pFw/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 17, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-18', title: 'Part 10: Partners', description: 'Working with a fight partner — communication, trust, and synchronization.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/TcPrVRm9EhM', thumbnailUrl: 'https://i.ytimg.com/vi/TcPrVRm9EhM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 18, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-19', title: 'Part 10B: Partner Drills', description: 'Partner drill exercises to build timing and coordination.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/qKVzUPMr6rI', thumbnailUrl: 'https://i.ytimg.com/vi/qKVzUPMr6rI/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 19, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-20', title: 'Part 11: Creating A Fight Scene', description: 'The process of creating a complete fight scene from concept to execution.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/sHlk_nz88gc', thumbnailUrl: 'https://i.ytimg.com/vi/sHlk_nz88gc/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 20, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-21', title: 'Part 11B: Creating A Fight Scene Demo', description: 'Full demonstration of creating a fight scene step by step.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/zFQ_VkEY0KU', thumbnailUrl: 'https://i.ytimg.com/vi/zFQ_VkEY0KU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 21, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-22', title: 'Part 12: Safety And Warm Downs', description: 'Post-fight safety checks and cool-down routines to prevent injury.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/q0PVCIGIqZA', thumbnailUrl: 'https://i.ytimg.com/vi/q0PVCIGIqZA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 22, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-23', title: 'Part 12B: Warm Down Demo', description: 'Demonstration of the complete warm-down routine after fight work.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/mfJn2NZGEcM', thumbnailUrl: 'https://i.ytimg.com/vi/mfJn2NZGEcM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 23, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-24', title: 'Part 13: Continuing Your Training', description: 'How to continue developing your screen combat skills beyond this course.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/VhVVFa2FhTI', thumbnailUrl: 'https://i.ytimg.com/vi/VhVVFa2FhTI/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 24, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-25', title: 'Part 14: Homework', description: 'Practice assignments to reinforce your fighting for film skills.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/vkfnLi3M6NU', thumbnailUrl: 'https://i.ytimg.com/vi/vkfnLi3M6NU/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 25, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-26', title: 'Part 15: Conclusion', description: 'Course wrap-up — key takeaways and your path forward in screen combat.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/rFZGWqNJLAA', thumbnailUrl: 'https://i.ytimg.com/vi/rFZGWqNJLAA/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 26, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
    { id: 'fight-27', title: 'Bonus: Nunchucks', description: 'Bonus lesson — nunchuck techniques for film and screen performance.', instructorName: 'Brad Martin', youtubeEmbedUrl: 'https://www.youtube.com/embed/R2OuSPwpJWM', thumbnailUrl: 'https://i.ytimg.com/vi/R2OuSPwpJWM/hqdefault.jpg', durationSeconds: 120, courseId: 'atlas-course-fighting', price: 1.99, isFree: false, sortOrder: 27, enabled: true, createdAt: '2025-01-15T00:00:00.000Z' },
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
      thumbnailUrl: 'https://i.ytimg.com/vi/NXZm2NysASo/hqdefault.jpg',
      price: 0,
      videoIds: ['fdp-1','fdp-2','fdp-3','fdp-4','fdp-5','fdp-6','fdp-7','fdp-8','fdp-9','fdp-10','fdp-11'],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-course-fighting',
      title: 'Fighting for Film',
      description: 'Learn to execute fight choreography on camera. Covers the four components of a perfect strike, hiding punches from camera, daily training drills, and the Atlas Stunt Kata.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/DGWRCbvmV78/hqdefault.jpg',
      price: 0,
      videoIds: ['fight-1','fight-2','fight-3','fight-4','fight-5','fight-6','fight-7','fight-8','fight-9','fight-10','fight-11','fight-12','fight-13','fight-14','fight-15','fight-16','fight-17','fight-18','fight-19','fight-20','fight-21','fight-22','fight-23','fight-24','fight-25','fight-26','fight-27'],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-course-coordinator',
      title: 'From Performer to Coordinator',
      description: 'Advance your career from performer to coordinator. Covers finding work, interviews, script breakdowns, and hiring the best team. Over 80 lessons with real production documents.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/CZb6saKKEzs/hqdefault.jpg',
      price: 0,
      videoIds: ['coord-1','coord-2','coord-3','coord-4','coord-5','coord-6','coord-7','coord-8','coord-9','coord-10','coord-11','coord-12','coord-13','coord-14','coord-15','coord-16','coord-17','coord-18','coord-19','coord-20','coord-21','coord-22','coord-23','coord-24','coord-25','coord-26','coord-27','coord-28','coord-29','coord-30','coord-31','coord-32','coord-33','coord-34','coord-35','coord-36','coord-37','coord-38','coord-39','coord-40','coord-41','coord-42','coord-43','coord-44','coord-45','coord-46','coord-47','coord-48','coord-49','coord-50','coord-51','coord-52','coord-53','coord-54','coord-55','coord-56','coord-57','coord-58','coord-59','coord-60','coord-61','coord-62','coord-63','coord-64','coord-65','coord-66','coord-67','coord-68','coord-69','coord-70','coord-71','coord-72','coord-73','coord-74','coord-75','coord-76'],
      enabled: true,
      createdAt: '2025-01-15T00:00:00.000Z',
    },
    {
      id: 'atlas-course-actors',
      title: 'Action for Actors',
      description: 'Teaches actors how to excel in action entertainment. Master auditions, physical conditioning, creating high-production-value content, and the Modern Triple Threat. 54 lessons included.',
      instructorName: 'Brad Martin',
      thumbnailUrl: 'https://i.ytimg.com/vi/rRRoE7a42i8/hqdefault.jpg',
      price: 0,
      videoIds: ['actors-1','actors-2','actors-3','actors-4','actors-5','actors-6','actors-7','actors-8','actors-9','actors-10','actors-11','actors-12','actors-13','actors-14','actors-15','actors-16','actors-17','actors-18','actors-19','actors-20','actors-21','actors-22','actors-23','actors-24','actors-25','actors-26','actors-27','actors-28','actors-29','actors-30','actors-31','actors-32','actors-33','actors-34','actors-35','actors-36','actors-37','actors-38','actors-39','actors-40','actors-41','actors-42','actors-43','actors-44','actors-45','actors-46','actors-47','actors-48','actors-49','actors-50','actors-51','actors-52','actors-53'],
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
