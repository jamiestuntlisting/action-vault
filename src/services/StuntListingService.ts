/**
 * StuntListing Reels Service
 * Provides access to stunt reels and skill reels from StuntListing members
 * with standard or plus subscriptions.
 */

import reelsData from '../data/stuntlisting-reels.json';

export interface StuntReel {
  id: string;
  title: string;
  url: string;
  youtubeId: string | null;
  thumb: string;
  name: string;       // performer name
  alias: string;      // StuntListing alias/profile slug
  photo: string | null; // performer headshot URL
  role: string;       // 'performer' | 'coordinator'
  tier: 'standard' | 'plus';
}

export interface SkillReel {
  id: string;
  skill: string;      // skill name
  desc: string;       // short description
  url: string;
  youtubeId: string | null;
  thumb: string | null;
  cat: string;        // category like 'Stunt Skills', 'Vehicles', etc.
  level: string;      // 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  name: string;       // performer name
  alias: string;
  photo: string | null;
  role: string;
  tier: 'standard' | 'plus';
}

// All stunt reels from paid StuntListing members — one per performer (first reel)
const allStuntReels: StuntReel[] = (reelsData as any).stuntReels || [];
export const stuntReels: StuntReel[] = (() => {
  const seen = new Set<string>();
  return allStuntReels.filter(r => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });
})();

// All skill reels from paid StuntListing members
export const skillReels: SkillReel[] = (reelsData as any).skillReels || [];

// Skill reel categories
export const skillReelCategories = [...new Set(skillReels.map(r => r.cat).filter(Boolean))];

// Get skill reels by category
export function getSkillReelsByCategory(category: string): SkillReel[] {
  return skillReels.filter(r => r.cat === category);
}

// Get stunt reels for a specific performer by name
export function getStuntReelsByPerformer(name: string): StuntReel[] {
  return stuntReels.filter(r => r.name.toLowerCase() === name.toLowerCase());
}

// Get the StuntListing profile URL for a performer
export function getProfileUrl(alias: string): string {
  return `https://stuntlisting.com/profile/${alias}`;
}

// Get embed URL for a reel
export function getEmbedUrl(reel: StuntReel | SkillReel): string | null {
  if (reel.youtubeId) {
    return `https://www.youtube.com/embed/${reel.youtubeId}`;
  }
  const vimeoMatch = reel.url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}
