import { useState, useEffect, useRef } from "react";
import { SignIn, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { api } from "./api.js";

// ─── ATLAS ACTION VAULT DATA ───
const ATLAS_COURSE = {
  id: "atlas-101",
  title: "101 Intro to Stunts",
  channel: "Atlas Action",
  playlistId: "PLL2kbKgT9A-XBgflHKns2mz-Q59_uW-8u",
  desc: "The complete introductory stunt course from Atlas Action. Learn the fundamentals of professional stunt work across 4 weeks of structured training covering safety, falls, fights, reactions, and more.",
  videoCost: 1.99,
  get coursePrice() { return Math.floor(this.videos.length * this.videoCost * 0.5) + 0.99; },
  videos: [
    { num:1, title:"w1 s03", videoId:"RRWdgHTU1po", week:1 },
    { num:2, title:"w1 s04", videoId:"2iah0vibzfU", week:1 },
    { num:3, title:"w1 s05", videoId:"c-u8CRRFkFo", week:1 },
    { num:4, title:"w1 s06", videoId:"cWvJ9UDxxYY", week:1 },
    { num:5, title:"w1 s09", videoId:"lhM5O00wV60", week:1 },
    { num:6, title:"w1 s10", videoId:"FQJFjotz-gE", week:1 },
    { num:7, title:"w1 s12", videoId:"K3-sBLjKNxk", week:1 },
    { num:8, title:"w1 s12b", videoId:"VbaPr1sSEdE", week:1 },
    { num:9, title:"w1 s14", videoId:"4JSgzCpEuFM", week:1 },
    { num:10, title:"w1 s15", videoId:"hfYACspjOR0", week:1 },
    { num:11, title:"w1 s16", videoId:"tXqtfLjyDtQ", week:1 },
    { num:12, title:"w1 s17", videoId:"mJY5wRyYuEI", week:1 },
    { num:13, title:"w1 s18", videoId:"Evfv71w-BEE", week:1 },
    { num:14, title:"w2 s38", videoId:"jsTsOucm-m4", week:2 },
    { num:15, title:"w2 s39", videoId:"SZGABE7ZZeY", week:2 },
    { num:16, title:"w2 s43", videoId:"Chgl_2oxcEg", week:2 },
    { num:17, title:"w2 s44", videoId:"oCNfxn0OL-8", week:2 },
    { num:18, title:"w2 s45", videoId:"gDn5WtjP_6A", week:2 },
    { num:19, title:"w2 s46", videoId:"Z9YKUpLQhWY", week:2 },
    { num:20, title:"w2 s47", videoId:"DGlgi6WxSDw", week:2 },
    { num:21, title:"w2 s48", videoId:"SOtOMDvbOh8", week:2 },
    { num:22, title:"w2 s50", videoId:"tcd4QWrFOWw", week:2 },
    { num:23, title:"w2 s51", videoId:"tHVFqJukCDM", week:2 },
    { num:24, title:"w2 s52", videoId:"J10xC7fVius", week:2 },
    { num:25, title:"w2 s53", videoId:"EUCPPvwPRO8", week:2 },
    { num:26, title:"w2 s54", videoId:"8qtxyYG32Jg", week:2 },
    { num:27, title:"w3 s63a", videoId:"7JmcO7-qw08", week:3 },
    { num:28, title:"w3 s63b", videoId:"jyiNWOjQOMA", week:3 },
    { num:29, title:"w3 s63c", videoId:"GcfiRM54wCM", week:3 },
    { num:30, title:"w3 s63d", videoId:"wPWHLsnsbm8", week:3 },
    { num:31, title:"w3 s63e", videoId:"LA4BRYojP2Q", week:3 },
    { num:32, title:"w3 s63f", videoId:"goC2oPNo7pA", week:3 },
    { num:33, title:"w3 s65", videoId:"P1i8Jr2XIOc", week:3 },
    { num:34, title:"w3 s66", videoId:"dn_debwtjZQ", week:3 },
    { num:35, title:"w3 s67", videoId:"SBN2h6_uyZ0", week:3 },
    { num:36, title:"w3 s68", videoId:"5npw5ACQOXA", week:3 },
    { num:37, title:"w3 s69", videoId:"Pv4wgk-bWiE", week:3 },
    { num:38, title:"w3 s71", videoId:"W3pX6SEEG44", week:3 },
    { num:39, title:"w3 s72", videoId:"2ynEzk917Bg", week:3 },
    { num:40, title:"w4 s81", videoId:"ZXtXkTlkZro", week:4 },
    { num:41, title:"w4 s82", videoId:"8WEktvin2Pc", week:4 },
    { num:42, title:"w4 s83", videoId:"vcmp_F168_A", week:4 },
    { num:43, title:"w4 s84", videoId:"3HXi0nToB8Y", week:4 },
    { num:44, title:"w4 s85", videoId:"hsiDMpdst24", week:4 },
    { num:45, title:"w4 s86", videoId:"w_6RQL8ifZk", week:4 },
    { num:46, title:"w4 s87", videoId:"aNdV7kON5Eg", week:4 },
    { num:47, title:"w4 s88", videoId:"nN_pjMVWfUA", week:4 },
    { num:48, title:"w4 s89", videoId:"-hiJCCzAt7U", week:4 },
    { num:49, title:"w4 s90", videoId:"_KellaiJcuE", week:4 },
    { num:50, title:"w4 s91", videoId:"bI1ugYtuopE", week:4 },
    { num:51, title:"w4 s92", videoId:"bsd2Ib_0twU", week:4 },
  ],
};

// ─── DATA ───
const VIDEOS = [
  // CORRIDOR CREW - STUNTMEN REACT
  { id:1, title:"Stuntmen React to Bad & Great Hollywood Stunts", channel:"Corridor Crew", cat:"React & Breakdown", sub:"Stuntmen React", url:"https://www.youtube.com/watch?v=EaVYPo8Ne2I", guest:"Eric Linden", films:["Jackie Chan Films","Way of the Dragon","Oldboy"], desc:"Real stuntmen break down iconic fight scenes and stunts, analyzing what works and what doesn't in Hollywood action.", year:2019, duration:"16 min", intensity:"Beginner Friendly" },
  { id:2, title:"Stuntmen React to Bad & Great Hollywood Stunts 2", channel:"Corridor Crew", cat:"React & Breakdown", sub:"Stuntmen React", url:"https://www.youtube.com/watch?v=uAl4TMDGF20", guest:"Eric Linden", films:["Mission: Impossible - Fallout","John Wick"], desc:"HALO jump breakdown and John Wick's fight choreography explained by working professionals.", year:2019, duration:"18 min", intensity:"Beginner Friendly" },
  { id:3, title:"Stuntmen React to Bad & Great Hollywood Stunts 3", channel:"Corridor Crew", cat:"React & Breakdown", sub:"Stuntmen React", url:"https://www.youtube.com/watch?v=MHlaGSaVOkI", guest:"Eric Linden", films:["Fast & Furious","Crouching Tiger Hidden Dragon"], desc:"Car stunts and wirework analyzed with insider perspective on what's real vs. enhanced.", year:2019, duration:"17 min", intensity:"Beginner Friendly" },
  { id:4, title:"Stuntmen React: Martial Arts Edition", channel:"Corridor Crew", cat:"React & Breakdown", sub:"Stuntmen React", url:"https://www.youtube.com/watch?v=d7hZfoQlAcc", guest:"Gui DaSilva-Greene", films:["The Matrix","Kill Bill","Ip Man"], desc:"Martial arts-focused breakdown with stuntman and actor Gui DaSilva-Greene on fight choreography techniques.", year:2019, duration:"16 min", intensity:"Intermediate" },
  { id:5, title:"Stuntmen React ft. Scott Adkins", channel:"Corridor Crew", cat:"React & Breakdown", sub:"Stuntmen React", url:"https://www.youtube.com/watch?v=BmLRCAT9xSc", guest:"Scott Adkins", films:["Undisputed","Doctor Strange","Ip Man 4"], desc:"Action star Scott Adkins breaks down martial arts cinema stunts and his own on-screen fight work.", year:2021, duration:"18 min", intensity:"Intermediate" },
  { id:6, title:"Stuntmen React to Bad & Great Hollywood Stunts 5", channel:"Corridor Crew", cat:"React & Breakdown", sub:"Stuntmen React", url:"https://www.youtube.com/watch?v=fc6pNSqrkBk", guest:"Eric Linden", films:["Terminator 2","Raiders of the Lost Ark"], desc:"Classic 80s and 90s stunt sequences dissected — the golden age of practical action filmmaking.", year:2019, duration:"17 min", intensity:"Beginner Friendly" },
  { id:7, title:"Stuntmen React to Marvel Stunts", channel:"Corridor Crew", cat:"React & Breakdown", sub:"Stuntmen React", url:"https://www.youtube.com/watch?v=BfRmGEAaU0c", guest:"Gui DaSilva-Greene", films:["Avengers: Endgame","Black Panther","Winter Soldier"], desc:"How Marvel combines wirework, VFX, and practical stunts across the MCU's biggest action sequences.", year:2020, duration:"19 min", intensity:"Beginner Friendly" },

  // INSIDER / MOVIES INSIDER
  { id:10, title:"How Stunt Performers Pull Off Dangerous Falls", channel:"Insider", cat:"How It Works", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=oe_pLp5iihc", guest:"Stephen Koepfer", films:["John Wick 3","Ray Donovan"], desc:"Stephen Koepfer demonstrates high falls, face-offs, and suicide falls with real stunt performers showing the technique.", year:2022, duration:"12 min", intensity:"Advanced" },
  { id:11, title:"What 12 of The Rock's Stunts Looked Like Behind The Scenes", channel:"Insider", cat:"Behind The Scenes", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=QjULp3THQRI", guest:"", films:["San Andreas","Jumanji","Fast & Furious Presents: Hobbs & Shaw"], desc:"Side-by-side comparisons of final shots vs. green screen rigs and stunt doubles for Dwayne Johnson.", year:2021, duration:"22 min", intensity:"Beginner Friendly" },
  { id:12, title:"What 12 Keanu Reeves Stunts Looked Like Behind The Scenes", channel:"Insider", cat:"Behind The Scenes", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=I7lYjYnPOyU", guest:"Tad Griffith", films:["John Wick: Chapter 4","The Matrix Reloaded","Point Break"], desc:"Keanu's reverse 180 car stunt and hand-to-hand combat between speeding cars — the most ambitious John Wick action yet.", year:2023, duration:"25 min", intensity:"Intermediate" },
  { id:13, title:"What 5 Tom Holland Stunts Looked Like Behind The Scenes", channel:"Insider", cat:"Behind The Scenes", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=ACEL0WwgdDU", guest:"", films:["Spider-Man: No Way Home","Uncharted"], desc:"How Tom Holland's gymnast and dance background helps him perform aspects of his own Spider-Man stunts.", year:2022, duration:"14 min", intensity:"Beginner Friendly" },
  { id:14, title:"8 Stunt Tricks Used Over And Over In Movies", channel:"Insider", cat:"How It Works", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=hSwU2PPeaxA", guest:"Brad Martin, Monique Ganderton, Bobby Holland Hanton, Tanoai Reed", films:["Thor","Jumanji","Wonder Woman"], desc:"Ratchet pulls, air rams, wire rigs, mini trampolines — the recurring stunt techniques explained by the performers who do them.", year:2021, duration:"18 min", intensity:"Beginner Friendly" },
  { id:15, title:"How Marvel's Shang-Chi Pulled Off Its 7-Minute Bus Fight", channel:"Insider", cat:"Behind The Scenes", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=1eE5XlL5LDQ", guest:"", films:["Shang-Chi and the Legend of the Ten Rings"], desc:"The iconic bus fight's blend of wirework, practical choreography, and VFX stitching broken down shot by shot.", year:2021, duration:"15 min", intensity:"Intermediate" },
  { id:16, title:"How Batman Movies Pulled Off Batmobile & Batwing Stunts", channel:"Insider", cat:"Behind The Scenes", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=dmhvOKMUnNo", guest:"", films:["Batman Begins","The Dark Knight","The Batman"], desc:"From practical Tumbler builds to CGI-enhanced chase sequences — vehicle stunts across the Batman franchise.", year:2022, duration:"20 min", intensity:"Intermediate" },
  { id:17, title:"How Hollywood Sets Actors on Fire", channel:"Insider", cat:"How It Works", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=_1oy6X2VKXE", guest:"", films:["Various"], desc:"Full body burns, fire gel application, safety protocols, and the stunt performers who specialize in fire work.", year:2020, duration:"11 min", intensity:"Advanced" },
  { id:18, title:"How Costumes Are Destroyed For Movies & TV", channel:"Insider", cat:"How It Works", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=cKi00WlJo1c", guest:"", films:["Various"], desc:"Breakaway clothing, blood rigs, and how wardrobe departments prep costumes for stunt sequences.", year:2021, duration:"13 min", intensity:"Beginner Friendly" },
  { id:19, title:"Marvel's First Female Stunt Coordinator", channel:"Insider", cat:"Performer Profile", sub:"Movies Insider", url:"https://www.youtube.com/watch?v=gLFBvbpHJlc", guest:"Monique Ganderton", films:["Avengers: Endgame","Deadpool"], desc:"Monique Ganderton on 15 years of stunt work, doubling Charlize Theron, and becoming Marvel's first female stunt coordinator.", year:2020, duration:"10 min", intensity:"Beginner Friendly" },

  // VANITY FAIR
  { id:20, title:"John Wick 2 — Stunt Coordinator Breaks Down Car Chase", channel:"Vanity Fair", cat:"Coordinator Breakdown", sub:"Notes on a Scene", url:"https://www.youtube.com/watch?v=u-Cv2-cgulo", guest:"Darrin Prescott", films:["John Wick: Chapter 2"], desc:"Darrin Prescott draws on an interactive monitor showing exactly how each car hit, drift, and crash was choreographed.", year:2017, duration:"8 min", intensity:"Intermediate" },
  { id:21, title:"Fast Five — Vault Car Chase Breakdown", channel:"Vanity Fair", cat:"Coordinator Breakdown", sub:"Notes on a Scene", url:"https://www.youtube.com/watch?v=kQCDMsXqEYs", guest:"Jack Gill", films:["Fast Five"], desc:"Jack Gill explains how a real 9,000-pound steel vault was dragged behind two Dodge Chargers through Rio streets.", year:2019, duration:"10 min", intensity:"Intermediate" },
  { id:22, title:"Stuntwoman Breaks Down Her Career — Alicia Vela-Bailey", channel:"Vanity Fair", cat:"Performer Profile", sub:"Notes on a Scene", url:"https://www.youtube.com/watch?v=BZVGHMcm_Lk", guest:"Alicia Vela-Bailey", films:["Wonder Woman","Avatar","Interstellar","Transformers"], desc:"From Underworld to Wonder Woman — a stuntwoman's career arc through Hollywood's biggest franchises.", year:2018, duration:"12 min", intensity:"Beginner Friendly" },
  { id:23, title:"Stunt Coordinator Shauna Duggins — Career Breakdown", channel:"Vanity Fair", cat:"Performer Profile", sub:"Notes on a Scene", url:"https://www.youtube.com/watch?v=uTjHBQFB-9I", guest:"Shauna Duggins", films:["Charlie's Angels","GLOW","Iron Man 3","Kill Bill Vol. 2"], desc:"Emmy-nominated stunt coordinator on Netflix's GLOW traces her path from helicopter jumps to running stunt departments.", year:2019, duration:"14 min", intensity:"Beginner Friendly" },
  { id:24, title:"Stuntwoman Reviews Action & Comedy Stunts", channel:"Vanity Fair", cat:"React & Breakdown", sub:"Notes on a Scene", url:"https://www.youtube.com/watch?v=VFTqjTRuMbY", guest:"Alyma Dorsey", films:["Mission: Impossible","Casino Royale","Ghostbusters","Death Proof"], desc:"Hollywood stuntwoman Alyma Dorsey reviews stunts across genres — from Bond to Tarantino to comedy.", year:2020, duration:"16 min", intensity:"Beginner Friendly" },

  // STUDIO BTS
  { id:30, title:"Mission: Impossible — Dead Reckoning Stunt Featurette", channel:"Paramount Pictures", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/watch?v=a_WuGDYawFQ", guest:"Tom Cruise", films:["Mission: Impossible - Dead Reckoning Part One"], desc:"Tom Cruise's motorcycle cliff jump and train sequence — months of preparation for seconds of screen time.", year:2023, duration:"8 min", intensity:"Advanced" },
  { id:31, title:"John Wick Chapter 4 — Behind the Scenes", channel:"Lionsgate", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/watch?v=eVpb08KUQGA", guest:"Chad Stahelski", films:["John Wick: Chapter 4"], desc:"Director and former stunt coordinator Chad Stahelski breaks down the Arc de Triomphe car sequence and staircase fight.", year:2023, duration:"12 min", intensity:"Intermediate" },
  { id:32, title:"The Fall Guy — Making of Stunts Featurette", channel:"Universal Pictures", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/watch?v=mD9YzcQrLKo", guest:"David Leitch, Logan Holladay", films:["The Fall Guy"], desc:"How the stunt-centric love letter to performers set a world record cannon roll and celebrated practical action.", year:2024, duration:"10 min", intensity:"Beginner Friendly" },
  { id:33, title:"Extraction 2 — 21-Minute Oner Breakdown", channel:"Netflix", cat:"Coordinator Breakdown", sub:"Studio BTS", url:"https://www.youtube.com/watch?v=Y7m8C5xFkJU", guest:"Sam Hargrave", films:["Extraction 2"], desc:"Director Sam Hargrave explains how hundreds of VFX stitches created the illusion of one continuous 21-minute action take.", year:2023, duration:"15 min", intensity:"Advanced" },
  { id:34, title:"Atomic Blonde — Fight Choreography Breakdown", channel:"Vanity Fair", cat:"Coordinator Breakdown", sub:"Notes on a Scene", url:"https://www.youtube.com/watch?v=gcDRRU_LHTY", guest:"Sam Hargrave", films:["Atomic Blonde"], desc:"Sam Hargrave breaks down tempered glass table gags, rubber prop work, and Charlize Theron's intensive training.", year:2017, duration:"10 min", intensity:"Advanced" },
  { id:35, title:"Mad Max: Fury Road — Stunts Behind The Scenes", channel:"Warner Bros.", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/watch?v=yKAHGwCyamc", guest:"Guy Norris", films:["Mad Max: Fury Road"], desc:"Stunt coordinator Guy Norris and the Namibian desert team's insane practical vehicle stunt work.", year:2015, duration:"14 min", intensity:"Advanced" },
  { id:36, title:"Top Gun: Maverick — How the Flying Stunts Were Filmed", channel:"Paramount Pictures", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/watch?v=YxSbDJkVmBo", guest:"Tom Cruise", films:["Top Gun: Maverick"], desc:"How actors trained in real fighter jets and the custom camera rigs built for in-cockpit footage at 7.5 Gs.", year:2022, duration:"11 min", intensity:"Intermediate" },
  { id:37, title:"The Dark Knight — Truck Flip Behind The Scenes", channel:"Warner Bros.", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/watch?v=h4mTxSGOrpw", guest:"", films:["The Dark Knight"], desc:"How Christopher Nolan's team flipped an 18-wheeler on LaSalle Street in downtown Chicago for real.", year:2008, duration:"6 min", intensity:"Intermediate" },
  { id:38, title:"Casino Royale — Parkour Chase BTS", channel:"Sony Pictures", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/watch?v=iZxNbAwY_rk", guest:"Sébastien Foucan", films:["Casino Royale"], desc:"Parkour founder Sébastien Foucan and the stunt team behind Bond's construction site chase sequence.", year:2006, duration:"9 min", intensity:"Intermediate" },

  // ANALYSIS & EDUCATION
  { id:40, title:"Jackie Chan — How to Do Action Comedy", channel:"Every Frame a Painting", cat:"Analysis & Education", sub:"Film Essay", url:"https://www.youtube.com/watch?v=Z1PCtIaM_GQ", guest:"", films:["Police Story","Drunken Master","Rumble in the Bronx"], desc:"Legendary video essay on how Jackie Chan designs and shoots action comedy differently from Hollywood — rhythm, pain, and wide shots.", year:2014, duration:"9 min", intensity:"Beginner Friendly" },
  { id:41, title:"The Raid — Why One-Take Fight Scenes Matter", channel:"Every Frame a Painting", cat:"Analysis & Education", sub:"Film Essay", url:"https://www.youtube.com/watch?v=Z1PCtIaM_GQ", guest:"", films:["The Raid","The Raid 2"], desc:"How Gareth Evans and Iko Uwais revolutionized modern martial arts filmmaking with practical choreography.", year:2015, duration:"8 min", intensity:"Beginner Friendly" },

  // STUNT COORDINATOR ARCHIVES
  { id:50, title:"Buffy the Vampire Slayer — BTS Stunt Footage Archive", channel:"Jeff Pruitt", cat:"Behind The Scenes", sub:"Coordinator Archive", url:"https://www.youtube.com/user/JeffPruitt", guest:"Jeff Pruitt, Sophia Crawford", films:["Buffy the Vampire Slayer"], desc:"Stunt coordinator Jeff Pruitt's personal archive of fight choreography development, rehearsals, and on-set BTS from Buffy.", year:1999, duration:"Various", intensity:"Beginner Friendly" },
  { id:51, title:"Concrete and Crashpads — Stunt Community Documentary", channel:"Film Independent", cat:"Documentary", sub:"Feature Doc", url:"https://www.youtube.com/watch?v=GG7EYYHm3Sw", guest:"Stephen Koepfer, Matthew Kaplowitz", films:["John Wick 3","Selma"], desc:"Documentary short profiling NYC stunt community members and the invisible, dangerous craft of professional stunt performance.", year:2017, duration:"20 min", intensity:"Beginner Friendly" },

  // PODCASTS
  { id:55, title:"JAMCast — Gui DaSilva on Stunt Doubling Jamie Foxx", channel:"JAMCast", cat:"Podcast & Interview", sub:"Industry Podcast", url:"https://youtube.com/JoiningAllMovement", guest:"Gui DaSilva-Greene, Travis Wong", films:["The Paper Tigers","Project Power"], desc:"Stuntman Gui DaSilva discusses doubling Jamie Foxx, transitioning to acting, and the independent action short community.", year:2021, duration:"60 min", intensity:"Intermediate" },
  { id:56, title:"JAMCast — Noelle Kim on StuntAccess.com", channel:"JAMCast", cat:"Podcast & Interview", sub:"Industry Podcast", url:"https://youtube.com/JoiningAllMovement", guest:"Noelle Kim, Travis Wong", films:["Various"], desc:"The only female executive at the Stuntmen's Association discusses founding StuntAccess.com and industry networking.", year:2021, duration:"55 min", intensity:"Beginner Friendly" },

  // CLASSICS & HISTORY
  { id:60, title:"Terminator 2 — Helicopter Under the Overpass", channel:"StuntHistory", cat:"Behind The Scenes", sub:"Classic BTS", url:"https://www.youtube.com/results?search_query=terminator+2+helicopter+stunt+behind+scenes", guest:"Chuck Tamburro", films:["Terminator 2: Judgment Day"], desc:"Veteran stunt pilot Chuck Tamburro flew a real helicopter inches under a freeway overpass. James Cameron operated the camera himself.", year:1991, duration:"5 min", intensity:"Advanced" },
  { id:61, title:"Ben-Hur (1959) — Chariot Race Behind The Scenes", channel:"TCM", cat:"Behind The Scenes", sub:"Classic BTS", url:"https://www.youtube.com/results?search_query=ben+hur+chariot+race+behind+scenes", guest:"Yakima Canutt, Joe Canutt", films:["Ben-Hur"], desc:"The legendary chariot race that defined stunt work for a generation — Yakima Canutt's masterwork of practical action.", year:1959, duration:"8 min", intensity:"Beginner Friendly" },
  { id:62, title:"Buster Keaton — The Original Stuntman", channel:"Film History", cat:"Analysis & Education", sub:"Classic BTS", url:"https://www.youtube.com/results?search_query=buster+keaton+stunts+analysis", guest:"", films:["The General","Steamboat Bill Jr.","Sherlock Jr."], desc:"How Buster Keaton performed death-defying stunts in the silent era with zero safety equipment or visual effects.", year:1920, duration:"10 min", intensity:"Beginner Friendly" },

  // SPECIALTY TECHNIQUE
  { id:70, title:"How Car Flips Are Done in Movies", channel:"Tom Harper", cat:"How It Works", sub:"Technique Deep Dive", url:"https://www.youtube.com/watch?v=oEq2cUVJGuw", guest:"Tom Harper", films:["Various"], desc:"Tom Harper's pneumatic ram and lever arm system that replaced the old cannon-under-car method of rolling vehicles.", year:2018, duration:"7 min", intensity:"Advanced" },
  { id:71, title:"How Wire Stunts & Flying Rigs Work", channel:"Insider", cat:"How It Works", sub:"Technique Deep Dive", url:"https://www.youtube.com/results?search_query=how+wire+stunts+flying+rigs+work+movies", guest:"", films:["Captain Marvel","Avengers: Endgame","Shang-Chi"], desc:"Wire rigs vs. tuning forks — how different suspension systems create different flying feels from wobbly novice to confident hero.", year:2020, duration:"9 min", intensity:"Intermediate" },
  { id:72, title:"How Ratchet Pulls Work in Stunts", channel:"Insider", cat:"How It Works", sub:"Technique Deep Dive", url:"https://www.youtube.com/results?search_query=ratchet+pull+stunts+how+it+works", guest:"", films:["Avengers: Endgame","The Mandalorian"], desc:"Air-pressure-powered cables that yank stunt performers forward or backward to simulate devastating hits.", year:2021, duration:"6 min", intensity:"Intermediate" },

  // MORE PERFORMER PROFILES
  { id:80, title:"Bobby Holland Hanton — Chris Hemsworth's Stunt Double", channel:"Bobby Holland Hanton", cat:"Performer Profile", sub:"Stunt Performer Channel", url:"https://www.youtube.com/channel/UCjqGYwEmKoINJJnnpVdH8Xw", guest:"Bobby Holland Hanton", films:["Thor","Wonder Woman","Quantum of Solace","Avengers"], desc:"Training footage, BTS clips, and the daily life of one of Hollywood's most in-demand stunt doubles.", year:2020, duration:"Various", intensity:"Beginner Friendly" },
  { id:81, title:"Zoë Bell — From Kill Bill to Death Proof", channel:"Various", cat:"Performer Profile", sub:"Stunt Legend", url:"https://www.youtube.com/results?search_query=zoe+bell+stunt+career+interview", guest:"Zoë Bell", films:["Kill Bill","Death Proof","The Hateful Eight"], desc:"New Zealand stunt legend Zoë Bell on doubling Uma Thurman, Tarantino's stunt-first filmmaking, and her acting career.", year:2015, duration:"15 min", intensity:"Beginner Friendly" },
  { id:82, title:"Dar Robinson — Greatest Stuntman Ever", channel:"Various", cat:"Documentary", sub:"Stunt Legend", url:"https://www.youtube.com/results?search_query=dar+robinson+greatest+stuntman", guest:"Dar Robinson", films:["Stick","Sharky's Machine","Highpoint"], desc:"The legendary Dar Robinson who held multiple world records for highest falls and most dangerous stunts in cinema history.", year:1986, duration:"12 min", intensity:"Beginner Friendly" },
  { id:83, title:"Hal Needham — The Real Fall Guy", channel:"Various", cat:"Documentary", sub:"Stunt Legend", url:"https://www.youtube.com/results?search_query=hal+needham+stuntman+documentary", guest:"Hal Needham", films:["Smokey and the Bandit","Hooper","The Cannonball Run"], desc:"Hal Needham went from doubling Burt Reynolds to directing — the stuntman who inspired The Fall Guy.", year:1980, duration:"20 min", intensity:"Beginner Friendly" },

  // RECENT / NEW
  { id:90, title:"The Fall Guy — World Record Cannon Roll", channel:"Universal Pictures", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/results?search_query=fall+guy+cannon+roll+world+record", guest:"Logan Holladay", films:["The Fall Guy"], desc:"Stunt performer Logan Holladay set a new Guinness World Record with 8.5 cannon rolls for the film.", year:2024, duration:"5 min", intensity:"Advanced" },
  { id:91, title:"Furiosa — Stunt Featurette", channel:"Warner Bros.", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/results?search_query=furiosa+stunts+behind+the+scenes", guest:"Guy Norris", films:["Furiosa: A Mad Max Saga"], desc:"Guy Norris returns to coordinate the prequel's massive practical vehicle stunts across Australian desert locations.", year:2024, duration:"8 min", intensity:"Advanced" },
  { id:92, title:"Nobody — Bob Odenkirk Stunt Training", channel:"Universal Pictures", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/results?search_query=nobody+bob+odenkirk+stunt+training", guest:"Bob Odenkirk, Daniel Bernhardt", films:["Nobody"], desc:"How Bob Odenkirk trained for two years to perform his own fight sequences in this John Wick-adjacent action thriller.", year:2021, duration:"7 min", intensity:"Intermediate" },
  { id:93, title:"Everything Everywhere All at Once — Fight Choreography BTS", channel:"A24", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/results?search_query=everything+everywhere+fight+choreography+behind+scenes", guest:"", films:["Everything Everywhere All at Once"], desc:"How the Daniels and their small stunt team created wildly inventive fight sequences on an indie budget.", year:2022, duration:"9 min", intensity:"Intermediate" },
  { id:94, title:"Inception — Rotating Hallway Fight Explained", channel:"Warner Bros.", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/results?search_query=inception+rotating+hallway+behind+scenes", guest:"Guy Hendrix Dyas", films:["Inception"], desc:"How Christopher Nolan built a massive rotating hallway set and Joseph Gordon-Levitt trained to fight in zero gravity.", year:2010, duration:"8 min", intensity:"Intermediate" },
  { id:95, title:"Bourne Ultimatum — Rooftop Chase BTS", channel:"Universal Pictures", cat:"Behind The Scenes", sub:"Studio BTS", url:"https://www.youtube.com/watch?v=JMS3Y5ItWoQ", guest:"", films:["The Bourne Ultimatum"], desc:"The iconic window jump achieved with a wired stunt double tracked mid-air by a Handycam operator on a separate rig.", year:2007, duration:"7 min", intensity:"Intermediate" },
];

const DECADES = ["All","2020s","2010s","2000s","1990s","1980s & Earlier"];
const CATS = ["All","Behind The Scenes","React & Breakdown","How It Works","Coordinator Breakdown","Performer Profile","Analysis & Education","Podcast & Interview","Documentary"];
const INTENSITIES = ["All","Beginner Friendly","Intermediate","Advanced"];

// User-applied section tags (separate from cat/sub which are content-baked)
// Any video can be tagged into one or more of these "shelves" surfaced in the nav.
const SECTIONS = [
  { id: "action-shorts", label: "Action Shorts", color: "#ff4081", desc: "Short independent action films and choreographed sequences." },
  { id: "previz", label: "Previz", color: "#7c4dff", desc: "Pre-visualization, animatics and stunt-vis breakdowns." },
  { id: "movie-trailers", label: "Movie Trailers", color: "#ffb300", desc: "Trailers for stunt-heavy releases." },
  { id: "free-courses", label: "Free Courses", color: "#00c853", desc: "Free training playlists and tutorial series." },
  { id: "skill-demos", label: "Skill Demonstrations", color: "#26c6da", desc: "Stunt skill demos — falls, fights, fire, wire, driving." },
  { id: "stunt-reels", label: "Stunt Reels", color: "#ef6c00", desc: "Performer demo reels and showcase compilations." },
];
const getSectionLabel = id => SECTIONS.find(s => s.id === id)?.label || id;
const getSectionColor = id => SECTIONS.find(s => s.id === id)?.color || "#e50914";

// Course/list status workflow (frontend mock — real approval needs a backend)
const COURSE_STATUS = {
  draft:    { label: "Draft",            color: "#888"    },
  pending:  { label: "Pending Review",   color: "#ffb300" },
  approved: { label: "Approved",         color: "#46d369" },
  rejected: { label: "Changes Requested",color: "#e50914" },
};

// Generic item types a list/course can hold
const ITEM_TYPES = [
  { id: "video",   label: "StuntFlix Video", icon: "🎬" },
  { id: "youtube", label: "YouTube Video",   icon: "▶"  },
  { id: "podcast", label: "Podcast Episode", icon: "🎧" },
  { id: "book",    label: "Book",            icon: "📕" },
  { id: "pdf",     label: "PDF / Document",  icon: "📄" },
  { id: "link",    label: "Link / Other",    icon: "🔗" },
];
const getItemTypeIcon = t => ITEM_TYPES.find(i => i.id === t)?.icon || "🔗";

const getDecade = y => { if(y>=2020) return "2020s"; if(y>=2010) return "2010s"; if(y>=2000) return "2000s"; if(y>=1990) return "1990s"; return "1980s & Earlier"; };

// localStorage helpers — single layer so Supabase swap is one-file change later
const lsKey = k => `stuntflix:${k}`;
const lsLoad = (k, fallback) => {
  try { const v = localStorage.getItem(lsKey(k)); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const lsSave = (k, v) => {
  try { localStorage.setItem(lsKey(k), JSON.stringify(v)); } catch {}
};
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── URL obfuscation (NOT encryption — keeps private URLs out of view-source/grep) ───
// XOR + base64. Anyone running the JS can recover URLs in DevTools; real protection needs a backend.
const VAULT_KEY = "av-2026-rotate-when-backend-lands";
const obfuscateURL = (url) => {
  if (!url) return "";
  try {
    let x = "";
    for (let i = 0; i < url.length; i++) {
      x += String.fromCharCode(url.charCodeAt(i) ^ VAULT_KEY.charCodeAt(i % VAULT_KEY.length));
    }
    return "v1:" + btoa(unescape(encodeURIComponent(x)));
  } catch { return url; }
};
const deobfuscateURL = (obf) => {
  if (!obf) return "";
  if (!obf.startsWith("v1:")) return obf; // legacy plaintext
  try {
    const x = decodeURIComponent(escape(atob(obf.slice(3))));
    let u = "";
    for (let i = 0; i < x.length; i++) {
      u += String.fromCharCode(x.charCodeAt(i) ^ VAULT_KEY.charCodeAt(i % VAULT_KEY.length));
    }
    return u;
  } catch { return ""; }
};
// Open a private URL via decode-on-click so it never lives in href attributes
const openPrivateURL = (obf) => {
  const u = deobfuscateURL(obf);
  if (u) window.open(u, "_blank", "noopener,noreferrer");
};

// ─── Pricing math (StuntListing platform fee) ───
// First $100 of course revenue: creator keeps 100%. Above $100: platform takes 20%.
const PLATFORM_FEE_RATE = 0.20;
const PLATFORM_FEE_THRESHOLD = 100;
const computeCreatorEarnings = (gross) => {
  if (gross <= PLATFORM_FEE_THRESHOLD) return gross;
  return PLATFORM_FEE_THRESHOLD + (gross - PLATFORM_FEE_THRESHOLD) * (1 - PLATFORM_FEE_RATE);
};

const catColors = {
  "Behind The Scenes":"#e50914","React & Breakdown":"#f5c518","How It Works":"#46d369",
  "Coordinator Breakdown":"#4fc3f7","Performer Profile":"#ce93d8","Analysis & Education":"#ff8a65",
  "Podcast & Interview":"#90caf9","Documentary":"#a5d6a7"
};
const getCatColor = c => catColors[c] || "#e50914";

// Row groupings for Netflix-style horizontal rows
const ROW_DEFS = [
  { title: "Trending Now", filter: v => v.year >= 2022 },
  { title: "Stuntmen React Series", filter: v => v.sub === "Stuntmen React" },
  { title: "Studio Behind The Scenes", filter: v => v.sub === "Studio BTS" || v.sub === "Classic BTS" },
  { title: "How Stunts Actually Work", filter: v => v.cat === "How It Works" },
  { title: "Coordinator Breakdowns", filter: v => v.cat === "Coordinator Breakdown" },
  { title: "Performer Profiles & Legends", filter: v => v.cat === "Performer Profile" || v.sub === "Stunt Legend" },
  { title: "Notes on a Scene (Vanity Fair)", filter: v => v.sub === "Notes on a Scene" },
  { title: "Documentaries & Deep Dives", filter: v => v.cat === "Documentary" || v.cat === "Analysis & Education" },
  { title: "Classic Era Stunts", filter: v => v.year < 2000 },
  { title: "Podcasts & Interviews", filter: v => v.cat === "Podcast & Interview" },
];

// ─── ACTION VAULT COMPONENT ───
function ActionVault({ userCourses = [], lists = [], onSelectVideo, watched = new Set(), favorites = new Set(), toggleFav, ownsPurchase, onBuy }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [activeCourseId, setActiveCourseId] = useState("atlas-101");
  const course = ATLAS_COURSE;
  const weeks = [1,2,3,4];
  const ownsFullCourse = ownsPurchase ? ownsPurchase(`vault-course:${course.id}`) : false;
  const ownsVideo = (num) => ownsPurchase ? ownsPurchase(`vault-video:${course.id}:${num}`) : false;

  return (
    <div style={{ padding:"76px 48px 60px", minHeight:"100vh" }}>
      {/* Vault Header */}
      <div style={{ marginBottom:40 }}>
        <div style={{
          display:"flex",alignItems:"center",gap:12,marginBottom:8,
        }}>
          <span style={{
            fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"#ff6b00",
            letterSpacing:"2px",textTransform:"uppercase",
            padding:"4px 12px",border:"1px solid #ff6b00",borderRadius:4,
          }}>Action Vault</span>
          <span style={{
            fontFamily:"Barlow, sans-serif",fontSize:12,color:"#666",
          }}>Premium Stunt Training Courses</span>
        </div>
      </div>

      {/* Course Hero Card */}
      <div style={{
        background:"linear-gradient(135deg, #ff6b0022 0%, #181818 40%, #0a0a0a 100%)",
        borderRadius:12,overflow:"hidden",marginBottom:40,
        border:"1px solid #ff6b0033",
      }}>
        {/* Embedded Full Course Player */}
        <div style={{
          position:"relative",paddingBottom:"56.25%",height:0,overflow:"hidden",
          background:"#000",
        }}>
          <iframe
            src={`https://www.youtube.com/embed/videoseries?list=${course.playlistId}`}
            style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={course.title}
          />
        </div>

        <div style={{ padding:"24px 32px 32px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:20 }}>
            <div style={{ flex:1,minWidth:300 }}>
              <h1 style={{
                fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:"#fff",
                margin:"0 0 4px",letterSpacing:"1px",
              }}>{course.title}</h1>
              <div style={{
                fontFamily:"Barlow, sans-serif",fontSize:14,color:"#ff6b00",
                fontWeight:600,marginBottom:12,
              }}>{course.channel}</div>
              <p style={{
                fontFamily:"Barlow, sans-serif",fontSize:14,color:"#999",
                lineHeight:1.6,margin:0,maxWidth:600,
              }}>{course.desc}</p>
            </div>

            {/* Pricing Box */}
            <div style={{
              background:"rgba(255,107,0,0.08)",border:"1px solid #ff6b0044",
              borderRadius:8,padding:"20px 28px",textAlign:"center",minWidth:220,
            }}>
              <div style={{
                fontFamily:"Barlow, sans-serif",fontSize:11,color:"#ff6b00",
                textTransform:"uppercase",letterSpacing:"2px",marginBottom:8,fontWeight:600,
              }}>Full Course</div>
              <div style={{
                fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"#fff",
                lineHeight:1,marginBottom:4,
              }}>${course.coursePrice.toFixed(2)}</div>
              <div style={{
                fontFamily:"Barlow, sans-serif",fontSize:12,color:"#666",marginBottom:16,
              }}>
                {course.videos.length} videos · Save {Math.round((1 - course.coursePrice / (course.videos.length * course.videoCost)) * 100)}%
              </div>
              <button
                disabled={ownsFullCourse}
                onClick={()=>onBuy?.({
                  kind:"vault-course",
                  key:`vault-course:${course.id}`,
                  title: course.title,
                  price: course.coursePrice,
                })}
                style={{
                  width:"100%",padding:"12px 24px",
                  background: ownsFullCourse ? "#46d369" : "#ff6b00",
                  border:"none",borderRadius:6,color:"#fff",fontFamily:"'Bebas Neue',sans-serif",
                  fontSize:18,letterSpacing:"1px",
                  cursor: ownsFullCourse ? "default" : "pointer",
                  transition:"background 0.2s",
                }}
                onMouseEnter={e=>{if(!ownsFullCourse) e.currentTarget.style.background="#ff8533"}}
                onMouseLeave={e=>{if(!ownsFullCourse) e.currentTarget.style.background="#ff6b00"}}
              >{ownsFullCourse ? "✓ Owned" : "Buy Full Course"}</button>
              <div style={{
                fontFamily:"Barlow, sans-serif",fontSize:11,color:"#555",marginTop:8,
              }}>or buy individual videos for ${course.videoCost.toFixed(2)} each</div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Video Modal */}
      {activeVideo && (
        <div onClick={()=>setActiveVideo(null)} style={{
          position:"fixed",inset:0,zIndex:1000,
          background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",
          display:"flex",alignItems:"center",justifyContent:"center",
          padding:20,animation:"fadeIn 0.2s ease",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:"100%",maxWidth:800,background:"#181818",borderRadius:8,overflow:"hidden",
          }}>
            <div style={{position:"relative",paddingBottom:"56.25%",height:0,background:"#000"}}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.videoId}`}
                style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={activeVideo.title}
              />
            </div>
            <div style={{ padding:"16px 24px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"#fff",letterSpacing:"0.5px"}}>
                  Lesson {activeVideo.num}: {activeVideo.title}
                </div>
                <div style={{fontFamily:"Barlow, sans-serif",fontSize:12,color:"#666"}}>Week {activeVideo.week}</div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                {(ownsFullCourse || ownsVideo(activeVideo.num)) ? (
                  <span style={{
                    padding:"8px 20px",background:"rgba(70,211,105,0.2)",border:"1px solid #46d36955",borderRadius:4,
                    color:"#46d369",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:"1px",
                  }}>✓ Owned</span>
                ) : (
                  <>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#ff6b00"}}>${course.videoCost.toFixed(2)}</span>
                    <button onClick={()=>onBuy?.({
                      kind:"vault-video",
                      key:`vault-video:${course.id}:${activeVideo.num}`,
                      title:`Lesson ${activeVideo.num}: ${activeVideo.title}`,
                      price: course.videoCost,
                    })} style={{
                      padding:"8px 20px",background:"#ff6b00",border:"none",borderRadius:4,
                      color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,
                      letterSpacing:"1px",cursor:"pointer",
                    }}
                      onMouseEnter={e=>e.currentTarget.style.background="#ff8533"}
                      onMouseLeave={e=>e.currentTarget.style.background="#ff6b00"}
                    >Buy Video</button>
                  </>
                )}
                <button onClick={()=>setActiveVideo(null)} style={{
                  width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.1)",
                  border:"none",color:"#fff",fontSize:18,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>✕</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week-by-Week Video Grid */}
      <h2 style={{
        fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#e5e5e5",
        letterSpacing:"1px",marginBottom:20,
      }}>Course Videos · {course.videos.length} Lessons</h2>

      {weeks.map(week => {
        const weekVideos = course.videos.filter(v => v.week === week);
        const isExpanded = expandedWeek === week;
        return (
          <div key={week} style={{ marginBottom:12 }}>
            {/* Week Header */}
            <button onClick={()=>setExpandedWeek(isExpanded ? null : week)} style={{
              width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"14px 20px",background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.08)",borderRadius: isExpanded ? "8px 8px 0 0" : 8,
              cursor:"pointer",transition:"background 0.2s",
            }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
            >
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <span style={{
                  fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#ff6b00",
                  letterSpacing:"1px",
                }}>Week {week}</span>
                <span style={{
                  fontFamily:"Barlow, sans-serif",fontSize:12,color:"#666",
                }}>{weekVideos.length} lessons</span>
              </div>
              <span style={{color:"#666",fontSize:16,transition:"transform 0.2s",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}>▼</span>
            </button>

            {/* Week Videos */}
            {isExpanded && (
              <div style={{
                border:"1px solid rgba(255,255,255,0.08)",borderTop:"none",
                borderRadius:"0 0 8px 8px",overflow:"hidden",
              }}>
                {weekVideos.map((v, i) => (
                  <div key={v.videoId} onClick={()=>setActiveVideo(v)} style={{
                    display:"flex",alignItems:"center",gap:16,
                    padding:"12px 20px",
                    background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                    cursor:"pointer",transition:"background 0.15s",
                    borderBottom: i < weekVideos.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,107,0,0.08)"}
                    onMouseLeave={e=>e.currentTarget.style.background= i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"}
                  >
                    {/* Lesson number */}
                    <span style={{
                      fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#444",
                      width:28,textAlign:"center",flexShrink:0,
                    }}>{v.num}</span>

                    {/* Thumbnail preview */}
                    <div style={{
                      width:120,height:68,borderRadius:4,overflow:"hidden",flexShrink:0,
                      background:"#000",position:"relative",
                    }}>
                      <img
                        src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`}
                        alt={v.title}
                        style={{width:"100%",height:"100%",objectFit:"cover"}}
                      />
                      <div style={{
                        position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
                        background:"rgba(0,0,0,0.3)",opacity:0,transition:"opacity 0.2s",
                      }}
                        className="play-overlay"
                      >
                        <span style={{fontSize:24,color:"#fff"}}>▶</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div style={{ flex:1 }}>
                      <div style={{
                        fontFamily:"Barlow, sans-serif",fontSize:14,color:"#e5e5e5",fontWeight:500,
                      }}>{v.title}</div>
                      <div style={{
                        fontFamily:"Barlow, sans-serif",fontSize:11,color:"#666",marginTop:2,
                      }}>Lesson {v.num} · Week {v.week}</div>
                    </div>

                    {/* Price */}
                    <div style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
                      {(ownsFullCourse || ownsVideo(v.num)) ? (
                        <span style={{
                          padding:"6px 14px",background:"rgba(70,211,105,0.15)",
                          border:"1px solid #46d36955",borderRadius:4,
                          color:"#46d369",fontFamily:"Barlow, sans-serif",fontSize:11,
                          fontWeight:600,letterSpacing:"0.5px",
                        }}>✓ Owned</span>
                      ) : (
                        <>
                          <span style={{
                            fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:"#ff6b00",
                          }}>${course.videoCost.toFixed(2)}</span>
                          <button onClick={e=>{
                            e.stopPropagation();
                            onBuy?.({
                              kind:"vault-video",
                              key:`vault-video:${course.id}:${v.num}`,
                              title:`Lesson ${v.num}: ${v.title}`,
                              price: course.videoCost,
                            });
                          }} style={{
                            padding:"6px 14px",background:"rgba(255,107,0,0.15)",
                            border:"1px solid #ff6b0044",borderRadius:4,
                            color:"#ff6b00",fontFamily:"Barlow, sans-serif",fontSize:11,
                            fontWeight:600,cursor:"pointer",letterSpacing:"0.5px",
                            transition:"background 0.2s",
                          }}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,107,0,0.3)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,107,0,0.15)"}
                          >Buy</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* User-submitted courses (approved by Action Vault admin) */}
      {userCourses.length > 0 && (
        <div style={{marginTop:50}}>
          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:18}}>
            <h2 style={{
              fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#e5e5e5",
              letterSpacing:"1px",margin:0,
            }}>Community Courses</h2>
            <span style={{color:"#666",fontSize:12,fontFamily:"Barlow, sans-serif"}}>
              {userCourses.length} approved
            </span>
          </div>
          <div style={{
            display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))",gap:14,
          }}>
            {userCourses.map(c => {
              const ownsKey = `course:${c.id}`;
              const owns = ownsPurchase ? ownsPurchase(ownsKey) : false;
              return (
                <div key={c.id} style={{
                  background:"linear-gradient(135deg, #ff6b0011 0%, #181818 50%, #0a0a0a 100%)",
                  border:"1px solid #ff6b0033",borderRadius:8,padding:"20px 24px",
                }}>
                  <div style={{
                    fontFamily:"Barlow, sans-serif",fontSize:10,color:"#46d369",
                    letterSpacing:"2px",textTransform:"uppercase",marginBottom:6,fontWeight:700,
                  }}>● Approved · Community</div>
                  <h3 style={{
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#fff",
                    margin:"0 0 6px",letterSpacing:"0.5px",
                  }}>{c.name}</h3>
                  <p style={{
                    fontFamily:"Barlow, sans-serif",fontSize:13,color:"#999",
                    lineHeight:1.5,margin:"0 0 14px",minHeight:38,
                  }}>{c.course.desc || "No description provided."}</p>
                  <div style={{
                    fontSize:12,color:"#666",fontFamily:"Barlow, sans-serif",marginBottom:14,
                  }}>{c.items.length} item{c.items.length!==1?"s":""}</div>
                  {owns ? (
                    <div style={{
                      padding:"10px 16px",borderRadius:4,
                      background:"rgba(70,211,105,0.15)",border:"1px solid #46d36955",
                      color:"#46d369",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,
                      letterSpacing:"1px",textAlign:"center",
                    }}>✓ Owned</div>
                  ) : c.course.isPaid ? (
                    <button onClick={()=>onBuy?.({
                      kind:"course", key: ownsKey, title: c.name, price: c.course.price,
                    })} style={{
                      width:"100%",padding:"10px 16px",background:"#ff6b00",border:"none",borderRadius:4,
                      color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:15,
                      letterSpacing:"1px",cursor:"pointer",
                    }}>Buy · ${c.course.price.toFixed(2)}</button>
                  ) : (
                    <div style={{
                      padding:"10px 16px",borderRadius:4,
                      background:"rgba(70,211,105,0.1)",border:"1px solid #46d36944",
                      color:"#46d369",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,
                      letterSpacing:"1px",textAlign:"center",
                    }}>Free</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTS ───

function ScrollRow({ title, videos, onSelect, watched, favorites, onToggleFav }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const checkScroll = () => {
    if (!ref.current) return;
    setCanLeft(ref.current.scrollLeft > 10);
    setCanRight(ref.current.scrollLeft < ref.current.scrollWidth - ref.current.clientWidth - 10);
  };

  useEffect(() => { checkScroll(); }, [videos]);

  const scroll = (dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * (ref.current.clientWidth * 0.75), behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  if (videos.length === 0) return null;

  return (
    <div style={{ marginBottom: 40, position: "relative" }}>
      <h2 style={{
        fontSize: 18, fontWeight: 700, color: "#e5e5e5", margin: "0 0 12px 48px",
        fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif",
        letterSpacing: "0.5px",
      }}>{title}</h2>
      <div style={{ position: "relative" }}>
        {canLeft && (
          <button onClick={() => scroll(-1)} style={{
            position:"absolute",left:0,top:0,bottom:0,width:48,zIndex:10,
            background:"linear-gradient(90deg,rgba(20,20,20,0.95),transparent)",
            border:"none",color:"#fff",fontSize:28,cursor:"pointer",display:"flex",
            alignItems:"center",justifyContent:"center",opacity:0.8,
          }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.8}>‹</button>
        )}
        {canRight && (
          <button onClick={() => scroll(1)} style={{
            position:"absolute",right:0,top:0,bottom:0,width:48,zIndex:10,
            background:"linear-gradient(270deg,rgba(20,20,20,0.95),transparent)",
            border:"none",color:"#fff",fontSize:28,cursor:"pointer",display:"flex",
            alignItems:"center",justifyContent:"center",opacity:0.8,
          }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.8}>›</button>
        )}
        <div ref={ref} onScroll={checkScroll} style={{
          display:"flex",gap:8,overflowX:"auto",padding:"0 48px",scrollbarWidth:"none",
        }}>
          <style>{`.scroll-row::-webkit-scrollbar{display:none}`}</style>
          {videos.map(v => (
            <VideoCard key={v.id} v={v} onSelect={onSelect} watched={watched.has(v.id)} isFav={favorites.has(v.id)} onToggleFav={onToggleFav} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoCard({ v, onSelect, watched, isFav, onToggleFav }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(v)}
      style={{
        flex: "0 0 260px", height: 146, borderRadius: 4, overflow: "hidden",
        position: "relative", cursor: "pointer",
        transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s",
        transform: hovered ? "scale(1.08)" : "scale(1)",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.7)" : "none",
        zIndex: hovered ? 20 : 1,
      }}
    >
      {/* Gradient BG */}
      <div style={{
        position:"absolute",inset:0,
        background:`linear-gradient(135deg, ${getCatColor(v.cat)}33 0%, #141414 60%, #0a0a0a 100%)`,
      }} />
      {/* Film grain texture */}
      <div style={{
        position:"absolute",inset:0,opacity:0.15,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.03) 2px,rgba(255,255,255,0.03) 4px)",
      }} />

      {/* Watched badge */}
      {watched && (
        <div style={{
          position:"absolute",top:8,left:8,zIndex:5,
          background:"rgba(0,0,0,0.7)",borderRadius:3,padding:"2px 6px",
          fontSize:10,color:"#46d369",fontWeight:700,fontFamily:"Barlow, sans-serif",
          display:"flex",alignItems:"center",gap:3,
        }}>✓ Watched</div>
      )}

      {/* Year badge */}
      <div style={{
        position:"absolute",top:8,right:8,zIndex:5,
        background:"rgba(0,0,0,0.75)",borderRadius:3,padding:"2px 7px",
        fontSize:11,color:"#aaa",fontFamily:"Barlow Condensed, sans-serif",fontWeight:600,letterSpacing:"0.5px",
      }}>{v.year}</div>

      {/* Content overlay */}
      <div style={{
        position:"absolute",bottom:0,left:0,right:0,zIndex:3,
        padding:"32px 12px 10px",
        background:"linear-gradient(transparent 0%, rgba(0,0,0,0.85) 60%)",
      }}>
        <div style={{
          fontSize:10,fontWeight:600,color:getCatColor(v.cat),textTransform:"uppercase",
          letterSpacing:"1.5px",fontFamily:"Barlow, sans-serif",marginBottom:3,
        }}>{v.channel}</div>
        <div style={{
          fontSize:13,fontWeight:700,color:"#fff",lineHeight:1.2,
          fontFamily:"'Bebas Neue','Barlow Condensed',sans-serif",
          letterSpacing:"0.3px",
          display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",
        }}>{v.title}</div>
      </div>

      {/* Hover overlay */}
      {hovered && (
        <div style={{
          position:"absolute",inset:0,zIndex:4,
          background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <div style={{
            width:44,height:44,borderRadius:"50%",border:"2px solid #fff",
            display:"flex",alignItems:"center",justifyContent:"center",
            background:"rgba(0,0,0,0.5)",
          }}>
            <span style={{fontSize:18,color:"#fff",marginLeft:3}}>▶</span>
          </div>
        </div>
      )}

      {/* Category bar */}
      <div style={{
        position:"absolute",bottom:0,left:0,right:0,height:2,zIndex:5,
        background: watched ? "#46d369" : getCatColor(v.cat),
        opacity: watched ? 1 : 0.6,
      }} />
    </div>
  );
}

function DetailModal({ v, onClose, watched, onToggleWatched, isFav, onToggleFav, lists, toggleVideoInList, sectionTags, toggleSectionTag }) {
  const [listPickerOpen, setListPickerOpen] = useState(false);
  if (!v) return null;
  const inLists = (lists || []).filter(l => l.items.some(i => i.type === "video" && i.videoId === v.id));
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:1000,
      background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:20, animation:"fadeIn 0.2s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%",maxWidth:720,maxHeight:"90vh",overflowY:"auto",
        background:"#181818",borderRadius:8,position:"relative",
      }}>
        {/* Hero section */}
        <div style={{
          height:280,position:"relative",
          background:`linear-gradient(135deg, ${getCatColor(v.cat)}44 0%, #181818 50%, #0a0a0a 100%)`,
        }}>
          <div style={{position:"absolute",inset:0,opacity:0.1,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.03) 3px,rgba(255,255,255,0.03) 6px)"}} />
          <div style={{
            position:"absolute",bottom:0,left:0,right:0,
            padding:"80px 32px 24px",
            background:"linear-gradient(transparent,#181818)",
          }}>
            <h2 style={{
              fontSize:"clamp(22px,4vw,32px)",fontWeight:800,color:"#fff",margin:0,lineHeight:1.15,
              fontFamily:"'Bebas Neue','Barlow Condensed',sans-serif",letterSpacing:"0.5px",
            }}>{v.title}</h2>
          </div>
          {/* Close button */}
          <button onClick={onClose} style={{
            position:"absolute",top:12,right:12,width:36,height:36,borderRadius:"50%",
            background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>✕</button>
        </div>

        <div style={{ padding:"0 32px 32px" }}>
          {/* Action buttons */}
          <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap" }}>
            <a href={v.url} target="_blank" rel="noopener noreferrer" style={{
              display:"inline-flex",alignItems:"center",gap:8,padding:"10px 24px",
              background:"#fff",borderRadius:4,color:"#000",fontFamily:"'Bebas Neue','Barlow Condensed',sans-serif",
              fontSize:16,fontWeight:700,textDecoration:"none",letterSpacing:"1px",
            }}>▶ Watch Now</a>
            {/* Add-to-list with picker */}
            <div style={{ position:"relative" }}>
              <button onClick={()=>setListPickerOpen(o=>!o)} style={{
                padding:"10px 20px",background: inLists.length ? "rgba(70,211,105,0.25)" : "rgba(109,109,110,0.7)",
                border:"none",borderRadius:4,color:"#fff",
                fontFamily:"'Bebas Neue','Barlow Condensed',sans-serif",fontSize:14,fontWeight:600,
                cursor:"pointer",letterSpacing:"1px",display:"flex",alignItems:"center",gap:6,
              }}>
                {inLists.length ? `✓ In ${inLists.length} List${inLists.length>1?"s":""}` : "+ Add to List"}
                <span style={{fontSize:9}}>▼</span>
              </button>
              {listPickerOpen && lists && (
                <div style={{
                  position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:20,
                  background:"rgba(20,20,20,0.98)",border:"1px solid #333",borderRadius:6,
                  minWidth:240,padding:"6px 0",
                  boxShadow:"0 12px 24px rgba(0,0,0,0.6)",
                }}>
                  {lists.map(l => {
                    const inThis = l.items.some(i => i.type === "video" && i.videoId === v.id);
                    return (
                      <button key={l.id} onClick={()=>toggleVideoInList(v.id, l.id)} style={{
                        display:"flex",alignItems:"center",gap:10,
                        width:"100%",padding:"8px 14px",background:"none",border:"none",
                        color: inThis ? "#46d369" : "#ddd",
                        fontFamily:"Barlow, sans-serif",fontSize:13,
                        cursor:"pointer",textAlign:"left",
                      }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
                        onMouseLeave={e=>e.currentTarget.style.background="none"}
                      >
                        <span style={{width:14,textAlign:"center"}}>{inThis ? "✓" : ""}</span>
                        <span style={{flex:1}}>{l.name}</span>
                        {l.course?.isCourse && <span style={{fontSize:10,color:COURSE_STATUS[l.course.status]?.color || "#888"}}>● course</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button onClick={()=>onToggleWatched(v.id)} style={{
              padding:"10px 20px",background: watched ? "#46d369" : "rgba(109,109,110,0.7)",
              border:"none",borderRadius:4,color: watched ? "#000" : "#fff",
              fontFamily:"'Bebas Neue','Barlow Condensed',sans-serif",fontSize:14,fontWeight:600,
              cursor:"pointer",letterSpacing:"1px",
            }}>{watched ? "✓ Watched" : "Mark Watched"}</button>
          </div>

          {/* Meta row */}
          <div style={{ display:"flex",gap:16,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{color:"#46d369",fontWeight:700,fontFamily:"Barlow, sans-serif",fontSize:14}}>{v.year}</span>
            <span style={{color:"#999",fontFamily:"Barlow, sans-serif",fontSize:13}}>{v.duration}</span>
            <span style={{
              padding:"2px 8px",borderRadius:3,fontSize:11,fontWeight:600,
              background:`${getCatColor(v.cat)}22`,color:getCatColor(v.cat),
              fontFamily:"Barlow, sans-serif",textTransform:"uppercase",letterSpacing:"1px",
            }}>{v.cat}</span>
          </div>

          {/* Description */}
          <p style={{
            fontSize:15,lineHeight:1.65,color:"#d2d2d2",margin:"0 0 20px",
            fontFamily:"Barlow, sans-serif",fontWeight:300,
          }}>{v.desc}</p>

          {/* Details grid */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 32px" }}>
            {v.guest && (
              <div>
                <span style={{color:"#777",fontSize:12,fontFamily:"Barlow, sans-serif",textTransform:"uppercase",letterSpacing:"1px"}}>Featuring</span>
                <div style={{color:"#fff",fontSize:14,fontFamily:"Barlow, sans-serif",marginTop:3}}>{v.guest}</div>
              </div>
            )}
            <div>
              <span style={{color:"#777",fontSize:12,fontFamily:"Barlow, sans-serif",textTransform:"uppercase",letterSpacing:"1px"}}>Channel</span>
              <div style={{color:"#fff",fontSize:14,fontFamily:"Barlow, sans-serif",marginTop:3}}>{v.channel}</div>
            </div>
            <div>
              <span style={{color:"#777",fontSize:12,fontFamily:"Barlow, sans-serif",textTransform:"uppercase",letterSpacing:"1px"}}>Series</span>
              <div style={{color:"#fff",fontSize:14,fontFamily:"Barlow, sans-serif",marginTop:3}}>{v.sub}</div>
            </div>
            <div>
              <span style={{color:"#777",fontSize:12,fontFamily:"Barlow, sans-serif",textTransform:"uppercase",letterSpacing:"1px"}}>Decade</span>
              <div style={{color:"#fff",fontSize:14,fontFamily:"Barlow, sans-serif",marginTop:3}}>{getDecade(v.year)}</div>
            </div>
          </div>

          {/* Films */}
          {v.films.length > 0 && v.films[0] !== "Various" && (
            <div style={{ marginTop: 20 }}>
              <span style={{color:"#777",fontSize:12,fontFamily:"Barlow, sans-serif",textTransform:"uppercase",letterSpacing:"1px"}}>Films Covered</span>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:8 }}>
                {v.films.map(f => (
                  <span key={f} style={{
                    padding:"4px 12px",background:"rgba(255,255,255,0.08)",borderRadius:20,
                    fontSize:12,color:"#ccc",fontFamily:"Barlow, sans-serif",
                  }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Section Tags — user labels for Browse shelves */}
          {toggleSectionTag && (
            <div style={{ marginTop: 24, paddingTop:20, borderTop:"1px solid #2a2a2a" }}>
              <span style={{color:"#777",fontSize:12,fontFamily:"Barlow, sans-serif",textTransform:"uppercase",letterSpacing:"1px"}}>Tag in Sections</span>
              <div style={{fontSize:11,color:"#555",fontFamily:"Barlow, sans-serif",marginTop:3}}>
                Toggle which Browse shelves this video appears in.
              </div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:10 }}>
                {SECTIONS.map(s => {
                  const on = (sectionTags || []).includes(s.id);
                  return (
                    <button key={s.id} onClick={()=>toggleSectionTag(v.id, s.id)} style={{
                      padding:"6px 14px",borderRadius:20,fontSize:12,
                      fontFamily:"Barlow, sans-serif",fontWeight:600,
                      cursor:"pointer",letterSpacing:"0.3px",
                      background: on ? `${s.color}33` : "rgba(255,255,255,0.04)",
                      border: on ? `1px solid ${s.color}` : "1px solid #333",
                      color: on ? s.color : "#999",
                      display:"flex",alignItems:"center",gap:6,
                    }}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:s.color,opacity: on ? 1 : 0.4}}/>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NEW LIST MODAL ───
function NewListModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn 0.2s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%",maxWidth:420,background:"#181818",borderRadius:8,padding:"28px 32px",
      }}>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:"1px",margin:"0 0 6px"}}>New List</h2>
        <p style={{color:"#888",fontFamily:"Barlow, sans-serif",fontSize:13,margin:"0 0 20px"}}>
          Lists organize what you save. They can be turned into public courses later.
        </p>
        <input
          autoFocus
          placeholder="List name (e.g. High Fall Reference)"
          value={name}
          onChange={e=>setName(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter" && name.trim()) onCreate(name.trim()); }}
          style={{
            width:"100%",padding:"12px 14px",background:"#0e0e0e",
            border:"1px solid #333",borderRadius:4,color:"#fff",
            fontFamily:"Barlow, sans-serif",fontSize:14,outline:"none",boxSizing:"border-box",
          }}
        />
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}>
          <button onClick={onClose} style={{
            padding:"8px 18px",background:"none",border:"1px solid #333",borderRadius:4,
            color:"#aaa",fontFamily:"Barlow, sans-serif",fontSize:13,cursor:"pointer",
          }}>Cancel</button>
          <button onClick={()=>name.trim() && onCreate(name.trim())} disabled={!name.trim()} style={{
            padding:"8px 22px",background: name.trim() ? "#e50914" : "#333",border:"none",borderRadius:4,
            color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:"1px",
            cursor: name.trim() ? "pointer" : "not-allowed",
          }}>Create</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADD CUSTOM ITEM MODAL ───
function AddItemModal({ list, onClose, onAdd }) {
  const [mode, setMode] = useState("single"); // "single" | "bulk"
  const [type, setType] = useState("youtube");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [notes, setNotes] = useState("");
  const [isPrivate, setIsPrivate] = useState(true); // default ON
  const [bulkText, setBulkText] = useState("");

  // Parse bulk paste — one URL per line, optional "Title | URL" syntax
  const bulkParsed = bulkText
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean)
    .map(line => {
      let title = "", url = line;
      if (line.includes(" | ")) {
        const [t, u] = line.split(" | ").map(s => s.trim());
        title = t; url = u;
      } else if (line.includes(" - http")) {
        const idx = line.indexOf(" - http");
        title = line.slice(0, idx).trim();
        url = line.slice(idx + 3).trim();
      }
      // Try to fetch a sensible default title from URL
      if (!title) {
        try {
          const u = new URL(url);
          if (u.hostname.includes("youtu")) {
            title = "YouTube · " + (u.searchParams.get("v") || u.pathname.slice(1)).slice(0, 24);
          } else {
            title = u.hostname.replace(/^www\./, "") + u.pathname.slice(0, 32);
          }
        } catch { title = url.slice(0, 40); }
      }
      return { title, url };
    });

  const detectType = (url) => {
    if (!url) return "link";
    if (/youtu\.?be/i.test(url)) return "youtube";
    if (/\.pdf(\?|$)/i.test(url)) return "pdf";
    if (/(spotify|apple\.com\/.*podcast|podcasts\.|simplecast|libsyn)/i.test(url)) return "podcast";
    return "link";
  };

  const submit = () => {
    if (mode === "bulk") {
      if (bulkParsed.length === 0) return;
      const items = bulkParsed.map(p => ({
        type: detectType(p.url),
        title: p.title,
        url: p.url,
        author: "",
        notes: "",
        isPrivate, // private by default
      }));
      onAdd(items);
    } else {
      if (!title.trim()) return;
      onAdd({ type, title: title.trim(), url: url.trim(), author: author.trim(), notes: notes.trim(), isPrivate });
    }
  };

  const canSubmit = mode === "bulk" ? bulkParsed.length > 0 : title.trim();

  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn 0.2s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",
        background:"#181818",borderRadius:8,padding:"28px 32px",
      }}>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:"1px",margin:"0 0 6px"}}>
          Add to "{list.name}"
        </h2>
        <p style={{color:"#888",fontFamily:"Barlow, sans-serif",fontSize:13,margin:"0 0 18px"}}>
          Add anything — videos, podcast episodes, books, PDFs, links. Or paste a list of URLs in bulk.
        </p>

        {/* Mode toggle */}
        <div style={{display:"flex",gap:6,marginBottom:18,padding:4,background:"rgba(0,0,0,0.4)",borderRadius:6}}>
          <button onClick={()=>setMode("single")} style={{
            flex:1,padding:"8px 12px",border:"none",borderRadius:4,
            background: mode==="single" ? "#e50914" : "transparent",
            color: mode==="single" ? "#fff" : "#888",
            fontFamily:"Barlow, sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",
          }}>One Item</button>
          <button onClick={()=>setMode("bulk")} style={{
            flex:1,padding:"8px 12px",border:"none",borderRadius:4,
            background: mode==="bulk" ? "#e50914" : "transparent",
            color: mode==="bulk" ? "#fff" : "#888",
            fontFamily:"Barlow, sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",
          }}>Paste Multiple URLs</button>
        </div>

        {mode === "single" ? (
          <>
            <label style={{color:"#777",fontSize:11,fontFamily:"Barlow, sans-serif",textTransform:"uppercase",letterSpacing:"1px"}}>Type</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,margin:"8px 0 18px"}}>
              {ITEM_TYPES.map(t => (
                <button key={t.id} onClick={()=>setType(t.id)} style={{
                  padding:"8px 14px",borderRadius:4,fontSize:12,
                  fontFamily:"Barlow, sans-serif",fontWeight:600,cursor:"pointer",
                  background: type===t.id ? "#e50914" : "rgba(255,255,255,0.05)",
                  border: type===t.id ? "1px solid #e50914" : "1px solid #333",
                  color: type===t.id ? "#fff" : "#aaa",
                  display:"flex",alignItems:"center",gap:6,
                }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            <FormField label="Title">
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. High Fall Reference Reel" style={inputStyle}/>
            </FormField>
            {type !== "book" && (
              <FormField label={type === "pdf" ? "PDF URL or file reference" : "URL or embed link"}>
                <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." style={inputStyle}/>
              </FormField>
            )}
            <FormField label={type === "book" ? "Author" : type === "podcast" ? "Show / Host" : type === "pdf" ? "Source" : "Author / Channel (optional)"}>
              <input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="" style={inputStyle}/>
            </FormField>
            <FormField label="Notes (optional)">
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Why it belongs here…" rows={3} style={{...inputStyle, resize:"vertical", fontFamily:"Barlow, sans-serif"}}/>
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Paste URLs (one per line)">
              <textarea
                value={bulkText}
                onChange={e=>setBulkText(e.target.value)}
                placeholder={`https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=...\nMy Title | https://youtube.com/watch?v=...`}
                rows={8}
                style={{...inputStyle, resize:"vertical", fontFamily:"monospace", fontSize:12}}
              />
            </FormField>
            <div style={{
              fontSize:11,color:"#666",fontFamily:"Barlow, sans-serif",marginBottom:14,
            }}>
              Optional title syntax: <code style={{background:"#0a0a0a",padding:"2px 5px",borderRadius:2}}>Title | URL</code> per line.
              Type is auto-detected (YouTube, PDF, podcast, link).
            </div>
            {bulkParsed.length > 0 && (
              <div style={{
                marginBottom:18,padding:"10px 14px",background:"rgba(70,211,105,0.05)",
                border:"1px solid #46d36933",borderRadius:4,maxHeight:140,overflowY:"auto",
              }}>
                <div style={{color:"#46d369",fontSize:11,fontFamily:"Barlow, sans-serif",fontWeight:700,letterSpacing:"1px",marginBottom:8}}>
                  WILL ADD {bulkParsed.length} ITEM{bulkParsed.length!==1?"S":""}
                </div>
                {bulkParsed.slice(0,8).map((p,i) => (
                  <div key={i} style={{fontSize:11,color:"#aaa",fontFamily:"Barlow, sans-serif",marginBottom:3,display:"flex",gap:8}}>
                    <span style={{color:"#666"}}>{getItemTypeIcon(detectType(p.url))}</span>
                    <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</span>
                  </div>
                ))}
                {bulkParsed.length > 8 && <div style={{fontSize:11,color:"#555",fontFamily:"Barlow, sans-serif",marginTop:4}}>+ {bulkParsed.length - 8} more</div>}
              </div>
            )}
          </>
        )}

        <label style={{display:"flex",alignItems:"flex-start",gap:8,marginTop:6,marginBottom:14,cursor:"pointer"}}>
          <input type="checkbox" checked={isPrivate} onChange={e=>setIsPrivate(e.target.checked)} style={{accentColor:"#e50914",marginTop:3}}/>
          <span style={{color:"#aaa",fontFamily:"Barlow, sans-serif",fontSize:13,lineHeight:1.5}}>
            <strong style={{color:"#ddd"}}>Private</strong> — URL stored obfuscated, hidden from view-source.
            <span style={{display:"block",fontSize:11,color:"#666",marginTop:2}}>
              Default ON for any URL. Real protection requires a backend; this only deters casual snooping.
            </span>
          </span>
        </label>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{
            padding:"8px 18px",background:"none",border:"1px solid #333",borderRadius:4,
            color:"#aaa",fontFamily:"Barlow, sans-serif",fontSize:13,cursor:"pointer",
          }}>Cancel</button>
          <button onClick={submit} disabled={!canSubmit} style={{
            padding:"8px 22px",background: canSubmit ? "#e50914" : "#333",border:"none",borderRadius:4,
            color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:"1px",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}>{mode === "bulk" ? `Add ${bulkParsed.length || ""} Items` : "Add Item"}</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width:"100%",padding:"10px 12px",background:"#0e0e0e",
  border:"1px solid #333",borderRadius:4,color:"#fff",
  fontFamily:"Barlow, sans-serif",fontSize:13,outline:"none",boxSizing:"border-box",
};

function FormField({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{
        display:"block",color:"#777",fontSize:11,fontFamily:"Barlow, sans-serif",
        textTransform:"uppercase",letterSpacing:"1px",marginBottom:6,
      }}>{label}</label>
      {children}
    </div>
  );
}

function PricingBreakdown({ price }) {
  if (!price || price <= 0) return null;
  const salesToHit100 = Math.ceil(PLATFORM_FEE_THRESHOLD / price);
  const grossAt100Sales = price * 100;
  const earningsAt100 = computeCreatorEarnings(grossAt100Sales);
  const platformAt100 = grossAt100Sales - earningsAt100;
  const row = (label, val, hint) => (
    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:"Barlow, sans-serif",padding:"4px 0",alignItems:"baseline"}}>
      <span style={{color:"#888"}}>{label}{hint && <span style={{color:"#555",marginLeft:6,fontSize:10}}>{hint}</span>}</span>
      <span style={{color:"#fff",fontWeight:600,fontFamily:"Barlow Condensed, sans-serif"}}>{val}</span>
    </div>
  );
  return (
    <div style={{borderTop:"1px solid #2a2a2a",paddingTop:10}}>
      {row("First sale", `You get $${price.toFixed(2)}`, "(under $100 cap)")}
      {row(`Sales 1 → ${salesToHit100}`, `100% to you`, `(up to $${PLATFORM_FEE_THRESHOLD})`)}
      {row("After $100 earned", `You: 80% · StuntListing: 20%`)}
      <div style={{borderTop:"1px dashed #2a2a2a",marginTop:8,paddingTop:8}}>
        {row("If you sell 100 copies", `$${earningsAt100.toFixed(2)} to you`, `· $${platformAt100.toFixed(2)} fee`)}
      </div>
    </div>
  );
}

// ─── CONVERT TO COURSE MODAL ───
function ConvertCourseModal({ list, adminMode, onClose, onSave }) {
  const c = list.course || {};
  const [isCourse, setIsCourse] = useState(c.isCourse || false);
  const [isPaid, setIsPaid] = useState(c.isPaid || false);
  const [price, setPrice] = useState(c.price || 9.99);
  const [desc, setDesc] = useState(c.desc || "");
  const status = c.status;

  const submit = () => {
    onSave({
      isCourse, isPaid, price: Number(price) || 0, desc,
      status: isCourse ? (status === "approved" ? "approved" : "pending") : null,
    });
  };
  const setApproval = (newStatus) => onSave({ ...c, isCourse, isPaid, price: Number(price) || 0, desc, status: newStatus });

  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn 0.2s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",
        background:"#181818",borderRadius:8,padding:"28px 32px",
      }}>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:"1px",margin:"0 0 6px"}}>
          Submit "{list.name}" to the Action Vault
        </h2>
        <p style={{color:"#888",fontFamily:"Barlow, sans-serif",fontSize:13,margin:"0 0 20px"}}>
          The Action Vault is where StuntListing publishes approved courses. Submit this list and an Action Vault admin will review it.
        </p>

        {status && (
          <div style={{
            padding:"10px 14px",borderRadius:4,marginBottom:18,
            background:`${COURSE_STATUS[status]?.color}22`,
            border:`1px solid ${COURSE_STATUS[status]?.color}55`,
            color: COURSE_STATUS[status]?.color,
            fontFamily:"Barlow, sans-serif",fontSize:13,fontWeight:600,
            display:"flex",alignItems:"center",gap:10,
          }}>
            <span style={{width:8,height:8,borderRadius:"50%",background:COURSE_STATUS[status]?.color}}/>
            Status: {COURSE_STATUS[status]?.label}
          </div>
        )}

        <label style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,cursor:"pointer"}}>
          <input type="checkbox" checked={isCourse} onChange={e=>setIsCourse(e.target.checked)} style={{accentColor:"#e50914"}}/>
          <span style={{color:"#ddd",fontFamily:"Barlow, sans-serif",fontSize:14}}>Make this list a course</span>
        </label>

        {isCourse && (
          <>
            <FormField label="Course description">
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}
                placeholder="What learners will get from this course"
                style={{...inputStyle, resize:"vertical"}}/>
            </FormField>

            <div style={{display:"flex",gap:14,marginBottom:14}}>
              <button onClick={()=>setIsPaid(false)} style={{
                flex:1,padding:"12px",borderRadius:4,
                background: !isPaid ? "rgba(70,211,105,0.2)" : "rgba(255,255,255,0.04)",
                border: !isPaid ? "1px solid #46d369" : "1px solid #333",
                color: !isPaid ? "#46d369" : "#888",
                fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"1px",cursor:"pointer",
              }}>Free</button>
              <button onClick={()=>setIsPaid(true)} style={{
                flex:1,padding:"12px",borderRadius:4,
                background: isPaid ? "rgba(255,107,0,0.2)" : "rgba(255,255,255,0.04)",
                border: isPaid ? "1px solid #ff6b00" : "1px solid #333",
                color: isPaid ? "#ff6b00" : "#888",
                fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"1px",cursor:"pointer",
              }}>Paid</button>
            </div>

            {isPaid && (
              <>
                <FormField label="Price (USD)">
                  <input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} style={inputStyle}/>
                </FormField>

                {/* Pricing breakdown */}
                <div style={{
                  marginBottom:16,padding:"14px 16px",
                  background:"rgba(70,211,105,0.04)",border:"1px solid #46d36933",borderRadius:6,
                }}>
                  <div style={{
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:"#46d369",
                    letterSpacing:"1px",marginBottom:8,
                  }}>
                    HOW REVENUE WORKS
                  </div>
                  <div style={{fontSize:12,color:"#bbb",fontFamily:"Barlow, sans-serif",lineHeight:1.6,marginBottom:12}}>
                    StuntListing's fee is <strong style={{color:"#fff"}}>$0 until you've earned $100</strong> from this course.
                    After $100, StuntListing keeps <strong style={{color:"#fff"}}>20%</strong> of additional sales.
                    You keep the rest.
                  </div>
                  <PricingBreakdown price={Number(price) || 0} />
                </div>
              </>
            )}

            <div style={{
              fontSize:11,color:"#666",fontFamily:"Barlow, sans-serif",
              padding:"10px 12px",background:"rgba(255,179,0,0.05)",border:"1px solid #ffb30033",
              borderRadius:4,marginBottom:18,lineHeight:1.5,
            }}>
              <strong style={{color:"#ffb300"}}>Heads up:</strong> Real approval, payment processing,
              and access control require a backend. Right now this is a UI mock — private URLs are
              obfuscated but not truly secured.
            </div>
          </>
        )}

        {adminMode && isCourse && (
          <div style={{
            padding:14,marginBottom:18,borderRadius:4,
            background:"rgba(70,211,105,0.05)",border:"1px solid #46d36944",
          }}>
            <div style={{color:"#46d369",fontSize:11,fontFamily:"Barlow, sans-serif",fontWeight:700,letterSpacing:"1px",marginBottom:8}}>
              ACTION VAULT ADMIN
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {Object.entries(COURSE_STATUS).map(([k, v]) => (
                <button key={k} onClick={()=>setApproval(k)} style={{
                  padding:"6px 14px",borderRadius:4,fontSize:11,
                  fontFamily:"Barlow, sans-serif",fontWeight:600,cursor:"pointer",
                  background: status===k ? `${v.color}33` : "rgba(255,255,255,0.03)",
                  border: status===k ? `1px solid ${v.color}` : "1px solid #333",
                  color: status===k ? v.color : "#aaa",
                }}>{v.label}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{
            padding:"8px 18px",background:"none",border:"1px solid #333",borderRadius:4,
            color:"#aaa",fontFamily:"Barlow, sans-serif",fontSize:13,cursor:"pointer",
          }}>Cancel</button>
          <button onClick={submit} style={{
            padding:"8px 22px",background:"#e50914",border:"none",borderRadius:4,
            color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:"1px",cursor:"pointer",
          }}>{isCourse ? "Submit to Action Vault" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── MY LISTS VIEW ───
function MyListsView({
  lists, activeListId, setActiveListId, createList, renameList, deleteList,
  removeItemFromList, updateListCourse,
  onSelectVideo, watched, favorites, toggleFav,
  onAddItem, onConvertCourse, onNewList, adminMode,
}) {
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const list = lists.find(l => l.id === activeListId) || lists[0];

  const startRename = (l) => { setRenaming(l.id); setRenameVal(l.name); };
  const commitRename = () => {
    if (renameVal.trim()) renameList(renaming, renameVal.trim());
    setRenaming(null);
  };

  const status = list?.course?.status;
  const isCourse = list?.course?.isCourse;

  return (
    <div style={{padding:"0 48px"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:6,flexWrap:"wrap"}}>
        <h2 style={{
          fontFamily:"'Bebas Neue',sans-serif",fontSize:28,fontWeight:400,
          letterSpacing:"1px",margin:0,
        }}>My Lists</h2>
        <span style={{color:"#666",fontSize:13,fontFamily:"Barlow, sans-serif"}}>
          {lists.length} list{lists.length!==1?"s":""}
        </span>
      </div>
      <p style={{color:"#777",fontSize:13,fontFamily:"Barlow, sans-serif",margin:"0 0 18px"}}>
        Build your own collections. Add anything — videos, podcasts, books, PDFs. Convert any list into a public course.
      </p>

      {/* List tabs */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24,alignItems:"center"}}>
        {lists.map(l => (
          <div key={l.id} style={{position:"relative"}}>
            {renaming === l.id ? (
              <input
                autoFocus
                value={renameVal}
                onChange={e=>setRenameVal(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e=>{ if(e.key==="Enter") commitRename(); if(e.key==="Escape") setRenaming(null); }}
                style={{
                  padding:"7px 14px",background:"#0e0e0e",border:"1px solid #e50914",borderRadius:20,
                  color:"#fff",fontFamily:"Barlow, sans-serif",fontSize:13,outline:"none",
                  width:160,
                }}
              />
            ) : (
              <button onClick={()=>setActiveListId(l.id)} onDoubleClick={()=>startRename(l)} style={{
                padding:"7px 16px",borderRadius:20,
                background: l.id===activeListId ? "#fff" : "rgba(255,255,255,0.06)",
                color: l.id===activeListId ? "#000" : "#ccc",
                border: l.id===activeListId ? "none" : "1px solid #333",
                fontFamily:"Barlow, sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",
                display:"flex",alignItems:"center",gap:6,
              }}>
                {l.name}
                <span style={{
                  fontSize:11,opacity:0.6,
                  color: l.id===activeListId ? "#444" : "#888",
                }}>· {l.items.length}</span>
                {l.course?.isCourse && (
                  <span style={{
                    width:6,height:6,borderRadius:"50%",
                    background: COURSE_STATUS[l.course.status]?.color || "#888",
                  }}/>
                )}
              </button>
            )}
          </div>
        ))}
        <button onClick={onNewList} style={{
          padding:"7px 14px",borderRadius:20,background:"none",border:"1px dashed #555",
          color:"#888",fontFamily:"Barlow, sans-serif",fontSize:13,cursor:"pointer",
        }}>+ New List</button>
      </div>

      {!list ? null : (
        <>
          {/* List actions */}
          <div style={{
            display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap",
            padding:"14px 18px",background:"rgba(255,255,255,0.02)",border:"1px solid #222",borderRadius:6,
          }}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#fff",letterSpacing:"0.5px"}}>
                {list.name}
              </div>
              {isCourse && status && (
                <div style={{
                  display:"inline-flex",alignItems:"center",gap:6,marginTop:4,
                  fontSize:11,fontFamily:"Barlow, sans-serif",fontWeight:600,
                  color: COURSE_STATUS[status]?.color || "#888",letterSpacing:"1px",textTransform:"uppercase",
                }}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:COURSE_STATUS[status]?.color}}/>
                  {COURSE_STATUS[status]?.label} · {list.course.isPaid ? `$${list.course.price.toFixed(2)}` : "Free"}
                </div>
              )}
            </div>
            <button onClick={onAddItem} style={{
              padding:"8px 16px",background:"#e50914",border:"none",borderRadius:4,
              color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:"1px",cursor:"pointer",
            }}>+ Add Item</button>
            <button onClick={onConvertCourse} style={{
              padding:"8px 16px",background:isCourse ? "rgba(70,211,105,0.15)" : "rgba(255,255,255,0.06)",
              border: isCourse ? "1px solid #46d36955" : "1px solid #333",
              borderRadius:4,color:isCourse ? "#46d369" : "#ccc",
              fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:"1px",cursor:"pointer",
            }}>{isCourse ? "Edit Course Settings" : "Convert to Course"}</button>
            <button onClick={()=>startRename(list)} style={{
              padding:"8px 14px",background:"none",border:"1px solid #333",borderRadius:4,
              color:"#aaa",fontFamily:"Barlow, sans-serif",fontSize:12,cursor:"pointer",
            }}>Rename</button>
            {!list.isDefault && (
              <button onClick={()=>{ if(confirm(`Delete list "${list.name}"?`)) deleteList(list.id); }} style={{
                padding:"8px 14px",background:"none",border:"1px solid #3a1f1f",borderRadius:4,
                color:"#a55",fontFamily:"Barlow, sans-serif",fontSize:12,cursor:"pointer",
              }}>Delete</button>
            )}
          </div>

          {/* Items */}
          {list.items.length === 0 ? (
            <div style={{textAlign:"center",padding:"80px 20px",color:"#555"}}>
              <div style={{fontSize:48,marginBottom:12}}>🎬</div>
              <div style={{fontSize:16,fontFamily:"Barlow, sans-serif",marginBottom:14}}>
                This list is empty.
              </div>
              <button onClick={onAddItem} style={{
                padding:"8px 18px",background:"#e50914",border:"none",borderRadius:4,
                color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:"1px",cursor:"pointer",
              }}>+ Add First Item</button>
            </div>
          ) : (
            <>
              {/* Video items grid */}
              {list.items.filter(i=>i.type==="video").length > 0 && (
                <div style={{marginBottom:30}}>
                  <h3 style={{
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"1px",
                    color:"#aaa",margin:"0 0 12px",textTransform:"uppercase",
                  }}>StuntFlix Videos</h3>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",gap:8}}>
                    {list.items.filter(i=>i.type==="video").map(item => {
                      const v = VIDEOS.find(x => x.id === item.videoId);
                      if (!v) return null;
                      return (
                        <div key={item.id} style={{position:"relative"}}>
                          <VideoCard v={v} onSelect={onSelectVideo} watched={watched.has(v.id)} isFav={favorites.has(v.id)} onToggleFav={toggleFav}/>
                          <button onClick={(e)=>{e.stopPropagation();removeItemFromList(list.id, item.id);}} style={{
                            position:"absolute",top:6,right:6,zIndex:10,
                            width:22,height:22,borderRadius:"50%",
                            background:"rgba(0,0,0,0.8)",border:"none",color:"#fff",
                            fontSize:11,cursor:"pointer",
                          }} title="Remove from list">✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom items list */}
              {list.items.filter(i=>i.type!=="video").length > 0 && (
                <div>
                  <h3 style={{
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"1px",
                    color:"#aaa",margin:"0 0 12px",textTransform:"uppercase",
                  }}>Other Items</h3>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {list.items.filter(i=>i.type!=="video").map(item => (
                      <div key={item.id} style={{
                        display:"flex",alignItems:"center",gap:14,
                        padding:"12px 16px",background:"rgba(255,255,255,0.03)",
                        border:"1px solid #222",borderRadius:6,
                      }}>
                        <span style={{fontSize:22,width:32,textAlign:"center"}}>{getItemTypeIcon(item.type)}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"Barlow, sans-serif",fontSize:14,color:"#fff",fontWeight:600}}>
                            {item.title}
                            {item.isPrivate && <span style={{
                              marginLeft:8,fontSize:10,padding:"2px 6px",borderRadius:3,
                              background:"rgba(255,107,0,0.15)",color:"#ff6b00",letterSpacing:"1px",
                            }}>PRIVATE</span>}
                          </div>
                          <div style={{fontFamily:"Barlow, sans-serif",fontSize:12,color:"#777",marginTop:2}}>
                            {ITEM_TYPES.find(t=>t.id===item.type)?.label}
                            {item.author ? ` · ${item.author}` : ""}
                          </div>
                          {item.notes && (
                            <div style={{fontFamily:"Barlow, sans-serif",fontSize:12,color:"#888",marginTop:4,fontStyle:"italic"}}>
                              {item.notes}
                            </div>
                          )}
                        </div>
                        {item.url && (
                          item.isPrivate ? (
                            <button onClick={()=>openPrivateURL(item.url)} style={{
                              color:"#46d369",fontFamily:"Barlow, sans-serif",fontSize:12,
                              padding:"6px 12px",border:"1px solid #46d36944",borderRadius:3,
                              background:"none",cursor:"pointer",
                            }}>Open ↗</button>
                          ) : (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
                              color:"#46d369",fontFamily:"Barlow, sans-serif",fontSize:12,textDecoration:"none",
                              padding:"6px 12px",border:"1px solid #46d36944",borderRadius:3,
                            }}>Open ↗</a>
                          )
                        )}
                        <button onClick={()=>removeItemFromList(list.id, item.id)} style={{
                          width:28,height:28,borderRadius:"50%",
                          background:"rgba(255,255,255,0.04)",border:"none",color:"#888",
                          fontSize:13,cursor:"pointer",
                        }} title="Remove">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── SECTION VIEW (Action Shorts, Previz, etc.) ───
function SectionView({ section, videos, onSelectVideo, watched, favorites, toggleFav, onBrowse }) {
  if (!section) return null;
  return (
    <div style={{padding:"0 48px"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:6,flexWrap:"wrap"}}>
        <span style={{
          width:10,height:10,borderRadius:2,background:section.color,display:"inline-block",
        }}/>
        <h2 style={{
          fontFamily:"'Bebas Neue',sans-serif",fontSize:28,fontWeight:400,
          letterSpacing:"1px",margin:0,color:"#fff",
        }}>{section.label}</h2>
        <span style={{color:"#666",fontSize:13,fontFamily:"Barlow, sans-serif"}}>
          {videos.length} title{videos.length!==1?"s":""}
        </span>
      </div>
      <p style={{color:"#888",fontSize:13,fontFamily:"Barlow, sans-serif",margin:"0 0 22px",maxWidth:680}}>
        {section.desc}
      </p>

      {videos.length === 0 ? (
        <div style={{
          textAlign:"center",padding:"80px 20px",color:"#555",
          border:"1px dashed #2a2a2a",borderRadius:8,
        }}>
          <div style={{fontSize:48,marginBottom:12}}>📭</div>
          <div style={{fontSize:16,fontFamily:"Barlow, sans-serif",marginBottom:6,color:"#888"}}>
            Nothing tagged for {section.label} yet.
          </div>
          <div style={{fontSize:13,fontFamily:"Barlow, sans-serif",color:"#666",marginBottom:18}}>
            Open any video and use the "Tag in Sections" buttons at the bottom to label it for this shelf.
          </div>
          <button onClick={onBrowse} style={{
            padding:"8px 18px",background: section.color,border:"none",borderRadius:4,
            color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:"1px",cursor:"pointer",
          }}>Browse Catalog</button>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",gap:8}}>
          {videos.map((v,i) => (
            <div key={v.id} style={{animation:`slideUp 0.4s ease ${Math.min(i*40,400)}ms both`}}>
              <VideoCard v={v} onSelect={onSelectVideo} watched={watched.has(v.id)} isFav={favorites.has(v.id)} onToggleFav={toggleFav}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SIGN-IN GATE + AUTH WRAPPER ───
export default function App() {
  return (
    <>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <AppInner />
      </SignedIn>
    </>
  );
}

function SignInScreen() {
  return (
    <div style={{
      minHeight:"100vh",background:"#141414",color:"#fff",
      fontFamily:"'Barlow','Helvetica Neue',sans-serif",
      display:"flex",alignItems:"center",justifyContent:"center",padding:24,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{textAlign:"center",maxWidth:480,width:"100%"}}>
        <div style={{
          fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"#e50914",
          letterSpacing:"3px",marginBottom:8,
        }}>STUNTFLIX</div>
        <div style={{
          fontFamily:"Barlow, sans-serif",fontSize:13,color:"#888",letterSpacing:"2px",
          textTransform:"uppercase",marginBottom:32,
        }}>Action Vault · Sign in to continue</div>
        <SignIn routing="hash" />
      </div>
    </div>
  );
}

// One-time migration: pull anything in localStorage into the cloud the first time you sign in
async function migrateLocalStorageToCloud(getToken) {
  if (lsLoad("migrated", false)) return;
  try {
    const legacyLists = lsLoad("lists", []);
    const legacyWatched = lsLoad("watched", []);
    const legacyTags = lsLoad("sectionTags", {});
    const legacyPurchased = lsLoad("purchased", []);

    const cloudLists = (await api.listsGet(getToken)).lists;
    const defaultList = cloudLists.find(l => l.isDefault);

    if (defaultList && legacyLists.length > 0) {
      // Find any local list with items and migrate them into cloud lists by name
      for (const ll of legacyLists) {
        let cloudList = cloudLists.find(c => c.name === ll.name);
        if (!cloudList) {
          const created = await api.listsCreate(getToken, ll.name);
          cloudList = { id: created.id, items: [] };
          if (ll.course?.isCourse) {
            await api.listsPatch(getToken, created.id, { course: ll.course });
          }
        }
        if (ll.items?.length) {
          await api.itemsAdd(getToken, cloudList.id, ll.items.map(i => ({
            type: i.type,
            videoId: i.videoId,
            title: i.title || "",
            url: i.url || "",
            author: i.author || "",
            notes: i.notes || "",
            isPrivate: !!i.isPrivate,
          })));
        }
      }
    }
    for (const vid of legacyWatched) {
      await api.watchedToggle(getToken, vid).catch(()=>{});
    }
    for (const [vid, sectionIds] of Object.entries(legacyTags)) {
      for (const sid of sectionIds) {
        await api.tagToggle(getToken, Number(vid), sid).catch(()=>{});
      }
    }
    for (const key of legacyPurchased) {
      await api.purchaseTest(getToken, key, 0).catch(()=>{});
    }
    lsSave("migrated", true);
  } catch (e) {
    console.warn("[migrate] failed, will retry on next load", e);
  }
}

function AppInner() {
  const [search, setSearch] = useState("");
  const [decade, setDecade] = useState("All");
  const [cat, setCat] = useState("All");
  const [intensity, setIntensity] = useState("All");
  const { getToken, isLoaded: authLoaded } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [watched, setWatched] = useState(() => new Set());
  const [purchased, setPurchased] = useState(() => new Set());
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [sectionTags, setSectionTags] = useState({});
  const [adminMode, setAdminMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("home");
  const [heroIdx, setHeroIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showConvertCourse, setShowConvertCourse] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  // ─── Hydrate from cloud on sign-in (and migrate any leftover localStorage on first load) ───
  useEffect(() => {
    if (!authLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        await migrateLocalStorageToCloud(getToken);
        const [listsRes, watchedRes, tagsRes, purchasesRes] = await Promise.all([
          api.listsGet(getToken),
          api.watchedGet(getToken),
          api.tagsGet(getToken),
          api.purchasesGet(getToken),
        ]);
        if (cancelled) return;
        setLists(listsRes.lists);
        setActiveListId(listsRes.lists[0]?.id || null);
        setWatched(new Set(watchedRes.watched));
        setSectionTags(tagsRes.tags);
        setPurchased(new Set(purchasesRes.purchased));
        setHydrated(true);
      } catch (e) {
        console.error("[hydrate] failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoaded]);

  // Purchase chokepoint — Stripe webhook later calls into confirmPurchase
  const confirmPurchase = async (key, price) => {
    setPurchased(p => { const n = new Set(p); n.add(key); return n; });
    setPurchaseSuccess(key);
    setTimeout(() => setPurchaseSuccess(null), 3500);
    try { await api.purchaseTest(getToken, key, price || 0); } catch (e) { console.error(e); }
  };
  const ownsPurchase = (key) => purchased.has(key);
  const resetAllData = () => {
    ["watched","lists","activeListId","sectionTags","purchased","favorites","migrated"].forEach(k =>
      localStorage.removeItem(lsKey(k))
    );
    location.reload();
  };

  // Convenience: a Set of all videoIds across all lists (for the heart/star UI)
  const favorites = new Set(lists.flatMap(l => l.items.filter(i => i.type === "video").map(i => i.videoId)));
  const activeList = lists.find(l => l.id === activeListId) || lists[0];

  // List operations — optimistic UI then API call. Reload list ids from server response on create.
  const createList = async (name) => {
    try {
      const res = await api.listsCreate(getToken, name);
      const newList = {
        id: res.id, name, items: [],
        course: { isCourse: false, isPaid: false, price: 0, desc: "", status: null },
        isDefault: false,
      };
      setLists(prev => [...prev, newList]);
      setActiveListId(res.id);
    } catch (e) { console.error(e); }
  };
  const renameList = async (id, name) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, name } : l));
    try { await api.listsPatch(getToken, id, { name }); } catch (e) { console.error(e); }
  };
  const deleteList = async (id) => {
    setLists(prev => prev.filter(l => l.id !== id));
    try { await api.listsDelete(getToken, id); } catch (e) { console.error(e); }
  };
  const updateListCourse = async (id, patch) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, course: { ...l.course, ...patch } } : l));
    try { await api.listsPatch(getToken, id, { course: patch }); } catch (e) { console.error(e); }
  };
  // addItemToList — accepts single or array
  const addItemToList = async (listId, itemOrItems) => {
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    const prepared = items.map(item => {
      const isPrivate = item.isPrivate ?? !!item.url;
      const url = item.url && isPrivate ? obfuscateURL(item.url) : item.url;
      return { id: uid(), ...item, url, isPrivate };
    });
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, items: [...l.items, ...prepared] } : l
    ));
    try { await api.itemsAdd(getToken, listId, prepared); } catch (e) { console.error(e); }
  };
  const removeItemFromList = async (listId, itemId) => {
    setLists(prev => prev.map(l =>
      l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l
    ));
    try { await api.itemsRemove(getToken, listId, itemId); } catch (e) { console.error(e); }
  };
  const toggleVideoInList = async (videoId, listId = activeListId) => {
    if (!listId) return;
    setLists(prev => prev.map(l => {
      if (l.id !== listId) return l;
      const existing = l.items.find(i => i.type === "video" && i.videoId === videoId);
      if (existing) return { ...l, items: l.items.filter(i => i.id !== existing.id) };
      return { ...l, items: [...l.items, { id: uid(), type: "video", videoId }] };
    }));
    try { await api.toggleVideoInList(getToken, listId, videoId); } catch (e) { console.error(e); }
  };

  const toggleSectionTag = async (videoId, sectionId) => {
    setSectionTags(prev => {
      const cur = new Set(prev[videoId] || []);
      if (cur.has(sectionId)) cur.delete(sectionId); else cur.add(sectionId);
      return { ...prev, [videoId]: [...cur] };
    });
    try { await api.tagToggle(getToken, videoId, sectionId); } catch (e) { console.error(e); }
  };
  const videoHasSection = (videoId, sectionId) => (sectionTags[videoId] || []).includes(sectionId);
  const videosInSection = (sectionId) => VIDEOS.filter(v => videoHasSection(v.id, sectionId));

  // Hero rotation
  const heroVideos = VIDEOS.filter(v => v.year >= 2022 && v.desc.length > 80);
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroVideos.length), 8000);
    return () => clearInterval(t);
  }, [heroVideos.length]);

  const heroVideo = heroVideos[heroIdx] || VIDEOS[0];

  const toggleWatched = async (id) => {
    setWatched(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
    try { await api.watchedToggle(getToken, id); } catch (e) { console.error(e); }
  };
  const toggleFav = id => toggleVideoInList(id, activeListId);

  const applyFilters = (list) => list.filter(v => {
    if (decade !== "All" && getDecade(v.year) !== decade) return false;
    if (cat !== "All" && v.cat !== cat) return false;
    if (intensity !== "All" && v.intensity !== intensity) return false;
    if (search) {
      const s = search.toLowerCase();
      return v.title.toLowerCase().includes(s) || v.desc.toLowerCase().includes(s) ||
        v.channel.toLowerCase().includes(s) || (v.guest||"").toLowerCase().includes(s) ||
        v.films.some(f=>f.toLowerCase().includes(s)) || String(v.year).includes(s) ||
        getDecade(v.year).toLowerCase().includes(s);
    }
    return true;
  });

  const allFiltered = applyFilters(VIDEOS);
  const myListVideos = VIDEOS.filter(v => favorites.has(v.id));
  const watchedVideos = VIDEOS.filter(v => watched.has(v.id));

  const showSearchResults = search.length > 0 || cat !== "All" || decade !== "All" || intensity !== "All";

  if (!hydrated) {
    return (
      <div style={{
        minHeight:"100vh",background:"#141414",color:"#fff",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontFamily:"'Barlow','Helvetica Neue',sans-serif",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:"#e50914",letterSpacing:"3px"}}>STUNTFLIX</div>
          <div style={{fontSize:12,color:"#666",fontFamily:"Barlow, sans-serif",letterSpacing:"2px",marginTop:6}}>Loading your vault…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight:"100vh",background:"#141414",color:"#fff",
      fontFamily:"'Barlow','Helvetica Neue',sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heroFade { from{opacity:0} to{opacity:1} }
        *::-webkit-scrollbar{height:0;width:0}
        input::placeholder{color:#666}
        body{margin:0;overflow-x:hidden}
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:500,
        background: (view !== "home" || showSearchResults) ? "rgba(20,20,20,0.97)" : "linear-gradient(rgba(0,0,0,0.7),transparent)",
        backdropFilter:"blur(8px)",
        padding:"0 48px",height:56,display:"flex",alignItems:"center",gap:24,
        transition:"background 0.3s",
      }}>
        {/* Logo */}
        <div style={{
          fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#e50914",
          letterSpacing:"2px",fontWeight:400,cursor:"pointer",flexShrink:0,
          marginRight:16,
        }} onClick={()=>{setView("home");setSearch("");setCat("All");setDecade("All");setIntensity("All");}}>
          STUNTFLIX
        </div>

        {/* Nav links */}
        <div style={{ display:"flex",gap:18,flexShrink:0,alignItems:"center" }}>
          {[
            {label:"Home",val:"home"},
            {label:"Action Vault",val:"vault"},
            {label:"My Lists",val:"mylist"},
            {label:`Watched (${watched.size})`,val:"watched"},
          ].map(n => (
            <button key={n.val} onClick={()=>{setView(n.val);if(n.val!=="home"){setSearch("");setCat("All");setDecade("All");setIntensity("All");}}}
              style={{
                background:"none",border:"none",color: view===n.val?"#fff":"#b3b3b3",
                fontFamily:"Barlow, sans-serif",fontSize:13,fontWeight: view===n.val?600:400,
                cursor:"pointer",padding:"4px 0",transition:"color 0.2s",
              }}
              onMouseEnter={e=>e.currentTarget.style.color="#fff"}
              onMouseLeave={e=>{if(view!==n.val)e.currentTarget.style.color="#b3b3b3"}}
            >{n.label}</button>
          ))}

          {/* Browse dropdown */}
          <div style={{ position:"relative" }}
            onMouseEnter={()=>setBrowseOpen(true)}
            onMouseLeave={()=>setBrowseOpen(false)}
          >
            <button style={{
              background:"none",border:"none",
              color: SECTIONS.some(s=>view===`section:${s.id}`) ? "#fff" : "#b3b3b3",
              fontFamily:"Barlow, sans-serif",fontSize:13,
              cursor:"pointer",padding:"4px 0",display:"flex",alignItems:"center",gap:4,
            }}>Browse <span style={{fontSize:9}}>▼</span></button>
            {browseOpen && (
              <div style={{
                position:"absolute",top:"100%",left:-12,
                background:"rgba(20,20,20,0.98)",border:"1px solid #333",
                padding:"6px 0",minWidth:200,borderRadius:4,
                boxShadow:"0 8px 20px rgba(0,0,0,0.6)",
              }}>
                {SECTIONS.map(s => (
                  <button key={s.id} onClick={()=>{setView(`section:${s.id}`);setBrowseOpen(false);setSearch("");setCat("All");setDecade("All");setIntensity("All");}}
                    style={{
                      display:"flex",alignItems:"center",gap:10,
                      width:"100%",padding:"8px 16px",background:"none",border:"none",
                      color:"#ddd",fontFamily:"Barlow, sans-serif",fontSize:13,
                      cursor:"pointer",textAlign:"left",
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="#fff";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="#ddd";}}
                  >
                    <span style={{width:8,height:8,borderRadius:2,background:s.color,flexShrink:0}} />
                    {s.label}
                    <span style={{marginLeft:"auto",color:"#555",fontSize:11}}>{videosInSection(s.id).length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{flex:1}} />

        {/* Search + Filters */}
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{
            display:"flex",alignItems:"center",
            background: searchFocused ? "rgba(0,0,0,0.75)" : "transparent",
            border: searchFocused ? "1px solid #fff" : "1px solid transparent",
            borderRadius:4,transition:"all 0.3s",overflow:"hidden",
            width: searchFocused ? 260 : 36, height:36,
          }}>
            <button onClick={()=>{setSearchFocused(!searchFocused);if(!searchFocused)setTimeout(()=>searchRef.current?.focus(),100);}}
              style={{background:"none",border:"none",color:"#fff",cursor:"pointer",padding:"0 8px",fontSize:16,flexShrink:0}}>
              ⌕
            </button>
            <input
              ref={searchRef}
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Titles, performers, films, years..."
              onFocus={()=>setSearchFocused(true)}
              style={{
                background:"none",border:"none",color:"#fff",fontSize:13,fontFamily:"Barlow, sans-serif",
                outline:"none",width:"100%",padding:"0 8px 0 0",
              }}
            />
          </div>

          {/* Decade */}
          <select value={decade} onChange={e=>setDecade(e.target.value)} style={{
            background:"rgba(0,0,0,0.6)",border:"1px solid #444",borderRadius:4,
            color:"#ccc",fontFamily:"Barlow, sans-serif",fontSize:12,padding:"6px 8px",cursor:"pointer",
          }}>
            {DECADES.map(d=><option key={d} value={d}>{d==="All"?"Decade":d}</option>)}
          </select>

          {/* Category */}
          <select value={cat} onChange={e=>setCat(e.target.value)} style={{
            background:"rgba(0,0,0,0.6)",border:"1px solid #444",borderRadius:4,
            color:"#ccc",fontFamily:"Barlow, sans-serif",fontSize:12,padding:"6px 8px",cursor:"pointer",
          }}>
            {CATS.map(c=><option key={c} value={c}>{c==="All"?"Category":c}</option>)}
          </select>

          {/* User button (Clerk) */}
          <div style={{marginLeft:8,display:"flex",alignItems:"center"}}>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: { width: 30, height: 30 } } }}/>
          </div>
        </div>
      </nav>

      {/* ─── HERO BILLBOARD ─── */}
      {view === "home" && !showSearchResults && (
        <div style={{
          position:"relative",height:"clamp(400px,56vh,600px)",overflow:"hidden",
          opacity:loaded?1:0,transition:"opacity 0.8s",
        }}>
          <div key={heroVideo.id} style={{
            position:"absolute",inset:0,animation:"heroFade 1s ease",
            background:`linear-gradient(135deg, ${getCatColor(heroVideo.cat)}22 0%, #141414 40%, #0a0a0a 100%)`,
          }}>
            <div style={{position:"absolute",inset:0,opacity:0.08,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(255,255,255,0.04) 4px,rgba(255,255,255,0.04) 8px)"}} />
          </div>
          <div style={{
            position:"absolute",bottom:0,left:0,right:0,height:"70%",
            background:"linear-gradient(transparent,#141414)",zIndex:2,
          }} />
          <div style={{
            position:"absolute",bottom:60,left:48,zIndex:3,maxWidth:600,
            animation:"slideUp 0.6s ease",
          }}>
            <div style={{
              fontSize:12,fontWeight:600,color:getCatColor(heroVideo.cat),textTransform:"uppercase",
              letterSpacing:"2px",fontFamily:"Barlow, sans-serif",marginBottom:8,
            }}>{heroVideo.sub} · {heroVideo.year}</div>
            <h1 style={{
              fontSize:"clamp(28px,4vw,48px)",fontWeight:400,margin:"0 0 12px",lineHeight:1.1,
              fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"1px",
            }}>{heroVideo.title}</h1>
            <div style={{ display:"flex",gap:12,marginBottom:14,alignItems:"center" }}>
              <span style={{color:"#46d369",fontWeight:700,fontSize:14}}>{heroVideo.year}</span>
              <span style={{color:"#999",fontSize:13}}>{heroVideo.duration}</span>
              <span style={{color:"#999",fontSize:13}}>{heroVideo.channel}</span>
            </div>
            <p style={{
              fontSize:15,lineHeight:1.6,color:"#b3b3b3",margin:"0 0 20px",fontWeight:300,
              display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden",
            }}>{heroVideo.desc}</p>
            <div style={{ display:"flex",gap:10 }}>
              <a href={heroVideo.url} target="_blank" rel="noopener noreferrer" style={{
                display:"inline-flex",alignItems:"center",gap:8,padding:"10px 28px",
                background:"#fff",borderRadius:4,color:"#000",fontFamily:"'Bebas Neue',sans-serif",
                fontSize:18,textDecoration:"none",letterSpacing:"1px",
              }}>▶ Watch</a>
              <button onClick={()=>setSelected(heroVideo)} style={{
                padding:"10px 24px",background:"rgba(109,109,110,0.7)",border:"none",borderRadius:4,
                color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:16,cursor:"pointer",letterSpacing:"1px",
              }}>ⓘ More Info</button>
              <button onClick={()=>toggleFav(heroVideo.id)} style={{
                width:40,height:40,borderRadius:"50%",border:"1px solid #777",background:"rgba(0,0,0,0.5)",
                color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              }}>{favorites.has(heroVideo.id)?"✓":"+"}</button>
              <button onClick={()=>toggleWatched(heroVideo.id)} style={{
                width:40,height:40,borderRadius:"50%",
                border: watched.has(heroVideo.id) ? "1px solid #46d369" : "1px solid #777",
                background: watched.has(heroVideo.id) ? "rgba(70,211,105,0.2)" : "rgba(0,0,0,0.5)",
                color: watched.has(heroVideo.id) ? "#46d369" : "#fff",
                fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              }}>{watched.has(heroVideo.id)?"✓":"👁"}</button>
            </div>
          </div>
          {/* Hero dots */}
          <div style={{
            position:"absolute",bottom:20,left:48,zIndex:3,display:"flex",gap:6,
          }}>
            {heroVideos.slice(0,8).map((_,i) => (
              <button key={i} onClick={()=>setHeroIdx(i)} style={{
                width: i===heroIdx?24:8,height:3,borderRadius:2,border:"none",cursor:"pointer",
                background: i===heroIdx?"#fff":"rgba(255,255,255,0.3)",transition:"all 0.3s",
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ─── ACTION VAULT VIEW ─── */}
      {view === "vault" && <ActionVault
        userCourses={lists.filter(l => l.course?.isCourse && l.course.status === "approved")}
        lists={lists}
        onSelectVideo={setSelected}
        watched={watched}
        favorites={favorites}
        toggleFav={toggleFav}
        ownsPurchase={ownsPurchase}
        onBuy={(p)=>setPendingPurchase(p)}
      />}

      {/* ─── CONTENT AREA ─── */}
      {view !== "vault" && <div style={{
        paddingTop: (view==="home" && !showSearchResults) ? 0 : 76,
        paddingBottom: 60,
        minHeight: "60vh",
      }}>
        {/* My Lists view */}
        {view === "mylist" && !showSearchResults ? (
          <MyListsView
            lists={lists} activeListId={activeListId} setActiveListId={setActiveListId}
            createList={createList} renameList={renameList} deleteList={deleteList}
            removeItemFromList={removeItemFromList} updateListCourse={updateListCourse}
            onSelectVideo={setSelected} watched={watched} favorites={favorites} toggleFav={toggleFav}
            onAddItem={()=>setShowAddItem(true)} onConvertCourse={()=>setShowConvertCourse(true)}
            onNewList={()=>setShowNewList(true)} adminMode={adminMode}
          />
        ) : view.startsWith("section:") && !showSearchResults ? (
          <SectionView
            section={SECTIONS.find(s => s.id === view.slice("section:".length))}
            videos={videosInSection(view.slice("section:".length))}
            onSelectVideo={setSelected} watched={watched} favorites={favorites} toggleFav={toggleFav}
            onBrowse={()=>setView("home")}
          />
        ) : (showSearchResults || view === "watched") ? (
          <div style={{ padding:"0 48px" }}>
            <h2 style={{
              fontFamily:"'Bebas Neue',sans-serif",fontSize:24,fontWeight:400,
              letterSpacing:"1px",marginBottom:4,
            }}>
              {view === "watched" ? "Watched" : search ? `Results for "${search}"` : "Browse"}
            </h2>
            {view === "watched" && (
              <p style={{color:"#777",fontSize:13,fontFamily:"Barlow, sans-serif",margin:"0 0 20px"}}>
                {watchedVideos.length} titles
              </p>
            )}

            {/* Active filters display */}
            {showSearchResults && (
              <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
                {search && <span style={{padding:"4px 12px",background:"rgba(229,9,20,0.15)",border:"1px solid rgba(229,9,20,0.3)",borderRadius:20,fontSize:12,color:"#e50914",fontFamily:"Barlow, sans-serif"}}>"{search}" ✕</span>}
                {decade!=="All" && <span style={{padding:"4px 12px",background:"rgba(255,255,255,0.08)",borderRadius:20,fontSize:12,color:"#ccc",fontFamily:"Barlow, sans-serif"}}>{decade}</span>}
                {cat!=="All" && <span style={{padding:"4px 12px",background:`${getCatColor(cat)}22`,borderRadius:20,fontSize:12,color:getCatColor(cat),fontFamily:"Barlow, sans-serif"}}>{cat}</span>}
                {intensity!=="All" && <span style={{padding:"4px 12px",background:"rgba(255,255,255,0.08)",borderRadius:20,fontSize:12,color:"#ccc",fontFamily:"Barlow, sans-serif"}}>{intensity}</span>}
                <button onClick={()=>{setSearch("");setCat("All");setDecade("All");setIntensity("All");}} style={{
                  background:"none",border:"none",color:"#e50914",fontSize:12,cursor:"pointer",fontFamily:"Barlow, sans-serif",
                }}>Clear All</button>
                <span style={{color:"#555",fontSize:12,fontFamily:"Barlow, sans-serif",marginLeft:8}}>
                  {allFiltered.length} result{allFiltered.length!==1?"s":""}
                </span>
              </div>
            )}

            {/* Grid */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",
              gap:8,
            }}>
              {(view==="watched" ? watchedVideos : allFiltered).map((v,i) => (
                <div key={v.id} style={{animation:`slideUp 0.4s ease ${Math.min(i*40,400)}ms both`}}>
                  <VideoCard v={v} onSelect={setSelected} watched={watched.has(v.id)} isFav={favorites.has(v.id)} onToggleFav={toggleFav} />
                </div>
              ))}
            </div>
            {(view==="watched" ? watchedVideos : allFiltered).length === 0 && (
              <div style={{textAlign:"center",padding:"80px 20px",color:"#555"}}>
                <div style={{fontSize:48,marginBottom:12}}>
                  {view==="watched"?"👁":"🔍"}
                </div>
                <div style={{fontSize:16,fontFamily:"Barlow, sans-serif"}}>
                  {view==="watched"?"Nothing watched yet — start exploring!":"No results found"}
                </div>
              </div>
            )}
          </div>
        ) : view === "home" && (
          /* ─── NETFLIX ROWS ─── */
          <div style={{ paddingTop: 20 }}>
            {/* Top 10 Row */}
            <div style={{ marginBottom: 40, position:"relative" }}>
              <h2 style={{
                fontSize:18,fontWeight:700,color:"#e5e5e5",margin:"0 0 12px 48px",
                fontFamily:"'Bebas Neue','Barlow Condensed',sans-serif",letterSpacing:"0.5px",
              }}>Top 10 on StuntFlix Today</h2>
              <div style={{display:"flex",gap:10,overflowX:"auto",padding:"0 48px",scrollbarWidth:"none"}}>
                {VIDEOS.filter(v=>v.year>=2020).sort((a,b)=>b.year-a.year).slice(0,10).map((v,i) => (
                  <div key={v.id} onClick={()=>setSelected(v)} style={{
                    flex:"0 0 200px",height:140,borderRadius:4,overflow:"hidden",
                    position:"relative",cursor:"pointer",display:"flex",
                    transition:"transform 0.3s",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.06)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                  >
                    {/* Big number */}
                    <div style={{
                      flex:"0 0 60px",display:"flex",alignItems:"flex-end",justifyContent:"center",
                      paddingBottom:4,
                    }}>
                      <span style={{
                        fontFamily:"'Bebas Neue',sans-serif",fontSize:72,fontWeight:400,
                        color:"transparent",
                        WebkitTextStroke:"2px #fff",lineHeight:0.8,
                      }}>{i+1}</span>
                    </div>
                    <div style={{
                      flex:1,position:"relative",borderRadius:4,overflow:"hidden",
                      background:`linear-gradient(135deg, ${getCatColor(v.cat)}33 0%, #1a1a1a 100%)`,
                    }}>
                      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"28px 8px 8px",background:"linear-gradient(transparent,rgba(0,0,0,0.85))"}}>
                        <div style={{fontSize:10,color:getCatColor(v.cat),fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",fontFamily:"Barlow, sans-serif"}}>{v.channel}</div>
                        <div style={{fontSize:12,fontWeight:700,color:"#fff",lineHeight:1.2,fontFamily:"Barlow Condensed, sans-serif",marginTop:2,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{v.title}</div>
                      </div>
                      {watched.has(v.id) && <div style={{position:"absolute",top:4,right:4,fontSize:9,color:"#46d369",fontWeight:700,background:"rgba(0,0,0,0.7)",borderRadius:3,padding:"1px 5px"}}>✓</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category rows */}
            {ROW_DEFS.map(row => (
              <ScrollRow
                key={row.title}
                title={row.title}
                videos={VIDEOS.filter(row.filter)}
                onSelect={setSelected}
                watched={watched}
                favorites={favorites}
                onToggleFav={toggleFav}
              />
            ))}
          </div>
        )}
      </div>}

      {/* ─── FOOTER ─── */}
      <div style={{
        borderTop:"1px solid #222",padding:"30px 48px",
        textAlign:"center",
      }}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"#e50914",letterSpacing:"2px",marginBottom:8}}>STUNTFLIX</div>
        <div style={{color:"#555",fontSize:12,fontFamily:"Barlow, sans-serif",lineHeight:1.8}}>
          {VIDEOS.length} curated BTS stunt videos · {new Set(VIDEOS.map(v=>v.channel)).size} channels · Spanning {Math.min(...VIDEOS.map(v=>v.year))}–{Math.max(...VIDEOS.map(v=>v.year))}
        </div>
        <div style={{color:"#333",fontSize:11,fontFamily:"Barlow, sans-serif",marginTop:8}}>
          All videos link to YouTube. Not affiliated with Netflix.
        </div>
        <div style={{marginTop:14,display:"flex",gap:8,justifyContent:"center"}}>
          <button onClick={()=>setAdminMode(a=>!a)} style={{
            background:"none",border:"1px solid #333",borderRadius:3,
            color: adminMode ? "#46d369" : "#444",
            fontFamily:"Barlow, sans-serif",fontSize:10,padding:"3px 10px",
            cursor:"pointer",letterSpacing:"1px",
          }}>{adminMode ? "ADMIN MODE: ON" : "admin mode"}</button>
          {adminMode && (
            <button onClick={()=>{ if(confirm("Reset all local data (lists, watched, tags, purchases)? This cannot be undone.")) resetAllData(); }} style={{
              background:"none",border:"1px solid #3a1f1f",borderRadius:3,
              color:"#a55",fontFamily:"Barlow, sans-serif",fontSize:10,padding:"3px 10px",
              cursor:"pointer",letterSpacing:"1px",
            }}>RESET DATA</button>
          )}
        </div>
      </div>

      {/* ─── DETAIL MODAL ─── */}
      <DetailModal
        v={selected}
        onClose={()=>setSelected(null)}
        watched={watched.has(selected?.id)}
        onToggleWatched={toggleWatched}
        isFav={favorites.has(selected?.id)}
        onToggleFav={toggleFav}
        lists={lists}
        toggleVideoInList={toggleVideoInList}
        sectionTags={selected ? (sectionTags[selected.id] || []) : []}
        toggleSectionTag={toggleSectionTag}
      />

      {/* ─── NEW LIST MODAL ─── */}
      {showNewList && (
        <NewListModal
          onClose={()=>setShowNewList(false)}
          onCreate={(name)=>{ createList(name); setShowNewList(false); }}
        />
      )}

      {/* ─── ADD ITEM MODAL ─── */}
      {showAddItem && activeList && (
        <AddItemModal
          list={activeList}
          onClose={()=>setShowAddItem(false)}
          onAdd={(item)=>{ addItemToList(activeList.id, item); setShowAddItem(false); }}
        />
      )}

      {/* ─── CONVERT COURSE MODAL ─── */}
      {showConvertCourse && activeList && (
        <ConvertCourseModal
          list={activeList}
          adminMode={adminMode}
          onClose={()=>setShowConvertCourse(false)}
          onSave={(patch)=>{ updateListCourse(activeList.id, patch); setShowConvertCourse(false); }}
        />
      )}

      {/* ─── PURCHASE CONFIRMATION MODAL ─── */}
      {pendingPurchase && (
        <PurchaseModal
          item={pendingPurchase}
          onClose={()=>setPendingPurchase(null)}
          onConfirm={()=>{ confirmPurchase(pendingPurchase.key, pendingPurchase.price); setPendingPurchase(null); }}
        />
      )}

      {/* ─── PURCHASE SUCCESS TOAST ─── */}
      {purchaseSuccess && (
        <div style={{
          position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:1200,
          padding:"14px 24px",background:"#46d369",borderRadius:6,
          color:"#000",fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"1px",
          boxShadow:"0 8px 24px rgba(70,211,105,0.4)",
          animation:"slideUp 0.3s ease",
        }}>
          ✓ PURCHASE CONFIRMED <span style={{fontFamily:"Barlow, sans-serif",fontSize:11,marginLeft:8,opacity:0.7}}>(test mode)</span>
        </div>
      )}
    </div>
  );
}

// ─── PURCHASE MODAL ───
function PurchaseModal({ item, onClose, onConfirm }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:1150,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn 0.2s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%",maxWidth:440,background:"#181818",borderRadius:8,padding:"32px 36px",
      }}>
        <div style={{
          fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:"#ff6b00",
          letterSpacing:"2px",marginBottom:8,
        }}>ACTION VAULT · CHECKOUT</div>
        <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.5px",margin:"0 0 6px",lineHeight:1.2}}>
          {item.title}
        </h2>
        <div style={{
          fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"#fff",
          margin:"18px 0",lineHeight:1,
        }}>${item.price.toFixed(2)}</div>

        <div style={{
          padding:"12px 14px",background:"rgba(255,179,0,0.05)",border:"1px solid #ffb30033",
          borderRadius:4,marginBottom:18,
        }}>
          <div style={{color:"#ffb300",fontSize:11,fontFamily:"Barlow, sans-serif",fontWeight:700,letterSpacing:"1px",marginBottom:4}}>
            TEST MODE
          </div>
          <div style={{color:"#aaa",fontSize:12,fontFamily:"Barlow, sans-serif",lineHeight:1.5}}>
            No card will be charged. Real payments go live once Stripe is connected on the backend.
            Your "purchase" will be remembered locally so you can preview the owned-content flow.
          </div>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{
            flex:1,padding:"12px",background:"none",border:"1px solid #333",borderRadius:4,
            color:"#aaa",fontFamily:"Barlow, sans-serif",fontSize:13,cursor:"pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex:2,padding:"12px",background:"#ff6b00",border:"none",borderRadius:4,
            color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"1px",cursor:"pointer",
          }}>Confirm Purchase (Test)</button>
        </div>
      </div>
    </div>
  );
}
