// Thin Vercel proxy in front of the StuntListing GraphQL API.
//
// The web client can't call api.stuntlisting.com directly (CORS), so we
// forward the credentials through the BE's official login mutation and
// reshape the response to what AuthScreen expects: { success, user, token }.
//
// We intentionally do NOT touch the DB directly — the GraphQL endpoint
// already handles password verification, salting, and token issuance.

const STUNTLISTING_GRAPHQL_URL = 'https://api.stuntlisting.com/graphql';

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      access_token
      refresh_token
      user_data {
        id
        email
        first_name
        last_name
        role
      }
    }
  }
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email: rawEmail, password } = req.body || {};
  if (!rawEmail || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  const email = String(rawEmail).trim().toLowerCase();

  try {
    const gqlResponse = await fetch(STUNTLISTING_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: { email, password },
      }),
    });

    const json: any = await gqlResponse.json();

    // GraphQL returns 200 even for auth errors; the error is in `errors[]`.
    // Collapse any BE error to a generic 401 so we don't leak whether the
    // email exists vs. password is wrong.
    if (json.errors && json.errors.length > 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const data = json.data?.login;
    if (!data || !data.access_token || !data.user_data) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const u = data.user_data;
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    const role = Array.isArray(u.role) ? (u.role[0] || 'performer') : (u.role || 'performer');

    return res.status(200).json({
      success: true,
      user: {
        id: String(u.id),
        email: u.email,
        name: fullName || email.split('@')[0],
        role,
      },
      token: data.access_token,
      refreshToken: data.refresh_token,
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, error: 'Authentication service unavailable' });
  }
}
