# Action Vault data API contract

Status: **proposed** — the service does not exist yet. This documents the
interface so the Worker and the service can be built against the same shapes.

## Why this exists

Action Vault is moving to Cloudflare Workers, and StuntListing side projects
are moving to MongoDB. Those two decisions do not meet:

- Hyperdrive, which is how Workers reach a regional database, supports
  **Postgres and MySQL only**. There is no MongoDB support.
- There is no official MongoDB driver for the Workers runtime. The Node driver
  expects `net`/`tls`, not the Workers `connect()` socket API.
- Workers run a fresh isolate per request, worldwide. MongoDB's driver assumes
  one long-lived pooled connection per process. Without pooling, every edge
  request opens its own connection — connection storms against Atlas. Hyperdrive
  solves exactly this for SQL; nothing equivalent exists for Mongo.

So the Worker talks HTTPS to a small service that owns the database
connections. The service pools; the Worker stays stateless. This also means the
Worker needs no `nodejs_compat` database driver, no Hyperdrive binding, and no
TCP — only `fetch`.

A useful side effect: the service can front **both** datastores. The Worker then
does not care that analytics lives in Mongo and core platform data lives in
MySQL, and either side can move later without the Worker changing.

## Two datastores, different owners

| Data | Tables today | Owner | Moving to Mongo? |
|---|---|---|---|
| Core platform | `user`, `stunt_reels`, `locations` | StuntListing platform (TypeORM) | **Undecided — see open questions** |
| Product analytics | `analytics_events`, `analytics_sessions` | Action Vault (it runs the `CREATE TABLE`) | Yes |

Action Vault only ever **reads** core platform data. It never writes it.

## Auth

Bearer token, shared secret, set as `DATA_API_TOKEN` on the Worker and on the
service. The service must not be publicly reachable without it. Rotate on a
schedule — an expired credential silently broke the reel cron for 79 days in
mid-2026, so prefer a mechanism that fails loudly.

## Endpoints

Base URL comes from `DATA_API_URL`. All responses are JSON.

### Core platform reads

#### `GET /v1/users/:id`
Replaces: ``SELECT id, alias, first_name, last_name, instagram, height, weight FROM `user` u LEFT JOIN locations l ON l.id = u.primary_locationId WHERE u.id = ?``

```json
{ "id": 123, "alias": "…", "first_name": "…", "last_name": "…",
  "instagram": "…", "height": "…", "weight": "…", "location_name": "…" }
```
`404` when not found. The superset shape is returned everywhere; callers that
need only the five basic fields ignore the rest.

#### `GET /v1/users/search?q=<term>&limit=<n>`
Replaces: ``… WHERE fullTextSearch LIKE '%?%' ORDER BY id ASC LIMIT ?``

Call sites use limits of 1, 5 and 10. `limit` defaults to 10, caps at 50.
Returns `{ "users": [ <user>, … ] }`, ordered by id ascending — the order is
load-bearing: `stunt-reel-performer` takes the first match as the performer.

The service owns the matching strategy. `fullTextSearch` is a denormalised
column in the MySQL schema; a Mongo implementation would use a text index. The
Worker must not care which.

#### `GET /v1/users/:id/stunt-reels`
Replaces: `SELECT id, reel_url, title FROM stunt_reels WHERE userId = ?`

```json
{ "reels": [ { "id": 1, "reel_url": "…", "title": "…" } ] }
```

#### `GET /v1/health`
Replaces: ``SELECT COUNT(*) AS n FROM `user` `` — used by the admin health check.

```json
{ "ok": true, "userCount": 12345, "datastores": { "core": "ok", "analytics": "ok" } }
```

### Analytics

#### `POST /v1/analytics/events`
Replaces the batch `INSERT INTO analytics_events`.

```json
{ "events": [ { "user_id": "…", "user_email": "…", "event_type": "…",
                "event_data": {}, "session_id": "…", "created_at": "ISO-8601" } ] }
```
Returns `{ "inserted": <n> }`. Batched; the current caller sends arrays.

#### `GET /v1/analytics/summary?days=<n>`
Replaces the aggregate block in `analytics-data.ts`. Everything the admin
Analytics screen needs, in one round trip — the current code issues ~15 separate
queries per page load, which is worth collapsing while we are here.

```json
{ "users":    { "total": 0, "last7d": 0, "last30d": 0 },
  "events":   { "total": 0, "videoPlays": 0, "sessions": 0 },
  "purchases":{ "count": 0, "revenue": 0 },
  "watchTime":{ "seconds": 0 },
  "breakdowns": { "byEventType": [], "byDay": [] } }
```

Note for the Mongo implementation: `revenue` and `watchTime` come from
`JSON_EXTRACT(event_data, '$.price')` and `'$.progressSeconds'` today. In Mongo
these are ordinary nested fields — simpler, but the values must stay numeric,
not strings, or the sums silently produce nonsense.

#### `GET /v1/analytics/recent?limit=<n>`
Replaces the two recent-activity queries.

```json
{ "events": [ { "user_email": "…", "event_type": "…", "event_data": {},
                "session_id": "…", "created_at": "ISO-8601" } ] }
```

## Failure behaviour

The Worker must degrade, not 500. Current behaviour worth preserving:

- `analytics-track` already falls back to a GitHub JSON buffer when the database
  is unreachable, so the admin Activity page still shows something. Keep that.
- `analytics-data` returns `{ demo: true }` with empty data rather than erroring.
- `stunt-reel-performer` returns the reel without performer enrichment.

A service outage should therefore look like "no performer match" and "no
analytics", not a broken app.

## Open questions

1. **Does the core platform move to Mongo, or stay MySQL?** If it stays, the
   service holds a MySQL pool for core reads and a Mongo client for analytics.
   If it moves, the three core endpoints need rewriting against the new schema
   and someone has to supply that schema. This does not change the Worker either
   way — that is the point of the contract — but it decides what the service does.

2. **Where does the service run?** It needs to be reachable over HTTPS from
   Cloudflare, hold long-lived DB connections, and be something the team is
   willing to operate. This is the decision with real ongoing cost attached.

3. **Migrate existing analytics data?** `analytics_events` has history in MySQL.
   Copy it into Mongo, leave it behind, or keep reading both for a period.
