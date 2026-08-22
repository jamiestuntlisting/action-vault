// Daily cron: discover newly-published stunt-performer demo reels on YouTube
// and append them to src/data/stunt-reels.json in the GitHub repo. The
// Vercel build that follows the commit deploys the new data to production.
//
// Catch-up behaviour: the search window starts from `discoveryCursor` in the
// data file (falling back to `lastUpdatedAt`), not from a fixed "yesterday".
// If the job has been down — an expired token, a bad key, a Vercel outage —
// the backlog is walked forward in one-day chunks, MAX_CHUNKS_PER_RUN at a
// time, so a long gap heals over successive runs instead of being lost.
// The chunk cap exists because YouTube search costs 100 quota units per query
// and the default daily allowance is 10,000; see MAX_CHUNKS_PER_RUN.
//
// Required env vars:
//   YOUTUBE_API_KEY           — YouTube Data API v3 key
//   GITHUB_TOKEN_REPO_WRITE   — fine-grained PAT with `contents: write` on
//                                jamiestuntlisting/action-vault
//   CRON_SECRET               — shared secret; Vercel cron sends this in the
//                                Authorization header automatically
//
// Schedule is configured in vercel.json (`crons` block).

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const FILE_PATH = 'src/data/stunt-reels.json';

const HOUR_MS = 60 * 60 * 1000;
const CHUNK_MS = 24 * HOUR_MS;

// Each chunk costs 8 searches x 100 units + a couple of cheap videos.list
// calls, so ~805 units. Six chunks keeps a normal run under ~4,800 of the
// 10,000/day default, leaving headroom for admin-dispatch, which shares the
// same key. Raise it for a one-off backfill with ?chunks=N.
const MAX_CHUNKS_PER_RUN = 6;
// A full day's 10,000 units buys ~12 chunks; the cap sits above that on
// purpose, because a run that overshoots stops cleanly on the quota error
// and banks the windows it already covered.
const MAX_CHUNKS_HARD_CAP = 20;

// Re-scan a little before the cursor: YouTube's index lags publication, so a
// video can appear in search after the window covering its publishedAt closed.
const OVERLAP_MS = 12 * HOUR_MS;

// Cold start with no cursor at all — the original fixed window.
const DEFAULT_LOOKBACK_MS = 36 * HOUR_MS;

const QUERIES = [
  'stunt reel',
  'stunt demo reel',
  'stuntman reel',
  'stuntwoman reel',
  'stunt performer reel',
  'action reel',
  'fight reel',
  'stunt showreel',
];

// High-precision title patterns. We accept higher false-negative rate to
// avoid polluting the monthly list with hashtag-spam clips, gaming streams,
// and tractor "reels".
const REQUIRED_PHRASES = [
  'stunt reel', 'demo reel', 'action reel', 'showreel', 'show reel',
  'stunt demo', 'stuntman reel', 'stuntwoman reel', 'fight reel',
  'stunt performer reel', 'stunts reel',
];
const REJECT_KEYWORDS = [
  'tractor', 'fishing', 'fyp', 'foryou', 'for you', 'viral', 'trending',
  'shorts', 'shortsfeed', 'anime', 'naruto', 'minato',
  'comedy', 'funny', 'dialogue', 'scene', 'movie scene', 'song',
  'cycle', 'bike reel', 'skating', 'skate', 'dance', 'yoga', 'exercise',
  'react', 'reaction', 'podcast', 'tutorial', 'how to',
  'behind the scenes', 'bts ', 'compilation', 'best stunts',
  'tom cruise', 'mumbai', 'indore', 'free fire', 'minecraft', 'gaming',
];

interface DiscoveredReel {
  youtubeId: string;
  title: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  durationSeconds: number;
  thumbnailUrl: string;
  description: string;
  viewCount: number;
  discoveredAt: string;
  excluded: boolean;
}

interface Window { start: Date; end: Date }

function parseISODuration(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

function classify(title: string, durationSeconds: number): { keep: boolean; reason: string } {
  const t = title.toLowerCase();
  if (durationSeconds > 240 || durationSeconds < 30) {
    return { keep: false, reason: `duration ${durationSeconds}s out of 30-240s range` };
  }
  if ((t.match(/#/g) || []).length >= 3) {
    return { keep: false, reason: 'hashtag spam' };
  }
  for (const kw of REJECT_KEYWORDS) {
    if (t.includes(kw)) return { keep: false, reason: `reject keyword '${kw}'` };
  }
  for (const phrase of REQUIRED_PHRASES) {
    if (t.includes(phrase)) return { keep: true, reason: `phrase '${phrase}'` };
  }
  return { keep: false, reason: 'no required phrase' };
}

// Where to resume from. Prefer the explicit cursor; fall back to the last
// write; fall back again to a fixed lookback on a cold file.
function resolveWindowStart(existing: Record<string, any>, now: Date): Date {
  const raw = existing.discoveryCursor || existing.lastUpdatedAt;
  const t = raw ? Date.parse(raw) : NaN;
  if (!Number.isFinite(t)) return new Date(now.getTime() - DEFAULT_LOOKBACK_MS);
  // Never scan further back than the cursor implies, and never forward of now.
  return new Date(Math.min(t - OVERLAP_MS, now.getTime()));
}

// Split [start, now] into day-sized windows, capped at maxChunks. Day-sized
// matters: search.list returns at most 50 results per query, so a wider
// window would silently truncate the busiest days.
function buildWindows(start: Date, now: Date, maxChunks: number): Window[] {
  const windows: Window[] = [];
  let cursor = start.getTime();
  while (cursor < now.getTime() && windows.length < maxChunks) {
    const end = Math.min(cursor + CHUNK_MS, now.getTime());
    windows.push({ start: new Date(cursor), end: new Date(end) });
    cursor = end;
  }
  return windows;
}

async function ytSearch(apiKey: string, q: string, publishedAfter: string, publishedBefore: string): Promise<any[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.search = new URLSearchParams({
    key: apiKey,
    part: 'snippet',
    type: 'video',
    q,
    publishedAfter,
    publishedBefore,
    videoDuration: 'short',
    maxResults: '50',
    order: 'date',
  }).toString();
  const r = await fetch(url.toString());
  if (!r.ok) {
    const body = await r.text();
    // Quota exhaustion is expected during a long backfill; surface it as a
    // distinct signal so the caller can stop early and keep its progress.
    const err: any = new Error(`youtube search failed: ${r.status} ${body}`);
    err.quotaExceeded = r.status === 403 && /quota/i.test(body);
    throw err;
  }
  const j: any = await r.json();
  return j.items || [];
}

async function ytVideoDetails(apiKey: string, ids: string[]): Promise<Record<string, any>> {
  const out: Record<string, any> = {};
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.search = new URLSearchParams({
      key: apiKey,
      part: 'contentDetails,snippet,statistics',
      id: batch.join(','),
    }).toString();
    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`youtube videos failed: ${r.status}`);
    const j: any = await r.json();
    for (const it of j.items || []) {
      out[it.id] = {
        durationSeconds: parseISODuration(it.contentDetails?.duration || ''),
        description: (it.snippet?.description || '').slice(0, 800),
        viewCount: parseInt(it.statistics?.viewCount || '0'),
      };
    }
  }
  return out;
}

// Fail fast and legibly on a dead credential. This job spent 79 days in mid
// 2026 burning YouTube quota every morning and dying on the final write
// because an expired PAT only announced itself at the last step.
async function assertGitHubCredential(token: string): Promise<void> {
  const r = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (r.status === 401) {
    throw new Error(
      'CREDENTIAL FAILURE: GITHUB_TOKEN_REPO_WRITE is expired or revoked (401 Bad credentials). ' +
      'Rotate it at https://github.com/settings/personal-access-tokens and update the Vercel env var.'
    );
  }
  if (!r.ok) {
    console.warn(`github repo check returned ${r.status}; continuing`);
    return;
  }
  const j: any = await r.json();
  // A permissionless fine-grained PAT can still read a public repo, so a
  // successful read proves nothing about write access. Check explicitly.
  if (j?.permissions && j.permissions.push !== true) {
    throw new Error(
      'CREDENTIAL FAILURE: GITHUB_TOKEN_REPO_WRITE cannot write to ' +
      `${REPO_OWNER}/${REPO_NAME} (no push permission). Grant the repo ` +
      '"Contents: Read and write" and make sure the repo is selected under Repository access.'
    );
  }
}

async function readReelsJsonFromGitHub(token: string): Promise<{ data: { reels: DiscoveredReel[] } & Record<string, any>; sha: string }> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) throw new Error(`github read failed: ${r.status} ${await r.text()}`);
  const j: any = await r.json();
  const content = Buffer.from(j.content, 'base64').toString('utf-8');
  return { data: JSON.parse(content), sha: j.sha };
}

async function writeReelsJsonToGitHub(token: string, sha: string, data: any, summary: string): Promise<void> {
  const body = JSON.stringify(data, null, 2) + '\n';
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `cron: ${summary}\n\nAutomated daily YouTube stunt-reel discovery.`,
        content: Buffer.from(body, 'utf-8').toString('base64'),
        sha,
        committer: { name: 'action-vault cron', email: 'noreply@stuntlisting.com' },
      }),
    }
  );
  if (!r.ok) throw new Error(`github write failed: ${r.status} ${await r.text()}`);
}

export default async function handler(req: any, res: any) {
  // Vercel cron uses GET; reject other methods. Also allow manual POST trigger
  // for debugging if a `secret` query param matches.
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization || '';
    const ok = auth === `Bearer ${cronSecret}` || req.query?.secret === cronSecret;
    if (!ok) return res.status(401).json({ error: 'Unauthorized' });
  }

  const ytKey = process.env.YOUTUBE_API_KEY;
  const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
  if (!ytKey || !ghToken) {
    return res.status(500).json({ error: 'Missing YOUTUBE_API_KEY or GITHUB_TOKEN_REPO_WRITE' });
  }

  // Callers past the secret check are trusted, so allow a bigger bite for a
  // deliberate backfill: ?chunks=20.
  const requested = parseInt(String(req.query?.chunks ?? ''), 10);
  const maxChunks = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), MAX_CHUNKS_HARD_CAP)
    : MAX_CHUNKS_PER_RUN;

  const now = new Date();

  try {
    // 0. Prove the credential before spending YouTube quota on it.
    await assertGitHubCredential(ghToken);

    // 1. Read current state from GitHub.
    const { data: existing, sha } = await readReelsJsonFromGitHub(ghToken);
    const knownIds = new Set((existing.reels || []).map(r => r.youtubeId));

    // 2. Work out how far behind we are and carve the gap into day chunks.
    const windowStart = resolveWindowStart(existing, now);
    const windows = buildWindows(windowStart, now, maxChunks);
    if (windows.length === 0) {
      return res.status(200).json({ status: 'ok', added: 0, message: 'cursor is current' });
    }
    const backlogDays = Math.max(0, (now.getTime() - windowStart.getTime()) / CHUNK_MS);

    // 3. Search YouTube, one day-window at a time.
    const candidates = new Map<string, any>();
    let covered = windowStart;
    let quotaExceeded = false;

    outer: for (const w of windows) {
      for (const q of QUERIES) {
        try {
          const items = await ytSearch(ytKey, q, w.start.toISOString(), w.end.toISOString());
          for (const it of items) {
            const vid = it.id?.videoId;
            if (!vid || candidates.has(vid) || knownIds.has(vid)) continue;
            candidates.set(vid, {
              youtubeId: vid,
              title: it.snippet.title,
              channelName: it.snippet.channelTitle,
              channelId: it.snippet.channelId,
              publishedAt: it.snippet.publishedAt,
              thumbnailUrl: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.medium?.url || '',
            });
          }
        } catch (e: any) {
          if (e.quotaExceeded) {
            // Stop here and keep the ground already covered; the next run
            // resumes from `covered` rather than redoing this window.
            console.warn('youtube quota exhausted; banking progress and stopping');
            quotaExceeded = true;
            break outer;
          }
          console.warn(`search err for "${q}" in ${w.start.toISOString()}:`, e.message);
        }
      }
      covered = w.end;
    }

    // 4. Fetch details, classify, keep stunt reels.
    const newReels: DiscoveredReel[] = [];
    const dropped: { id: string; title: string; reason: string }[] = [];

    if (candidates.size > 0) {
      const details = await ytVideoDetails(ytKey, Array.from(candidates.keys()));
      for (const [vid, c] of candidates.entries()) {
        const d = details[vid] || { durationSeconds: 0, description: '', viewCount: 0 };
        const cls = classify(c.title, d.durationSeconds);
        if (!cls.keep) {
          dropped.push({ id: vid, title: c.title.slice(0, 60), reason: cls.reason });
          continue;
        }
        newReels.push({
          ...c,
          durationSeconds: d.durationSeconds,
          description: d.description,
          viewCount: d.viewCount,
          discoveredAt: now.toISOString(),
          excluded: false,
        });
      }
    }

    // 5. Persist. While catching up we must write even on an empty haul, or
    // the cursor never advances and the backlog is rescanned forever.
    const caughtUp = covered.getTime() >= now.getTime() - CHUNK_MS;
    const remainingDays = Math.max(0, (now.getTime() - covered.getTime()) / CHUNK_MS);
    // If quota died on the very first window there is no progress to bank,
    // and an empty commit would just churn a deploy for nothing.
    const advanced = covered.getTime() > windowStart.getTime();

    if (newReels.length === 0 && (caughtUp || !advanced)) {
      return res.status(200).json({
        status: 'ok',
        added: 0,
        candidates: candidates.size,
        dropped: dropped.length,
        backlogDays: Math.round(backlogDays * 10) / 10,
        quotaExceeded,
      });
    }

    const windowLabel = `${windows[0].start.toISOString().slice(0, 10)} → ${covered.toISOString().slice(0, 10)}`;
    const summary = newReels.length > 0
      ? `discover ${newReels.length} new stunt reel${newReels.length === 1 ? '' : 's'} (${candidates.size} candidates, ${dropped.length} filtered)`
        + (caughtUp ? '' : ` [backfill ${windowLabel}, ${Math.ceil(remainingDays)}d remaining]`)
      : `backfill ${windowLabel}, no new reels (${Math.ceil(remainingDays)}d remaining)`;

    const updated = {
      ...existing,
      lastUpdatedAt: now.toISOString(),
      discoveryCursor: covered.toISOString(),
      reels: [...(existing.reels || []), ...newReels],
    };
    await writeReelsJsonToGitHub(ghToken, sha, updated, summary);

    return res.status(200).json({
      status: 'ok',
      added: newReels.length,
      candidates: candidates.size,
      dropped: dropped.length,
      windowsScanned: windows.length,
      coveredThrough: covered.toISOString(),
      backlogDaysRemaining: Math.round(remainingDays * 10) / 10,
      quotaExceeded,
      newTitles: newReels.map(r => `${r.channelName} — ${r.title}`),
    });
  } catch (e: any) {
    console.error('cron error:', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
