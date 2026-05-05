// GET /api/stunt-reel-performer?youtubeId=<id>
//
// Public lookup of the StuntListing performer behind a YouTube-discovered
// stunt reel, used by the stunt voting screen to surface name, location,
// height, weight, and profile link when we can match.
//
// Resolution order:
//   1. data/stunt-reel-overrides.json — admin-set user.id wins
//   2. Search StuntListing user table by channelName + name parsed from title
//
// All fields returned (height, weight, location, instagram) are what
// StuntListing already shows on the public profile page, so no extra
// privacy gate beyond what stuntlisting.com itself enforces.

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const STUNT_REELS_PATH = 'src/data/stunt-reels.json';
const OVERRIDES_PATH = 'data/stunt-reel-overrides.json';
const STUNTLISTING_PROFILE_BASE = 'https://stuntlisting.com/profile/';

async function readJsonFromRepo(ghToken: string, path: string): Promise<any> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) throw new Error(`gh read ${path} failed: ${r.status}`);
  const j: any = await r.json();
  return JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8'));
}

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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const youtubeId = (req.query?.youtubeId || '').toString().trim();
  if (!youtubeId) return res.status(400).json({ error: 'youtubeId required' });

  const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
  const dbHost = process.env.STUNTLISTING_DB_HOST;
  if (!ghToken || !dbHost) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  // Cache for 5 min — performer matches change rarely (overrides are rare,
  // discovery is daily). Keeps the voting page snappy.
  res.setHeader('Cache-Control', 'public, max-age=300');

  try {
    const reelsData = await readJsonFromRepo(ghToken, STUNT_REELS_PATH);
    const reel = (reelsData.reels || []).find((r: any) => r.youtubeId === youtubeId);
    if (!reel) return res.status(404).json({ error: 'reel not found' });

    const overridesData = await readJsonFromRepo(ghToken, OVERRIDES_PATH);
    const override = (overridesData.overrides || []).find((o: any) => o.youtubeId === youtubeId);

    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({
      host: dbHost,
      user: process.env.STUNTLISTING_DB_USER,
      password: process.env.STUNTLISTING_DB_PASSWORD,
      database: process.env.STUNTLISTING_DB_NAME,
    });

    try {
      // Pulls the publicly-visible fields plus joins primary_location for
      // its display name. The FK column from TypeORM's @JoinColumn is
      // primary_locationId by default.
      const SELECT_USER = `
        SELECT u.id, u.alias, u.first_name, u.last_name, u.instagram,
               u.height, u.weight, l.name AS location_name
          FROM \`user\` u
          LEFT JOIN locations l ON l.id = u.primary_locationId
      `;

      let user: any = null;
      let viaOverride = false;
      if (override?.stuntListingId) {
        const [rows] = await conn.execute(`${SELECT_USER} WHERE u.id = ? LIMIT 1`, [Number(override.stuntListingId)]);
        user = (rows as any[])[0] || null;
        viaOverride = !!user;
      }

      if (!user) {
        const candidates: string[] = [];
        if (reel.channelName) candidates.push(reel.channelName);
        const parsed = parsePerformerNameFromTitle(reel.title);
        if (parsed) candidates.push(parsed);
        for (const name of candidates) {
          if (!name || name.trim().length < 3) continue;
          const [rows] = await conn.execute(
            `${SELECT_USER} WHERE u.fullTextSearch LIKE ? ORDER BY u.id ASC LIMIT 1`,
            [`%${name.trim()}%`]
          );
          const candidate = (rows as any[])[0];
          if (candidate) { user = candidate; break; }
        }
      }

      if (!user) {
        return res.status(200).json({ youtubeId, match: null });
      }

      return res.status(200).json({
        youtubeId,
        match: {
          id: user.id,
          alias: user.alias,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: [user.first_name, user.last_name].filter(Boolean).join(' '),
          instagram: user.instagram || null,
          height: user.height || null,
          weight: user.weight || null,
          location: user.location_name || null,
          profileUrl: STUNTLISTING_PROFILE_BASE + (user.alias || ''),
          viaOverride,
        },
      });
    } finally {
      try { await conn.end(); } catch {}
    }
  } catch (e: any) {
    console.error('stunt-reel-performer error:', e);
    return res.status(500).json({ error: e.message });
  }
}
