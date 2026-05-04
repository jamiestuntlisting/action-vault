// POST /api/votes/submit
// Records (or clears) a single user's vote on a single reel and commits the
// updated data/votes.json to GitHub. Identity is verified by calling
// StuntListing's getMyProfile with the user's access_token from login.
//
// Body: { entryId: string, reelId: string, rating: number }
//   rating === 0 clears any existing vote for this user/entry/reel.

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const VOTES_PATH = 'data/votes.json';
const STUNTLISTING_GRAPHQL = 'https://api.stuntlisting.com/graphql';

async function getMyProfile(token: string): Promise<any | null> {
  const r = await fetch(STUNTLISTING_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      query: `query { getMyProfile { id email first_name last_name role union_status alias } }`,
    }),
  });
  if (!r.ok) return null;
  const j: any = await r.json();
  if (j.errors?.length) return null;
  return j.data?.getMyProfile || null;
}

async function readVotes(ghToken: string): Promise<{ data: any; sha: string }> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${VOTES_PATH}`,
    { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) throw new Error(`gh read failed: ${r.status} ${await r.text()}`);
  const j: any = await r.json();
  return { data: JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8')), sha: j.sha };
}

async function writeVotes(ghToken: string, sha: string, data: any, msg: string): Promise<void> {
  const body = JSON.stringify(data, null, 2) + '\n';
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${VOTES_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `vote: ${msg}`,
        content: Buffer.from(body, 'utf-8').toString('base64'),
        sha,
        committer: { name: 'action-vault votes', email: 'noreply@stuntlisting.com' },
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

  const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
  if (!ghToken) return res.status(500).json({ error: 'Server not configured (missing GITHUB_TOKEN_REPO_WRITE)' });

  const { entryId, reelId, rating } = req.body || {};
  if (!entryId || !reelId || typeof rating !== 'number') {
    return res.status(400).json({ error: 'Required: entryId, reelId, rating (number)' });
  }

  // Concurrent votes can race on GitHub's optimistic SHA check; one retry on conflict.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, sha } = await readVotes(ghToken);
      const votes = (data.votes || []) as any[];
      const without = votes.filter(
        v => !(v.entryId === entryId && v.reelId === reelId && v.userId === profile.id)
      );

      const nowIso = new Date().toISOString();
      let updated;
      let summary;
      if (rating >= 1) {
        const prior = votes.find(v => v.entryId === entryId && v.reelId === reelId && v.userId === profile.id);
        const newVote = {
          userId: profile.id,
          userEmail: profile.email,
          userName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          alias: profile.alias || null,
          unionStatus: profile.union_status || null,
          roles: profile.role || null,
          entryId,
          reelId,
          rating,
          createdAt: prior?.createdAt || nowIso,
          updatedAt: nowIso,
        };
        updated = { ...data, lastUpdatedAt: nowIso, votes: [...without, newVote] };
        summary = `${profile.email} → ${rating} on ${entryId}/${reelId}`;
      } else {
        updated = { ...data, lastUpdatedAt: nowIso, votes: without };
        summary = `${profile.email} cleared ${entryId}/${reelId}`;
      }

      await writeVotes(ghToken, sha, updated, summary);
      return res.status(200).json({ status: 'ok' });
    } catch (e: any) {
      if (attempt === 0 && /409|sha/i.test(e.message)) {
        // Concurrent edit — retry.
        continue;
      }
      console.error('vote submit error:', e);
      return res.status(500).json({ status: 'error', message: e.message });
    }
  }
  return res.status(500).json({ status: 'error', message: 'retry exhausted' });
}
