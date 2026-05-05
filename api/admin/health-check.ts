// GET /api/admin/health-check
// Runs a battery of checks against every backing service the app depends on
// and returns pass/fail status for each. Drives the admin Health Check page.
//
// Checks:
//   1. Auth — POST /api/stuntlisting-auth (bogus creds) → expect 401
//   2. YouTube Data API — small search, expect items
//   3. StuntListing GraphQL — getMyProfile with admin's token
//   4. StuntListing DB — `SELECT 1 FROM user LIMIT 1`
//   5. GitHub PAT — read data/admin-settings.json
//   6. Stunt-reels JSON — count + lastUpdatedAt
//   7. Votes JSON — count
//   8. Cron health — last cron commit timestamp
//
// Admin-only (StuntListing email allowlist).

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const STUNTLISTING_GRAPHQL = 'https://api.stuntlisting.com/graphql';

const ADMIN_EMAILS = [
  'james.northrup@gmail.com',
  'warrenhullstunts@gmail.com',
  'greg@stuntlisting.com',
  'info@stuntlisting.com',
  'jamie@stuntlisting.com',
  'warren@stuntlisting.com',
];

interface CheckResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  detail: string;
  durationMs: number;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T | null; error: any; durationMs: number }> {
  const t0 = Date.now();
  try {
    const result = await fn();
    return { result, error: null, durationMs: Date.now() - t0 };
  } catch (e) {
    return { result: null, error: e, durationMs: Date.now() - t0 };
  }
}

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

  const checks: CheckResult[] = [];
  const overallStart = Date.now();

  // ── 1. Auth proxy responds with 401 to bogus creds ──────────────────────
  {
    // We are SAME-host so use absolute path on this deployment.
    const hostBase = `https://${req.headers.host || 'action-vault-blond.vercel.app'}`;
    const t = await timed(async () => {
      const r = await fetch(`${hostBase}/api/stuntlisting-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'health-check@invalid.test', password: 'invalid' }),
      });
      return r.status;
    });
    if (t.error) {
      checks.push({ name: '/api/stuntlisting-auth reachable', category: 'Auth', status: 'fail', detail: `${t.error.message}`, durationMs: t.durationMs });
    } else if (t.result === 401) {
      checks.push({ name: '/api/stuntlisting-auth reachable', category: 'Auth', status: 'pass', detail: '401 on bogus creds (expected)', durationMs: t.durationMs });
    } else {
      checks.push({ name: '/api/stuntlisting-auth reachable', category: 'Auth', status: 'warn', detail: `unexpected status ${t.result}`, durationMs: t.durationMs });
    }
  }

  // ── 2. YouTube Data API key still works ─────────────────────────────────
  {
    const ytKey = process.env.YOUTUBE_API_KEY;
    if (!ytKey) {
      checks.push({ name: 'YouTube Data API key set', category: 'Cron', status: 'fail', detail: 'YOUTUBE_API_KEY env var missing', durationMs: 0 });
    } else {
      const t = await timed(async () => {
        const r = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=stunt+reel&key=${ytKey}`
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j: any = await r.json();
        return Array.isArray(j.items) ? j.items.length : 0;
      });
      checks.push({
        name: 'YouTube Data API key works',
        category: 'Cron',
        status: t.error ? 'fail' : 'pass',
        detail: t.error ? `${t.error.message}` : `returned ${t.result} item(s) for "stunt reel"`,
        durationMs: t.durationMs,
      });
    }
  }

  // ── 3. StuntListing GraphQL reachable ───────────────────────────────────
  {
    // We've already used `auth` to verify the caller above; reuse it.
    const t = await timed(async () => {
      const r = await fetch(STUNTLISTING_GRAPHQL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
        body: JSON.stringify({ query: `query { getMyProfile { id email } }` }),
      });
      const j: any = await r.json();
      return j?.data?.getMyProfile?.id || null;
    });
    checks.push({
      name: 'StuntListing GraphQL (api.stuntlisting.com)',
      category: 'StuntListing',
      status: t.error || !t.result ? 'fail' : 'pass',
      detail: t.error ? `${t.error.message}` : `getMyProfile returned id=${t.result}`,
      durationMs: t.durationMs,
    });
  }

  // ── 4. StuntListing DB reachable ────────────────────────────────────────
  {
    const dbHost = process.env.STUNTLISTING_DB_HOST;
    if (!dbHost) {
      checks.push({ name: 'StuntListing DB env vars set', category: 'StuntListing', status: 'fail', detail: 'STUNTLISTING_DB_* env vars missing', durationMs: 0 });
    } else {
      const t = await timed(async () => {
        const mysql = require('mysql2/promise');
        const conn = await mysql.createConnection({
          host: dbHost,
          user: process.env.STUNTLISTING_DB_USER,
          password: process.env.STUNTLISTING_DB_PASSWORD,
          database: process.env.STUNTLISTING_DB_NAME,
        });
        try {
          const [rows] = await conn.execute(`SELECT COUNT(*) AS n FROM \`user\``);
          return (rows as any[])[0]?.n;
        } finally {
          await conn.end();
        }
      });
      checks.push({
        name: 'StuntListing DB reachable',
        category: 'StuntListing',
        status: t.error ? 'fail' : 'pass',
        detail: t.error ? `${t.error.message}` : `${t.result} users in user table`,
        durationMs: t.durationMs,
      });
    }
  }

  // ── 5. GitHub PAT can read repo contents ────────────────────────────────
  {
    const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
    if (!ghToken) {
      checks.push({ name: 'GitHub PAT set', category: 'Repo', status: 'fail', detail: 'GITHUB_TOKEN_REPO_WRITE env var missing', durationMs: 0 });
    } else {
      const t = await timed(async () => {
        const r = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/data/admin-settings.json`,
          { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j: any = await r.json();
        return j.size;
      });
      checks.push({
        name: 'GitHub PAT can read repo',
        category: 'Repo',
        status: t.error ? 'fail' : 'pass',
        detail: t.error ? `${t.error.message}` : `read admin-settings.json (${t.result} bytes)`,
        durationMs: t.durationMs,
      });
    }
  }

  // ── 6. Stunt-reels JSON freshness ───────────────────────────────────────
  {
    const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
    const t = await timed(async () => {
      const r = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/src/data/stunt-reels.json`,
        { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j: any = await r.json();
      const data = JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8'));
      return { count: (data.reels || []).length, lastUpdatedAt: data.lastUpdatedAt };
    });
    if (t.error) {
      checks.push({ name: 'Stunt-reels data file', category: 'Data', status: 'fail', detail: `${t.error.message}`, durationMs: t.durationMs });
    } else {
      const ageHours = t.result?.lastUpdatedAt ? (Date.now() - new Date(t.result.lastUpdatedAt).getTime()) / 3.6e6 : null;
      const stale = ageHours != null && ageHours > 36; // cron is daily — flag if >36h old
      checks.push({
        name: 'Stunt-reels data file fresh',
        category: 'Data',
        status: stale ? 'warn' : 'pass',
        detail: `${t.result?.count} reels · last updated ${t.result?.lastUpdatedAt} (${ageHours != null ? `${ageHours.toFixed(1)}h ago` : 'unknown'})`,
        durationMs: t.durationMs,
      });
    }
  }

  // ── 7. Votes JSON ───────────────────────────────────────────────────────
  {
    const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
    const t = await timed(async () => {
      const r = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/data/votes.json`,
        { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j: any = await r.json();
      const data = JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8'));
      return { count: (data.votes || []).length, lastUpdatedAt: data.lastUpdatedAt };
    });
    checks.push({
      name: 'Votes JSON readable',
      category: 'Data',
      status: t.error ? 'fail' : 'pass',
      detail: t.error ? `${t.error.message}` : `${t.result?.count} votes · last updated ${t.result?.lastUpdatedAt}`,
      durationMs: t.durationMs,
    });
  }

  // ── 8. Cron last-run signal ─────────────────────────────────────────────
  {
    const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
    const t = await timed(async () => {
      const r = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=src/data/stunt-reels.json&per_page=10`,
        { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const commits: any[] = await r.json();
      const lastCron = commits.find(c => /^cron:/i.test(c.commit?.message || ''));
      return lastCron ? lastCron.commit.author.date : null;
    });
    if (t.error) {
      checks.push({ name: 'Daily cron heartbeat', category: 'Cron', status: 'fail', detail: `${t.error.message}`, durationMs: t.durationMs });
    } else if (!t.result) {
      checks.push({ name: 'Daily cron heartbeat', category: 'Cron', status: 'warn', detail: 'no cron commits in last 10 commits to stunt-reels.json', durationMs: t.durationMs });
    } else {
      const ageHours = (Date.now() - new Date(t.result).getTime()) / 3.6e6;
      checks.push({
        name: 'Daily cron heartbeat',
        category: 'Cron',
        status: ageHours > 36 ? 'warn' : 'pass',
        detail: `last run ${t.result} (${ageHours.toFixed(1)}h ago)`,
        durationMs: t.durationMs,
      });
    }
  }

  // Summary
  const summary = {
    total: checks.length,
    pass: checks.filter(c => c.status === 'pass').length,
    fail: checks.filter(c => c.status === 'fail').length,
    warn: checks.filter(c => c.status === 'warn').length,
    skip: checks.filter(c => c.status === 'skip').length,
    durationMs: Date.now() - overallStart,
    runAt: new Date().toISOString(),
  };

  return res.status(200).json({ summary, checks });
}
