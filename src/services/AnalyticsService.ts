import { Platform } from 'react-native';

const API_BASE = Platform.OS === 'web' ? '' : 'https://actionvault.stuntlisting.com';
const SESSION_ID = 'sess-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
const FLUSH_INTERVAL = 10000; // 10 seconds
const MAX_BATCH = 50;

interface QueuedEvent {
  eventType: string;
  eventData: any;
  sessionId: string;
  timestamp: string;
}

let queue: QueuedEvent[] = [];
let flushTimer: any = null;

export const AnalyticsService = {
  _token: null as string | null,

  init(authToken: string | null) {
    this._token = authToken;
    if (!authToken) return;

    this.track('session_start', { platform: Platform.OS });

    // Start periodic flush
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL);

    // Web: flush on page unload
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (queue.length > 0 && this._token) {
          const body = JSON.stringify({ events: queue.splice(0) });
          try {
            navigator.sendBeacon(`${API_BASE}/api/analytics-track`, body);
          } catch {}
        }
      });
    }
  },

  track(eventType: string, eventData: any = {}) {
    if (!this._token) return;
    queue.push({
      eventType,
      eventData,
      sessionId: SESSION_ID,
      timestamp: new Date().toISOString(),
    });
    if (queue.length >= MAX_BATCH) this.flush();
  },

  async flush() {
    if (queue.length === 0 || !this._token) return;
    const batch = queue.splice(0, MAX_BATCH);
    try {
      await fetch(`${API_BASE}/api/analytics-track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._token}`,
        },
        body: JSON.stringify({ events: batch }),
      });
    } catch {
      // Push back on failure for retry
      queue.unshift(...batch);
    }
  },

  // Convenience methods
  pageView(screen: string, params?: any) { this.track('page_view', { screen, ...params }); },
  videoPlay(videoId: string, title?: string, source?: string) { this.track('video_play', { videoId, title, source }); },
  videoProgress(videoId: string, progressSeconds: number, durationSeconds: number, completed: boolean) {
    this.track('video_progress', { videoId, progressSeconds, durationSeconds, completed });
  },
  search(query: string, resultCount: number) { this.track('search', { query, resultCount }); },
  categoryBrowse(categoryId: string, categoryName: string) { this.track('category_browse', { categoryId, categoryName }); },
  purchase(type: string, itemId: string, title: string, price: number) { this.track('purchase', { type, itemId, title, price }); },
  favorite(videoId: string, added: boolean) { this.track(added ? 'favorite_add' : 'favorite_remove', { videoId }); },
  rating(videoId: string, thumbs: string | null, difficulty: number | null, bestOfBest: boolean) {
    this.track('rating', { videoId, thumbs, difficulty, bestOfBest });
  },
  follow(type: string, id: string, action: string) { this.track('follow', { followableType: type, followableId: id, action }); },
  bookmark(videoId: string, timestampSeconds: number) { this.track('bookmark_add', { videoId, timestampSeconds }); },
};
