// GET  /api/admin/stunt-reel-overrides — list all stored overrides
// POST /api/admin/stunt-reel-overrides — set/clear an override for one reel
//   body: { youtubeId, stuntListingId?, alias? }   (omit/null both to clear)
//
// Persists to data/stunt-reel-overrides.json in the repo via GitHub Contents
// API. Admin-only.

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const OVERRIDES_PATH = 'data/stunt-reel-overrides.json';
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

async function readOverrides(ghToken: string): Promise<{ data: any; sha: string }> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${OVERRIDES_PATH}`,
    { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) throw new Error(`gh read failed: ${r.status}`);
  const j: any = await r.json();
  return {
    data: JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8')),
    sha: j.sha,
  };
}

async function writeOverrides(ghToken: string, sha: string, data: any, msg: string): Promise<void> {
  const body = JSON.stringify(data, null, 2) + '\n';
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${OVERRIDES_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `override: ${msg}`,
        content: Buffer.from(body, 'utf-8').toString('base64'),
        sha,
        committer: { name: 'action-vault overrides', email: 'noreply@stuntlisting.com' },
      }),
    }
  );
  if (!r.ok) throw new Error(`gh write failed: ${r.status} ${await r.text()}`);
}

// Resolve alias from a numeric StuntListing user id by walking pages of
// searchUserNavbar. The public schema doesn't expose a getUserById, so we
// search and filter. This is best-effort; if the admin enters an id that
// doesn't surface in search, alias stays null and the matcher will skip
// the live profile lookup until next time.
async function findAliasForId(stuntListingId: number, callerToken: string): Promise<string | null> {
  // Cheap shortcut: searchUserNavbar with empty-ish query rarely returns the
  // target. So instead try fetching getUsersProfile with the id encoded as
  // alias — won't work for numeric. Skip lookup; rely on the UI prompting
  // the admin to also paste an alias if known.
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
    if (req.method === 'GET') {
      const { data } = await readOverrides(ghToken);
      return res.status(200).json(data);
    }

    // POST: set/clear an override.
    const { youtubeId, stuntListingId, alias } = req.body || {};
    if (!youtubeId) return res.status(400).json({ error: 'youtubeId required' });

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data, sha } = await readOverrides(ghToken);
        const existing = (data.overrides || []).filter((o: any) => o.youtubeId !== youtubeId);
        const nowIso = new Date().toISOString();
        let updated;
        let summary;
        const cleared = !stuntListingId && !alias;
        if (cleared) {
          updated = { ...data, lastUpdatedAt: nowIso, overrides: existing };
          summary = `clear ${youtubeId}`;
        } else {
          const o = {
            youtubeId,
            stuntListingId: stuntListingId ? Number(stuntListingId) : null,
            alias: alias || null,
            setBy: profile.email,
            setAt: nowIso,
          };
          updated = { ...data, lastUpdatedAt: nowIso, overrides: [...existing, o] };
          summary = `set ${youtubeId} → id=${o.stuntListingId ?? '?'} alias=${o.alias ?? '?'} (by ${profile.email})`;
        }
        await writeOverrides(ghToken, sha, updated, summary);
        return res.status(200).json({ status: 'ok', overrides: updated.overrides });
      } catch (e: any) {
        if (attempt === 0 && /409|sha/i.test(e.message)) continue;
        throw e;
      }
    }
    return res.status(500).json({ status: 'error', message: 'retry exhausted' });
  } catch (e: any) {
    console.error('overrides error:', e);
    return res.status(500).json({ error: e.message });
  }
}
