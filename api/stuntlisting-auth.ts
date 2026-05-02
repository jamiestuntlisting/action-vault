export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email: rawEmail, password } = req.body;
  if (!rawEmail || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  const email = String(rawEmail).trim().toLowerCase();

  try {
    // Option 1: Direct database verification
    // Requires STUNTLISTING_DB_* environment variables in Vercel
    const dbHost = process.env.STUNTLISTING_DB_HOST;
    const dbUser = process.env.STUNTLISTING_DB_USER;
    const dbPass = process.env.STUNTLISTING_DB_PASSWORD;
    const dbName = process.env.STUNTLISTING_DB_NAME;

    if (!dbHost) {
      // Demo mode (no DB configured): require a shared demo password AND
      // an @stuntlisting.com email. If STUNTLISTING_DEMO_PASSWORD is not
      // set, demo mode is disabled and auth fails closed.
      const demoPassword = process.env.STUNTLISTING_DEMO_PASSWORD;
      const allowedDomain = '@stuntlisting.com';
      const emailOk = email.toLowerCase().endsWith(allowedDomain);
      const passwordOk = !!demoPassword && password === demoPassword;
      if (!demoPassword || !emailOk || !passwordOk) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
      return res.status(200).json({
        success: true,
        user: {
          id: 'demo-' + Date.now(),
          email,
          name: email.split('@')[0],
          role: 'performer',
        },
        token: Buffer.from(JSON.stringify({ email, ts: Date.now() })).toString('base64'),
        demo: true,
      });
    }

    // Production: connect to StuntListing database.
    // Schema follows the StuntListing-BE TypeORM `User` entity: table is
    // `user` (singular), names are split into first_name/last_name, and the
    // password is sha256(SALT + plaintext) — NOT bcrypt. SALT must match the
    // StuntListing-BE config.SALT env var.
    const salt = process.env.SALT;
    if (!salt) {
      console.error('Auth error: SALT env var not configured');
      return res.status(500).json({ success: false, error: 'Authentication service unavailable' });
    }

    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPass,
      database: dbName,
    });

    const [rows] = await connection.execute(
      'SELECT id, email, first_name, last_name, password, role FROM `user` WHERE email = ? LIMIT 1',
      [email]
    );

    await connection.end();

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = rows[0];

    const crypto = require('crypto');
    const hashedPw = crypto.createHash('sha256').update(salt + password).digest('hex');

    if (user.password !== hashedPw) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

    // Generate a simple session token
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      ts: Date.now(),
    })).toString('base64');

    return res.status(200).json({
      success: true,
      user: {
        id: String(user.id),
        email: user.email,
        name: fullName || email.split('@')[0],
        role: user.role || 'performer',
      },
      token,
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, error: 'Authentication service unavailable' });
  }
}
