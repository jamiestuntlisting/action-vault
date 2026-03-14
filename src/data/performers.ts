import { Performer } from '../types';

export const performers: Performer[] = [
  {
    id: 'perf-1',
    name: 'Keanu Reeves',
    bio: 'Actor who does a significant amount of his own stunt work. Trained extensively in firearms, judo, and jiu-jitsu for John Wick franchise.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/ff6b00?text=KR',
    specialties: ['Firearms', 'Martial Arts', 'Car Work'],
    videoCount: 8,
  },
  {
    id: 'perf-2',
    name: 'Tom Cruise',
    bio: 'Legendary for performing his own stunts. HALO jumps, building climbs, helicopter piloting, motorcycle chases — he does it all.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/ff6b00?text=TC',
    specialties: ['High Falls', 'Vehicle Work', 'Aerial', 'Motorcycle'],
    videoCount: 11,
  },
  {
    id: 'perf-3',
    name: 'Ryan Gosling',
    bio: 'Trained extensively in stunt driving and fighting for his roles. Did much of his own stunt work in The Fall Guy and Drive.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/ff6b00?text=RG',
    specialties: ['Precision Driving', 'Fight Choreography', 'Falls'],
    videoCount: 5,
  },
  {
    id: 'perf-4',
    name: 'Gui DaSilva-Greene',
    bio: 'Professional stunt performer known for Marvel, DC, and John Wick. Social media star sharing BTS stunt content.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/ff6b00?text=GD',
    specialties: ['Fight Choreography', 'Wire Work', 'High Falls'],
    videoCount: 7,
  },
  {
    id: 'perf-5',
    name: 'Amy Johnston',
    bio: 'World champion martial artist turned stunt performer and actress. Known for incredible fight choreography and doubling.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/ff6b00?text=AJ',
    specialties: ['Martial Arts', 'Fight Choreography', 'Weapons'],
    videoCount: 6,
  },
  {
    id: 'perf-6',
    name: 'Bobby Holland Hanton',
    bio: 'Chris Hemsworth\'s longtime stunt double. Former gymnast and diving champion. Known for Thor and Extraction work.',
    photoUrl: 'https://via.placeholder.com/200x200/1a1a1a/ff6b00?text=BH',
    specialties: ['High Falls', 'Fight Choreography', 'Wire Work'],
    videoCount: 5,
  },
];

export const performerMap = new Map(performers.map(p => [p.id, p]));
