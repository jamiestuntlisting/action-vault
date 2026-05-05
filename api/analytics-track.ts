// Receives batched analytics events from the AnalyticsService client.
// Writes to MySQL when STUNTLISTING_DB_HOST is reachable; otherwise
// falls back to data/analytics-events.json in the GitHub repo (rolling
// 5000-event circular buffer) so the admin Activity page has data
// even while the RDS env var is broken.

const REPO_OWNER = 'jamiestuntlisting';
const REPO_NAME = 'action-vault';
const ANALYTICS_PATH = 'data/analytics-events.json';
const ANALYTICS_BUFFER_LIMIT = 5000;

async function readJsonFromRepo(ghToken: string, path: string): Promise<{ data: any; sha: string | null }> {
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  if (r.status === 404) return { data: { schemaVersion: 1, events: [] }, sha: null };
  if (!r.ok) throw new Error(`gh read ${path} failed: ${r.status}`);
  const j: any = await r.json();
  return {
    data: JSON.parse(Buffer.from(j.content, 'base64').toString('utf-8')),
    sha: j.sha,
  };
}

async function writeJsonToRepo(ghToken: string, path: string, sha: string | null, data: any, msg: string): Promise<void> {
  const body = JSON.stringify(data, null, 2) + '\n';
  const r = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        content: Buffer.from(body, 'utf-8').toString('base64'),
        ...(sha ? { sha } : {}),
        committer: { name: 'action-vault analytics', email: 'noreply@stuntlisting.com' },
      }),
    }
  );
  if (!r.ok) throw new Error(`gh write ${path} failed: ${r.status} ${await r.text()}`);
}

async function appendEventsToGithub(ghToken: string, batch: any[], userId: string, userEmail: string) {
  // SHA-conflict retry — concurrent batches from different users would
  // otherwise stomp each other.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, sha } = await readJsonFromRepo(ghToken, ANALYTICS_PATH);
      const existing = (data.events || []) as any[];
      const newEvents = batch.map((e: any) => ({
        userId,
        userEmail,
        eventType: e.eventType || 'unknown',
        eventData: e.eventData || {},
        sessionId: e.sessionId || null,
        timestamp: e.timestamp || new Date().toISOString(),
      }));
      const combined = [...existing, ...newEvents];
      // Trim the oldest events when the buffer overflows. Newest stay.
      const trimmed = combined.length > ANALYTICS_BUFFER_LIMIT
        ? combined.slice(combined.length - ANALYTICS_BUFFER_LIMIT)
        : combined;
      const updated = {
        schemaVersion: 1,
        lastUpdatedAt: new Date().toISOString(),
        events: trimmed,
      };
      const summary = `analytics: +${newEvents.length} (${userEmail || userId})`;
      await writeJsonToRepo(ghToken, ANALYTICS_PATH, sha, updated, summary);
      return { inserted: newEvents.length, total: trimmed.length };
    } catch (e: any) {
      if (attempt < 2 && /409|sha/i.test(e.message)) continue;
      throw e;
    }
  }
  throw new Error('analytics: GitHub write retry exhausted');
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  let userId: string;
  let userEmail: string;
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    userId = String(decoded.userId || decoded.id || decoded.email || 'unknown');
    userEmail = decoded.email || '';
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const { events } = req.body;
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'No events provided' });
  }
  const batch = events.slice(0, 100);

  // Try MySQL first (fast). If the RDS env var is missing/unreachable
  // (Jamie's case right now), fall back to the GitHub JSON buffer so
  // the admin Activity page still has something to show.
  const dbHost = process.env.STUNTLISTING_DB_HOST;
  if (dbHost) {
    try {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: dbHost,
        user: process.env.STUNTLISTING_DB_USER,
        password: process.env.STUNTLISTING_DB_PASSWORD,
        database: process.env.STUNTLISTING_DB_NAME,
        connectTimeout: 5000,
      });
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          user_email VARCHAR(255) DEFAULT NULL,
          event_type VARCHAR(64) NOT NULL,
          event_data JSON DEFAULT NULL,
          session_id VARCHAR(64) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          INDEX idx_type (event_type),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      const values = batch.map((e: any) => [
        userId, userEmail, e.eventType || 'unknown',
        JSON.stringify(e.eventData || {}),
        e.sessionId || null,
        e.timestamp ? new Date(e.timestamp) : new Date(),
      ]);
      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      await connection.execute(
        `INSERT INTO analytics_events (user_id, user_email, event_type, event_data, session_id, created_at) VALUES ${placeholders}`,
        values.flat()
      );
      await connection.end();
      return res.status(200).json({ success: true, inserted: batch.length, source: 'mysql' });
    } catch (dbErr: any) {
      // Fall through to GitHub fallback below — DB is unreachable.
      console.error('analytics MySQL failed, falling back to GitHub:', dbErr?.message);
    }
  }

  // GitHub JSON fallback
  const ghToken = process.env.GITHUB_TOKEN_REPO_WRITE;
  if (!ghToken) {
    return res.status(200).json({ success: true, inserted: 0, demo: true });
  }
  try {
    const r = await appendEventsToGithub(ghToken, batch, userId, userEmail);
    return res.status(200).json({ success: true, inserted: r.inserted, total: r.total, source: 'github' });
  } catch (e: any) {
    console.error('analytics GitHub fallback failed:', e?.message);
    return res.status(500).json({ error: 'Failed to store events' });
  }
}
