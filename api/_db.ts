// Shared MySQL connection factory.
//
// Two runtimes, one code path:
//   Vercel   — plain mysql2 over TCP, credentials from process.env.
//   Workers  — the same driver, but pointed at a Hyperdrive binding, which
//              proxies and pools the TCP connection for us. Workers cannot
//              open an arbitrary socket to RDS directly, so Hyperdrive is
//              not an optimisation here, it is the only way in.
//
// The Worker entrypoint calls setPlatformEnv() on each request so this
// module can see its bindings; on Vercel that never happens and the
// process.env path is used instead.

import { createConnection } from 'mysql2/promise';

type PlatformEnv = { HYPERDRIVE?: { host: string; user: string; password: string; database: string; port: number } };

let platformEnv: PlatformEnv | null = null;

export function setPlatformEnv(env: PlatformEnv): void {
  platformEnv = env;
}

export function hasDatabase(): boolean {
  return Boolean(platformEnv?.HYPERDRIVE || process.env.STUNTLISTING_DB_HOST);
}

// `overrides` carries the per-call-site options the endpoints already set,
// notably connectTimeout, which differs between the admin UI (fail fast) and
// the analytics writer.
export async function getConnection(overrides: Record<string, any> = {}): Promise<any> {
  const hyperdrive = platformEnv?.HYPERDRIVE;

  if (hyperdrive) {
    return createConnection({
      host: hyperdrive.host,
      user: hyperdrive.user,
      password: hyperdrive.password,
      database: hyperdrive.database,
      port: hyperdrive.port,
      // mysql2 uses eval() to build row parsers for wide result sets, which
      // the Workers runtime forbids. Required, not optional.
      disableEval: true,
      ...overrides,
    });
  }

  const host = process.env.STUNTLISTING_DB_HOST;
  if (!host) throw new Error('No database configured: set STUNTLISTING_DB_HOST or bind HYPERDRIVE');

  return createConnection({
    host,
    user: process.env.STUNTLISTING_DB_USER,
    password: process.env.STUNTLISTING_DB_PASSWORD,
    database: process.env.STUNTLISTING_DB_NAME,
    ...overrides,
  });
}
