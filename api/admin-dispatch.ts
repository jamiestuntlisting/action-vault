// Consolidated admin endpoint dispatcher.
//
// Vercel's Hobby plan caps a deployment at 12 serverless functions. Each
// `api/**/*.ts` file counts as one. We had separate files for every admin
// endpoint, which pushed us over. This single dynamic route handles all of
// them — the URL paths the client uses are unchanged because Vercel's
// `[action]` catch-all matches /api/admin/<anything>.
//
// Actions:
//   GET  /api/admin/voting-results
//   GET  /api/admin/match-stunt-reels?scope=month|all
//   GET  /api/admin/stunt-reel-overrides
//   POST /api/admin/stunt-reel-overrides            { youtubeId, stuntListingId? }
//   POST /api/admin/exclude-stunt-reel              { youtubeId, excluded }
//   GET  /api/admin/cron-health
//   GET  /api/admin/search-stuntlisting-users?q=…
//   POST /api/admin/global-settings                 { settings: { ... } }
//   GET  /api/admin/health-check
//
// All actions require a valid StuntListing access_token in
// `Authorization: Bearer <token>` AND an email in the admin allowlist.

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const STUNT_REELS_PATH = 'src/data/stunt-reels.json';
const VOTES_PATH = 'data/votes.json';
const OVERRIDES_PATH = 'data/stunt-reel-overrides.json';
const ADMIN_SETTINGS_PATH = 'data/admin-settings.json';
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

// ─── Shared helpers ─────────────────────────────────────────────────────

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

async function readJsonFromRepo(ghToken: string, path: string): Promise<{ data: any; sha: string }> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) throw new Error(`gh read ${path} failed: ${r.status}`);
  const j: any = await r.json();
  return { data: JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8')), sha: j.sha };
}

async function writeJsonToRepo(ghToken: string, path: string, sha: string, data: any, msg: string): Promise<void> {
  const body = JSON.stringify(data, null, 2) + '\n';
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        content: Buffer.from(body, 'utf-8').toString('base64'),
        sha,
        committer: { name: 'action-vault admin', email: 'noreply@stuntlisting.com' },
      }),
    }
  );
  if (!r.ok) throw new Error(`gh write ${path} failed: ${r.status} ${await r.text()}`);
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

function videoIdFromUrl(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

async function withDb<T>(fn: (conn: any) => Promise<T>): Promise<T> {
  const host = process.env.STUNTLISTING_DB_HOST;
  if (!host) {
    const err: any = new Error('StuntListing DB not configured: STUNTLISTING_DB_HOST is unset on Vercel.');
    err.code = 'EMISSINGENV';
    throw err;
  }
  const mysql = require('mysql2/promise');
  let conn: any;
  try {
    conn = await mysql.createConnection({
      host,
      user: process.env.STUNTLISTING_DB_USER,
      password: process.env.STUNTLISTING_DB_PASSWORD,
      database: process.env.STUNTLISTING_DB_NAME,
      // Fail fast on DNS / connect issues so the admin UI gets a quick
      // error rather than a 30s hung lambda.
      connectTimeout: 8000,
    });
  } catch (e: any) {
    const code = e?.code || '';
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
      const err: any = new Error(
        `StuntListing DB host "${host}" not resolvable. The RDS endpoint may have changed — update STUNTLISTING_DB_HOST on Vercel.`
      );
      err.code = code;
      throw err;
    }
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
      const err: any = new Error(
        `StuntListing DB at ${host} unreachable (${code}). Check the RDS security group allows Vercel egress.`
      );
      err.code = code;
      throw err;
    }
    if (code === 'ER_ACCESS_DENIED_ERROR') {
      const err: any = new Error(`StuntListing DB credentials rejected — check STUNTLISTING_DB_USER / _PASSWORD.`);
      err.code = code;
      throw err;
    }
    throw e;
  }
  try { return await fn(conn); } finally { try { await conn.end(); } catch {} }
}

// ─── Action handlers ────────────────────────────────────────────────────

async function actionVotingResults(req: any, res: any, _profile: any, ghToken: string) {
  const { data } = await readJsonFromRepo(ghToken, VOTES_PATH);
  const votes = (data.votes || []) as any[];

  // Pivot by entry → reel (kept for back-compat) AND by entry → voter
  // (new primary view: Jamie wants to see voting results by person name,
  // not by reel id).
  const byEntry: Record<string, Record<string, any>> = {};
  const byEntryByVoter: Record<string, Record<string, any>> = {};

  for (const v of votes) {
    byEntry[v.entryId] = byEntry[v.entryId] || {};
    const bucket = (byEntry[v.entryId][v.reelId] = byEntry[v.entryId][v.reelId] || {
      reelId: v.reelId, count: 0, sum: 0, voters: [],
    });
    bucket.count += 1;
    bucket.sum += v.rating;
    bucket.voters.push({
      userId: v.userId, userName: v.userName, userEmail: v.userEmail,
      alias: v.alias, unionStatus: v.unionStatus, rating: v.rating, updatedAt: v.updatedAt,
    });

    byEntryByVoter[v.entryId] = byEntryByVoter[v.entryId] || {};
    const voterKey = String(v.userId ?? v.userEmail ?? v.userName);
    const voter = (byEntryByVoter[v.entryId][voterKey] = byEntryByVoter[v.entryId][voterKey] || {
      userId: v.userId,
      userName: v.userName,
      userEmail: v.userEmail,
      alias: v.alias,
      unionStatus: v.unionStatus,
      votes: [],
      sum: 0,
      lastUpdatedAt: v.updatedAt,
    });
    voter.votes.push({ reelId: v.reelId, rating: v.rating, updatedAt: v.updatedAt });
    voter.sum += v.rating;
    if (!voter.lastUpdatedAt || (v.updatedAt && v.updatedAt > voter.lastUpdatedAt)) {
      voter.lastUpdatedAt = v.updatedAt;
    }
  }

  const entries = Object.entries(byEntry).map(([entryId, reels]) => {
    const reelList = Object.values(reels)
      .map((r: any) => ({ ...r, average: r.count > 0 ? Math.round((r.sum / r.count) * 100) / 100 : 0 }))
      .sort((a: any, b: any) => b.average - a.average || b.count - a.count);
    const voters = Object.values(byEntryByVoter[entryId] || {})
      .map((v: any) => ({
        ...v,
        averageRating: v.votes.length ? Math.round((v.sum / v.votes.length) * 100) / 100 : 0,
        votes: v.votes
          .slice()
          .sort((a: any, b: any) => b.rating - a.rating || String(a.reelId).localeCompare(String(b.reelId))),
      }))
      // Sort voters alphabetically by name (the explicit ask: "by person name").
      .sort((a: any, b: any) =>
        String(a.userName || '').localeCompare(String(b.userName || ''), undefined, { sensitivity: 'base' })
      );
    return {
      entryId,
      totalVotes: reelList.reduce((acc: number, r: any) => acc + r.count, 0),
      uniqueVoters: new Set(votes.filter(v => v.entryId === entryId).map(v => v.userId)).size,
      reels: reelList,
      voters,
    };
  });
  return res.status(200).json({ lastUpdatedAt: data.lastUpdatedAt, totalVotes: votes.length, entries });
}

async function actionMatchStuntReels(req: any, res: any, profile: any, ghToken: string) {
  const reelsData = (await readJsonFromRepo(ghToken, STUNT_REELS_PATH)).data;
  const overridesData = (await readJsonFromRepo(ghToken, OVERRIDES_PATH)).data;
  const overridesByYoutubeId = new Map<string, any>();
  for (const o of overridesData.overrides || []) overridesByYoutubeId.set(o.youtubeId, o);

  const scope: 'month' | 'all' = req.query?.scope === 'all' ? 'all' : 'month';
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const targetReels = (reelsData.reels || []).filter((r: any) => {
    if (scope === 'all') return true;
    return (r.publishedAt || '').startsWith(monthKey);
  });

  return await withDb(async (conn) => {
    async function searchByName(name: string): Promise<any[]> {
      if (!name || name.trim().length < 3) return [];
      const [rows] = await conn.execute(
        `SELECT id, alias, first_name, last_name, instagram FROM \`user\` WHERE fullTextSearch LIKE ? ORDER BY id ASC LIMIT 5`,
        [`%${name.trim()}%`]
      );
      return rows;
    }
    async function getUserById(id: number): Promise<any | null> {
      const [rows] = await conn.execute(
        `SELECT id, alias, first_name, last_name, instagram FROM \`user\` WHERE id = ? LIMIT 1`,
        [id]
      );
      return rows[0] || null;
    }
    async function getStuntReelsForUser(userId: number): Promise<any[]> {
      const [rows] = await conn.execute(
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

      if (override?.stuntListingId) {
        const user = await getUserById(Number(override.stuntListingId));
        if (user) {
          const userReels = await getStuntReelsForUser(user.id);
          const onProfile = userReels.some((sr: any) => videoIdFromUrl(sr.reel_url) === youtubeId);
          matches.push({
            youtubeId, title: reel.title, thumbnailUrl: reel.thumbnailUrl,
            channelName: reel.channelName, publishedAt: reel.publishedAt,
            excluded: !!reel.excluded, override: true, searchedNames: Array.from(candidateNames),
            email: override?.email || null,
            match: {
              id: user.id, alias: user.alias,
              firstName: user.first_name, lastName: user.last_name,
              instagram: user.instagram || null,
              profileUrl: STUNTLISTING_PROFILE_BASE + (user.alias || ''),
              reelOnProfile: onProfile,
            },
            fallbackSearchUrl: null,
          });
          continue;
        }
      }

      const seen = new Set<number>();
      const allHits: any[] = [];
      for (const name of candidateNames) {
        try {
          const hits = await searchByName(name);
          for (const h of hits) if (h?.id && !seen.has(h.id)) { seen.add(h.id); allHits.push(h); }
        } catch {}
        if (allHits.length >= 5) break;
      }
      const top = allHits[0];
      let match: any = null;
      let fallbackSearchUrl: string | null = null;
      if (top) {
        const userReels = await getStuntReelsForUser(top.id);
        const onProfile = userReels.some((sr: any) => videoIdFromUrl(sr.reel_url) === youtubeId);
        match = {
          id: top.id, alias: top.alias,
          firstName: top.first_name, lastName: top.last_name,
          instagram: top.instagram || null,
          profileUrl: STUNTLISTING_PROFILE_BASE + (top.alias || ''),
          reelOnProfile: onProfile,
        };
      } else {
        const seed = (parsed || reel.channelName || '').replace(/\s+/g, '_');
        if (seed) fallbackSearchUrl = STUNTLISTING_SEARCH_BASE + encodeURIComponent(seed);
      }
      matches.push({
        youtubeId, title: reel.title, thumbnailUrl: reel.thumbnailUrl,
        channelName: reel.channelName, publishedAt: reel.publishedAt,
        excluded: !!reel.excluded, override: false, searchedNames: Array.from(candidateNames),
        email: override?.email || null,
        match, fallbackSearchUrl,
        otherCandidates: allHits.slice(1, 5).map((h: any) => ({
          id: h.id, alias: h.alias, firstName: h.first_name, lastName: h.last_name,
        })),
      });
    }
    return res.status(200).json({ scope, generatedAt: now.toISOString(), total: matches.length, matches });
  });
}

async function actionStuntReelOverrides(req: any, res: any, profile: any, ghToken: string) {
  if (req.method === 'GET') {
    const { data } = await readJsonFromRepo(ghToken, OVERRIDES_PATH);
    return res.status(200).json(data);
  }
  // POST. Body fields are independent — pass any subset:
  //   stuntListingId?: number   → set/clear matched StuntListing user
  //   email?: string            → contact email (used by the
  //                                Not-on-StuntListing admin page)
  // The override entry is removed entirely when both stuntListingId
  // and email are empty.
  const body = req.body || {};
  const { youtubeId, stuntListingId, email } = body;
  if (!youtubeId) return res.status(400).json({ error: 'youtubeId required' });
  const stuntListingIdProvided = Object.prototype.hasOwnProperty.call(body, 'stuntListingId');
  const emailProvided = Object.prototype.hasOwnProperty.call(body, 'email');
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, sha } = await readJsonFromRepo(ghToken, OVERRIDES_PATH);
      const all = (data.overrides || []) as any[];
      const prev = all.find((o: any) => o.youtubeId === youtubeId) || {};
      const rest = all.filter((o: any) => o.youtubeId !== youtubeId);
      const id = stuntListingIdProvided ? Number(stuntListingId) || 0 : (prev.stuntListingId || 0);
      const finalEmail = emailProvided ? (typeof email === 'string' ? email.trim() : '') : (prev.email || '');
      const merged: any = {
        youtubeId,
        setBy: profile.email,
        setAt: new Date().toISOString(),
      };
      if (id > 0) merged.stuntListingId = id;
      if (finalEmail) merged.email = finalEmail;

      const drop = !merged.stuntListingId && !merged.email;
      const updated = drop
        ? { ...data, lastUpdatedAt: new Date().toISOString(), overrides: rest }
        : { ...data, lastUpdatedAt: new Date().toISOString(), overrides: [...rest, merged] };
      const parts: string[] = [];
      if (stuntListingIdProvided) parts.push(id > 0 ? `id=${id}` : 'clear-id');
      if (emailProvided) parts.push(finalEmail ? `email=${finalEmail}` : 'clear-email');
      const summary = `${youtubeId}: ${parts.join(', ') || 'noop'} (by ${profile.email})`;
      await writeJsonToRepo(ghToken, OVERRIDES_PATH, sha, updated, `override: ${summary}`);
      return res.status(200).json({ status: 'ok', overrides: updated.overrides });
    } catch (e: any) {
      if (attempt === 0 && /409|sha/i.test(e.message)) continue;
      throw e;
    }
  }
  return res.status(500).json({ error: 'retry exhausted' });
}

async function actionExcludeStuntReel(req: any, res: any, profile: any, ghToken: string) {
  const { youtubeId, excluded } = req.body || {};
  if (!youtubeId || typeof excluded !== 'boolean') {
    return res.status(400).json({ error: 'youtubeId + excluded (boolean) required' });
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, sha } = await readJsonFromRepo(ghToken, STUNT_REELS_PATH);
      const reels = (data.reels || []) as any[];
      const idx = reels.findIndex(r => r.youtubeId === youtubeId);
      if (idx < 0) return res.status(404).json({ error: 'Reel not found' });
      if (!!reels[idx].excluded === excluded) {
        return res.status(200).json({ status: 'noop', youtubeId, excluded });
      }
      const updatedReels = [...reels];
      updatedReels[idx] = { ...reels[idx], excluded, excludedBy: profile.email, excludedAt: new Date().toISOString() };
      const updated = { ...data, lastUpdatedAt: new Date().toISOString(), reels: updatedReels };
      await writeJsonToRepo(ghToken, STUNT_REELS_PATH, sha, updated,
        `admin: ${excluded ? 'exclude' : 'include'} ${youtubeId} (by ${profile.email})`);
      return res.status(200).json({ status: 'ok', youtubeId, excluded });
    } catch (e: any) {
      if (attempt === 0 && /409|sha/i.test(e.message)) continue;
      throw e;
    }
  }
  return res.status(500).json({ error: 'retry exhausted' });
}

async function actionCronHealth(req: any, res: any, _profile: any, ghToken: string) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${encodeURIComponent(STUNT_REELS_PATH)}&per_page=10`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`gh commits failed: ${r.status}`);
  const commits: any[] = await r.json();
  const runs = commits.map(c => {
    const msg = c.commit?.message || '';
    const isCron = /^cron:/i.test(msg) && /stunt[-\s]reels?/i.test(msg);
    let added: number | null = null, candidates: number | null = null, filtered: number | null = null;
    if (isCron) {
      const m = /cron:\s*discover\s+(\d+)\s+new\s+stunt\s+reels?(?:\s*\((\d+)\s+candidates?,\s*(\d+)\s+filtered\))?/i.exec(msg);
      if (m) { added = parseInt(m[1]); candidates = m[2] ? parseInt(m[2]) : null; filtered = m[3] ? parseInt(m[3]) : null; }
    }
    return {
      sha: (c.sha || '').slice(0, 7),
      date: c.commit?.author?.date || c.commit?.committer?.date || '',
      isCron, added, candidates, filtered,
      message: msg.split('\n')[0],
      authorName: c.commit?.author?.name || '',
    };
  });
  const lastCron = runs.find(r => r.isCron);
  return res.status(200).json({
    lastCron: lastCron || null,
    cronCountInRecent: runs.filter(r => r.isCron).length,
    recentRuns: runs,
  });
}

async function actionSearchStuntListingUsers(req: any, res: any) {
  const q = (req.query?.q || '').trim();
  if (q.length < 2) return res.status(400).json({ error: 'q must be 2+ chars' });
  return await withDb(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, alias, first_name, last_name, instagram
         FROM \`user\` WHERE fullTextSearch LIKE ? ORDER BY id ASC LIMIT 10`,
      [`%${q}%`]
    );
    return res.status(200).json({
      query: q,
      results: (rows as any[]).map(r => ({
        id: r.id, alias: r.alias,
        firstName: r.first_name, lastName: r.last_name,
        instagram: r.instagram || null,
      })),
    });
  });
}

async function actionGlobalSettings(req: any, res: any, profile: any, ghToken: string) {
  const patch = req.body?.settings;
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return res.status(400).json({ error: '`settings` (object) required' });
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, sha } = await readJsonFromRepo(ghToken, ADMIN_SETTINGS_PATH);
      const merged = { ...(data.settings || {}), ...patch };
      const updated = { ...data, lastUpdatedAt: new Date().toISOString(), settings: merged };
      const summary = `${profile.email} updated ${Object.keys(patch).join(', ')}`;
      await writeJsonToRepo(ghToken, ADMIN_SETTINGS_PATH, sha, updated, `admin-settings: ${summary}`);
      return res.status(200).json({ status: 'ok', settings: merged });
    } catch (e: any) {
      if (attempt === 0 && /409|sha/i.test(e.message)) continue;
      throw e;
    }
  }
  return res.status(500).json({ error: 'retry exhausted' });
}

async function actionHealthCheck(req: any, res: any, _profile: any, ghToken: string) {
  interface CheckResult { name: string; category: string; status: 'pass' | 'fail' | 'warn' | 'skip'; detail: string; durationMs: number; }
  async function timed<T>(fn: () => Promise<T>) {
    const t0 = Date.now();
    try { return { result: await fn(), error: null as any, durationMs: Date.now() - t0 }; }
    catch (e) { return { result: null as T | null, error: e, durationMs: Date.now() - t0 }; }
  }
  const checks: CheckResult[] = [];
  const t0 = Date.now();
  const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const hostBase = `https://${req.headers.host || 'action-vault-blond.vercel.app'}`;

  // Auth
  {
    const t = await timed(async () => {
      const r = await fetch(`${hostBase}/api/stuntlisting-auth`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'health@invalid.test', password: 'invalid' }),
      });
      return r.status;
    });
    checks.push({
      name: '/api/stuntlisting-auth reachable', category: 'Auth',
      status: t.error ? 'fail' : (t.result === 401 ? 'pass' : 'warn'),
      detail: t.error ? `${t.error.message}` : (t.result === 401 ? '401 on bogus creds (expected)' : `unexpected status ${t.result}`),
      durationMs: t.durationMs,
    });
  }
  // YouTube
  {
    const ytKey = process.env.YOUTUBE_API_KEY;
    if (!ytKey) checks.push({ name: 'YouTube Data API key set', category: 'Cron', status: 'fail', detail: 'YOUTUBE_API_KEY missing', durationMs: 0 });
    else {
      const t = await timed(async () => {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=stunt+reel&key=${ytKey}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j: any = await r.json();
        return Array.isArray(j.items) ? j.items.length : 0;
      });
      checks.push({
        name: 'YouTube Data API key works', category: 'Cron',
        status: t.error ? 'fail' : 'pass',
        detail: t.error ? `${t.error.message}` : `returned ${t.result} item(s)`,
        durationMs: t.durationMs,
      });
    }
  }
  // GraphQL
  {
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
      name: 'StuntListing GraphQL', category: 'StuntListing',
      status: (t.error || !t.result) ? 'fail' : 'pass',
      detail: t.error ? `${t.error.message}` : `getMyProfile id=${t.result}`,
      durationMs: t.durationMs,
    });
  }
  // DB
  {
    if (!process.env.STUNTLISTING_DB_HOST) {
      checks.push({ name: 'StuntListing DB env vars', category: 'StuntListing', status: 'fail', detail: 'STUNTLISTING_DB_* missing', durationMs: 0 });
    } else {
      const t = await timed(async () => withDb(async (conn) => {
        const [rows] = await conn.execute(`SELECT COUNT(*) AS n FROM \`user\``);
        return (rows as any[])[0]?.n;
      }));
      checks.push({
        name: 'StuntListing DB reachable', category: 'StuntListing',
        status: t.error ? 'fail' : 'pass',
        detail: t.error ? `${t.error.message}` : `${t.result} users in user table`,
        durationMs: t.durationMs,
      });
    }
  }
  // GitHub PAT
  {
    const t = await timed(async () => {
      const r = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${ADMIN_SETTINGS_PATH}`,
        { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j: any = await r.json();
      return j.size;
    });
    checks.push({
      name: 'GitHub PAT can read repo', category: 'Repo',
      status: t.error ? 'fail' : 'pass',
      detail: t.error ? `${t.error.message}` : `read admin-settings.json (${t.result} bytes)`,
      durationMs: t.durationMs,
    });
  }
  // Stunt-reels JSON freshness
  {
    const t = await timed(async () => readJsonFromRepo(ghToken, STUNT_REELS_PATH));
    if (t.error) checks.push({ name: 'Stunt-reels data file', category: 'Data', status: 'fail', detail: `${t.error.message}`, durationMs: t.durationMs });
    else {
      const ageHours = t.result?.data?.lastUpdatedAt ? (Date.now() - new Date(t.result.data.lastUpdatedAt).getTime()) / 3.6e6 : null;
      const stale = ageHours != null && ageHours > 36;
      checks.push({
        name: 'Stunt-reels data file fresh', category: 'Data',
        status: stale ? 'warn' : 'pass',
        detail: `${(t.result?.data?.reels || []).length} reels · last updated ${t.result?.data?.lastUpdatedAt} (${ageHours != null ? `${ageHours.toFixed(1)}h ago` : 'unknown'})`,
        durationMs: t.durationMs,
      });
    }
  }
  // Votes JSON
  {
    const t = await timed(async () => readJsonFromRepo(ghToken, VOTES_PATH));
    checks.push({
      name: 'Votes JSON readable', category: 'Data',
      status: t.error ? 'fail' : 'pass',
      detail: t.error ? `${t.error.message}` : `${(t.result?.data?.votes || []).length} votes · last updated ${t.result?.data?.lastUpdatedAt}`,
      durationMs: t.durationMs,
    });
  }
  // Cron heartbeat
  {
    const t = await timed(async () => {
      const r = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${encodeURIComponent(STUNT_REELS_PATH)}&per_page=10`,
        { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const commits: any[] = await r.json();
      const lastCron = commits.find(c => /^cron:/i.test(c.commit?.message || ''));
      return lastCron ? lastCron.commit.author.date : null;
    });
    if (t.error) checks.push({ name: 'Daily cron heartbeat', category: 'Cron', status: 'fail', detail: `${t.error.message}`, durationMs: t.durationMs });
    else if (!t.result) checks.push({ name: 'Daily cron heartbeat', category: 'Cron', status: 'warn', detail: 'no cron commits in last 10 commits', durationMs: t.durationMs });
    else {
      const ageHours = (Date.now() - new Date(t.result).getTime()) / 3.6e6;
      checks.push({
        name: 'Daily cron heartbeat', category: 'Cron',
        status: ageHours > 36 ? 'warn' : 'pass',
        detail: `last run ${t.result} (${ageHours.toFixed(1)}h ago)`,
        durationMs: t.durationMs,
      });
    }
  }
  const summary = {
    total: checks.length,
    pass: checks.filter(c => c.status === 'pass').length,
    fail: checks.filter(c => c.status === 'fail').length,
    warn: checks.filter(c => c.status === 'warn').length,
    skip: checks.filter(c => c.status === 'skip').length,
    durationMs: Date.now() - t0,
    runAt: new Date().toISOString(),
  };
  return res.status(200).json({ summary, checks });
}

// ─── Dispatcher ─────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  const profile = await getMyProfile(auth);
  if (!profile) return res.status(401).json({ error: 'Invalid token' });
  if (!ADMIN_EMAILS.includes((profile.email || '').toLowerCase())) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
  if (!ghToken) return res.status(500).json({ error: 'Server not configured (GITHUB_TOKEN_REPO_WRITE)' });

  const action = (req.query?.action || '').toString();
  try {
    switch (action) {
      case 'voting-results':
        if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
        return await actionVotingResults(req, res, profile, ghToken);
      case 'match-stunt-reels':
        if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
        return await actionMatchStuntReels(req, res, profile, ghToken);
      case 'stunt-reel-overrides':
        if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });
        return await actionStuntReelOverrides(req, res, profile, ghToken);
      case 'exclude-stunt-reel':
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
        return await actionExcludeStuntReel(req, res, profile, ghToken);
      case 'cron-health':
        if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
        return await actionCronHealth(req, res, profile, ghToken);
      case 'search-stuntlisting-users':
        if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
        return await actionSearchStuntListingUsers(req, res);
      case 'global-settings':
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
        return await actionGlobalSettings(req, res, profile, ghToken);
      case 'health-check':
        if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
        return await actionHealthCheck(req, res, profile, ghToken);
      default:
        return res.status(404).json({ error: `Unknown admin action: ${action}` });
    }
  } catch (e: any) {
    console.error(`admin/${action} error:`, e);
    return res.status(500).json({ error: e.message });
  }
}
