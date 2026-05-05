// GET /api/admin/match-stunt-reels?scope=month|all
//
// For each YouTube-discovered stunt reel in src/data/stunt-reels.json (current
// month or all, not excluded), tries to find a StuntListing performer match by
// querying the StuntListing MySQL database directly:
//
//   - SELECT id, alias, first_name, last_name, instagram FROM `user`
//     WHERE fullTextSearch LIKE '%name%'
//
// Search candidates are the YouTube channelName + a name parsed from the title
// ("FirstName LastName Stunt Reel ..." → "FirstName LastName"). For the top
// match, fetches their stunt_reels rows and checks whether the YouTube
// videoId appears in any reel_url. Honors manual overrides from
// data/stunt-reel-overrides.json — when an override is set, we look up that
// user.id directly (no name search needed).
//
// Admin-only (StuntListing email allowlist). Live every call.

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

async function getMyProfile(token: string): Promise<any | null> {
  const r = await fetch(STUNTLISTING_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: `query { getMyProfile { id email } }` }),
  });
  if (!r.ok) return null;
  const j: any = await r.json();
  if (j.errors?.length) return null;
  return j.data?.getMyProfile || null;
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

// Best-effort extraction of a performer name from a YouTube reel title.
function parsePerformerNameFromTitle(title: string): string | null {
  if (!title) return null;
  const stripped = title
    .replace(/[\(\[].*?[\)\]]/g, ' ')
    .replace(/\s*[-|·:]\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
  const m1 = /^(.+?)\s*(?:-\s*)?(?:stunt\s+reel|demo\s+reel|action\s+reel|showreel|show\s+reel|stunt\s+demo|fight\s+reel|stunts?\s+reel)/i.exec(stripped);
  if (m1) {
    const cand = m1[1].replace(/[-|]$/, '').trim();
    if (/^[A-Z][\w'.-]*(\s+[A-Z][\w'.-]*){1,3}$/.test(cand)) return cand;
  }
  return null;
}

function videoIdFromUrl(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{6,})/);
  return m ? m[1] : null;
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
  const dbHost = process.env.STUNTLISTING_DB_HOST;
  const dbUser = process.env.STUNTLISTING_DB_USER;
  const dbPass = process.env.STUNTLISTING_DB_PASSWORD;
  const dbName = process.env.STUNTLISTING_DB_NAME;
  if (!ghToken || !dbHost || !dbUser || !dbPass || !dbName) {
    return res.status(500).json({ error: 'Server not configured (missing GH or DB env vars)' });
  }

  const mysql = require('mysql2/promise');
  let connection: any = null;

  try {
    const reelsData = await readJsonFromRepo<{ reels: any[] }>(ghToken, STUNT_REELS_PATH);
    const overridesData = await readJsonFromRepo<{ overrides: any[] }>(ghToken, OVERRIDES_PATH);

    const overridesByYoutubeId = new Map<string, any>();
    for (const o of overridesData.overrides || []) {
      overridesByYoutubeId.set(o.youtubeId, o);
    }

    const scope: 'month' | 'all' = req.query?.scope === 'all' ? 'all' : 'month';
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    // Admin matcher shows EVERYTHING including excluded — admin needs the
    // ability to re-include. Excluded state is surfaced per-row so the UI
    // can dim and flip the toggle. Public-facing screens still filter out
    // excluded; this is admin-only.
    const targetReels = (reelsData.reels || []).filter((r: any) => {
      if (scope === 'all') return true;
      return (r.publishedAt || '').startsWith(monthKey);
    });

    connection = await mysql.createConnection({
      host: dbHost, user: dbUser, password: dbPass, database: dbName,
    });

    // Helper: search by name, returns up to N candidate users.
    async function searchByName(name: string, limit = 5): Promise<any[]> {
      if (!name || name.trim().length < 3) return [];
      const [rows] = await connection.execute(
        `SELECT id, alias, first_name, last_name, instagram
           FROM \`user\`
          WHERE fullTextSearch LIKE ?
          ORDER BY id ASC
          LIMIT ?`,
        [`%${name.trim()}%`, limit]
      );
      return rows;
    }

    // Helper: fetch a single user by id (for overrides + top-match enrichment).
    async function getUserById(id: number): Promise<any | null> {
      const [rows] = await connection.execute(
        `SELECT id, alias, first_name, last_name, instagram FROM \`user\` WHERE id = ? LIMIT 1`,
        [id]
      );
      return rows[0] || null;
    }

    // Helper: fetch a user's stunt_reels rows (id + reel_url for videoId compare).
    async function getStuntReelsForUser(userId: number): Promise<Array<{ id: number; reel_url: string; title: string }>> {
      const [rows] = await connection.execute(
        `SELECT id, reel_url, title FROM stunt_reels WHERE userId = ?`,
        [userId]
      );
      return rows;
    }

    const matches: any[] = [];

    for (const reel of targetReels) {
      const youtubeId = reel.youtubeId;
      const override = overridesByYoutubeId.get(youtubeId);

      const candidateNames = new Set<string>();
      if (reel.channelName) candidateNames.add(reel.channelName);
      const parsed = parsePerformerNameFromTitle(reel.title);
      if (parsed) candidateNames.add(parsed);

      // Override path: skip name search, fetch the manually-set user directly.
      if (override?.stuntListingId) {
        const user = await getUserById(Number(override.stuntListingId));
        if (user) {
          const userReels = await getStuntReelsForUser(user.id);
          const onProfile = userReels.some(sr => videoIdFromUrl(sr.reel_url) === youtubeId);
          matches.push({
            youtubeId,
            title: reel.title,
            thumbnailUrl: reel.thumbnailUrl,
            channelName: reel.channelName,
            publishedAt: reel.publishedAt,
            excluded: !!reel.excluded,
            override: true,
            searchedNames: Array.from(candidateNames),
            match: {
              id: user.id,
              alias: user.alias,
              firstName: user.first_name,
              lastName: user.last_name,
              instagram: user.instagram || null,
              profileUrl: STUNTLISTING_PROFILE_BASE + (user.alias || ''),
              reelOnProfile: onProfile,
            },
            fallbackSearchUrl: null,
          });
          continue;
        }
        // Override pointed at a non-existent ID — fall through to search.
      }

      // Search by each candidate, dedupe by user.id.
      const seen = new Set<number>();
      const allHits: any[] = [];
      for (const name of candidateNames) {
        try {
          const hits = await searchByName(name);
          for (const h of hits) {
            if (h?.id && !seen.has(h.id)) {
              seen.add(h.id);
              allHits.push(h);
            }
          }
        } catch (e: any) {
          console.warn(`db search err for "${name}":`, e.message);
        }
        if (allHits.length >= 5) break;
      }

      const top = allHits[0];
      let match: any = null;
      let fallbackSearchUrl: string | null = null;

      if (top) {
        const userReels = await getStuntReelsForUser(top.id);
        const onProfile = userReels.some(sr => videoIdFromUrl(sr.reel_url) === youtubeId);
        match = {
          id: top.id,
          alias: top.alias,
          firstName: top.first_name,
          lastName: top.last_name,
          instagram: top.instagram || null,
          profileUrl: STUNTLISTING_PROFILE_BASE + (top.alias || ''),
          reelOnProfile: onProfile,
        };
      } else {
        const seed = (parsed || reel.channelName || '').replace(/\s+/g, '_');
        if (seed) fallbackSearchUrl = STUNTLISTING_SEARCH_BASE + encodeURIComponent(seed);
      }

      matches.push({
        youtubeId,
        title: reel.title,
        thumbnailUrl: reel.thumbnailUrl,
        channelName: reel.channelName,
        publishedAt: reel.publishedAt,
        excluded: !!reel.excluded,
        override: false,
        searchedNames: Array.from(candidateNames),
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
  } finally {
    if (connection) try { await connection.end(); } catch {}
  }
}
