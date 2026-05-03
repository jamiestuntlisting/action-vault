// Daily cron: discover newly-published stunt-performer demo reels on YouTube
// and append them to src/data/stunt-reels.json in the GitHub repo. The
// Vercel build that follows the commit deploys the new data to production.
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
  if (!r.ok) throw new Error(`youtube search failed: ${r.status} ${await r.text()}`);
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

  // Window: yesterday 00:00 UTC → now (covers the past day plus a small overlap).
  const now = new Date();
  const yesterday = new Date(now.getTime() - 36 * 60 * 60 * 1000);
  yesterday.setUTCHours(0, 0, 0, 0);
  const publishedAfter = yesterday.toISOString();
  const publishedBefore = now.toISOString();

  try {
    // 1. Read current state from GitHub.
    const { data: existing, sha } = await readReelsJsonFromGitHub(ghToken);
    const knownIds = new Set((existing.reels || []).map(r => r.youtubeId));

    // 2. Search YouTube.
    const candidates = new Map<string, any>();
    for (const q of QUERIES) {
      try {
        const items = await ytSearch(ytKey, q, publishedAfter, publishedBefore);
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
        console.warn(`search err for "${q}":`, e.message);
      }
    }

    if (candidates.size === 0) {
      return res.status(200).json({ status: 'ok', added: 0, message: 'no new candidates in window' });
    }

    // 3. Fetch details, classify, keep stunt reels.
    const ids = Array.from(candidates.keys());
    const details = await ytVideoDetails(ytKey, ids);
    const newReels: DiscoveredReel[] = [];
    const dropped: { id: string; title: string; reason: string }[] = [];

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

    if (newReels.length === 0) {
      return res.status(200).json({
        status: 'ok',
        added: 0,
        candidates: candidates.size,
        dropped: dropped.length,
      });
    }

    // 4. Append + write back.
    const updated = {
      ...existing,
      lastUpdatedAt: now.toISOString(),
      reels: [...(existing.reels || []), ...newReels],
    };
    const summary = `discover ${newReels.length} new stunt reel${newReels.length === 1 ? '' : 's'} (${candidates.size} candidates, ${dropped.length} filtered)`;
    await writeReelsJsonToGitHub(ghToken, sha, updated, summary);

    return res.status(200).json({
      status: 'ok',
      added: newReels.length,
      candidates: candidates.size,
      dropped: dropped.length,
      newTitles: newReels.map(r => `${r.channelName} — ${r.title}`),
    });
  } catch (e: any) {
    console.error('cron error:', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
