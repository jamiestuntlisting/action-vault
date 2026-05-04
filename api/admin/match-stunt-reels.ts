// GET /api/admin/match-stunt-reels
// For each YouTube-discovered stunt reel in src/data/stunt-reels.json (current
// month, not excluded), tries to find a StuntListing performer match by
// running the public searchUserNavbar query against:
//   1. the YouTube channelName as-is
//   2. a name parsed from the title (best-effort: "FirstName LastName Stunt
//      Reel ..." → "FirstName LastName")
// For the top match per reel, fetches their profile to retrieve their
// stunt_reels list and instagram handle, then checks whether the YouTube
// videoId is in any of those reel URLs.
//
// Admin-only (StuntListing email allowlist). Live lookups every call —
// no caching yet, ~12 GraphQL calls per stunt reel × N reels.

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const STUNT_REELS_PATH = 'src/data/stunt-reels.json';
const OVERRIDES_PATH = 'data/stunt-reel-overrides.json';
const STUNTLISTING_GRAPHQL = 'https://api.stuntlisting.com/graphql';
const STUNTLISTING_PROFILE_BASE = 'https://stuntlisting.com/profile/';
const STUNTLISTING_SEARCH_BASE = 'https://www.stuntlisting.com/coordinator_dashboard?search_query=';

const ADMIN_EMAILS = [
  'james.northrup@gmail.com',
  'warrenhullstunts@gmail.com',
  'greg@stuntlisting.com',
  'info@stuntlisting.com',
  'jamie@stuntlisting.com',
  'warren@stuntlisting.com',
];

async function gql(query: string, variables: Record<string, any> = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(STUNTLISTING_GRAPHQL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new Error(`gql ${r.status}`);
  const j: any = await r.json();
  if (j.errors?.length) throw new Error(j.errors[0].message);
  return j.data;
}

async function getMyProfile(token: string): Promise<any | null> {
  try {
    const d = await gql(`query { getMyProfile { id email } }`, {}, token);
    return d?.getMyProfile || null;
  } catch {
    return null;
  }
}

async function readJsonFromRepo<T>(ghToken: string, path: string): Promise<T> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) throw new Error(`gh read ${path} failed: ${r.status}`);
  const j: any = await r.json();
  return JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8'));
}

// Best-effort extraction of a performer's name from a YouTube reel title.
// Patterns covered: "Name - Stunt Reel", "Name Stunt Reel", "Name Action Reel",
// "Name | Stunt Reel YYYY", etc. Returns null if nothing reasonable found.
function parsePerformerNameFromTitle(title: string): string | null {
  if (!title) return null;
  // Strip common reel suffixes and surrounding punctuation.
  const stripped = title
    .replace(/[\(\[].*?[\)\]]/g, ' ') // drop parenthesized parts
    .replace(/\s*[-|·:]\s*/g, ' - ') // normalize separators
    .replace(/\s+/g, ' ')
    .trim();

  // Try: text before " - Stunt Reel" / " Stunt Reel" etc.
  const m1 = /^(.+?)\s*(?:-\s*)?(?:stunt\s+reel|demo\s+reel|action\s+reel|showreel|show\s+reel|stunt\s+demo|fight\s+reel|stunts?\s+reel)/i.exec(stripped);
  if (m1) {
    const cand = m1[1].replace(/[-|]$/, '').trim();
    // Sanity: 2-4 words, looks like a personal name.
    if (/^[A-Z][\w'.-]*(\s+[A-Z][\w'.-]*){1,3}$/.test(cand)) return cand;
  }
  return null;
}

function videoIdFromUrl(url: string): string | null {
  if (!url) return null;
  // youtube.com/watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID
  const m = url.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

async function searchByName(name: string): Promise<any[]> {
  if (!name || name.trim().length < 3) return [];
  const data = await gql(
    `query SearchUsersNavbar($query: String!) {
       searchUserNavbar(query: $query, users_pagination_page: 1, users_page_size: 5) {
         users { id alias first_name last_name instagram }
       }
     }`,
    { query: name.trim() },
  );
  return data?.searchUserNavbar?.users || [];
}

async function getProfileByAlias(alias: string, callerToken: string): Promise<any | null> {
  if (!alias) return null;
  try {
    const data = await gql(
      `query Profile($alias: String!) {
         getUsersProfile(alias: $alias, is_profile_view_only: true) {
           id alias first_name last_name instagram stunt_reels { id reel_url thumb_url title }
         }
       }`,
      { alias },
      callerToken,
    );
    return data?.getUsersProfile || null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!auth) return res.status(401).json({ error: 'Missing token' });

  const profile = await getMyProfile(auth);
  if (!profile) return res.status(401).json({ error: 'Invalid token' });
  if (!ADMIN_EMAILS.includes(profile.email.toLowerCase())) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
  if (!ghToken) return res.status(500).json({ error: 'Server not configured' });

  try {
    const reelsData = await readJsonFromRepo<{ reels: any[] }>(ghToken, STUNT_REELS_PATH);
    const overridesData = await readJsonFromRepo<{ overrides: any[] }>(ghToken, OVERRIDES_PATH);

    const overridesByYoutubeId = new Map<string, any>();
    for (const o of overridesData.overrides || []) {
      overridesByYoutubeId.set(o.youtubeId, o);
    }

    // Filter to current month, not excluded.
    const scope: 'month' | 'all' = req.query?.scope === 'all' ? 'all' : 'month';
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetReels = (reelsData.reels || []).filter((r: any) => {
      if (r.excluded) return false;
      if (scope === 'all') return true;
      return (r.publishedAt || '').startsWith(monthKey);
    });

    const matches: any[] = [];
    for (const reel of targetReels) {
      const youtubeId = reel.youtubeId;
      const override = overridesByYoutubeId.get(youtubeId);

      // Candidate name pool to search for.
      const candidates = new Set<string>();
      if (reel.channelName) candidates.add(reel.channelName);
      const parsed = parsePerformerNameFromTitle(reel.title);
      if (parsed) candidates.add(parsed);

      // If admin manually mapped this reel to a StuntListing user ID, skip
      // search and go straight to that profile (still need the alias —
      // if override has the alias too, no extra lookup; otherwise we'd
      // need a search-by-id which isn't exposed publicly. For now, the
      // admin endpoint requires the override to also include `alias`).
      if (override?.stuntListingId && override?.alias) {
        const fullProfile = await getProfileByAlias(override.alias, auth);
        const reels = fullProfile?.stunt_reels || [];
        const onProfile = reels.some((sr: any) => videoIdFromUrl(sr.reel_url) === youtubeId);
        matches.push({
          youtubeId,
          title: reel.title,
          thumbnailUrl: reel.thumbnailUrl,
          channelName: reel.channelName,
          publishedAt: reel.publishedAt,
          override: true,
          searchedNames: Array.from(candidates),
          match: {
            id: fullProfile?.id || override.stuntListingId,
            alias: fullProfile?.alias || override.alias,
            firstName: fullProfile?.first_name || null,
            lastName: fullProfile?.last_name || null,
            instagram: fullProfile?.instagram || null,
            profileUrl: STUNTLISTING_PROFILE_BASE + (fullProfile?.alias || override.alias),
            reelOnProfile: onProfile,
          },
          fallbackSearchUrl: null,
        });
        continue;
      }

      // Search StuntListing by each candidate name; collect unique users.
      const seen = new Set<number>();
      const allHits: any[] = [];
      for (const name of candidates) {
        try {
          const hits = await searchByName(name);
          for (const h of hits) {
            if (h?.id && !seen.has(h.id)) {
              seen.add(h.id);
              allHits.push(h);
            }
          }
        } catch (e: any) {
          console.warn(`search err for "${name}":`, e.message);
        }
        if (allHits.length >= 5) break;
      }

      const top = allHits[0];
      let match: any = null;
      let fallbackSearchUrl: string | null = null;

      if (top) {
        // Fetch their profile to get stunt_reels and instagram.
        const fullProfile = await getProfileByAlias(top.alias, auth);
        const reels = fullProfile?.stunt_reels || [];
        const onProfile = reels.some((sr: any) => videoIdFromUrl(sr.reel_url) === youtubeId);
        match = {
          id: top.id,
          alias: top.alias,
          firstName: top.first_name,
          lastName: top.last_name,
          instagram: fullProfile?.instagram || top.instagram || null,
          profileUrl: STUNTLISTING_PROFILE_BASE + top.alias,
          reelOnProfile: onProfile,
        };
      } else {
        // No match — link to a search the admin can run on stuntlisting.com.
        const seed = (parsed || reel.channelName || '').replace(/\s+/g, '_');
        if (seed) fallbackSearchUrl = STUNTLISTING_SEARCH_BASE + encodeURIComponent(seed);
      }

      matches.push({
        youtubeId,
        title: reel.title,
        thumbnailUrl: reel.thumbnailUrl,
        channelName: reel.channelName,
        publishedAt: reel.publishedAt,
        override: false,
        searchedNames: Array.from(candidates),
        match,
        fallbackSearchUrl,
        otherCandidates: allHits.slice(1, 5).map(h => ({
          id: h.id,
          alias: h.alias,
          firstName: h.first_name,
          lastName: h.last_name,
        })),
      });
    }

    return res.status(200).json({
      scope,
      generatedAt: now.toISOString(),
      total: matches.length,
      matches,
    });
  } catch (e: any) {
    console.error('match-stunt-reels error:', e);
    return res.status(500).json({ error: e.message });
  }
}
