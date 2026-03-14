/**
 * TMDB (The Movie Database) API Service
 * Used to enrich video data with movie/show metadata and stunt crew info.
 *
 * API docs: https://developer.themoviedb.org/docs
 */

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

// TMDB API key — free tier, read-only access
// Users can set their own key in Settings
let API_KEY = '';

const STUNT_JOBS = [
  'Stunt Coordinator',
  'Stunts Coordinator',
  'Fight Choreographer',
  'Stunt Double',
  'Stunts',
  'Utility Stunts',
  'Stunt Driver',
  'Stunt Rigger',
  'Stunt Performer',
  'Second Unit Director',
];

// --- Types ---

export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
  budget: number;
  revenue: number;
  runtime: number;
  vote_average: number;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
}

export interface TmdbTvShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  overview: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  networks: { id: number; name: string }[];
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  department: string;
  job: string;
  profile_path: string | null;
  credit_id: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  order: number;
  profile_path: string | null;
}

export interface TmdbCredits {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbSearchResult {
  id: number;
  title?: string;       // movies
  name?: string;        // tv
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  vote_average: number;
  media_type?: string;
}

export interface StuntCrewMember {
  id: number;
  name: string;
  job: string;
  photoUrl: string | null;
}

export interface EnrichedProductionData {
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  studio: string;
  budget: number;
  genres: string[];
  rating: number;
  stuntCrew: StuntCrewMember[];
}

// --- Image helpers ---

export function posterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' = 'w342'): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export function profileUrl(path: string | null, size: 'w185' | 'w342' = 'w185'): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w780'): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

// --- API calls ---

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error('TMDB API key not set. Go to Settings to add your key.');
  }
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString());
  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid TMDB API key');
    if (response.status === 429) throw new Error('TMDB rate limit exceeded. Try again in a moment.');
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
}

// --- Public API ---

export const TmdbService = {
  setApiKey(key: string) {
    API_KEY = key;
  },

  getApiKey() {
    return API_KEY;
  },

  hasApiKey() {
    return !!API_KEY;
  },

  /** Search for movies by title */
  async searchMovies(query: string, page = 1): Promise<{ results: TmdbSearchResult[]; total_pages: number }> {
    return tmdbFetch('/search/movie', { query, page: String(page) });
  },

  /** Search for TV shows by title */
  async searchTv(query: string, page = 1): Promise<{ results: TmdbSearchResult[]; total_pages: number }> {
    return tmdbFetch('/search/tv', { query, page: String(page) });
  },

  /** Multi-search (movies + TV + people) */
  async searchMulti(query: string, page = 1): Promise<{ results: TmdbSearchResult[]; total_pages: number }> {
    return tmdbFetch('/search/multi', { query, page: String(page) });
  },

  /** Get movie details with credits in one call */
  async getMovieWithCredits(movieId: number): Promise<TmdbMovie & { credits: TmdbCredits }> {
    return tmdbFetch(`/movie/${movieId}`, { append_to_response: 'credits' });
  },

  /** Get TV show details with credits */
  async getTvWithCredits(seriesId: number): Promise<TmdbTvShow & { credits: TmdbCredits }> {
    return tmdbFetch(`/tv/${seriesId}`, { append_to_response: 'credits' });
  },

  /** Get movie credits only */
  async getMovieCredits(movieId: number): Promise<TmdbCredits> {
    return tmdbFetch(`/movie/${movieId}/credits`);
  },

  /** Extract stunt crew from credits */
  extractStuntCrew(credits: TmdbCredits): StuntCrewMember[] {
    return credits.crew
      .filter(c => STUNT_JOBS.some(job => c.job.toLowerCase().includes(job.toLowerCase())))
      .map(c => ({
        id: c.id,
        name: c.name,
        job: c.job,
        photoUrl: profileUrl(c.profile_path),
      }));
  },

  /** Get enriched production data for a movie title */
  async enrichProduction(title: string, year?: number): Promise<EnrichedProductionData | null> {
    try {
      const query = year ? `${title} ${year}` : title;
      const searchResult = await this.searchMovies(title);
      if (searchResult.results.length === 0) return null;

      // Find best match — prefer year match if provided
      let best = searchResult.results[0];
      if (year) {
        const yearMatch = searchResult.results.find(r =>
          r.release_date?.startsWith(String(year))
        );
        if (yearMatch) best = yearMatch;
      }

      const details = await this.getMovieWithCredits(best.id);
      const stuntCrew = this.extractStuntCrew(details.credits);
      const studio = details.production_companies?.[0]?.name || 'Unknown';

      return {
        tmdbId: details.id,
        title: details.title,
        year: new Date(details.release_date).getFullYear(),
        posterUrl: posterUrl(details.poster_path),
        backdropUrl: backdropUrl(details.backdrop_path),
        studio,
        budget: details.budget,
        genres: details.genres.map(g => g.name),
        rating: details.vote_average,
        stuntCrew,
      };
    } catch (e) {
      console.warn('TMDB enrichment failed:', e);
      return null;
    }
  },

  /** Batch enrich multiple productions */
  async enrichMultiple(productions: { title: string; year?: number }[]): Promise<Map<string, EnrichedProductionData>> {
    const results = new Map<string, EnrichedProductionData>();
    // Process sequentially to respect rate limits
    for (const prod of productions) {
      try {
        const data = await this.enrichProduction(prod.title, prod.year);
        if (data) {
          results.set(prod.title, data);
        }
        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        // Continue on individual failures
      }
    }
    return results;
  },

  /** Find stunt coordinators for a given movie by TMDB ID */
  async getStuntCoordinators(tmdbId: number): Promise<StuntCrewMember[]> {
    const credits = await this.getMovieCredits(tmdbId);
    return this.extractStuntCrew(credits).filter(
      c => c.job === 'Stunt Coordinator' || c.job === 'Stunts Coordinator' || c.job === 'Fight Choreographer'
    );
  },
};
