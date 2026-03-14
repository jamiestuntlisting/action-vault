import { SkillTag } from '../types';

export const skillTags: SkillTag[] = [
  { id: 'high-falls', name: 'high_fall', displayName: 'High Falls', category: 'Falls', icon: 'arrow-down' },
  { id: 'fire-burns', name: 'fire_burn', displayName: 'Fire Burns', category: 'Fire', icon: 'flame' },
  { id: 'car-hits', name: 'car_hit', displayName: 'Car Hits', category: 'Car Work', icon: 'car' },
  { id: 'car-rolls', name: 'car_roll', displayName: 'Car Rolls', category: 'Car Work', icon: 'car' },
  { id: 'car-chases', name: 'car_chase', displayName: 'Car Chases', category: 'Car Work', icon: 'car' },
  { id: 'cannon-rolls', name: 'cannon_roll', displayName: 'Cannon Rolls', category: 'Car Work', icon: 'car' },
  { id: 'fight-h2h', name: 'fight_hand_to_hand', displayName: 'Hand-to-Hand', category: 'Fight Choreography', icon: 'fitness' },
  { id: 'fight-weapons', name: 'fight_weapons', displayName: 'Weapons Fighting', category: 'Fight Choreography', icon: 'fitness' },
  { id: 'fight-mma', name: 'fight_mma', displayName: 'MMA-Style', category: 'Fight Choreography', icon: 'fitness' },
  { id: 'wire-work', name: 'wire_work', displayName: 'Wire Work & Flying Rigs', category: 'Rigs', icon: 'resize' },
  { id: 'glass-breakaway', name: 'glass_breakaway', displayName: 'Glass & Breakaway', category: 'Gags', icon: 'flash' },
  { id: 'explosions', name: 'explosions_pyro', displayName: 'Explosions & Pyro', category: 'Fire', icon: 'flame' },
  { id: 'water-work', name: 'water_work', displayName: 'Water Work', category: 'Water', icon: 'water' },
  { id: 'horse-work', name: 'horse_animal', displayName: 'Horse & Animal Work', category: 'Specialty', icon: 'paw' },
  { id: 'motorcycle', name: 'motorcycle', displayName: 'Motorcycle', category: 'Vehicle', icon: 'bicycle' },
  { id: 'specialty-vehicle', name: 'specialty_vehicle', displayName: 'Specialty Vehicle', category: 'Vehicle', icon: 'car' },
  { id: 'ratchet', name: 'ratchet_jerk', displayName: 'Ratchet & Jerk Gags', category: 'Rigs', icon: 'flash' },
  { id: 'stair-falls', name: 'stair_fall', displayName: 'Stair Falls', category: 'Falls', icon: 'arrow-down' },
  { id: 'body-falls', name: 'body_fall', displayName: 'Body Falls', category: 'Falls', icon: 'arrow-down' },
  { id: 'precision-driving', name: 'precision_driving', displayName: 'Precision Driving', category: 'Car Work', icon: 'speedometer' },
  { id: 'mocap', name: 'motion_capture', displayName: 'Motion Capture', category: 'Virtual', icon: 'body' },
  { id: 'virtual-production', name: 'virtual_production', displayName: 'Virtual Production', category: 'Virtual', icon: 'videocam' },
  { id: 'bts-featurette', name: 'bts_featurette', displayName: 'Full BTS Featurette', category: 'Documentary', icon: 'film' },
  { id: 'interview', name: 'interview', displayName: 'Interviews', category: 'Documentary', icon: 'mic' },
  { id: 'training', name: 'training_gym', displayName: 'Training & Gym', category: 'Training', icon: 'barbell' },
  { id: 'rig-breakdown', name: 'rig_breakdown', displayName: 'Rig Breakdowns', category: 'Safety', icon: 'construct' },
  { id: 'safety-walkthrough', name: 'safety_walkthrough', displayName: 'Safety Walkthroughs', category: 'Safety', icon: 'shield-checkmark' },
];

export const skillTagMap = new Map(skillTags.map(t => [t.id, t]));

export const categories = [...new Set(skillTags.map(t => t.category))];

export const categoryThumbnails: Record<string, string> = {
  'Falls': 'https://img.youtube.com/vi/I7lYjYnPOyU/hqdefault.jpg',
  'Fire': 'https://img.youtube.com/vi/gwn0J2OVDG4/hqdefault.jpg',
  'Car Work': 'https://img.youtube.com/vi/Vntap_wZDKI/hqdefault.jpg',
  'Fight Choreography': 'https://img.youtube.com/vi/psWUuuoYMy8/hqdefault.jpg',
  'Rigs': 'https://img.youtube.com/vi/ACEL0WwgdDU/hqdefault.jpg',
  'Gags': 'https://img.youtube.com/vi/Oh7svEBK6I8/hqdefault.jpg',
  'Water': 'https://img.youtube.com/vi/b-DVRCUhinQ/hqdefault.jpg',
  'Specialty': 'https://img.youtube.com/vi/mLvu5oyQZek/hqdefault.jpg',
  'Vehicle': 'https://img.youtube.com/vi/-lsFs2615gw/hqdefault.jpg',
  'Virtual': 'https://img.youtube.com/vi/b-DVRCUhinQ/hqdefault.jpg',
  'Documentary': 'https://img.youtube.com/vi/ERc9grpxINg/hqdefault.jpg',
  'Training': 'https://img.youtube.com/vi/ZSl8_ylM3-I/hqdefault.jpg',
  'Safety': 'https://img.youtube.com/vi/ERc9grpxINg/hqdefault.jpg',
};
