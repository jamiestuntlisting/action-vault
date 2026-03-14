import { RigTag } from '../types';

export const rigTags: RigTag[] = [
  { id: 'rig-descender', name: 'descender', displayName: 'Descender' },
  { id: 'rig-ratchet', name: 'ratchet', displayName: 'Ratchet' },
  { id: 'rig-airbag', name: 'airbag', displayName: 'Airbag' },
  { id: 'rig-portapit', name: 'porta_pit', displayName: 'Porta-Pit' },
  { id: 'rig-wire', name: 'wire_rig', displayName: 'Wire Rig' },
  { id: 'rig-cannon', name: 'cannon', displayName: 'Air Cannon' },
  { id: 'rig-jerk-vest', name: 'jerk_vest', displayName: 'Jerk Vest' },
  { id: 'rig-fire-gel', name: 'fire_gel', displayName: 'Fire Gel' },
  { id: 'rig-breakaway', name: 'breakaway', displayName: 'Breakaway Props' },
  { id: 'rig-cardboard-boxes', name: 'cardboard_boxes', displayName: 'Cardboard Boxes' },
  { id: 'rig-crash-pad', name: 'crash_pad', displayName: 'Crash Pad' },
  { id: 'rig-harness', name: 'harness', displayName: 'Full Body Harness' },
];

export const rigTagMap = new Map(rigTags.map(r => [r.id, r]));
