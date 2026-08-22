// Cloudflare Worker entrypoint.
//
// The ten files under api/ are written against Vercel's (req, res) handler
// signature. Rather than rewrite each one for the fetch API — ten chances to
// change behaviour by accident — this adapts the two shapes. The handlers
// only ever touch req.method / headers / body / query and res.status /
// setHeader / json / end, so the surface being emulated is small and fully
// covered by toVercelHandler() below.
//
// Static assets and SPA routing are handled by the assets binding; see
// wrangler.jsonc, where run_worker_first pins this Worker to /api/* only.

import { setPlatformEnv } from '../api/_db';

import adminDispatch from '../api/admin-dispatch';
import analyticsData from '../api/analytics-data';
import analyticsTrack from '../api/analytics-track';
import createCheckoutSession from '../api/create-checkout-session';
import discoverStuntReels from '../api/cron/discover-stunt-reels';
import globalSettings from '../api/global-settings';
import stuntReelPerformer from '../api/stunt-reel-performer';
import stuntlistingAuth from '../api/stuntlisting-auth';
import verifyPurchase from '../api/verify-purchase';
import votesSubmit from '../api/votes/submit';

type VercelHandler = (req: any, res: any) => Promise<any> | any;

const ROUTES: Record<string, VercelHandler> = {
  '/api/admin-dispatch': adminDispatch,
  '/api/analytics-data': analyticsData,
  '/api/analytics-track': analyticsTrack,
  '/api/create-checkout-session': createCheckoutSession,
  '/api/cron/discover-stunt-reels': discoverStuntReels,
  '/api/global-settings': globalSettings,
  '/api/stunt-reel-performer': stuntReelPerformer,
  '/api/stuntlisting-auth': stuntlistingAuth,
  '/api/verify-purchase': verifyPurchase,
  '/api/votes/submit': votesSubmit,
};

async function toVercelHandler(handler: VercelHandler, request: Request, extraQuery: Record<string, string> = {}): Promise<Response> {
  const url = new URL(request.url);

  const query: Record<string, string> = { ...extraQuery };
  for (const [k, v] of url.searchParams) query[k] = v;

  const headers: Record<string, string> = {};
  for (const [k, v] of request.headers) headers[k.toLowerCase()] = v;

  // Vercel pre-parses JSON bodies; the handlers assume req.body is an object.
  let body: any = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const raw = await request.text();
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = raw;
      }
    }
  }

  const req = { method: request.method, headers, query, body, url: url.pathname + url.search };

  const responseHeaders = new Headers();
  let statusCode = 200;
  let settled = false;

  return await new Promise<Response>((resolve, reject) => {
    const finish = (payload: BodyInit | null, contentType?: string) => {
      if (settled) return; // a handler that responds twice would otherwise throw
      settled = true;
      if (contentType) responseHeaders.set('Content-Type', contentType);
      resolve(new Response(payload, { status: statusCode, headers: responseHeaders }));
    };

    const res = {
      status(code: number) { statusCode = code; return res; },
      setHeader(name: string, value: string) { responseHeaders.set(name, value); return res; },
      json(payload: unknown) { finish(JSON.stringify(payload), 'application/json'); return res; },
      send(payload: any) { finish(typeof payload === 'string' ? payload : JSON.stringify(payload)); return res; },
      end(payload?: any) { finish(payload ?? null); return res; },
    };

    Promise.resolve(handler(req, res))
      .then(() => {
        // A handler that returned without responding would hang the request.
        if (!settled) finish(null);
      })
      .catch(reject);
  });
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    setPlatformEnv(env);
    const url = new URL(request.url);

    // Mirrors the vercel.json rewrite: /api/admin/<action> is a friendlier
    // alias for /api/admin-dispatch?action=<action>.
    const adminMatch = /^\/api\/admin\/(.+)$/.exec(url.pathname);
    if (adminMatch) {
      return toVercelHandler(adminDispatch, request, { action: adminMatch[1] });
    }

    const handler = ROUTES[url.pathname.replace(/\/$/, '')];
    if (handler) return toVercelHandler(handler, request);

    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Anything else is the SPA; let the assets binding serve it.
    return env.ASSETS.fetch(request);
  },

  // Replaces the vercel.json `crons` block. Schedule lives in wrangler.jsonc.
  // The handler authenticates itself, so hand it the secret the same way
  // Vercel's scheduler did.
  async scheduled(_controller: any, env: any, ctx: any): Promise<void> {
    setPlatformEnv(env);
    const secret = env.CRON_SECRET ?? process.env.CRON_SECRET;
    const request = new Request('https://cron.internal/api/cron/discover-stunt-reels', {
      method: 'GET',
      headers: secret ? { authorization: `Bearer ${secret}` } : {},
    });
    ctx.waitUntil(
      toVercelHandler(discoverStuntReels, request)
        .then(async (r) => console.log('cron finished', r.status, await r.text()))
        .catch((e) => console.error('cron threw', e))
    );
  },
};
