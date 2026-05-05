// GET /api/admin/search-stuntlisting-users?q=<name>
// Searches the StuntListing `user` table via fullTextSearch LIKE for use in
// the matcher screen's manual override flow. Admin-only.
//
// Returns up to 10 candidates: { id, alias, firstName, lastName, instagram }.

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

  const dbHost = process.env.STUNTLISTING_DB_HOST;
  const dbUser = process.env.STUNTLISTING_DB_USER;
  const dbPass = process.env.STUNTLISTING_DB_PASSWORD;
  const dbName = process.env.STUNTLISTING_DB_NAME;
  if (!dbHost || !dbUser || !dbPass || !dbName) {
    return res.status(500).json({ error: 'DB not configured' });
  }

  const q = (req.query?.q || '').trim();
  if (q.length < 2) return res.status(400).json({ error: 'q must be 2+ chars' });

  const mysql = require('mysql2/promise');
  let connection: any = null;
  try {
    connection = await mysql.createConnection({
      host: dbHost, user: dbUser, password: dbPass, database: dbName,
    });
    const [rows] = await connection.execute(
      `SELECT id, alias, first_name, last_name, instagram
         FROM \`user\`
        WHERE fullTextSearch LIKE ?
        ORDER BY id ASC
        LIMIT 10`,
      [`%${q}%`]
    );
    return res.status(200).json({
      query: q,
      results: (rows as any[]).map(r => ({
        id: r.id,
        alias: r.alias,
        firstName: r.first_name,
        lastName: r.last_name,
        instagram: r.instagram || null,
      })),
    });
  } catch (e: any) {
    console.error('search-stuntlisting-users error:', e);
    return res.status(500).json({ error: e.message });
  } finally {
    if (connection) try { await connection.end(); } catch {}
  }
}
