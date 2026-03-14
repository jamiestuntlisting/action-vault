import { TrainingPath } from '../types';

export const trainingPaths: TrainingPath[] = [
  {
    id: 'tp-1',
    title: 'Intro to High Falls',
    description: 'Learn the fundamentals of high fall work, from basic technique to professional airbag falls. Progress from 30-foot falls to understanding 100+ foot setups.',
    skillTagId: 'high-falls',
    videoIds: ['v20', 'v11', 'v1'],
    thumbnailUrl: 'https://img.youtube.com/vi/d5LVpYagDWs/maxresdefault.jpg',
    totalDuration: 1652,
  },
  {
    id: 'tp-2',
    title: 'Fire Burns 101',
    description: 'Everything you need to know about fire burns in the stunt industry. Safety protocols, gel application, and full body burn demonstrations.',
    skillTagId: 'fire-burns',
    videoIds: ['v12', 'v4'],
    thumbnailUrl: 'https://img.youtube.com/vi/3x9_jFmKBSg/maxresdefault.jpg',
    totalDuration: 1380,
  },
  {
    id: 'tp-3',
    title: 'Fight Choreography Fundamentals',
    description: 'From basic sells to complex sequences. Study fight choreography from the best in the business across multiple styles.',
    skillTagId: 'fight-h2h',
    videoIds: ['v10', 'v19', 'v7', 'v15'],
    thumbnailUrl: 'https://img.youtube.com/vi/t1SrVH3aTbk/maxresdefault.jpg',
    totalDuration: 1710,
  },
  {
    id: 'tp-4',
    title: 'Vehicle Stunts Masterclass',
    description: 'Precision driving, cannon rolls, car chases — study the art and science of vehicle stunts from basic J-turns to record-breaking rolls.',
    skillTagId: 'precision-driving',
    videoIds: ['v18', 'v3', 'v13', 'v5'],
    thumbnailUrl: 'https://img.youtube.com/vi/5lGoQhFb4NM/maxresdefault.jpg',
    totalDuration: 2840,
  },
  {
    id: 'tp-5',
    title: 'Wire Work & Rigging',
    description: 'Understand wire rigs, descenders, and flying systems. From harness basics to complex multi-point flying rigs.',
    skillTagId: 'wire-work',
    videoIds: ['v14', 'v11', 'v16'],
    thumbnailUrl: 'https://img.youtube.com/vi/GvX-heRiHxY/maxresdefault.jpg',
    totalDuration: 1390,
  },
];

export const trainingPathMap = new Map(trainingPaths.map(tp => [tp.id, tp]));
