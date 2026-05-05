// GET /api/global-settings
// Returns the admin-curated settings that must be the same for every member
// across every device — currently the Reel-of-the-Month schedule. Reads
// data/admin-settings.json from the repo via the GitHub Contents API.
//
// Public read (no auth) — these are the same values every signed-in member
// would see anyway. Writes go through /api/admin/global-settings (admin-only).

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const ADMIN_SETTINGS_PATH = 'data/admin-settings.json';

async function readAdminSettings(ghToken: string): Promise<any> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${ADMIN_SETTINGS_PATH}`,
    { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) throw new Error(`gh read failed: ${r.status}`);
  const j: any = await r.json();
  return JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8'));
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
  if (!ghToken) return res.status(500).json({ error: 'Server not configured' });

  try {
    // Cache for 60s — this is read by every app load. The admin write
    // path invalidates by overwriting; clients pick up the new value on
    // their next load (~5min round-trip). Acceptable for the
    // monthly-schedule-style settings that live here.
    res.setHeader('Cache-Control', 'public, max-age=60');
    const data = await readAdminSettings(ghToken);
    return res.status(200).json(data);
  } catch (e: any) {
    console.error('global-settings read error:', e);
    return res.status(500).json({ error: e.message });
  }
}
