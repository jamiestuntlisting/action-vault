export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

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

    // Production: connect to StuntListing database
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPass,
      database: dbName,
    });

    const [rows] = await connection.execute(
      'SELECT id, email, name, password, role FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    await connection.end();

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Verify password (bcrypt hash comparison)
    const bcrypt = require('bcryptjs');
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

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
        name: user.name || email.split('@')[0],
        role: user.role || 'performer',
      },
      token,
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, error: 'Authentication service unavailable' });
  }
}
