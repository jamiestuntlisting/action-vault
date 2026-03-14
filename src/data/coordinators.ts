import { Coordinator } from '../types';

export const coordinators: Coordinator[] = [
  {
    id: 'coord-1',
    name: 'David Leitch',
    bio: 'Former stunt performer turned director. Co-founded 87Eleven Action Design. Known for John Wick, Atomic Blonde, Deadpool 2, Bullet Train, The Fall Guy.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/e50914?text=DL',
    stuntlistingUrl: undefined,
    knownFor: ['John Wick', 'Atomic Blonde', 'Deadpool 2', 'Bullet Train', 'The Fall Guy'],
    videoCount: 12,
  },
  {
    id: 'coord-2',
    name: 'Chad Stahelski',
    bio: 'Legendary stunt coordinator and director. Co-founded 87Eleven. Directed the entire John Wick franchise. Former stunt double for Keanu Reeves.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/e50914?text=CS',
    knownFor: ['John Wick 1-4', 'The Matrix', '300', 'The Hunger Games'],
    videoCount: 15,
  },
  {
    id: 'coord-3',
    name: 'Sam Hargrave',
    bio: 'Stunt coordinator turned director. Known for Marvel work and directing Extraction for Netflix. Second unit director on multiple Avengers films.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/e50914?text=SH',
    knownFor: ['Extraction', 'Avengers: Endgame', 'Avengers: Infinity War', 'Atomic Blonde'],
    videoCount: 8,
  },
  {
    id: 'coord-4',
    name: 'Zoe Bell',
    bio: 'New Zealand stunt performer and actress. Famous as Uma Thurman\'s stunt double in Kill Bill. Known for her incredible car and fight work.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/e50914?text=ZB',
    knownFor: ['Kill Bill', 'Death Proof', 'Once Upon a Time in Hollywood', 'The Hateful Eight'],
    videoCount: 6,
  },
  {
    id: 'coord-5',
    name: 'Jack Gill',
    bio: 'Veteran stunt coordinator with 40+ years in the industry. Known for major franchise work and pioneering car stunt techniques.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/e50914?text=JG',
    knownFor: ['Fast & Furious franchise', 'Transformers', 'The A-Team'],
    videoCount: 9,
  },
  {
    id: 'coord-6',
    name: 'Garrett Warren',
    bio: 'Stunt coordinator and second unit director known for Avatar, Alita, and Terminator. Expert in motion capture and virtual production stunts.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/e50914?text=GW',
    knownFor: ['Avatar', 'Avatar: The Way of Water', 'Alita: Battle Angel', 'Terminator: Dark Fate'],
    videoCount: 7,
  },
  {
    id: 'coord-7',
    name: 'Wade Eastwood',
    bio: 'British stunt coordinator known for his work on Mission: Impossible and James Bond franchises. Specializes in vehicle and high-altitude stunts.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/e50914?text=WE',
    knownFor: ['Mission: Impossible', 'Top Gun: Maverick', 'Edge of Tomorrow'],
    videoCount: 10,
  },
];

export const coordinatorMap = new Map(coordinators.map(c => [c.id, c]));
