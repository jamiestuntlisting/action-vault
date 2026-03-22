# StuntFlix 🎬

A Netflix-style browsing experience for behind-the-scenes stunt videos from YouTube. Built with React + Vite.

## Features

- **Hero Billboard** — auto-rotating featured videos with Watch, My List, and Watched buttons
- **Top 10 Row** — Netflix-style numbered rankings
- **Horizontal Scroll Rows** — 10 curated category rows with arrow navigation
- **Hover Cards** — scale-up animation with play overlay
- **Detail Modal** — full info sheet with description, metadata, film tags
- **My List** — save favorites
- **Watched Tracking** — green checkmarks, dedicated Watched view, nav counter
- **Search** — expandable search across titles, performers, films, channels, years
- **Decade Filter** — 2020s, 2010s, 2000s, 1990s, 1980s & Earlier
- **Category Filter** — Behind The Scenes, React & Breakdown, How It Works, etc.
- **Intensity Level** — Beginner Friendly / Intermediate / Advanced
- **45+ videos** spanning 1920–2024

## Quick Start

```bash
npm install
npm run dev
```

Opens at http://localhost:3000

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
stuntflix/
├── index.html          # Entry HTML
├── package.json
├── vite.config.js
├── .gitignore
├── README.md
├── CLAUDE.md           # Claude Code context
└── src/
    ├── main.jsx        # React mount
    └── App.jsx         # Full app (data + components)
```

## Adding Videos

All video data lives in the `VIDEOS` array at the top of `src/App.jsx`. Each entry:

```js
{
  id: 100,                    // Unique ID
  title: "Video Title",
  channel: "Channel Name",
  cat: "Behind The Scenes",   // Category (must match CATS array)
  sub: "Studio BTS",          // Subcategory / series name
  url: "https://youtube.com/watch?v=...",
  guest: "Performer Name",    // Optional
  films: ["Film 1", "Film 2"],
  desc: "Description text.",
  year: 2024,
  duration: "10 min",
  intensity: "Intermediate"   // Beginner Friendly | Intermediate | Advanced
}
```

Row groupings are in the `ROW_DEFS` array — each has a title and filter function.

## Tech Stack

- React 18
- Vite 5
- No UI library — all custom styled components
- Google Fonts (Bebas Neue, Barlow, Barlow Condensed)
