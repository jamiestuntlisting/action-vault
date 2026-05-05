// POST /api/admin/global-settings
// Body: a partial settings object (any subset of admin-curated fields) that
// gets merged into data/admin-settings.json's `settings` map and committed.
// Anything in the body's `settings` overrides existing keys; nothing is
// removed unless the body explicitly sets a key to `null`.
//
// Used today to sync the Reel-of-the-Month schedule (`reelOfMonthEntries`)
// across devices. The same endpoint can carry any admin-set field that
// must be universal (admin video moderation, atlas catalog overrides,
// etc.) when those flows are wired up.
//
// Admin-only via the StuntListing email allowlist.

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const ADMIN_SETTINGS_PATH = 'data/admin-settings.json';
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

async function readAdminSettings(ghToken: string): Promise<{ data: any; sha: string }> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${ADMIN_SETTINGS_PATH}`,
    { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) throw new Error(`gh read failed: ${r.status}`);
  const j: any = await r.json();
  return { data: JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8')), sha: j.sha };
}

async function writeAdminSettings(ghToken: string, sha: string, data: any, msg: string): Promise<void> {
  const body = JSON.stringify(data, null, 2) + '\n';
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${ADMIN_SETTINGS_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `admin-settings: ${msg}`,
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

  const patch = req.body?.settings;
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return res.status(400).json({ error: '`settings` (object) required in body' });
  }

  // Optimistic-concurrency retry once on 409 SHA mismatch.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, sha } = await readAdminSettings(ghToken);
      const merged = {
        ...(data.settings || {}),
        ...patch, // shallow merge — caller passes full arrays for list fields
      };
      const updated = {
        ...data,
        lastUpdatedAt: new Date().toISOString(),
        settings: merged,
      };
      const summary = `${profile.email} updated ${Object.keys(patch).join(', ')}`;
      await writeAdminSettings(ghToken, sha, updated, summary);
      return res.status(200).json({ status: 'ok', settings: merged });
    } catch (e: any) {
      if (attempt === 0 && /409|sha/i.test(e.message)) continue;
      console.error('global-settings write error:', e);
      return res.status(500).json({ error: e.message });
    }
  }
  return res.status(500).json({ error: 'retry exhausted' });
}
