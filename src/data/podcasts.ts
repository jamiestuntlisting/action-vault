export interface StuntPodcast {
  id: string;
  title: string;
  hosts: string;
  description: string;
  status: 'active' | 'inactive';
  coverUrl: string;
  links: {
    apple?: string;
    spotify?: string;
    youtube?: string;
    website?: string;
  };
}

export const podcasts: StuntPodcast[] = [
  {
    id: 'pod-1',
    title: 'Artists Behind the Action',
    hosts: 'Cale Schultz (87eleven Action Design)',
    description: 'The official podcast of 87eleven Action Design, co-founded by Chad Stahelski and David Leitch (John Wick, Atomic Blonde). Features interviews with top stunt performers including Keanu Reeves\' double Jackson Spidell and Heidi Moneymaker.',
    status: 'inactive',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/13xJ37W09Ec5gpTZPUN9WO',
      apple: 'https://podcasts.apple.com/us/podcast/artists-behind-the-action/id1463240027',
      website: 'https://www.87eleven.net/podcasts/',
    },
  },
  {
    id: 'pod-2',
    title: 'Stunt Stories w/ Corey Eubanks',
    hosts: 'Corey Eubanks',
    description: 'Veteran stuntman known for The Dukes of Hazzard, The Fall Guy, Fast & Furious, and Transformers shares stories from performing stunts for Hollywood\'s biggest stars and interviews fellow professionals.',
    status: 'active',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/6omAupv7zDCKWwSuGUavD4',
      apple: 'https://podcasts.apple.com/us/podcast/stunt-stories-w-corey-eubanks/id1790007212',
      website: 'https://stuntstories.buzzsprout.com/',
    },
  },
  {
    id: 'pod-3',
    title: 'Film Fights With Friends',
    hosts: 'Stephen Koepfer & Paul Varacchi',
    description: 'Winner of Best Podcast at the 2024 Dramatic Action Awards. Deep dives into specific fight scenes from film and TV with industry guests from Breakfall Studios.',
    status: 'active',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/0KZYPw4F0sKCkZiNrtlZ8w',
      apple: 'https://podcasts.apple.com/us/podcast/film-fights-with-friends/id1738939711',
      website: 'https://fightswithfriends.captivate.fm/',
    },
  },
  {
    id: 'pod-4',
    title: 'Cunning Stunts',
    hosts: 'David Holmes',
    description: 'David Holmes — Daniel Radcliffe\'s stunt double who was paralyzed on the Harry Potter set — pays tribute to stunt coordinators and performers through candid industry interviews.',
    status: 'inactive',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/2ZBPrCspi2QvQx7wvs5i96',
      apple: 'https://podcasts.apple.com/us/podcast/cunning-stunts-a-podcast-series/id1513793963',
    },
  },
  {
    id: 'pod-5',
    title: 'The Stunt Pod',
    hosts: 'Jon Auty',
    description: 'Interviews with stunt legends and working professionals covering careers spanning decades of film and TV action. Guests include Greg Powell, Paul Jennings, and Jean Coulter.',
    status: 'active',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/2QxgnchOHMkvZlGSPqKMfO',
      website: 'https://thestuntpod.podbean.com/',
    },
  },
  {
    id: 'pod-6',
    title: 'Going Again',
    hosts: 'Randy & Andrew Butcher',
    description: 'Father and son stunt professionals talk with friends from their decades-long careers in TV and film. Randy is known for Mayor of Kingstown and The Way Home.',
    status: 'active',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/1q9BsD34Gedf5uJUQYyFKk',
      apple: 'https://podcasts.apple.com/us/podcast/going-again/id1641513532',
      website: 'https://goingagain.podbean.com/',
    },
  },
  {
    id: 'pod-7',
    title: 'STUNTSTRUCK!',
    hosts: 'Augie Davis',
    description: 'Stunt coordinator from The Lord of the Rings and The Hobbit shares knowledge, wisdom, and strategy for stunt men and women worldwide. Guests include Sala Baker and Dayna Grant.',
    status: 'inactive',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/1hiLNeLIgJTToaNcoiu5yI',
      apple: 'https://podcasts.apple.com/us/podcast/stuntstruck-ordinary-people-doing-extraordinary-things/id1523310719',
    },
  },
  {
    id: 'pod-8',
    title: 'Action Filmmaking Decoded',
    hosts: 'Darren Tun & Mike Messina',
    description: 'In-depth analysis of action choreography and fight sequences. Notable guests include Sam Hargrave (Extraction director) and Gui DaSilva-Greene (Black Panther stunt double).',
    status: 'active',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/7H0Qcf00kHboWoshyOOcBt',
      apple: 'https://podcasts.apple.com/us/podcast/action-filmmaking-decoded-the-story-of-action-films/id1513949547',
      website: 'https://actiondecoded.com/',
    },
  },
  {
    id: 'pod-9',
    title: 'Behind the Stunts',
    hosts: 'Jon Auty',
    description: 'A celebration of action in James Bond films and beyond, paying tribute to the stunt men and women who create breathtaking action sequences in the 007 franchise.',
    status: 'active',
    coverUrl: '',
    links: {
      apple: 'https://podcasts.apple.com/us/podcast/behind-the-stunts/id1547078357',
    },
  },
  {
    id: 'pod-10',
    title: 'Stunt Talk',
    hosts: 'Char',
    description: 'Aspiring Irish stunt performer training toward the British Stunt Register covers performer stories, sports health, nutrition, athletic disciplines, and how stunts integrate with film departments.',
    status: 'active',
    coverUrl: '',
    links: {
      apple: 'https://podcasts.apple.com/us/podcast/stunt-talk/id1814710552',
    },
  },
  {
    id: 'pod-11',
    title: 'Kung Fu Drive-In',
    hosts: 'Jeof Vita',
    description: 'Covers kung fu movies and martial arts cinema with interviews featuring stunt performers, fight choreographers, and directors. Recent guests include Sharlene Royer (Shogun) and Lateef Crowder (The Mandalorian).',
    status: 'active',
    coverUrl: '',
    links: {
      apple: 'https://podcasts.apple.com/us/podcast/kung-fu-drive-in-podcast/id1087252154',
      website: 'https://kungfudrivein.libsyn.com/',
    },
  },
];
