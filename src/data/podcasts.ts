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
    title: 'The Stunt Pod',
    hosts: 'Various stunt professionals',
    description: 'Interviews with stunt performers and coordinators covering stories from set, career advice, and behind-the-scenes breakdowns of major action sequences.',
    status: 'active',
    coverUrl: '',
    links: {
      apple: 'https://podcasts.apple.com/podcast/the-stunt-pod',
      spotify: 'https://open.spotify.com/show/the-stunt-pod',
    },
  },
  {
    id: 'pod-2',
    title: 'Stuntlife Podcast',
    hosts: 'Tyler Weaver',
    description: 'Weekly conversations with working stunt professionals discussing the business, craft, and lifestyle of performing stunts in Hollywood.',
    status: 'active',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/stuntlife-podcast',
      apple: 'https://podcasts.apple.com/podcast/stuntlife',
    },
  },
  {
    id: 'pod-3',
    title: 'Action Movie Anatomy',
    hosts: 'Ben Bateman & Mitch Saba',
    description: 'Two comedians dive deep into action movies, analyzing fight choreography, stunt work, and what makes great action cinema tick.',
    status: 'active',
    coverUrl: '',
    links: {
      apple: 'https://podcasts.apple.com/podcast/action-movie-anatomy',
      spotify: 'https://open.spotify.com/show/action-movie-anatomy',
    },
  },
  {
    id: 'pod-4',
    title: 'The Stunt Guys Podcast',
    hosts: 'Various hosts',
    description: 'Candid conversations about life as a stunt performer — from training and injuries to the politics of the stunt world.',
    status: 'active',
    coverUrl: '',
    links: {
      spotify: 'https://open.spotify.com/show/the-stunt-guys',
    },
  },
  {
    id: 'pod-5',
    title: 'Fight Choreography Podcast',
    hosts: 'Various fight coordinators',
    description: 'Exploring the art and science of fight choreography in film and television. Interviews with fight coordinators, weapon masters, and stunt doubles.',
    status: 'active',
    coverUrl: '',
    links: {
      apple: 'https://podcasts.apple.com/podcast/fight-choreography',
      spotify: 'https://open.spotify.com/show/fight-choreography',
    },
  },
  {
    id: 'pod-6',
    title: 'The Stunt Academy Podcast',
    hosts: 'Various instructors',
    description: 'Educational episodes covering stunt training techniques, safety protocols, and career development for aspiring stunt performers.',
    status: 'active',
    coverUrl: '',
    links: {
      apple: 'https://podcasts.apple.com/podcast/stunt-academy',
    },
  },
  {
    id: 'pod-7',
    title: 'How Did They Do That?',
    hosts: 'Action film enthusiasts',
    description: 'Breaking down famous stunts and action sequences from blockbuster movies — how they were planned, rehearsed, and executed.',
    status: 'inactive',
    coverUrl: '',
    links: {
      youtube: 'https://www.youtube.com/@HowDidTheyDoThat',
    },
  },
  {
    id: 'pod-8',
    title: 'Inside Action',
    hosts: 'Stunt coordinators & actors',
    description: 'Behind-the-scenes look at action filmmaking featuring interviews with coordinators, second-unit directors, and actors who do their own stunts.',
    status: 'inactive',
    coverUrl: '',
    links: {
      apple: 'https://podcasts.apple.com/podcast/inside-action',
    },
  },
];
