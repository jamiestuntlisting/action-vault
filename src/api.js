// Action Vault API client — talks to Cloudflare Worker
// All calls require a Clerk session token; pass it via getToken() from useAuth().

const API_URL = import.meta.env.VITE_API_URL || "https://action-vault.jamie-181.workers.dev";

const req = async (getToken, path, opts = {}) => {
  const token = await getToken();
  const r = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
};

export const api = {
  me: (gt) => req(gt, "/api/me"),

  // Lists
  listsGet: (gt) => req(gt, "/api/lists"),
  listsCreate: (gt, name) => req(gt, "/api/lists", { method: "POST", body: JSON.stringify({ name }) }),
  listsPatch: (gt, id, patch) => req(gt, `/api/lists/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  listsDelete: (gt, id) => req(gt, `/api/lists/${id}`, { method: "DELETE" }),

  // Items
  itemsAdd: (gt, listId, items) => req(gt, `/api/lists/${listId}/items`, {
    method: "POST",
    body: JSON.stringify({ items: Array.isArray(items) ? items : [items] }),
  }),
  itemsRemove: (gt, listId, itemId) => req(gt, `/api/lists/${listId}/items/${itemId}`, { method: "DELETE" }),
  toggleVideoInList: (gt, listId, videoId) => req(gt, `/api/lists/${listId}/toggle-video`, {
    method: "POST",
    body: JSON.stringify({ videoId }),
  }),

  // Watched
  watchedGet: (gt) => req(gt, "/api/watched"),
  watchedToggle: (gt, videoId) => req(gt, "/api/watched/toggle", {
    method: "POST",
    body: JSON.stringify({ videoId }),
  }),

  // Section tags
  tagsGet: (gt) => req(gt, "/api/section-tags"),
  tagToggle: (gt, videoId, sectionId) => req(gt, "/api/section-tags/toggle", {
    method: "POST",
    body: JSON.stringify({ videoId, sectionId }),
  }),

  // Purchases
  purchasesGet: (gt) => req(gt, "/api/purchases"),
  purchaseTest: (gt, key, price) => req(gt, "/api/purchases/test", {
    method: "POST",
    body: JSON.stringify({ key, price }),
  }),

  // Public
  discoverCourses: () => fetch(`${API_URL}/api/discover/courses`).then(r => r.json()),
};
