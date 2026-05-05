// GET /api/admin/cron-health
// Returns the last 10 commits to src/data/stunt-reels.json so admins can see
// when the daily YouTube discovery cron last ran and how many reels it added.
// Each cron commit message looks like:
//   cron: discover N new stunt reels (M candidates, K filtered)
// We parse those numbers out for the dashboard.

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

interface CronRun {
  sha: string;
  date: string;
  isCron: boolean;
  added: number | null;
  candidates: number | null;
  filtered: number | null;
  message: string;
  authorName: string;
}

function parseCronMessage(msg: string): { added: number | null; candidates: number | null; filtered: number | null } {
  // "cron: discover N new stunt reels (M candidates, K filtered)"
  const m = /cron:\s*discover\s+(\d+)\s+new\s+stunt\s+reels?(?:\s*\((\d+)\s+candidates?,\s*(\d+)\s+filtered\))?/i.exec(msg);
  if (!m) return { added: null, candidates: null, filtered: null };
  return {
    added: parseInt(m[1], 10),
    candidates: m[2] ? parseInt(m[2], 10) : null,
    filtered: m[3] ? parseInt(m[3], 10) : null,
  };
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
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${encodeURIComponent(STUNT_REELS_PATH)}&per_page=10`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' },
    });
    if (!r.ok) throw new Error(`gh commits failed: ${r.status}`);
    const commits: any[] = await r.json();

    const runs: CronRun[] = commits.map(c => {
      const msg = c.commit?.message || '';
      const isCron = /^cron:/i.test(msg) && /stunt[-\s]reels?/i.test(msg);
      const { added, candidates, filtered } = isCron
        ? parseCronMessage(msg)
        : { added: null, candidates: null, filtered: null };
      return {
        sha: c.sha?.slice(0, 7) || '',
        date: c.commit?.author?.date || c.commit?.committer?.date || '',
        isCron,
        added,
        candidates,
        filtered,
        message: msg.split('\n')[0],
        authorName: c.commit?.author?.name || '',
      };
    });

    const lastCron = runs.find(r => r.isCron);
    const cronCount = runs.filter(r => r.isCron).length;
    return res.status(200).json({
      lastCron: lastCron || null,
      cronCountInRecent: cronCount,
      recentRuns: runs,
    });
  } catch (e: any) {
    console.error('cron-health error:', e);
    return res.status(500).json({ error: e.message });
  }
}
