export interface AvatarOption {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

export const avatarOptions: AvatarOption[] = [
  { key: 'fire', label: 'Fire Burn', emoji: '🔥', color: '#FF4500' },
  { key: 'fall', label: 'High Fall', emoji: '🪂', color: '#1E90FF' },
  { key: 'car', label: 'Car Flip', emoji: '🏎️', color: '#FFD700' },
  { key: 'fight', label: 'Fighter', emoji: '🥊', color: '#DC143C' },
  { key: 'sword', label: 'Sword Master', emoji: '⚔️', color: '#C0C0C0' },
  { key: 'explosion', label: 'Explosion', emoji: '💥', color: '#FF6347' },
  { key: 'motorcycle', label: 'Rider', emoji: '🏍️', color: '#2F4F4F' },
  { key: 'wire', label: 'Wire Flyer', emoji: '🦅', color: '#4169E1' },
  { key: 'camera', label: 'Camera Op', emoji: '🎬', color: '#8B4513' },
  { key: 'stunt', label: 'Stunt Pro', emoji: '🎭', color: '#9400D3' },
  { key: 'water', label: 'Water Work', emoji: '🌊', color: '#00CED1' },
  { key: 'horse', label: 'Horse Rider', emoji: '🐎', color: '#8B4513' },
];

export const avatarMap = new Map(avatarOptions.map(a => [a.key, a]));
