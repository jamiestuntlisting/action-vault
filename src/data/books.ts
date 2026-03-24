export interface StuntBook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: 'memoir' | 'history' | 'training' | 'reference';
  coverUrl: string;
  amazonUrl: string;
  asin: string;
}

// Replace 'stuntlisting-20' with your actual Amazon Associates affiliate tag
const AFFILIATE_TAG = 'stuntlisting-20';

function affiliateLink(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

function coverImage(asin: string): string {
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX200_.jpg`;
}

export const books: StuntBook[] = [
  // ── Memoirs & Autobiographies ──
  {
    id: 'book-1',
    title: 'Stuntman!: My Car-Crashing, Plane-Jumping, Bone-Breaking, Death-Defying Hollywood Life',
    author: 'Hal Needham',
    description: 'The classic memoir from Hollywood\'s most legendary stuntman who broke 56 bones, was the highest-paid stuntman in the world, and later directed Smokey and the Bandit.',
    category: 'memoir',
    coverUrl: coverImage('0316078999'),
    amazonUrl: affiliateLink('0316078999'),
    asin: '0316078999',
  },
  {
    id: 'book-2',
    title: 'The True Adventures of the World\'s Greatest Stuntman',
    author: 'Vic Armstrong',
    description: 'Guinness World Records holder for Most Prolific Stuntman. Doubled for Harrison Ford, Roger Moore, and Christopher Reeve. Foreword by Steven Spielberg.',
    category: 'memoir',
    coverUrl: coverImage('0857689142'),
    amazonUrl: affiliateLink('0857689142'),
    asin: '0857689142',
  },
  {
    id: 'book-3',
    title: 'Stunt Man: The Autobiography of Yakima Canutt',
    author: 'Yakima Canutt',
    description: 'The pioneering stuntman who coached John Wayne, doubled for Clark Gable, and directed the iconic chariot race in Ben-Hur.',
    category: 'memoir',
    coverUrl: coverImage('0802706134'),
    amazonUrl: affiliateLink('0802706134'),
    asin: '0802706134',
  },
  {
    id: 'book-4',
    title: 'Never Grow Up',
    author: 'Jackie Chan',
    description: 'Jackie Chan\'s tell-all memoir covering his childhood, journey from stunt actor to global star, and his relationship with Hollywood.',
    category: 'memoir',
    coverUrl: coverImage('1501187473'),
    amazonUrl: affiliateLink('1501187473'),
    asin: '1501187473',
  },
  {
    id: 'book-5',
    title: 'Stars, Stunts and Stories: A Hollywood Stuntman\'s Fall to Fame',
    author: 'Carl Ciarfalio',
    description: 'Worked with Scorsese, Ron Howard, Eastwood, and Cruise. Two-term president of the Stuntman\'s Association who helped establish the first Emmy Award for stunts.',
    category: 'memoir',
    coverUrl: coverImage('0986155276'),
    amazonUrl: affiliateLink('0986155276'),
    asin: '0986155276',
  },
  {
    id: 'book-6',
    title: 'Hollywood Stuntwoman: Follow Your Dreams... Overcome Your Fears',
    author: 'Diane Peterson',
    description: 'Over 40 years as a professional stuntwoman on 200+ films including Titanic and Batman Forever. Doubled for Sharon Stone, Jessica Lange, and Faye Dunaway.',
    category: 'memoir',
    coverUrl: coverImage('1957807555'),
    amazonUrl: affiliateLink('1957807555'),
    asin: '1957807555',
  },
  {
    id: 'book-7',
    title: 'Falling For The Stars: A Stunt Gal\'s Tattle Tales',
    author: 'Lisa Loving Dalton',
    description: 'Memoir of a stuntwoman covering cliff hangs, car hits, high falls, and the career-ending spinal injury that changed her life.',
    category: 'memoir',
    coverUrl: coverImage('162747403X'),
    amazonUrl: affiliateLink('162747403X'),
    asin: '162747403X',
  },
  // ── History & Journalism ──
  {
    id: 'book-8',
    title: 'Stuntwomen: The Untold Hollywood Story',
    author: 'Mollie Gregory',
    description: 'The first comprehensive history of stuntwomen in film from the silent era to the 21st century. Features 65 interviews with pioneering stuntwomen including Jeannie Epper.',
    category: 'history',
    coverUrl: coverImage('0813166225'),
    amazonUrl: affiliateLink('0813166225'),
    asin: '0813166225',
  },
  {
    id: 'book-9',
    title: 'The Full Burn: On the Set, at the Bar, Behind the Wheel, and Over the Edge with Hollywood Stuntmen',
    author: 'Kevin Conley',
    description: 'Journalism-driven exploration of the stunt world by a former New Yorker editor. Features legends like Debbie Evans and Ronnie Rondell.',
    category: 'history',
    coverUrl: coverImage('1596910240'),
    amazonUrl: affiliateLink('1596910240'),
    asin: '1596910240',
  },
  {
    id: 'book-10',
    title: 'Danger on the Silver Screen: 50 Films Celebrating Cinema\'s Greatest Stunts',
    author: 'Scott McGee',
    description: 'Profiles 50 foundational stunt films from 1920 to 2017 with behind-the-scenes stories and hundreds of photographs. A Turner Classic Movies publication.',
    category: 'history',
    coverUrl: coverImage('076247484X'),
    amazonUrl: affiliateLink('076247484X'),
    asin: '076247484X',
  },
  {
    id: 'book-11',
    title: 'Hollywood Stunts: Action in the Making',
    author: 'Allen Woodman',
    description: 'Insider account from a multi-award-winning stunt coordinator with over 40 years in the business. Part memoir, part career guide.',
    category: 'history',
    coverUrl: coverImage('B0FQTDFKYT'),
    amazonUrl: affiliateLink('B0FQTDFKYT'),
    asin: 'B0FQTDFKYT',
  },
  // ── Training & How-To ──
  {
    id: 'book-12',
    title: 'Action Movie Maker\'s Handbook: The Art of Movie Action',
    author: 'Andy Armstrong',
    description: 'The first complete instruction manual for making action movies. Covers fire, water, high falls, fights, vehicle chases, car crashes, and on-set safety.',
    category: 'training',
    coverUrl: coverImage('1530911532'),
    amazonUrl: affiliateLink('1530911532'),
    asin: '1530911532',
  },
  {
    id: 'book-13',
    title: 'Stunts: The How To Handbook',
    author: 'Angela Meryl',
    description: 'Practical career guide covering gear, networking, training, resume building, and marketing. Meryl has doubled for Beyonce, Halle Berry, and Rihanna.',
    category: 'training',
    coverUrl: coverImage('0615579094'),
    amazonUrl: affiliateLink('0615579094'),
    asin: '0615579094',
  },
  {
    id: 'book-14',
    title: 'How to Stunt in Hollywood',
    author: 'Amy Johnston',
    description: 'Interview-based guide spotlighting men and women who perform and design stunts, with advice from top Hollywood stunt professionals.',
    category: 'training',
    coverUrl: coverImage('1726307271'),
    amazonUrl: affiliateLink('1726307271'),
    asin: '1726307271',
  },
  {
    id: 'book-15',
    title: 'So You Wanna Be a Stuntman',
    author: 'Mark Aisbett',
    description: 'Practical guide from a 12-year veteran who appeared in films like Fantastic Four and Blade Trinity. Covers how to break into the world\'s toughest business.',
    category: 'training',
    coverUrl: coverImage('0968486509'),
    amazonUrl: affiliateLink('0968486509'),
    asin: '0968486509',
  },
  // ── Reference / Bonus ──
  {
    id: 'book-16',
    title: 'A Stuntman\'s Guide to Safe Parenting',
    author: 'Andy Armstrong',
    description: 'Humorous parenting book applying 40 years of stunt safety planning to raising kids. From the Taurus Lifetime Achievement Award winner.',
    category: 'reference',
    coverUrl: coverImage('154285945X'),
    amazonUrl: affiliateLink('154285945X'),
    asin: '154285945X',
  },
];

export const bookCategories = ['memoir', 'history', 'training', 'reference'] as const;
export const bookCategoryLabels: Record<string, string> = {
  memoir: 'Memoirs & Autobiographies',
  history: 'History & Journalism',
  training: 'Training & How-To',
  reference: 'Reference & Bonus',
};
