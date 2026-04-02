export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  let userId: string;
  let userEmail: string;
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    userId = String(decoded.userId || decoded.email || 'unknown');
    userEmail = decoded.email || '';
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const { events } = req.body;
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'No events provided' });
  }

  // Cap batch size
  const batch = events.slice(0, 100);

  const dbHost = process.env.STUNTLISTING_DB_HOST;
  if (!dbHost) {
    // Demo mode — just acknowledge
    return res.status(200).json({ success: true, inserted: 0, demo: true });
  }

  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: dbHost,
      user: process.env.STUNTLISTING_DB_USER,
      password: process.env.STUNTLISTING_DB_PASSWORD,
      database: process.env.STUNTLISTING_DB_NAME,
    });

    // Auto-create tables on first run
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

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS analytics_sessions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL UNIQUE,
        user_id VARCHAR(64) NOT NULL,
        user_email VARCHAR(255) DEFAULT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        page_views INT DEFAULT 0,
        platform VARCHAR(32) DEFAULT 'web',
        INDEX idx_user (user_id),
        INDEX idx_started (started_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Batch insert events
    if (batch.length > 0) {
      const values = batch.map((e: any) => [
        userId,
        userEmail,
        e.eventType || 'unknown',
        JSON.stringify(e.eventData || {}),
        e.sessionId || null,
        e.timestamp ? new Date(e.timestamp) : new Date(),
      ]);
      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const flat = values.flat();
      await connection.execute(
        `INSERT INTO analytics_events (user_id, user_email, event_type, event_data, session_id, created_at) VALUES ${placeholders}`,
        flat
      );

      // Upsert session
      const sessionId = batch[0].sessionId;
      if (sessionId) {
        const pageViews = batch.filter((e: any) => e.eventType === 'page_view').length;
        const platform = batch.find((e: any) => e.eventType === 'session_start')?.eventData?.platform || 'web';
        await connection.execute(
          `INSERT INTO analytics_sessions (session_id, user_id, user_email, platform, page_views)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE last_active_at = NOW(), page_views = page_views + ?`,
          [sessionId, userId, userEmail, platform, pageViews, pageViews]
        );
      }
    }

    await connection.end();
    return res.status(200).json({ success: true, inserted: batch.length });
  } catch (error: any) {
    console.error('Analytics track error:', error);
    return res.status(500).json({ error: 'Failed to store events' });
  }
}
