// POST /api/admin/exclude-stunt-reel
// Body: { youtubeId: string, excluded: boolean }
//
// Flips the `excluded` flag on a stunt reel in src/data/stunt-reels.json
// (the bundled discovery JSON). Excluded reels are dropped from the home
// montage, the StuntReelVoting screen (both 'month' and 'all' scopes), and
// the matcher's targets list. Admin-only.
//
// Touches src/data/ so this commit DOES trigger a Vercel rebuild — exclusion
// is a deliberate admin action, not a high-frequency event.

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const STUNT_REELS_PATH = 'src/data/stunt-reels.json';
const STUNTLISTING_GRAPHQL = 'https://api.stuntlisting.com/graphql';

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

async function readReels(ghToken: string): Promise<{ data: any; sha: string }> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STUNT_REELS_PATH}`,
    { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) throw new Error(`gh read failed: ${r.status}`);
  const j: any = await r.json();
  return { data: JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8')), sha: j.sha };
}

async function writeReels(ghToken: string, sha: string, data: any, msg: string): Promise<void> {
  const body = JSON.stringify(data, null, 2) + '\n';
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STUNT_REELS_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `admin: ${msg}`,
        content: Buffer.from(body, 'utf-8').toString('base64'),
        sha,
        committer: { name: 'action-vault admin', email: 'noreply@stuntlisting.com' },
      }),
    }
  );
  if (!r.ok) throw new Error(`gh write failed: ${r.status} ${await r.text()}`);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  const profile = await getMyProfile(auth);
  if (!profile) return res.status(401).json({ error: 'Invalid token' });
  if (!ADMIN_EMAILS.includes(profile.email.toLowerCase())) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
  if (!ghToken) return res.status(500).json({ error: 'Server not configured' });

  const { youtubeId, excluded } = req.body || {};
  if (!youtubeId || typeof excluded !== 'boolean') {
    return res.status(400).json({ error: 'youtubeId + excluded (boolean) required' });
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, sha } = await readReels(ghToken);
      const reels = (data.reels || []) as any[];
      const idx = reels.findIndex(r => r.youtubeId === youtubeId);
      if (idx < 0) return res.status(404).json({ error: 'Reel not found' });

      // No-op if already in target state.
      if (!!reels[idx].excluded === excluded) {
        return res.status(200).json({ status: 'noop', youtubeId, excluded });
      }

      const updatedReels = [...reels];
      updatedReels[idx] = { ...reels[idx], excluded, excludedBy: profile.email, excludedAt: new Date().toISOString() };
      const updated = { ...data, lastUpdatedAt: new Date().toISOString(), reels: updatedReels };

      await writeReels(
        ghToken, sha, updated,
        `${excluded ? 'exclude' : 'include'} ${youtubeId} (by ${profile.email})`
      );
      return res.status(200).json({ status: 'ok', youtubeId, excluded });
    } catch (e: any) {
      if (attempt === 0 && /409|sha/i.test(e.message)) continue;
      console.error('exclude error:', e);
      return res.status(500).json({ error: e.message });
    }
  }
  return res.status(500).json({ error: 'retry exhausted' });
}
