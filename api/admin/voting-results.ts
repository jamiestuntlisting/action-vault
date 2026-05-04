// GET /api/admin/voting-results
// Returns aggregated voting results across all users, grouped by entryId
// then by reelId. Admin email allowlist is enforced via the user's
// StuntListing token (same allowlist as AdminReelOfTheMonthScreen).

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const VOTES_PATH = 'data/votes.json';
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

async function readVotes(ghToken: string): Promise<any> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${VOTES_PATH}`,
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
    const data = await readVotes(ghToken);
    const votes = (data.votes || []) as any[];

    // Group: entryId → reelId → { count, sum, voters }
    const byEntry: Record<string, Record<string, any>> = {};
    for (const v of votes) {
      byEntry[v.entryId] = byEntry[v.entryId] || {};
      const bucket = (byEntry[v.entryId][v.reelId] = byEntry[v.entryId][v.reelId] || {
        reelId: v.reelId,
        count: 0,
        sum: 0,
        voters: [],
      });
      bucket.count += 1;
      bucket.sum += v.rating;
      bucket.voters.push({
        userId: v.userId,
        userName: v.userName,
        userEmail: v.userEmail,
        alias: v.alias,
        unionStatus: v.unionStatus,
        rating: v.rating,
        updatedAt: v.updatedAt,
      });
    }

    // Convert to a list-of-lists shape for the client.
    const entries = Object.entries(byEntry).map(([entryId, reels]) => {
      const reelList = Object.values(reels)
        .map((r: any) => ({
          ...r,
          average: r.count > 0 ? Math.round((r.sum / r.count) * 100) / 100 : 0,
        }))
        .sort((a: any, b: any) => b.average - a.average || b.count - a.count);
      return {
        entryId,
        totalVotes: reelList.reduce((acc: number, r: any) => acc + r.count, 0),
        uniqueVoters: new Set(votes.filter(v => v.entryId === entryId).map(v => v.userId)).size,
        reels: reelList,
      };
    });

    return res.status(200).json({
      lastUpdatedAt: data.lastUpdatedAt,
      totalVotes: votes.length,
      entries,
    });
  } catch (e: any) {
    console.error('voting-results error:', e);
    return res.status(500).json({ error: e.message });
  }
}
