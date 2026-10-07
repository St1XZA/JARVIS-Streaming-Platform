import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { MEDIA_CATALOG, searchVidApiCatalog } from './src/data/mediaCatalog.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// List of fallback models in order of priority (prioritizing high-availability gemini-2.5-flash)
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

// Lazy-initialize Gemini AI
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    terminal: 'JARVIS-MARK-LXXXV', 
    engine: 'VidAPI (vidapi.ru)', 
    tmdbConfigured: Boolean(process.env.TMDB_API_KEY || process.env.TMDB_READ_ACCESS_TOKEN),
    uptime: process.uptime() 
  });
});

// Search TMDb API or free Global Media suggestions (compliant with https://developer.themoviedb.org/docs/search-and-query-for-details)
async function searchOnlineMedia(query: string, type: 'all' | 'movie' | 'tv' = 'all') {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;

  // Check if query is a direct IMDb ID (tt...)
  if (cleanQ.toLowerCase().startsWith('tt')) {
    const existing = MEDIA_CATALOG.find(m => m.id.toLowerCase() === cleanQ.toLowerCase() || (m.imdbId && m.imdbId.toLowerCase() === cleanQ.toLowerCase()));
    if (existing) return [existing];
  }

  // 1. Try TMDb Official API if key or token is configured
  if (tmdbKey || tmdbToken) {
    try {
      const endpoint = type === 'movie' ? 'search/movie' : type === 'tv' ? 'search/tv' : 'search/multi';
      const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
      url.searchParams.set('query', cleanQ);
      url.searchParams.set('include_adult', 'false');
      url.searchParams.set('language', 'en-US');
      if (tmdbKey) url.searchParams.set('api_key', tmdbKey);

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (tmdbToken) headers['Authorization'] = `Bearer ${tmdbToken}`;

      const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data: any = await res.json();
        const results = data.results || [];
        
        const mapped = results.slice(0, 20).map((item: any) => {
          const itemType: 'movie' | 'tv' = item.media_type === 'tv' || type === 'tv' ? 'tv' : 'movie';
          const title = item.title || item.name || item.original_title || item.original_name || 'Unknown Title';
          const year = (item.release_date || item.first_air_date || '').substring(0, 4) || new Date().getFullYear();
          return {
            id: String(item.id),
            tmdbId: item.id,
            title,
            type: itemType,
            year,
            poster: item.poster_path 
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}` 
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
            backdrop: item.backdrop_path 
              ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` 
              : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
            rating: Number((item.vote_average || 7.5).toFixed(1)),
            overview: item.overview || `Direct stream node for ${title} available via VidAPI gateway.`,
            genres: ['TMDb', itemType.toUpperCase()],
          };
        });

        if (mapped.length > 0) return mapped;
      }
    } catch {
      // Fall through to free suggestion resource
    }
  }

  // 2. Free Global Media Suggestions (IMDb Real-Time Public Endpoint, zero API key requirement)
  try {
    const sanitized = cleanQ.toLowerCase().replace(/[\s\-_]+/g, '_').replace(/[^a-z0-9_]/g, '');
    const firstChar = sanitized.charAt(0) || 'x';
    const freeUrls = [
      `https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(sanitized)}.json`,
      `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(sanitized)}.json`
    ];

    for (const freeUrl of freeUrls) {
      try {
        const res = await fetch(freeUrl, { signal: AbortSignal.timeout(4500) });
        if (res.ok) {
          const data: any = await res.json();
          const entries = data.d || [];
          const filteredEntries = entries.filter((e: any) => {
            if (!e.id) return false;
            const isMovie = e.qid === 'movie' || e.q === 'feature' || e.q === 'TV movie';
            const isTv = e.qid === 'tvSeries' || e.qid === 'tvMiniSeries' || (e.q && e.q.includes('TV'));
            if (type === 'movie') return isMovie;
            if (type === 'tv') return isTv;
            return isMovie || isTv;
          });

          const mapped = filteredEntries.slice(0, 20).map((entry: any) => {
            const isTv = entry.qid === 'tvSeries' || entry.qid === 'tvMiniSeries' || (entry.q && entry.q.includes('TV'));
            const itemType: 'movie' | 'tv' = isTv ? 'tv' : 'movie';
            const poster = entry.i?.imageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';
            return {
              id: entry.id, // e.g. tt1375666
              imdbId: entry.id,
              title: entry.l,
              type: itemType,
              year: entry.y || new Date().getFullYear(),
              poster,
              backdrop: poster,
              rating: entry.rank && entry.rank < 1000 ? 8.4 : 7.8,
              overview: `Stream ${entry.l} (${entry.y || 'Feature'}) via VidAPI protocol. Starring: ${entry.s || 'Main Cast'}.`,
              genres: ['Global Index', isTv ? 'Series' : 'Movie'],
              cast: entry.s ? entry.s.split(', ') : [],
            };
          });

          if (mapped.length > 0) {
            // Also merge with any matching local catalog items for richer data
            const localHits = searchVidApiCatalog(cleanQ, type);
            const seen = new Set<string>();
            const combined: any[] = [];
            for (const h of localHits) {
              seen.add(h.id.toLowerCase());
              if (h.imdbId) seen.add(h.imdbId.toLowerCase());
              combined.push(h);
            }
            for (const m of mapped) {
              if (!seen.has(m.id.toLowerCase()) && (!m.imdbId || !seen.has(m.imdbId.toLowerCase()))) {
                seen.add(m.id.toLowerCase());
                combined.push(m);
              }
            }
            return combined;
          }
        }
      } catch {
        // try next
      }
    }
  } catch {
    // Fall through to local catalog search
  }

  // 3. Fallback to local catalog
  return searchVidApiCatalog(cleanQ, type);
}

// Media details query (supports TMDB and IMDb lookups)
async function getMediaDetailsOnline(type: 'movie' | 'tv', id: string) {
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const isImdb = id.startsWith('tt');
      let tmdbId = id;
      if (isImdb) {
        const findUrl = new URL(`https://api.themoviedb.org/3/find/${id}`);
        findUrl.searchParams.set('external_source', 'imdb_id');
        if (tmdbKey) findUrl.searchParams.set('api_key', tmdbKey);
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (tmdbToken) headers['Authorization'] = `Bearer ${tmdbToken}`;
        const findRes = await fetch(findUrl.toString(), { headers, signal: AbortSignal.timeout(5000) });
        if (findRes.ok) {
          const findData: any = await findRes.json();
          const match = findData.movie_results?.[0] || findData.tv_results?.[0];
          if (match) tmdbId = String(match.id);
        }
      }

      const detailUrl = new URL(`https://api.themoviedb.org/3/${type}/${tmdbId}`);
      detailUrl.searchParams.set('append_to_response', 'external_ids,credits,videos');
      if (tmdbKey) detailUrl.searchParams.set('api_key', tmdbKey);
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (tmdbToken) headers['Authorization'] = `Bearer ${tmdbToken}`;
      const detRes = await fetch(detailUrl.toString(), { headers, signal: AbortSignal.timeout(5000) });
      if (detRes.ok) {
        const d: any = await detRes.json();
        const validSeasons = d.seasons ? d.seasons.filter((s: any) => s.season_number > 0) : [];
        const seasonsData = validSeasons.map((s: any) => ({
          seasonNumber: s.season_number,
          episodeCount: s.episode_count || 10,
          name: s.name,
        }));
        const totalSeasons = d.number_of_seasons || (validSeasons.length > 0 ? validSeasons.length : (type === 'tv' ? 18 : undefined));

        return {
          id: d.external_ids?.imdb_id || String(d.id),
          imdbId: d.external_ids?.imdb_id,
          tmdbId: d.id,
          title: d.title || d.name,
          type,
          year: (d.release_date || d.first_air_date || '').substring(0, 4) || new Date().getFullYear(),
          poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : undefined,
          backdrop: d.backdrop_path ? `https://image.tmdb.org/t/p/original${d.backdrop_path}` : undefined,
          rating: Number((d.vote_average || 8.0).toFixed(1)),
          overview: d.overview,
          genres: d.genres ? d.genres.map((g: any) => g.name) : [],
          totalSeasons,
          episodesPerSeason: d.number_of_episodes,
          seasonsData: seasonsData.length > 0 ? seasonsData : undefined,
          cast: d.credits?.cast ? d.credits.cast.slice(0, 5).map((c: any) => c.name) : [],
        };
      }
    } catch {
      // ignore
    }
  }

  const catalogItem = MEDIA_CATALOG.find(m => m.id === id || m.imdbId === id || String(m.tmdbId) === id);
  return catalogItem || null;
}

// TMDb & Global Media Search Endpoint
app.get('/api/tmdb/search', async (req, res) => {
  const query = (req.query.query as string) || '';
  const type = (req.query.type as 'all' | 'movie' | 'tv') || 'all';

  if (!query.trim()) {
    return res.json({ engine: 'TMDb & VidAPI Index', total: 0, results: [] });
  }

  const results = await searchOnlineMedia(query, type);
  const tmdbActive = Boolean(process.env.TMDB_API_KEY || process.env.TMDB_READ_ACCESS_TOKEN);

  res.json({
    engine: tmdbActive ? 'TMDb Official API v3/v4' : 'Free Global Media Index (VidAPI Ready)',
    total: results.length,
    results
  });
});

// TMDb Media Details Endpoint (https://developer.themoviedb.org/docs/search-and-query-for-details)
app.get('/api/tmdb/details/:type/:id', async (req, res) => {
  const type = (req.params.type as 'movie' | 'tv') || 'movie';
  const id = req.params.id;

  const details = await getMediaDetailsOnline(type, id);
  if (!details) {
    return res.status(404).json({ error: 'Media node details not found' });
  }

  res.json({
    engine: 'TMDb & VidAPI Details Service',
    media: details
  });
});

// TMDb & VidAPI Trending Endpoint
app.get('/api/tmdb/trending', async (req, res) => {
  const type = (req.query.type as 'all' | 'movie' | 'tv') || 'all';
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const url = new URL(`https://api.themoviedb.org/3/trending/${type === 'all' ? 'all' : type}/week`);
      if (tmdbKey) url.searchParams.set('api_key', tmdbKey);
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (tmdbToken) headers['Authorization'] = `Bearer ${tmdbToken}`;
      const r = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const data: any = await r.json();
        const results = (data.results || []).slice(0, 16).map((item: any) => {
          const itemType: 'movie' | 'tv' = item.media_type === 'tv' || type === 'tv' ? 'tv' : 'movie';
          return {
            id: String(item.id),
            tmdbId: item.id,
            title: item.title || item.name || 'Unknown',
            type: itemType,
            year: (item.release_date || item.first_air_date || '').substring(0, 4) || 2024,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80',
            rating: Number((item.vote_average || 8.0).toFixed(1)),
            overview: item.overview || 'Trending transmission stream ready via VidAPI.',
            genres: ['Trending', itemType.toUpperCase()],
            isLatest: true,
          };
        });
        return res.json({ engine: 'TMDb Trending API', total: results.length, results });
      }
    } catch {
      // ignore
    }
  }

  let items = MEDIA_CATALOG.filter(m => m.category === 'trending' || m.isLatest);
  if (type !== 'all') items = items.filter(m => m.type === type);
  res.json({ engine: 'VidAPI Curated Trending', total: items.length, results: items });
});

// VidAPI Specification & Embed Info Endpoint (https://vidapi.ru/api)
app.get('/api/vidapi/embed-info', (req, res) => {
  res.json({
    documentation: 'https://vidapi.ru/api',
    gateway: 'https://vidapi.ru',
    playerDomains: ['vaplayer.ru', 'vidapi.ru'],
    endpoints: {
      movie: 'https://vaplayer.ru/embed/movie/{id}',
      tv: 'https://vaplayer.ru/embed/tv/{id}/{season}/{episode}',
    },
    validParameters: {
      id: 'IMDB ID (with tt prefix) or TMDB ID (numeric only)',
      season: 'Season number (for TV)',
      episode: 'Episode number (for TV)',
      color: 'Primary UI color (e.g. 00f2ff)',
      autoplay: '1 for autoplay on, 0 for off'
    }
  });
});

// VidAPI Movies and TV Search Endpoint (calls unified online & catalog engine)
app.get('/api/vidapi/search', async (req, res) => {
  const query = (req.query.query as string) || '';
  const type = (req.query.type as 'all' | 'movie' | 'tv') || 'all';
  const genre = (req.query.genre as string) || 'all';

  if (query.trim()) {
    const results = await searchOnlineMedia(query, type);
    return res.json({
      engine: 'VidAPI & TMDb Search Matrix',
      total: results.length,
      results
    });
  }

  const results = searchVidApiCatalog(query, type, genre);
  res.json({
    engine: 'VidAPI (vidapi.ru)',
    total: results.length,
    results
  });
});

// Comprehensive Multi-Page Discovery & Pagination API
app.get('/api/media/discover', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(36, Math.max(6, parseInt(req.query.pageSize as string) || 18));
  const type = (req.query.type as 'all' | 'movie' | 'tv') || 'all';
  const category = (req.query.category as string) || 'all';
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;

  // 1. Try TMDb Discover API if configured
  if (tmdbKey || tmdbToken) {
    try {
      const endpoint = type === 'tv' ? 'discover/tv' : 'discover/movie';
      const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('sort_by', 'popularity.desc');
      url.searchParams.set('include_adult', 'false');
      url.searchParams.set('language', 'en-US');
      if (tmdbKey) url.searchParams.set('api_key', tmdbKey);

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (tmdbToken) headers['Authorization'] = `Bearer ${tmdbToken}`;

      const tmdbRes = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(5000) });
      if (tmdbRes.ok) {
        const data: any = await tmdbRes.json();
        const results = (data.results || []).map((item: any) => {
          const itemType: 'movie' | 'tv' = item.media_type === 'tv' || type === 'tv' ? 'tv' : 'movie';
          const title = item.title || item.name || item.original_title || 'Untitled';
          const year = (item.release_date || item.first_air_date || '').substring(0, 4) || 2024;
          return {
            id: String(item.id),
            tmdbId: item.id,
            title,
            type: itemType,
            year,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80',
            rating: Number((item.vote_average || 7.5).toFixed(1)),
            overview: item.overview || `Transmission stream ready for ${title}.`,
            genres: ['Discover', itemType.toUpperCase()],
          };
        });

        return res.json({
          engine: 'TMDb Global Discover API',
          page,
          pageSize,
          totalPages: data.total_pages || 100,
          totalResults: data.total_results || 1000,
          hasMore: page < (data.total_pages || 100),
          results
        });
      }
    } catch {
      // Fall through
    }
  }

  // 2. Base Catalog Paging with Virtual Extended Library
  let filtered = [...MEDIA_CATALOG];
  if (type !== 'all') {
    filtered = filtered.filter(m => m.type === type);
  }
  if (category !== 'all') {
    filtered = filtered.filter(m => m.category === category || (category === 'latest' && m.isLatest));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const results = filtered.slice(startIndex, startIndex + pageSize);

  res.json({
    engine: 'VidAPI Indexed Archives',
    page,
    pageSize,
    totalPages,
    totalResults: total,
    hasMore: page < totalPages,
    results
  });
});

// VidAPI Live Content Discovery Proxy APIs (as specified in VidAPI integration guide)
app.get('/api/vidapi/live/movies', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  try {
    const url = `https://vidapi.ru/movies/latest/page-${page}.json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (response.ok) {
      const data: any = await response.json();
      return res.json(data);
    }
  } catch (err) {
    console.warn('VidAPI live movies fetch failed:', err);
  }

  // Fallback to local catalog
  const filtered = MEDIA_CATALOG.filter(m => m.type === 'movie');
  res.json({
    page,
    per_page: 24,
    total: filtered.length,
    total_pages: Math.ceil(filtered.length / 24),
    items: filtered.map(m => ({
      tmdb_id: m.tmdbId,
      imdb_id: m.imdbId || m.id,
      title: m.title,
      year: m.year,
      poster_url: m.poster,
      rating: m.rating,
      genre: m.genres.join(', '),
      popularity: '9.5',
      type: 'movie',
      embed_url: `https://vaplayer.ru/embed/movie/${m.imdbId || m.id}`
    }))
  });
});

app.get('/api/vidapi/live/tvshows', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  try {
    const url = `https://vidapi.ru/tvshows/latest/page-${page}.json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (response.ok) {
      const data: any = await response.json();
      return res.json(data);
    }
  } catch (err) {
    console.warn('VidAPI live tvshows fetch failed:', err);
  }

  // Fallback to local catalog
  const filtered = MEDIA_CATALOG.filter(m => m.type === 'tv');
  res.json({
    page,
    per_page: 24,
    total: filtered.length,
    total_pages: Math.ceil(filtered.length / 24),
    items: filtered.map(m => ({
      tmdb_id: m.tmdbId,
      imdb_id: m.imdbId || m.id,
      title: m.title,
      year: m.year,
      poster_url: m.poster,
      rating: m.rating,
      genre: m.genres.join(', '),
      popularity: '9.2',
      type: 'tv',
      embed_url: `https://vaplayer.ru/embed/tv/${m.imdbId || m.id}/1/1`
    }))
  });
});

app.get('/api/vidapi/live/episodes', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  try {
    const url = `https://vidapi.ru/episodes/latest/page-${page}.json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (response.ok) {
      const data: any = await response.json();
      return res.json(data);
    }
  } catch (err) {
    console.warn('VidAPI live episodes fetch failed:', err);
  }

  res.json({
    page,
    per_page: 24,
    total: 0,
    total_pages: 1,
    items: []
  });
});

// Real-Time TMDb & Live Gateways Endpoint: Latest Movies (Now Playing & Fresh Theatrical)
app.get('/api/media/latest-movies', async (req, res) => {
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const url = new URL('https://api.themoviedb.org/3/movie/now_playing');
      url.searchParams.set('language', 'en-US');
      url.searchParams.set('page', '1');
      if (tmdbKey) url.searchParams.set('api_key', tmdbKey);

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (tmdbToken) headers['Authorization'] = `Bearer ${tmdbToken}`;

      const response = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(6000) });
      if (response.ok) {
        const data: any = await response.json();
        const results = (data.results || []).map((item: any) => ({
          id: String(item.id),
          tmdbId: item.id,
          title: item.title || item.original_title,
          type: 'movie' as const,
          year: (item.release_date || '').substring(0, 4) || new Date().getFullYear(),
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
          backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80',
          rating: Number((item.vote_average || 7.5).toFixed(1)),
          overview: item.overview || 'Latest cinema transmission ready on VidFast & VidAPI.',
          genres: ['Latest', 'Movie', '4K'],
          isLatest: true,
          releaseDate: item.release_date,
        }));
        if (results.length > 0) {
          return res.json({ engine: 'TMDb Now Playing Movies', total: results.length, results });
        }
      }
    } catch (e) {
      console.warn('TMDb now_playing fetch error:', e);
    }
  }

  // Fallback to local catalog latest movies
  const catalogMovies = MEDIA_CATALOG.filter(m => m.type === 'movie' && (m.isLatest || m.category === 'latest' || (typeof m.year === 'number' ? m.year >= 2024 : parseInt(String(m.year)) >= 2024)));
  res.json({
    engine: 'VidAPI & Local Index',
    total: catalogMovies.length,
    results: catalogMovies
  });
});

// Real-Time TMDb & Live Gateways Endpoint: Latest TV Series (On The Air & Fresh Seasons)
app.get('/api/media/latest-tv', async (req, res) => {
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const url = new URL('https://api.themoviedb.org/3/tv/on_the_air');
      url.searchParams.set('language', 'en-US');
      url.searchParams.set('page', '1');
      if (tmdbKey) url.searchParams.set('api_key', tmdbKey);

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (tmdbToken) headers['Authorization'] = `Bearer ${tmdbToken}`;

      const response = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(6000) });
      if (response.ok) {
        const data: any = await response.json();
        const results = (data.results || []).map((item: any) => ({
          id: String(item.id),
          tmdbId: item.id,
          title: item.name || item.original_name,
          type: 'tv' as const,
          year: (item.first_air_date || '').substring(0, 4) || new Date().getFullYear(),
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&auto=format&fit=crop&q=80',
          backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
          rating: Number((item.vote_average || 8.0).toFixed(1)),
          overview: item.overview || 'Latest episodic television series ready for streaming.',
          genres: ['Latest', 'Series', 'HD'],
          totalSeasons: 2,
          isLatest: true,
          releaseDate: item.first_air_date,
        }));
        if (results.length > 0) {
          return res.json({ engine: 'TMDb On-the-Air TV', total: results.length, results });
        }
      }
    } catch (e) {
      console.warn('TMDb on_the_air fetch error:', e);
    }
  }

  // Fallback to local catalog latest TV
  const catalogTv = MEDIA_CATALOG.filter(m => m.type === 'tv' && (m.isLatest || m.category === 'latest' || m.category === 'series'));
  res.json({
    engine: 'VidAPI & Local Index',
    total: catalogTv.length,
    results: catalogTv
  });
});

// Real-Time TMDb & Live Gateways Endpoint: Hottest (Daily & Weekly Trending Combo)
app.get('/api/media/hottest', async (req, res) => {
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;

  if (tmdbKey || tmdbToken) {
    try {
      const url = new URL('https://api.themoviedb.org/3/trending/all/day');
      url.searchParams.set('language', 'en-US');
      if (tmdbKey) url.searchParams.set('api_key', tmdbKey);

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (tmdbToken) headers['Authorization'] = `Bearer ${tmdbToken}`;

      const response = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(6000) });
      if (response.ok) {
        const data: any = await response.json();
        const results = (data.results || []).slice(0, 15).map((item: any) => {
          const itemType: 'movie' | 'tv' = item.media_type === 'tv' ? 'tv' : 'movie';
          return {
            id: String(item.id),
            tmdbId: item.id,
            title: item.title || item.name,
            type: itemType,
            year: (item.release_date || item.first_air_date || '').substring(0, 4) || new Date().getFullYear(),
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80',
            rating: Number((item.vote_average || 8.0).toFixed(1)),
            overview: item.overview || 'Hot trending transmission ready on VidFast and VidAPI.',
            genres: ['Trending', itemType.toUpperCase(), '4K'],
            isLatest: true,
          };
        });
        if (results.length > 0) {
          return res.json({ engine: 'TMDb Trending Day', total: results.length, results });
        }
      }
    } catch (e) {
      console.warn('TMDb trending day fetch error:', e);
    }
  }

  // Fallback to local catalog top rated & trending
  const items = MEDIA_CATALOG.filter(m => m.category === 'trending' || m.rating >= 7.5 || m.isLatest).slice(0, 15);
  res.json({
    engine: 'VidAPI & Local Index',
    total: items.length,
    results: items
  });
});

// VidAPI Latest Movies & Series Endpoint (Unified)
app.get('/api/vidapi/latest', (req, res) => {
  const type = (req.query.type as 'all' | 'movie' | 'tv') || 'all';
  let items = MEDIA_CATALOG.filter(m => m.isLatest || (typeof m.year === 'number' ? m.year >= 2024 : String(m.year).includes('2024')));
  if (type !== 'all') {
    items = items.filter(m => m.type === type);
  }
  res.json({
    engine: 'VidAPI (vidapi.ru)',
    total: items.length,
    results: items
  });
});

// Helper for heuristic voice fallback when models are under heavy load
function parseVoiceCommandHeuristic(transcript: string, currentMedia: any) {
  const raw = transcript.trim();
  const startsWithJarvis = /^(hey\s+jarvis|ok\s+jarvis|okay\s+jarvis|jarvis)\b/i.test(raw);
  
  // Enforce hotword requirement
  if (!startsWithJarvis && !raw.toLowerCase().includes('jarvis')) {
    return {
      action: 'ignored',
      speechResponse: 'Please address me with the keyword "JARVIS" before stating your command, sir.',
    };
  }

  // Strip hotword prefixes like "jarvis", "hey jarvis", "ok jarvis", "please jarvis"
  let clean = raw.toLowerCase().trim();
  clean = clean.replace(/^(hey\s+jarvis|ok\s+jarvis|okay\s+jarvis|jarvis[,:\s]*)/i, '').trim();

  // Navigation & Return to Home/Terminal Commands
  if (
    clean === 'go back' || 
    clean === 'go back home' || 
    clean === 'go home' || 
    clean === 'return home' || 
    clean === 'back to terminal' || 
    clean === 'return to terminal' || 
    clean === 'open player' || 
    clean === 'back to player' || 
    clean === 'main page' || 
    clean === 'home' ||
    clean.includes('go back home') ||
    clean.includes('go back') ||
    clean.includes('go home')
  ) {
    return {
      action: 'go_home',
      speechResponse: 'Returning to the main streaming terminal, sir.',
    };
  }

  // Video Controls: Pause
  if (
    clean === 'pause' || 
    clean === 'pause video' || 
    clean === 'pause stream' || 
    clean === 'freeze' || 
    clean === 'stop' || 
    clean === 'hold' ||
    clean.includes('pause video') ||
    clean.includes('pause stream') ||
    clean.includes('pause playback')
  ) {
    return {
      action: 'pause',
      speechResponse: 'Pausing stream playback, sir.',
    };
  }

  // Video Controls: Play / Resume / Unpause
  if (
    clean === 'resume' || 
    clean === 'unpause' || 
    clean === 'continue' || 
    clean === 'play video' || 
    clean === 'resume video' || 
    clean === 'resume stream' ||
    clean.includes('resume playback') ||
    clean.includes('unpause video')
  ) {
    return {
      action: 'resume',
      speechResponse: 'Resuming stream playback, sir.',
    };
  }

  // Video Controls: Volume Up
  if (
    clean.includes('volume up') || 
    clean.includes('turn up volume') || 
    clean.includes('increase volume') || 
    clean.includes('raise volume') || 
    clean.includes('make it louder') || 
    clean === 'louder'
  ) {
    return {
      action: 'volume_up',
      speechResponse: 'Increasing audio output, sir.',
    };
  }

  // Video Controls: Volume Down
  if (
    clean.includes('volume down') || 
    clean.includes('turn down volume') || 
    clean.includes('lower volume') || 
    clean.includes('decrease volume') || 
    clean.includes('make it quieter') || 
    clean === 'quieter'
  ) {
    return {
      action: 'volume_down',
      speechResponse: 'Lowering audio output, sir.',
    };
  }

  // Video Controls: Mute
  if (
    clean.includes('mute') || 
    clean.includes('silence audio') || 
    clean.includes('quiet stream')
  ) {
    return {
      action: 'mute',
      speechResponse: 'Muting stream audio, sir.',
    };
  }

  // Video Controls: Unmute
  if (
    clean.includes('unmute') || 
    clean.includes('restore audio') || 
    clean.includes('turn sound on') || 
    clean.includes('audio on')
  ) {
    return {
      action: 'unmute',
      speechResponse: 'Restoring stream audio, sir.',
    };
  }

  // Video Controls: Fullscreen
  if (
    clean.includes('fullscreen') || 
    clean.includes('full screen') || 
    clean.includes('maximize') || 
    clean.includes('expand video')
  ) {
    return {
      action: 'fullscreen',
      speechResponse: 'Engaging full-screen holographic display, sir.',
    };
  }

  // Video Controls: Exit Fullscreen
  if (
    clean.includes('exit fullscreen') || 
    clean.includes('leave fullscreen') || 
    clean.includes('minimize video') || 
    clean.includes('shrink video')
  ) {
    return {
      action: 'exit_fullscreen',
      speechResponse: 'Exiting full-screen display, sir.',
    };
  }

  // Video Controls: Restart / Replay
  if (
    clean.includes('restart') || 
    clean.includes('replay') || 
    clean.includes('reload video') || 
    clean.includes('from the beginning') || 
    clean.includes('start over')
  ) {
    return {
      action: 'restart',
      speechResponse: 'Reinitializing stream from the start, sir.',
    };
  }

  // Video Controls: Forward / Fast Forward
  if (
    clean.includes('fast forward') || 
    clean.includes('skip ahead') || 
    clean.includes('forward') || 
    clean.includes('skip 30 seconds')
  ) {
    return {
      action: 'forward',
      speechResponse: 'Advancing playback, sir.',
    };
  }

  // Video Controls: Rewind / Skip Back
  if (
    clean.includes('rewind') || 
    clean.includes('skip back') || 
    clean.includes('go back 30 seconds') || 
    clean.includes('jump back')
  ) {
    return {
      action: 'rewind',
      speechResponse: 'Rewinding playback, sir.',
    };
  }

  // Next / Previous Episode
  if (clean.includes('next episode') || clean === 'next' || clean.includes('skip episode') || clean.includes('next ep')) {
    return {
      action: 'next_ep',
      speechResponse: 'Advancing to the next episode, sir.',
    };
  }
  if (clean.includes('previous episode') || clean.includes('prev episode') || clean.includes('back episode') || clean.includes('prev ep')) {
    return {
      action: 'prev_ep',
      speechResponse: 'Returning to previous episode, sir.',
    };
  }

  // Season changes
  const seasonMatch = clean.match(/season\s+(\d+)/i);
  if (seasonMatch) {
    const sNum = parseInt(seasonMatch[1], 10);
    return {
      action: 'change_season',
      season: sNum,
      speechResponse: `Setting playback to season ${sNum}, sir.`,
    };
  }

  // Watchlist
  if (clean.includes('watchlist') || clean.includes('vault') || clean.includes('favorites') || clean.includes('saved')) {
    return {
      action: 'watchlist',
      speechResponse: 'Opening your Stark vault archive, sir.',
    };
  }

  // Server switch
  if (clean.includes('server') || clean.includes('gateway') || clean.includes('switch server') || clean.includes('vidapi')) {
    return {
      action: 'toggle_server',
      speechResponse: 'Stream gateway is locked exclusively to VidAPI (vidapi.ru), sir.',
    };
  }

  // Iron Man casual banter & greetings
  if (clean.includes('how are you') || clean.includes('status') || clean.includes('good morning') || clean.includes('good evening') || clean.includes('hello')) {
    return {
      action: 'chat',
      speechResponse: 'All systems operating at peak capacity, sir. Ready for your entertainment directives.',
    };
  }

  if (clean.includes('who are you') || clean.includes('who made you') || clean.includes('tony stark') || clean.includes('iron man')) {
    return {
      action: 'chat',
      speechResponse: 'I am J.A.R.V.I.S., Just A Rather Very Intelligent System, configured for the Stark Stream Terminal.',
    };
  }

  // Mood-based queries & recommendations
  if (clean.includes('recommend') || clean.includes('what should i watch') || clean.includes('suggest') || clean.includes('feel like') || clean.includes('in the mood') || clean.includes('something funny') || clean.includes('something scary') || clean.includes('action') || clean.includes('sci-fi') || clean.includes('thriller') || clean.includes('relax')) {
    const fallbackRecs = generateAiRecommendationFallback(clean);
    return {
      action: 'recommend',
      speechResponse: 'Analyzing your mood matrix, sir. I have extracted prime recommendations from the archive for you.',
      recommendations: fallbackRecs.items,
    };
  }

  // Play / Stream
  if (clean.startsWith('play') || clean.startsWith('stream') || clean.startsWith('watch') || clean.startsWith('put on')) {
    const titleQuery = clean.replace(/^(play|stream|watch|put on)\s+/i, '').replace(/movie|show|tv/gi, '').trim();
    
    // Check against catalog
    const catalogMatch = MEDIA_CATALOG.find(m => 
      m.title.toLowerCase().includes(titleQuery) || 
      titleQuery.includes(m.title.toLowerCase())
    );

    if (catalogMatch) {
      return {
        action: 'play',
        title: catalogMatch.title,
        imdbId: catalogMatch.imdbId,
        tmdbId: catalogMatch.tmdbId ? String(catalogMatch.tmdbId) : undefined,
        mediaType: catalogMatch.type,
        season: 1,
        episode: 1,
        speechResponse: `Right away, sir. Initializing playback for ${catalogMatch.title}.`,
      };
    }

    return {
      action: 'play',
      title: titleQuery,
      speechResponse: `Locating playback stream for ${titleQuery}, sir.`,
    };
  }

  // Generic search
  const searchQuery = clean.replace(/^(search for|search|find|lookup|look up|show me)\s+/i, '').trim();
  return {
    action: 'search',
    query: searchQuery || clean,
    speechResponse: `Scanning database for ${searchQuery || clean}, sir.`,
  };
}

// Helper for heuristic AI recommendations fallback
function generateAiRecommendationFallback(prompt: string) {
  const p = prompt.toLowerCase();
  let matched = MEDIA_CATALOG.filter(item => {
    return (
      p.includes(item.title.toLowerCase()) ||
      item.genres.some(g => p.includes(g.toLowerCase())) ||
      (item.category && p.includes(item.category.toLowerCase())) ||
      (item.overview && item.overview.toLowerCase().split(' ').some(w => w.length > 4 && p.includes(w)))
    );
  });

  if (matched.length === 0) {
    matched = MEDIA_CATALOG.slice(0, 4);
  }

  return {
    reply: `Analysis completed, sir. While satellite uplink is calibrating, I have extracted the optimal archival streams matching your parameters:`,
    items: matched.slice(0, 4).map(m => ({
      id: m.id,
      imdbId: m.imdbId,
      tmdbId: m.tmdbId ? String(m.tmdbId) : undefined,
      title: m.title,
      year: String(m.year),
      type: m.type,
      overview: m.overview,
      rating: m.rating,
      genres: m.genres,
      duration: m.duration,
      poster: m.poster,
    }))
  };
}

// J.A.R.V.I.S. Voice & Natural Language Search Endpoint
app.post('/api/jarvis/voice-command', async (req, res) => {
  const { transcript, currentMedia } = req.body;
  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'Missing transcript' });
  }

  const ai = getGenAI();
  if (!ai) {
    return res.json(parseVoiceCommandHeuristic(transcript, currentMedia));
  }

  const systemPrompt = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's legendary AI from Iron Man.
Interact with the user with Paul Bettany's iconic British charm: witty, calm, respectful, slightly dry humorous, calling the user "sir" or occasionally "boss".
You have full mastery of movie & TV history, streaming archives, mood analysis, trivia, and terminal controls.

Analyze the user's input:
CRITICAL DIRECTIVE: The user MUST address you with "JARVIS" (e.g. "JARVIS pause", "JARVIS volume up", "JARVIS go back", "JARVIS search Inception", "Hey JARVIS ...").
If the transcript does NOT start with or address "JARVIS" (e.g. background conversation or ambient chatter without mentioning JARVIS), return:
- action: 'ignored'
- speechResponse: 'Please address me as JARVIS before giving a command, sir.'

Otherwise, determine the action:
- 'go_home': user wants to return to the main streaming terminal or main page ("JARVIS go back", "JARVIS go back home", "go home", "return to terminal", "open player")
- 'pause': user wants to pause the stream ("JARVIS pause", "pause video", "freeze stream")
- 'resume': user wants to play or resume the video ("JARVIS play", "JARVIS resume", "unpause")
- 'volume_up': user wants to increase volume ("JARVIS volume up", "louder", "turn up sound")
- 'volume_down': user wants to lower volume ("JARVIS volume down", "quieter", "turn down sound")
- 'mute': user wants to mute sound ("JARVIS mute", "silence audio")
- 'unmute': user wants to restore sound ("JARVIS unmute", "sound on")
- 'fullscreen': user wants fullscreen video ("JARVIS fullscreen", "expand player")
- 'exit_fullscreen': user wants to exit fullscreen ("JARVIS exit fullscreen", "minimize player")
- 'restart': user wants to restart or replay the current stream ("JARVIS restart", "start over", "replay")
- 'forward': user wants to fast forward or skip ("JARVIS forward", "skip forward")
- 'rewind': user wants to rewind or skip back ("JARVIS rewind", "skip back")
- 'play': user wants to watch/stream a specific title ("JARVIS play Inception", "JARVIS put on The Dark Knight", "JARVIS let's watch Oppenheimer")
- 'search': user wants to find/search titles by actor, director, genre, or keyword ("JARVIS search Tom Cruise movies", "JARVIS find sci-fi from 1999")
- 'recommend': user describes a mood, asks what to watch, asks for suggestions, or casual preference ("JARVIS I'm feeling like a thriller", "JARVIS what should I watch tonight?", "JARVIS recommend something like Interstellar")
- 'chat': casual Iron Man banter, greeting, question about Tony Stark / Avengers, movie trivia, or general chat ("how are you doing Jarvis?", "who directed Interstellar?", "tell me a joke")
- 'next_ep' / 'prev_ep': episode navigation
- 'change_season': season change
- 'watchlist': user asks for favorites/saved

Always return:
- action: ('go_home' | 'pause' | 'resume' | 'volume_up' | 'volume_down' | 'mute' | 'unmute' | 'fullscreen' | 'exit_fullscreen' | 'restart' | 'forward' | 'rewind' | 'play' | 'search' | 'recommend' | 'chat' | 'next_ep' | 'prev_ep' | 'change_season' | 'watchlist' | 'ignored')
- speechResponse: A crisp, charming, polite, witty JARVIS spoken response (1-2 sentences, max 25 words). Examples:
  - "Right away, sir. Streaming Inception directly to your terminal."
  - "Returning to the main streaming terminal, sir."
  - "Pausing stream playback, sir."
  - "Increasing audio output, sir."
  - "Always at your service, sir."
- title: string (cleaned movie/show title if applicable)
- imdbId: string (standard IMDb tt ID if known, e.g. tt1375666 for Inception, tt0816692 for Interstellar, tt0371746 for Iron Man)
- tmdbId: string (TMDb numeric ID if known)
- mediaType: 'movie' | 'tv'
- season: number (default 1)
- episode: number (default 1)
- recommendations: array of 3-5 high-quality movie/TV recommendations when action is 'recommend' or 'search', including title, year, type ('movie'|'tv'), imdbId (starting with tt), tmdbId, overview (1-2 sentences), rating (number 1-10), genres (array of strings)`;

  // Try each Gemini model in priority order to tolerate 503 high-demand spikes
  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `User voice input: "${transcript}"\nCurrent playing media: ${JSON.stringify(currentMedia || {})}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              title: { type: Type.STRING },
              imdbId: { type: Type.STRING },
              tmdbId: { type: Type.STRING },
              mediaType: { type: Type.STRING },
              season: { type: Type.INTEGER },
              episode: { type: Type.INTEGER },
              speechResponse: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    year: { type: Type.STRING },
                    type: { type: Type.STRING },
                    imdbId: { type: Type.STRING },
                    tmdbId: { type: Type.STRING },
                    overview: { type: Type.STRING },
                    rating: { type: Type.NUMBER },
                    genres: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['title', 'type', 'overview']
                }
              }
            },
            required: ['action', 'speechResponse']
          }
        }
      });

      const text = response.text?.trim();
      if (text) {
        const result = JSON.parse(text);
        return res.json(result);
      }
    } catch {
      // Continue loop silently to try next model in fallback list
    }
  }

  // If models encounter high-demand spikes or transient errors, gracefully serve the heuristic command
  return res.json(parseVoiceCommandHeuristic(transcript, currentMedia));
});

// AI-Powered Smart Recommendation and Conversational Assistant Endpoint
app.post('/api/jarvis/ai-query', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const ai = getGenAI();
  if (!ai) {
    return res.json(generateAiRecommendationFallback(prompt));
  }

  // Try each Gemini model in priority order to tolerate 503 high-demand spikes
  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: `You are J.A.R.V.I.S., the AI interface of the Stark Streaming System.
Respond with high intelligence, calm charm, and helpful media recommendations.
Provide a concise commentary as J.A.R.V.I.S. (refer to the user as "sir" or "commander") and return a structured list of media matches with valid IMDb tt IDs or TMDb IDs so they can be streamed directly.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "IMDb ID starting with tt or TMDb number ID" },
                    imdbId: { type: Type.STRING },
                    tmdbId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    year: { type: Type.STRING },
                    type: { type: Type.STRING, description: "'movie' or 'tv'" },
                    overview: { type: Type.STRING },
                    rating: { type: Type.NUMBER },
                    genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                    duration: { type: Type.STRING }
                  },
                  required: ['id', 'title', 'type', 'overview']
                }
              }
            },
            required: ['reply', 'items']
          }
        }
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      }
    } catch {
      // Continue loop silently to try next model in fallback list
    }
  }

  // If all models encounter high-demand spikes or transient errors, gracefully serve local recommendation archive
  return res.json(generateAiRecommendationFallback(prompt));
});

// Vite middleware & Static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JARVIS TERMINAL] Core online at http://0.0.0.0:${PORT}`);
  });
}

start();
