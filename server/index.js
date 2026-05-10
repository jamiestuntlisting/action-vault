// Action Vault Worker API — runs on Cloudflare Workers, talks to D1
// Auth: Clerk JWT in Authorization: Bearer <token> header
// Every endpoint scopes data by user_id (Clerk user id) — RLS-equivalent enforced in code.

import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClerkClient, verifyToken } from "@clerk/backend";

const app = new Hono();

// CORS — allow the Pages frontend + localhost dev
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") || "";
  const allowed = (c.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const corsMiddleware = cors({
    origin: allowed.includes(origin) ? origin : allowed[0] || "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Auth middleware — verifies Clerk JWT, sets c.userId
const requireAuth = async (c, next) => {
  const auth = c.req.header("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return c.json({ error: "missing token" }, 401);
  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });
    c.set("userId", payload.sub);
    await next();
  } catch (e) {
    return c.json({ error: "invalid token", detail: String(e?.message || e) }, 401);
  }
};

const now = () => Date.now();
const uid = () => Math.random().toString(36).slice(2, 10);

// Health
app.get("/", (c) => c.json({ ok: true, service: "action-vault-api", at: new Date().toISOString() }));
app.get("/health", (c) => c.json({ ok: true }));

// Whoami — returns the verified user
app.get("/api/me", requireAuth, async (c) => {
  return c.json({ userId: c.get("userId") });
});

// ─── Lists ───
app.get("/api/lists", requireAuth, async (c) => {
  const userId = c.get("userId");
  const lists = await c.env.DB.prepare(
    "SELECT * FROM lists WHERE user_id = ? ORDER BY is_default DESC, created_at ASC"
  ).bind(userId).all();
  const items = await c.env.DB.prepare(
    "SELECT * FROM list_items WHERE user_id = ? ORDER BY position ASC, created_at ASC"
  ).bind(userId).all();
  const itemsByList = {};
  for (const it of items.results || []) {
    (itemsByList[it.list_id] ||= []).push({
      id: it.id,
      type: it.type,
      videoId: it.video_id,
      title: it.title,
      url: it.url,
      author: it.author,
      notes: it.notes,
      isPrivate: !!it.is_private,
    });
  }
  let listsRows = lists.results || [];
  // First-time user — seed default "My List"
  if (listsRows.length === 0) {
    const defaultId = "default-" + uid();
    const t = now();
    await c.env.DB.prepare(
      "INSERT INTO lists (id,user_id,name,is_default,course_is_course,course_is_paid,course_price,course_desc,course_status,created_at,updated_at) VALUES (?,?,?,1,0,0,0,'',NULL,?,?)"
    ).bind(defaultId, userId, "My List", t, t).run();
    listsRows = [{
      id: defaultId, user_id: userId, name: "My List", is_default: 1,
      course_is_course: 0, course_is_paid: 0, course_price: 0,
      course_desc: "", course_status: null, created_at: t, updated_at: t,
    }];
  }
  const result = listsRows.map(l => ({
    id: l.id,
    name: l.name,
    isDefault: !!l.is_default,
    items: itemsByList[l.id] || [],
    course: {
      isCourse: !!l.course_is_course,
      isPaid: !!l.course_is_paid,
      price: l.course_price,
      desc: l.course_desc || "",
      status: l.course_status,
    },
  }));
  return c.json({ lists: result });
});

app.post("/api/lists", requireAuth, async (c) => {
  const userId = c.get("userId");
  const { name } = await c.req.json();
  if (!name?.trim()) return c.json({ error: "name required" }, 400);
  const id = uid();
  const t = now();
  await c.env.DB.prepare(
    "INSERT INTO lists (id,user_id,name,is_default,course_is_course,course_is_paid,course_price,course_desc,course_status,created_at,updated_at) VALUES (?,?,?,0,0,0,0,'',NULL,?,?)"
  ).bind(id, userId, name.trim(), t, t).run();
  return c.json({ id });
});

app.patch("/api/lists/:id", requireAuth, async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const fields = [];
  const values = [];
  if (typeof body.name === "string") { fields.push("name = ?"); values.push(body.name); }
  if (body.course) {
    if ("isCourse" in body.course) { fields.push("course_is_course = ?"); values.push(body.course.isCourse ? 1 : 0); }
    if ("isPaid"   in body.course) { fields.push("course_is_paid = ?");   values.push(body.course.isPaid   ? 1 : 0); }
    if ("price"    in body.course) { fields.push("course_price = ?");    values.push(Number(body.course.price) || 0); }
    if ("desc"     in body.course) { fields.push("course_desc = ?");     values.push(body.course.desc || ""); }
    if ("status"   in body.course) { fields.push("course_status = ?");   values.push(body.course.status); }
  }
  if (fields.length === 0) return c.json({ ok: true });
  fields.push("updated_at = ?");
  values.push(now(), id, userId);
  await c.env.DB.prepare(`UPDATE lists SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`).bind(...values).run();
  return c.json({ ok: true });
});

app.delete("/api/lists/:id", requireAuth, async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  // Don't delete the default list
  const row = await c.env.DB.prepare("SELECT is_default FROM lists WHERE id = ? AND user_id = ?").bind(id, userId).first();
  if (!row) return c.json({ error: "not found" }, 404);
  if (row.is_default) return c.json({ error: "cannot delete default list" }, 400);
  await c.env.DB.prepare("DELETE FROM list_items WHERE list_id = ? AND user_id = ?").bind(id, userId).run();
  await c.env.DB.prepare("DELETE FROM lists WHERE id = ? AND user_id = ?").bind(id, userId).run();
  return c.json({ ok: true });
});

// ─── Items ───
app.post("/api/lists/:listId/items", requireAuth, async (c) => {
  const userId = c.get("userId");
  const listId = c.req.param("listId");
  const body = await c.req.json();
  const items = Array.isArray(body.items) ? body.items : [body];
  // Verify list belongs to user
  const list = await c.env.DB.prepare("SELECT id FROM lists WHERE id = ? AND user_id = ?").bind(listId, userId).first();
  if (!list) return c.json({ error: "list not found" }, 404);
  const t = now();
  const stmts = items.map(it => c.env.DB.prepare(
    "INSERT INTO list_items (id,list_id,user_id,type,video_id,title,url,author,notes,is_private,position,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(
    uid(), listId, userId, it.type || "link",
    it.videoId || null, it.title || "", it.url || "", it.author || "", it.notes || "",
    it.isPrivate ? 1 : 0, 0, t
  ));
  await c.env.DB.batch(stmts);
  return c.json({ ok: true, count: items.length });
});

app.delete("/api/lists/:listId/items/:itemId", requireAuth, async (c) => {
  const userId = c.get("userId");
  await c.env.DB.prepare(
    "DELETE FROM list_items WHERE id = ? AND list_id = ? AND user_id = ?"
  ).bind(c.req.param("itemId"), c.req.param("listId"), userId).run();
  return c.json({ ok: true });
});

// Toggle a video into/out of a list
app.post("/api/lists/:listId/toggle-video", requireAuth, async (c) => {
  const userId = c.get("userId");
  const listId = c.req.param("listId");
  const { videoId } = await c.req.json();
  const existing = await c.env.DB.prepare(
    "SELECT id FROM list_items WHERE list_id = ? AND user_id = ? AND type = 'video' AND video_id = ?"
  ).bind(listId, userId, videoId).first();
  if (existing) {
    await c.env.DB.prepare("DELETE FROM list_items WHERE id = ?").bind(existing.id).run();
    return c.json({ ok: true, action: "removed" });
  }
  await c.env.DB.prepare(
    "INSERT INTO list_items (id,list_id,user_id,type,video_id,title,url,author,notes,is_private,position,created_at) VALUES (?,?,?,'video',?, '','','','',0,0,?)"
  ).bind(uid(), listId, userId, videoId, now()).run();
  return c.json({ ok: true, action: "added" });
});

// ─── Watched ───
app.get("/api/watched", requireAuth, async (c) => {
  const userId = c.get("userId");
  const rows = await c.env.DB.prepare("SELECT video_id FROM watched WHERE user_id = ?").bind(userId).all();
  return c.json({ watched: (rows.results || []).map(r => r.video_id) });
});

app.post("/api/watched/toggle", requireAuth, async (c) => {
  const userId = c.get("userId");
  const { videoId } = await c.req.json();
  const existing = await c.env.DB.prepare(
    "SELECT video_id FROM watched WHERE user_id = ? AND video_id = ?"
  ).bind(userId, videoId).first();
  if (existing) {
    await c.env.DB.prepare("DELETE FROM watched WHERE user_id = ? AND video_id = ?").bind(userId, videoId).run();
    return c.json({ ok: true, action: "removed" });
  }
  await c.env.DB.prepare(
    "INSERT INTO watched (user_id, video_id, created_at) VALUES (?,?,?)"
  ).bind(userId, videoId, now()).run();
  return c.json({ ok: true, action: "added" });
});

// ─── Section tags ───
app.get("/api/section-tags", requireAuth, async (c) => {
  const userId = c.get("userId");
  const rows = await c.env.DB.prepare(
    "SELECT video_id, section_id FROM section_tags WHERE user_id = ?"
  ).bind(userId).all();
  const tags = {};
  for (const r of rows.results || []) {
    (tags[r.video_id] ||= []).push(r.section_id);
  }
  return c.json({ tags });
});

app.post("/api/section-tags/toggle", requireAuth, async (c) => {
  const userId = c.get("userId");
  const { videoId, sectionId } = await c.req.json();
  const existing = await c.env.DB.prepare(
    "SELECT 1 FROM section_tags WHERE user_id = ? AND video_id = ? AND section_id = ?"
  ).bind(userId, videoId, sectionId).first();
  if (existing) {
    await c.env.DB.prepare(
      "DELETE FROM section_tags WHERE user_id = ? AND video_id = ? AND section_id = ?"
    ).bind(userId, videoId, sectionId).run();
    return c.json({ ok: true, action: "removed" });
  }
  await c.env.DB.prepare(
    "INSERT INTO section_tags (user_id, video_id, section_id, created_at) VALUES (?,?,?,?)"
  ).bind(userId, videoId, sectionId, now()).run();
  return c.json({ ok: true, action: "added" });
});

// ─── Purchases (test mode — Stripe webhook will replace this) ───
app.get("/api/purchases", requireAuth, async (c) => {
  const userId = c.get("userId");
  const rows = await c.env.DB.prepare(
    "SELECT purchase_key FROM purchases WHERE user_id = ?"
  ).bind(userId).all();
  return c.json({ purchased: (rows.results || []).map(r => r.purchase_key) });
});

app.post("/api/purchases/test", requireAuth, async (c) => {
  const userId = c.get("userId");
  const { key, price } = await c.req.json();
  if (!key) return c.json({ error: "key required" }, 400);
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO purchases (user_id, purchase_key, created_at, amount_cents) VALUES (?,?,?,?)"
  ).bind(userId, key, now(), Math.round((price || 0) * 100)).run();
  return c.json({ ok: true });
});

// ─── Public: discover approved community courses (no auth) ───
app.get("/api/discover/courses", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, user_id, name, course_is_paid, course_price, course_desc FROM lists WHERE course_is_course = 1 AND course_status = 'approved' ORDER BY updated_at DESC LIMIT 50"
  ).all();
  return c.json({
    courses: (rows.results || []).map(l => ({
      id: l.id,
      name: l.name,
      isPaid: !!l.course_is_paid,
      price: l.course_price,
      desc: l.course_desc,
    })),
  });
});

export default app;
