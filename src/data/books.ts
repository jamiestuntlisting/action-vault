export interface StuntBook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: 'memoir' | 'history' | 'training' | 'reference';
  coverUrl: string;
  amazonUrl: string;
  ebaySearchUrl: string;
  asin: string;
}

const AFFILIATE_TAG = 'stuntlistin00-20';

function affiliateLink(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

function ebaySearch(title: string): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(title + ' book')}`;
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
    description: 'The classic memoir from Hollywood\'s most legendary stuntman who broke 56 bones, was the highest-paid stuntman in the world, and later directed Smokey and the Bandit. Inspiration for Brad Pitt\'s Cliff Booth in Once Upon a Time in Hollywood.',
    category: 'memoir',
    coverUrl: coverImage('0316078999'),
    amazonUrl: affiliateLink('0316078999'),
    ebaySearchUrl: ebaySearch('Stuntman Hal Needham'),
    asin: '0316078999',
  },
  {
    id: 'book-2',
    title: 'The True Adventures of the World\'s Greatest Stuntman',
    author: 'Vic Armstrong',
    description: 'Guinness World Records holder for Most Prolific Stuntman. Doubled for Harrison Ford, Roger Moore, and Christopher Reeve. Foreword by Steven Spielberg. Later became a top second-unit director.',
    category: 'memoir',
    coverUrl: coverImage('0857689142'),
    amazonUrl: affiliateLink('0857689142'),
    ebaySearchUrl: ebaySearch('True Adventures Greatest Stuntman Vic Armstrong'),
    asin: '0857689142',
  },
  {
    id: 'book-3',
    title: 'Stunt Man: The Autobiography of Yakima Canutt',
    author: 'Yakima Canutt',
    description: 'The pioneering stuntman who coached John Wayne, doubled for Clark Gable and Errol Flynn, and directed the iconic chariot race in Ben-Hur. One of the founding fathers of the stunt profession.',
    category: 'memoir',
    coverUrl: coverImage('0802706134'),
    amazonUrl: affiliateLink('0802706134'),
    ebaySearchUrl: ebaySearch('Stunt Man Yakima Canutt'),
    asin: '0802706134',
  },
  {
    id: 'book-4',
    title: 'Never Grow Up',
    author: 'Jackie Chan',
    description: 'Jackie Chan\'s tell-all memoir covering his childhood at the Peking Opera School, journey from stunt actor to global superstar, and the real cost of doing his own stunts for 40+ years.',
    category: 'memoir',
    coverUrl: 'https://m.media-amazon.com/images/I/81V5cos2hcL._SY522_.jpg',
    amazonUrl: affiliateLink('1501187473'),
    ebaySearchUrl: ebaySearch('Never Grow Up Jackie Chan'),
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
    ebaySearchUrl: ebaySearch('Stars Stunts Stories Carl Ciarfalio'),
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
    ebaySearchUrl: ebaySearch('Hollywood Stuntwoman Diane Peterson'),
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
    ebaySearchUrl: ebaySearch('Falling For The Stars Lisa Dalton'),
    asin: '162747403X',
  },
  {
    id: 'book-17',
    title: 'The Boy Who Lived: When Harry Potter and Reality Collide',
    author: 'David R. Holmes',
    description: 'The incredible true story of David Holmes, Daniel Radcliffe\'s stunt double on the Harry Potter films, who was paralyzed during a stunt on the final film. A story of courage, friendship, and resilience.',
    category: 'memoir',
    coverUrl: 'https://m.media-amazon.com/images/I/71JH-nCb2jL._SY522_.jpg',
    amazonUrl: affiliateLink('B0D8WKJNMW'),
    ebaySearchUrl: ebaySearch('Boy Who Lived David Holmes stunt'),
    asin: 'B0D8WKJNMW',
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
    ebaySearchUrl: ebaySearch('Stuntwomen Untold Hollywood Story'),
    asin: '0813166225',
  },
  {
    id: 'book-9',
    title: 'The Full Burn: On the Set, at the Bar, Behind the Wheel, and Over the Edge with Hollywood Stuntmen',
    author: 'Kevin Conley',
    description: 'Journalism-driven exploration of the stunt world by a former New Yorker editor. Features legends like Debbie Evans and Ronnie Rondell. Conley even subjected himself to a full burn.',
    category: 'history',
    coverUrl: coverImage('1596910240'),
    amazonUrl: affiliateLink('1596910240'),
    ebaySearchUrl: ebaySearch('The Full Burn Kevin Conley'),
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
    ebaySearchUrl: ebaySearch('Danger Silver Screen Stunts'),
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
    ebaySearchUrl: ebaySearch('Hollywood Stunts Action Making'),
    asin: 'B0FQTDFKYT',
  },
  // ── Training & How-To ──
  {
    id: 'book-12',
    title: 'Action Movie Maker\'s Handbook: The Art of Movie Action',
    author: 'Andy Armstrong',
    description: 'The first complete instruction manual for making action movies. Covers fire, water, high falls, fights, vehicle chases, car crashes, and on-set safety. Taurus Lifetime Achievement Award winner.',
    category: 'training',
    coverUrl: coverImage('1530911532'),
    amazonUrl: affiliateLink('1530911532'),
    ebaySearchUrl: ebaySearch('Action Movie Makers Handbook Andy Armstrong'),
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
    ebaySearchUrl: ebaySearch('Stunts How To Handbook Angela Meryl'),
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
    ebaySearchUrl: ebaySearch('How Stunt Hollywood Amy Johnston'),
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
    ebaySearchUrl: ebaySearch('So You Wanna Be Stuntman Mark Aisbett'),
    asin: '0968486509',
  },
  // ── Reference & Fun ──
  {
    id: 'book-16',
    title: 'A Stuntman\'s Guide to Safe Parenting',
    author: 'Andy Armstrong',
    description: 'Humorous parenting book applying 40 years of stunt safety planning to raising kids. From the Taurus Lifetime Achievement Award winner.',
    category: 'reference',
    coverUrl: coverImage('154285945X'),
    amazonUrl: affiliateLink('154285945X'),
    ebaySearchUrl: ebaySearch('Stuntmans Guide Safe Parenting Andy Armstrong'),
    asin: '154285945X',
  },
  {
    id: 'book-18',
    title: 'Siverio Stunts Word Search: Stunt Industry Edition',
    author: 'Siverio Stunts',
    description: 'A fun word search puzzle book themed around the stunt industry — stunt terminology, gear, techniques, and famous performers. Great for downtime between takes.',
    category: 'reference',
    coverUrl: 'https://m.media-amazon.com/images/I/61pZj2YrO7L._SY522_.jpg',
    amazonUrl: affiliateLink('B0F2ZSL1XT'),
    ebaySearchUrl: ebaySearch('Siverio Stunts Word Search'),
    asin: 'B0F2ZSL1XT',
  },
];

  // ── Additional Books ──
  {
    id: 'book-19',
    title: 'My Days With Errol Flynn',
    author: 'Buster Wiles',
    description: 'Stuntman Buster Wiles recounts his career as a circus acrobat and Hollywood stuntman, centering on his close friendship with Errol Flynn beginning with Captain Blood (1935).',
    category: 'memoir',
    coverUrl: coverImage('0915677369'),
    amazonUrl: affiliateLink('0915677369'),
    ebaySearchUrl: ebaySearch('My Days With Errol Flynn Buster Wiles'),
    asin: '0915677369',
  },
  {
    id: 'book-20',
    title: 'Shadows & Light: Journeys With Outlaws in Revolutionary Hollywood',
    author: 'Gary Kent',
    description: 'Actor/stuntman/director Gary Kent covers 40+ years in independent cinema with Jack Nicholson, John Cassavetes, and Bruce Campbell. His Spahn Ranch experiences inspired Brad Pitt\'s Cliff Booth in Once Upon a Time in Hollywood.',
    category: 'memoir',
    coverUrl: coverImage('172713303X'),
    amazonUrl: affiliateLink('172713303X'),
    ebaySearchUrl: ebaySearch('Shadows Light Gary Kent Hollywood'),
    asin: '172713303X',
  },
  {
    id: 'book-21',
    title: 'Flying Sideways: The Story of the World\'s Most Famous Stunt Pilot',
    author: 'Fred North',
    description: 'Hollywood\'s go-to stunt helicopter pilot with 200+ film credits including Inception, James Bond: Spectre, and Fast X. Holds the world altitude record for helicopters. Endorsed by Gerard Butler and Sam Hargrave.',
    category: 'memoir',
    coverUrl: coverImage('1947297872'),
    amazonUrl: affiliateLink('1947297872'),
    ebaySearchUrl: ebaySearch('Flying Sideways Fred North stunt pilot'),
    asin: '1947297872',
  },
  {
    id: 'book-22',
    title: 'Fight Choreography: The Art of Non-Verbal Dialogue',
    author: 'John Kreng',
    description: 'Comprehensive guide covering every element of fight choreography — philosophy, planning, filming, editing, special effects, and sound. Kreng has worked with Jet Li, Steven Spielberg, and Roger Corman.',
    category: 'training',
    coverUrl: coverImage('1592006795'),
    amazonUrl: affiliateLink('1592006795'),
    ebaySearchUrl: ebaySearch('Fight Choreography Non-Verbal Dialogue John Kreng'),
    asin: '1592006795',
  },
  {
    id: 'book-23',
    title: 'Fight Choreography: A Practical Guide for Stage, Film and Television',
    author: 'F. Braun McAsh',
    description: 'Practical manual covering sets, costumes, lighting, weapons, and how to choreograph fights with phrases and rhythm. McAsh is the swordmaster for TV\'s Highlander with 120+ credits since 1976.',
    category: 'training',
    coverUrl: coverImage('1847972233'),
    amazonUrl: affiliateLink('1847972233'),
    ebaySearchUrl: ebaySearch('Fight Choreography Practical Guide McAsh'),
    asin: '1847972233',
  },
  {
    id: 'book-24',
    title: 'Incredible Stunts: The Chaos, Crashes, and Courage of the World\'s Wildest Stuntmen',
    author: 'Jeffery R. Werner',
    description: 'Large-format photo book documenting stuntmen and daredevils with a special tribute to Evel Knievel. Werner was the first still photographer inducted into The Stuntworld Hall of Fame.',
    category: 'history',
    coverUrl: coverImage('0979634962'),
    amazonUrl: affiliateLink('0979634962'),
    ebaySearchUrl: ebaySearch('Incredible Stunts Werner'),
    asin: '0979634962',
  },
  {
    id: 'book-25',
    title: 'Entertainment Rigging for the 21st Century',
    author: 'Bill Sapsis',
    description: 'Covers physical forces, performer flying, and stage automation. Insider information on rigging systems and the skills needed to safely operate them in the entertainment industry.',
    category: 'training',
    coverUrl: coverImage('B01K0Q5JQS'),
    amazonUrl: affiliateLink('B01K0Q5JQS'),
    ebaySearchUrl: ebaySearch('Entertainment Rigging 21st Century Sapsis'),
    asin: 'B01K0Q5JQS',
  },
  {
    id: 'book-26',
    title: 'Rigging for Entertainment: Regulations and Practice',
    author: 'Chris Higgs',
    description: 'Detailed coverage of rigging regulations and equipment for the entertainment industry — factors of safety, wire ropes, equipment descriptions, and working at height.',
    category: 'training',
    coverUrl: coverImage('1904031218'),
    amazonUrl: affiliateLink('1904031218'),
    ebaySearchUrl: ebaySearch('Rigging Entertainment Chris Higgs'),
    asin: '1904031218',
  },
];

export const bookCategories = ['memoir', 'history', 'training', 'reference'] as const;
export const bookCategoryLabels: Record<string, string> = {
  memoir: 'Memoirs',
  history: 'History',
  training: 'Training',
  reference: 'Fun',
};
