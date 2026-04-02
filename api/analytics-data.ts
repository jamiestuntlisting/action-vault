export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, query, userId: filterUserId, days } = req.body;
  const analyticsPassword = process.env.ANALYTICS_PASSWORD;

  if (!analyticsPassword || password !== analyticsPassword) {
    return res.status(403).json({ error: 'Invalid password' });
  }

  const dbHost = process.env.STUNTLISTING_DB_HOST;
  if (!dbHost) {
    return res.status(200).json({ success: true, data: {}, demo: true });
  }

  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: dbHost,
      user: process.env.STUNTLISTING_DB_USER,
      password: process.env.STUNTLISTING_DB_PASSWORD,
      database: process.env.STUNTLISTING_DB_NAME,
    });

    let data: any = {};
    const timeRange = days || 30;

    switch (query) {
      case 'overview': {
        const [totalUsers] = await connection.execute('SELECT COUNT(DISTINCT user_id) as count FROM analytics_events');
        const [activeUsers7d] = await connection.execute('SELECT COUNT(DISTINCT user_id) as count FROM analytics_events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
        const [activeUsers30d] = await connection.execute('SELECT COUNT(DISTINCT user_id) as count FROM analytics_events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
        const [totalEvents] = await connection.execute('SELECT COUNT(*) as count FROM analytics_events');
        const [totalPlays] = await connection.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'video_play'");
        const [totalSessions] = await connection.execute('SELECT COUNT(*) as count FROM analytics_sessions');
        const [purchases] = await connection.execute("SELECT COUNT(*) as count, COALESCE(SUM(JSON_EXTRACT(event_data, '$.price')), 0) as revenue FROM analytics_events WHERE event_type = 'purchase'");
        const [watchTime] = await connection.execute("SELECT COALESCE(SUM(JSON_EXTRACT(event_data, '$.progressSeconds')), 0) as seconds FROM analytics_events WHERE event_type = 'video_progress'");

        data = {
          totalUsers: totalUsers[0].count,
          activeUsers7d: activeUsers7d[0].count,
          activeUsers30d: activeUsers30d[0].count,
          totalEvents: totalEvents[0].count,
          totalPlays: totalPlays[0].count,
          totalSessions: totalSessions[0].count,
          totalPurchases: purchases[0].count,
          totalRevenue: parseFloat(purchases[0].revenue) || 0,
          totalWatchSeconds: parseFloat(watchTime[0].seconds) || 0,
        };
        break;
      }

      case 'users': {
        const [users] = await connection.execute(`
          SELECT
            user_id,
            user_email,
            COUNT(*) as total_events,
            MAX(created_at) as last_active,
            MIN(created_at) as first_seen,
            SUM(CASE WHEN event_type = 'video_play' THEN 1 ELSE 0 END) as video_plays,
            SUM(CASE WHEN event_type = 'favorite_add' THEN 1 ELSE 0 END) as favorites,
            SUM(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as purchases,
            COALESCE(SUM(CASE WHEN event_type = 'video_progress' THEN JSON_EXTRACT(event_data, '$.progressSeconds') ELSE 0 END), 0) as watch_seconds
          FROM analytics_events
          GROUP BY user_id, user_email
          ORDER BY last_active DESC
          LIMIT 200
        `);
        data = { users };
        break;
      }

      case 'popular_content': {
        const [topVideos] = await connection.execute(`
          SELECT
            JSON_EXTRACT(event_data, '$.videoId') as video_id,
            MAX(JSON_EXTRACT(event_data, '$.title')) as title,
            COUNT(*) as play_count,
            COUNT(DISTINCT user_id) as unique_viewers
          FROM analytics_events
          WHERE event_type = 'video_play'
          GROUP BY JSON_EXTRACT(event_data, '$.videoId')
          ORDER BY play_count DESC
          LIMIT 50
        `);
        const [topSearches] = await connection.execute(`
          SELECT
            JSON_EXTRACT(event_data, '$.query') as search_query,
            COUNT(*) as search_count
          FROM analytics_events
          WHERE event_type = 'search'
          GROUP BY JSON_EXTRACT(event_data, '$.query')
          ORDER BY search_count DESC
          LIMIT 30
        `);
        const [topFavorited] = await connection.execute(`
          SELECT
            JSON_EXTRACT(event_data, '$.videoId') as video_id,
            COUNT(*) as fav_count
          FROM analytics_events
          WHERE event_type = 'favorite_add'
          GROUP BY JSON_EXTRACT(event_data, '$.videoId')
          ORDER BY fav_count DESC
          LIMIT 30
        `);
        data = { topVideos, topSearches, topFavorited };
        break;
      }

      case 'engagement': {
        const [daily] = await connection.execute(`
          SELECT
            DATE(created_at) as date,
            COUNT(DISTINCT user_id) as active_users,
            COUNT(*) as total_events,
            SUM(CASE WHEN event_type = 'video_play' THEN 1 ELSE 0 END) as video_plays
          FROM analytics_events
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `, [timeRange]);
        data = { daily };
        break;
      }

      case 'purchases': {
        const [purchaseList] = await connection.execute(`
          SELECT
            user_email,
            event_data,
            created_at
          FROM analytics_events
          WHERE event_type = 'purchase'
          ORDER BY created_at DESC
          LIMIT 200
        `);
        data = { purchases: purchaseList };
        break;
      }

      case 'recent_events': {
        const [events] = await connection.execute(`
          SELECT user_email, event_type, event_data, created_at
          FROM analytics_events
          ORDER BY created_at DESC
          LIMIT 200
        `);
        data = { events };
        break;
      }

      case 'user_detail': {
        if (!filterUserId) {
          data = { error: 'userId required' };
          break;
        }
        const [events] = await connection.execute(`
          SELECT event_type, event_data, session_id, created_at
          FROM analytics_events
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 500
        `, [filterUserId]);
        data = { events };
        break;
      }

      default:
        data = { error: 'Unknown query type' };
    }

    await connection.end();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Analytics data error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}
