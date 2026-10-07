import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Film, 
  Tv, 
  Play, 
  Star, 
  Clock, 
  Calendar, 
  Bookmark, 
  BookmarkCheck, 
  RefreshCw, 
  TrendingUp, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface HotReleasesViewProps {
  onSelectMedia: (media: MediaItem, season?: number, episode?: number) => void;
  watchlist: MediaItem[];
  onToggleWatchlist: (media: MediaItem) => void;
  onNavigateToPlayer: () => void;
}

interface VidApiLiveItem {
  tmdb_id?: number | string;
  imdb_id?: string;
  show_tmdb_id?: number | string;
  show_imdb_id?: string;
  title?: string;
  show_title?: string;
  episode_title?: string;
  year?: string | number;
  air_date?: string;
  poster_url?: string;
  rating?: number | string;
  genre?: string;
  popularity?: string | number;
  type?: 'movie' | 'tv' | 'episode';
  season_number?: number;
  episode_number?: number;
  embed_url?: string;
}

export const HotReleasesView: React.FC<HotReleasesViewProps> = ({
  onSelectMedia,
  watchlist,
  onToggleWatchlist,
  onNavigateToPlayer
}) => {
  const [activeTab, setActiveTab] = useState<'movies' | 'tvshows' | 'episodes'>('movies');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [items, setItems] = useState<VidApiLiveItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent'>('popular');

  const fetchLiveReleases = async (tab: 'movies' | 'tvshows' | 'episodes', pageNum: number) => {
    setLoading(true);
    try {
      const endpoint = `/api/vidapi/live/${tab}?page=${pageNum}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalPages(Math.min(data.total_pages || 1, 50)); // Cap for responsive browsing
      }
    } catch (err) {
      console.error('Failed to load hot VidAPI releases:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveReleases(activeTab, page);
  }, [activeTab, page]);

  const handleRefresh = () => {
    jarvisAudio.playClick();
    setIsRefreshing(true);
    fetchLiveReleases(activeTab, page);
  };

  const handleTabChange = (tab: 'movies' | 'tvshows' | 'episodes') => {
    jarvisAudio.playClick();
    setActiveTab(tab);
    setPage(1);
  };

  const handlePlayLiveItem = (item: VidApiLiveItem) => {
    jarvisAudio.playStreamInit();

    // Map VidAPI item to MediaItem format
    const id = (item.imdb_id || item.show_imdb_id || String(item.tmdb_id || item.show_tmdb_id) || 'tt0000000');
    const title = item.title || item.show_title || 'Untitled Stream';
    const isTv = activeTab === 'tvshows' || activeTab === 'episodes' || item.type === 'tv' || item.type === 'episode';

    const media: MediaItem = {
      id,
      imdbId: item.imdb_id || item.show_imdb_id,
      tmdbId: item.tmdb_id || item.show_tmdb_id,
      type: isTv ? 'tv' : 'movie',
      title,
      year: item.year || (item.air_date ? item.air_date.substring(0, 4) : 2024),
      poster: item.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
      backdrop: item.poster_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80',
      rating: Number(item.rating) || 8.0,
      overview: item.episode_title 
        ? `Episode: ${item.episode_title} (Season ${item.season_number || 1}, Ep ${item.episode_number || 1}). Live sync stream from VidAPI.`
        : `${title} - Live sync stream from VidAPI (vaplayer.ru)`,
      genres: item.genre ? item.genre.split(', ') : ['Hot Release', isTv ? 'Series' : 'Movie'],
      totalSeasons: item.season_number ? Math.max(item.season_number, 1) : 3,
      episodesPerSeason: item.episode_number ? Math.max(item.episode_number, 10) : 12,
      isLatest: true,
      category: 'trending'
    };

    const s = item.season_number || 1;
    const e = item.episode_number || 1;

    onSelectMedia(media, s, e);
    onNavigateToPlayer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isItemWatchlisted = (item: VidApiLiveItem) => {
    const id = item.imdb_id || item.show_imdb_id || String(item.tmdb_id || item.show_tmdb_id);
    return watchlist.some(w => w.id === id || w.imdbId === id);
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 font-mono"
    >
      {/* Top Banner & Header */}
      <div className="border border-[#00f2ff]/30 bg-black/80 p-3 sm:p-4 mb-4 shadow-[0_0_20px_rgba(0,242,255,0.1)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00f2ff]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-amber-400 bg-amber-400/10 flex items-center justify-center text-amber-400 shadow-[0_0_12px_#ffaa00]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
                  HOT MOVIES & SERIES RADAR
                </h2>
                <span className="px-1.5 py-0.5 bg-[#00f2ff]/15 text-[#00f2ff] text-[9px] border border-[#00f2ff]/30 font-bold uppercase">
                  VIDAPI SYNC
                </span>
              </div>
              <p className="text-[11px] text-[#00f2ff]/70">
                Direct live catalog feed from VidAPI discovery index. Stream instantly via VaPlayer engine.
              </p>
            </div>
          </div>

          {/* Quick Refresh & Telemetry */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1 bg-black/60 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] transition-all disabled:opacity-50"
              title="Refresh live catalog feed from VidAPI"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">REFRESH FEED</span>
            </button>
          </div>
        </div>

        {/* Tab Controls & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleTabChange('movies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all ${
                activeTab === 'movies'
                  ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_10px_#ffaa00]'
                  : 'bg-black/50 text-[#00f2ff]/70 border-[#00f2ff]/30 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>HOT MOVIES</span>
            </button>

            <button
              onClick={() => handleTabChange('tvshows')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all ${
                activeTab === 'tvshows'
                  ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_10px_#ffaa00]'
                  : 'bg-black/50 text-[#00f2ff]/70 border-[#00f2ff]/30 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>HOT SERIES</span>
            </button>

            <button
              onClick={() => handleTabChange('episodes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all ${
                activeTab === 'episodes'
                  ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_10px_#ffaa00]'
                  : 'bg-black/50 text-[#00f2ff]/70 border-[#00f2ff]/30 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>LATEST EPISODES</span>
            </button>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#00f2ff]/60 text-[11px]">
              PAGE {page} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { jarvisAudio.playClick(); setPage(p => Math.max(1, p - 1)); }}
                disabled={page <= 1 || loading}
                className="p-1 border border-[#00f2ff]/30 bg-black/60 text-[#00f2ff] hover:bg-[#00f2ff]/20 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { jarvisAudio.playClick(); setPage(p => Math.min(totalPages, p + 1)); }}
                disabled={page >= totalPages || loading}
                className="p-1 border border-[#00f2ff]/30 bg-black/60 text-[#00f2ff] hover:bg-[#00f2ff]/20 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 border border-[#00f2ff]/20 bg-black/60 text-center font-mono">
          <div className="inline-block w-8 h-8 border-2 border-[#00f2ff] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-[#00f2ff] animate-pulse">SYNCHRONIZING VIDAPI TRANSMISSION FEED...</p>
        </div>
      ) : (
        /* Grid of Hot Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {items.map((item, idx) => {
            const title = item.title || item.show_title || 'Untitled';
            const year = item.year || (item.air_date ? item.air_date.substring(0, 4) : '2024');
            const rating = item.rating || '8.2';
            const poster = item.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80';
            const watchlisted = isItemWatchlisted(item);

            return (
              <div
                key={`${item.imdb_id || item.show_imdb_id || idx}`}
                className="group relative border border-[#00f2ff]/30 bg-black/75 hover:border-[#00f2ff] flex flex-col justify-between transition-all duration-200 overflow-hidden"
              >
                {/* HUD Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00f2ff] pointer-events-none z-10"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00f2ff] pointer-events-none z-10"></div>

                <div>
                  {/* Poster Thumbnail */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/80">
                    <img
                      src={poster}
                      alt={title}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>

                    {/* Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                      <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[9px] font-mono font-bold tracking-wider uppercase border border-amber-300 shadow-sm flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        HOT
                      </span>
                      {item.episode_number !== undefined && (
                        <span className="px-1.5 py-0.5 bg-[#00f2ff]/20 text-[#00f2ff] text-[9px] font-mono border border-[#00f2ff]/40 uppercase font-bold">
                          S{item.season_number} E{item.episode_number}
                        </span>
                      )}
                    </div>

                    {/* Rating Overlay */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/80 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{rating}</span>
                    </div>

                    {/* Play Overlay */}
                    <div 
                      onClick={() => handlePlayLiveItem(item)}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur-[2px] transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-[#00f2ff] bg-black/80 flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_#00f2ff] group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-[#00f2ff] translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 space-y-1.5 font-mono">
                    <h3 
                      onClick={() => handlePlayLiveItem(item)}
                      className="text-xs font-bold text-white group-hover:text-[#00f2ff] cursor-pointer line-clamp-1 transition-colors uppercase"
                      title={title}
                    >
                      {title}
                    </h3>

                    {item.episode_title && (
                      <p className="text-[10px] text-[#00f2ff]/80 truncate">
                        Ep: {item.episode_title}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-[#00f2ff]/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{year}</span>
                      </span>
                      {item.genre && (
                        <>
                          <span>•</span>
                          <span className="truncate text-slate-300 max-w-[120px]">{item.genre}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-2 border-t border-[#00f2ff]/20 bg-black/90 flex items-center justify-between gap-1.5 font-mono text-[10px]">
                  <button
                    onClick={() => handlePlayLiveItem(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold transition-all shadow-[0_0_8px_rgba(0,242,255,0.4)]"
                  >
                    <Play className="w-3 h-3 fill-black" />
                    <span>STREAM NOW</span>
                  </button>

                  <button
                    onClick={() => {
                      jarvisAudio.playClick();
                      const id = item.imdb_id || item.show_imdb_id || String(item.tmdb_id || item.show_tmdb_id) || 'tt0000000';
                      const mediaItem: MediaItem = {
                        id,
                        imdbId: item.imdb_id || item.show_imdb_id,
                        tmdbId: item.tmdb_id || item.show_tmdb_id,
                        type: activeTab === 'movies' ? 'movie' : 'tv',
                        title,
                        year,
                        poster,
                        backdrop: poster,
                        rating: Number(rating) || 8.0,
                        overview: `${title} - VidAPI stream`,
                        genres: item.genre ? item.genre.split(', ') : ['Hot']
                      };
                      onToggleWatchlist(mediaItem);
                    }}
                    className={`p-1.5 border transition-all ${
                      watchlisted
                        ? 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff]'
                        : 'bg-black border-[#00f2ff]/30 text-[#00f2ff]/70 hover:text-white hover:border-[#00f2ff]'
                    }`}
                    title={watchlisted ? 'Saved in Stark Vault' : 'Save to Stark Vault'}
                  >
                    {watchlisted ? <BookmarkCheck className="w-3.5 h-3.5 text-[#00f2ff]" /> : <Bookmark className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bottom Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 p-3 border border-[#00f2ff]/30 bg-black/60 text-xs">
          <div className="text-[11px] text-[#00f2ff]/60">
            SHOWING PAGE {page} OF {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { jarvisAudio.playClick(); setPage(p => Math.max(1, p - 1)); }}
              disabled={page <= 1}
              className="flex items-center gap-1 px-2.5 py-1 border border-[#00f2ff]/30 bg-black/80 text-[#00f2ff] hover:bg-[#00f2ff]/20 disabled:opacity-30 disabled:pointer-events-none text-xs"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>PREVIOUS</span>
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setPage(p => Math.min(totalPages, p + 1)); }}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-2.5 py-1 border border-[#00f2ff]/30 bg-black/80 text-[#00f2ff] hover:bg-[#00f2ff]/20 disabled:opacity-30 disabled:pointer-events-none text-xs"
            >
              <span>NEXT</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
};
