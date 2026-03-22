# CLAUDE.md — StuntFlix Project Context

## What This Is
StuntFlix is a Netflix-style browsing UI for curated behind-the-scenes stunt videos from YouTube. It's a single-page React app (Vite) with no backend — all data is in the VIDEOS array in src/App.jsx.

## Architecture
- **Single file app**: All components and data live in `src/App.jsx`
- **No state management library**: Uses React useState/useEffect only
- **No CSS framework**: All inline styles, uses Google Fonts (Bebas Neue, Barlow, Barlow Condensed)
- **No router**: View state managed via `view` state variable (home/search/mylist/watched)
- **No persistence**: Watched/favorites reset on reload (future: add localStorage or persistent storage)

## Key Data Structures
- `VIDEOS[]` — master array of all video entries with id, title, channel, cat, sub, url, guest, films[], desc, year, duration, intensity
- `ROW_DEFS[]` — defines Netflix-style horizontal scroll rows with title + filter function
- `CATS[]` — category filter options
- `DECADES[]` — decade filter options
- `INTENSITIES[]` — difficulty level options
- `catColors{}` — color mapping per category

## Key Components
- `App` (main) — nav, hero billboard, content routing, filters, state management
- `ScrollRow` — horizontal scrollable row with arrow buttons
- `VideoCard` — individual video thumbnail card with hover effects
- `DetailModal` — full detail overlay when clicking a video

## Commands
```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Design Decisions
- Netflix dark theme (#141414 background, #e50914 red accent)
- Category-coded color system for visual variety
- Hero billboard auto-rotates every 8 seconds
- Cards are 260px wide in scroll rows
- Modal uses backdrop blur
- All videos link out to YouTube (no embedded players)

## Future Iteration Ideas
- Persistent watched/favorites with localStorage
- Embedded YouTube player in modal
- User ratings / personal notes per video
- Sorting options (by year, by channel, by duration)
- Mobile responsive improvements
- Video submission form to add new entries
- Thumbnail images (YouTube API or manual)
- "Continue Watching" row
- Share links for individual videos
- Keyboard navigation (arrow keys in rows, Escape to close modal)
- Search history / recent searches
