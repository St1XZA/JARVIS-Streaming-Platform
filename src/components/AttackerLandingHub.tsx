import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Film, 
  Tv, 
  Play, 
  Star, 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface AttackerLandingHubProps {
  catalog: MediaItem[];
  onSelectMedia: (media: MediaItem, season?: number, episode?: number) => void;
  watchlist: MediaItem[];
  onToggleWatchlist: (media: MediaItem) => void;
  onExploreMore?: () => void;
}

export const AttackerLandingHub: React.FC<AttackerLandingHubProps> = ({
  catalog,
  onSelectMedia,
  watchlist,
  onToggleWatchlist,
  onExploreMore,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'all' | 'movies' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedQuality, setSelectedQuality] = useState<string>('All');
  const [liveMovies, setLiveMovies] = useState<MediaItem[]>([]);
  const [liveTvShows, setLiveTvShows] = useState<MediaItem[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);

  // Curate Top Hottest Movies & Series combo for Hero Carousel & Grid
  const trendingCurated = catalog.filter(
    (m) => m.category === 'trending' || m.category === 'blockbusters' || m.isLatest || m.rating >= 8.0
  );

  // Fetch real-time live feeds from VidAPI proxy to combine with catalog
  useEffect(() => {
    let isMounted = true;
    const fetchLiveFeeds = async () => {
      setLoadingLive(true);
      try {
        const [movRes, tvRes] = await Promise.all([
          fetch('/api/vidapi/live/movies?page=1'),
          fetch('/api/vidapi/live/tvshows?page=1')
        ]);

        if (movRes.ok) {
          const movData = await movRes.json();
          if (isMounted && Array.isArray(movData.items)) {
            const mappedMov: MediaItem[] = movData.items.slice(0, 16).map((item: any) => ({
              id: item.imdb_id || String(item.tmdb_id),
              imdbId: item.imdb_id,
              tmdbId: item.tmdb_id,
              type: 'movie',
              title: item.title,
              year: item.year || 2024,
              poster: item.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
              backdrop: item.poster_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80',
              rating: parseFloat(item.rating) > 0 ? parseFloat(item.rating) : 7.8,
              overview: `Live movie transmission on VidAPI protocol. Genre: ${item.genre || 'Action, Drama'}.`,
              genres: item.genre ? item.genre.split(',').map((g: string) => g.trim()) : ['Movie', 'HD'],
              category: 'trending',
              isLatest: true,
            }));
            setLiveMovies(mappedMov);
          }
        }

        if (tvRes.ok) {
          const tvData = await tvRes.json();
          if (isMounted && Array.isArray(tvData.items)) {
            const mappedTv: MediaItem[] = tvData.items.slice(0, 16).map((item: any) => ({
              id: item.imdb_id || String(item.tmdb_id),
              imdbId: item.imdb_id,
              tmdbId: item.tmdb_id,
              type: 'tv',
              title: item.title,
              year: item.year || 2024,
              poster: item.poster_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=500&q=80',
              backdrop: item.poster_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
              rating: parseFloat(item.rating) > 0 ? parseFloat(item.rating) : 8.2,
              overview: `Live television series transmission on VidAPI protocol. Genre: ${item.genre || 'Drama, Series'}.`,
              genres: item.genre ? item.genre.split(',').map((g: string) => g.trim()) : ['Series', 'HD'],
              category: 'series',
              totalSeasons: 4,
              episodesPerSeason: 10,
              isLatest: true,
            }));
            setLiveTvShows(mappedTv);
          }
        }
      } catch (e) {
        console.warn('Failed to load live feeds:', e);
      } finally {
        if (isMounted) setLoadingLive(false);
      }
    };

    fetchLiveFeeds();
    return () => { isMounted = false; };
  }, []);

  const isItemWatchlisted = (id: string) => watchlist.some((w) => w.id === id);

  // Combine curated + live for the "Trending Combo" section
  const combinedMovies = [...catalog.filter(m => m.type === 'movie'), ...liveMovies];
  // Deduplicate by id
  const uniqueMovies = Array.from(new Map(combinedMovies.map(item => [item.id, item])).values());

  const combinedTv = [...catalog.filter(m => m.type === 'tv'), ...liveTvShows];
  const uniqueTv = Array.from(new Map(combinedTv.map(item => [item.id, item])).values());

  // Top combo list (interleaved movies and tv shows)
  const comboHottest: MediaItem[] = [];
  const maxLen = Math.max(uniqueMovies.length, uniqueTv.length);
  for (let i = 0; i < maxLen; i++) {
    if (uniqueMovies[i]) comboHottest.push(uniqueMovies[i]);
    if (uniqueTv[i]) comboHottest.push(uniqueTv[i]);
  }

  // Filter combo list
  const filteredHottest = comboHottest.filter(item => {
    if (activeMainTab === 'movies' && item.type !== 'movie') return false;
    if (activeMainTab === 'tv' && item.type !== 'tv') return false;
    if (selectedGenre !== 'All' && !item.genres.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase()))) return false;
    return true;
  });

  const featuredSpotlight = catalog[0] || uniqueMovies[0]; // A Quiet Place Day One

  const genresList = ['All', 'Action', 'Sci-Fi', 'Horror', 'Drama', 'Adventure', 'Comedy', 'Animation', 'Crime'];

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-4 font-mono space-y-6">
      {/* Attacker.bz Top Featured Spotlight Hero Banner */}
      {featuredSpotlight && (
        <div className="relative border border-[#00f2ff]/40 bg-[#030914] overflow-hidden group shadow-[0_0_25px_rgba(0,242,255,0.15)]">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00f2ff] z-20 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff] z-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff] z-20 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00f2ff] z-20 pointer-events-none"></div>

          <div className="relative min-h-[260px] sm:min-h-[340px] flex flex-col justify-end p-4 sm:p-8">
            {/* Background Backdrop Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={featuredSpotlight.backdrop || featuredSpotlight.poster}
                alt={featuredSpotlight.title}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-full h-full object-cover object-center opacity-40 group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1400&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02050a] via-[#02050a]/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#02050a] via-[#02050a]/80 to-transparent"></div>
            </div>

            {/* Spotlight Content */}
            <div className="relative z-10 max-w-2xl space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-bold tracking-wider uppercase border border-amber-300 shadow-[0_0_10px_#ffaa00] flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-black" />
                  HOTTEST #1 SPOTLIGHT
                </span>
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold uppercase border border-rose-400">
                  HD 1080P
                </span>
                <span className="px-2 py-0.5 bg-black/80 text-[#00f2ff] text-[10px] border border-[#00f2ff]/40 uppercase">
                  {featuredSpotlight.type === 'movie' ? 'FEATURE MOVIE' : 'TV SERIES'}
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-wide text-glow-cyan">
                {featuredSpotlight.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#00f2ff]">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {featuredSpotlight.rating}
                </span>
                <span>•</span>
                <span>{featuredSpotlight.year}</span>
                <span>•</span>
                <span>{featuredSpotlight.duration || `${featuredSpotlight.totalSeasons || 1} Seasons`}</span>
                <span>•</span>
                <span className="text-slate-300">{featuredSpotlight.genres.join(' / ')}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
                {featuredSpotlight.overview}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    jarvisAudio.playStreamInit();
                    onSelectMedia(featuredSpotlight);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-extrabold text-xs tracking-wider shadow-[0_0_15px_#00f2ff] transition-all uppercase"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>STREAM NOW (VIDAPI)</span>
                </button>

                <button
                  onClick={() => {
                    jarvisAudio.playClick();
                    onToggleWatchlist(featuredSpotlight);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 border text-xs font-bold transition-all ${
                    isItemWatchlisted(featuredSpotlight.id)
                      ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]'
                      : 'bg-black/70 text-white border-[#00f2ff]/40 hover:bg-[#00f2ff]/20 hover:border-[#00f2ff]'
                  }`}
                >
                  {isItemWatchlisted(featuredSpotlight.id) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-[#00f2ff]" />
                      <span>SAVED IN VAULT</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>SAVE TO VAULT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attacker.bz Multi-Section Filter & Category Bar */}
      <div className="border border-[#00f2ff]/30 bg-[#02050a]/90 p-3 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00f2ff]/20 pb-2.5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-wider uppercase text-glow-cyan">
              TRENDING COMBO // HOTTEST MOVIES & SERIES
            </h2>
          </div>

          {/* Attacker.bz Tab Switcher (Combo vs Movies vs TV Shows) */}
          <div className="flex items-center gap-1 bg-black/60 p-0.5 border border-[#00f2ff]/30 text-xs">
            <button
              onClick={() => { jarvisAudio.playClick(); setActiveMainTab('all'); }}
              className={`px-3 py-1 font-bold transition-all ${
                activeMainTab === 'all'
                  ? 'bg-[#00f2ff] text-black shadow-[0_0_8px_#00f2ff]'
                  : 'text-[#00f2ff]/70 hover:text-white'
              }`}
            >
              ALL TRENDING
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setActiveMainTab('movies'); }}
              className={`flex items-center gap-1 px-3 py-1 font-bold transition-all ${
                activeMainTab === 'movies'
                  ? 'bg-[#00f2ff] text-black shadow-[0_0_8px_#00f2ff]'
                  : 'text-[#00f2ff]/70 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>MOVIES</span>
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setActiveMainTab('tv'); }}
              className={`flex items-center gap-1 px-3 py-1 font-bold transition-all ${
                activeMainTab === 'tv'
                  ? 'bg-[#00f2ff] text-black shadow-[0_0_8px_#00f2ff]'
                  : 'text-[#00f2ff]/70 hover:text-white'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>TV SERIES</span>
            </button>
          </div>
        </div>

        {/* Quick Genre Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[10px] text-[#00f2ff]/60 uppercase tracking-widest mr-1 shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            GENRE:
          </span>
          {genresList.map((g) => (
            <button
              key={g}
              onClick={() => { jarvisAudio.playClick(); setSelectedGenre(g); }}
              className={`px-2.5 py-0.5 text-[10px] border uppercase transition-all shrink-0 ${
                selectedGenre === g
                  ? 'bg-[#00f2ff]/30 text-white font-bold border-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.4)]'
                  : 'bg-black/50 text-[#00f2ff]/60 border-[#00f2ff]/20 hover:text-[#00f2ff]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Main Hottest Grid (Combo layout matching attacker.bz film_list-grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
        {filteredHottest.slice(0, 18).map((item, idx) => {
          const watchlisted = isItemWatchlisted(item.id);
          return (
            <div
              key={`hot-item-${item.id}-${idx}`}
              onClick={() => {
                jarvisAudio.playStreamInit();
                onSelectMedia(item);
              }}
              className="group relative border border-[#00f2ff]/30 bg-[#02050a] hover:border-[#00f2ff] hover:shadow-[0_0_18px_rgba(0,242,255,0.25)] flex flex-col justify-between transition-all duration-200 overflow-hidden cursor-pointer"
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f2ff] z-20 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f2ff] z-20 pointer-events-none"></div>

              <div>
                {/* Attacker.bz styled poster container with HD and TYPE badges */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                  <img
                    src={item.poster || item.backdrop}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>

                  {/* Top Left Badges: HD + TYPE */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10">
                    <span className="px-1.5 py-0.2 bg-emerald-500 text-black text-[9px] font-bold uppercase border border-emerald-300 shadow-sm">
                      HD
                    </span>
                    <span className="px-1.5 py-0.2 bg-black/80 text-[#00f2ff] text-[9px] border border-[#00f2ff]/40 uppercase flex items-center gap-0.5">
                      {item.type === 'movie' ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5 text-amber-400" />}
                      {item.type}
                    </span>
                  </div>

                  {/* Top Right Vault Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      jarvisAudio.playClick();
                      onToggleWatchlist(item);
                    }}
                    className={`absolute top-1.5 right-1.5 p-1 z-20 border transition-all ${
                      watchlisted
                        ? 'bg-[#00f2ff] text-black border-[#00f2ff] shadow-[0_0_8px_#00f2ff]'
                        : 'bg-black/80 text-[#00f2ff] hover:bg-[#00f2ff]/20 border-[#00f2ff]/30'
                    }`}
                    title={watchlisted ? 'Remove from Stark Vault' : 'Save to Stark Vault'}
                  >
                    {watchlisted ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                  </button>

                  {/* Hover Overlay with Big Play Icon */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <div className="w-11 h-11 bg-[#00f2ff] text-black rounded-full flex items-center justify-center shadow-[0_0_15px_#00f2ff] group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-black translate-x-0.5" />
                    </div>
                  </div>

                  {/* Bottom Rating and Year Chip */}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px] z-10 pointer-events-none">
                    <span className="px-1 py-0.2 bg-black/90 border border-amber-400/40 text-amber-300 font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {item.rating || '8.0'}
                    </span>
                    <span className="px-1 py-0.2 bg-black/90 border border-[#00f2ff]/30 text-[#00f2ff]">
                      {item.year}
                    </span>
                  </div>
                </div>

                {/* Card Title and Genre Info */}
                <div className="p-2 space-y-1">
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-[#00f2ff] transition-colors" title={item.title}>
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[10px] text-[#00f2ff]/60">
                    <span className="truncate">{item.genres.slice(0, 2).join(', ')}</span>
                    <span className="shrink-0">{item.duration || `${item.totalSeasons || 1}S`}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Stream Button */}
              <div className="p-1.5 border-t border-[#00f2ff]/15 bg-black/80">
                <div className="w-full py-1 text-center bg-[#00f2ff]/10 group-hover:bg-[#00f2ff] text-[#00f2ff] group-hover:text-black font-bold text-[9px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>WATCH NOW</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Latest Movies Transmission Row */}
      <div className="border border-[#00f2ff]/30 bg-[#02050a]/90 p-3 space-y-3">
        <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-2">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#00f2ff]" />
            <h3 className="text-xs font-bold text-[#00f2ff] tracking-wider uppercase">
              LATEST MOVIES (ATTACKER ARCHIVES)
            </h3>
          </div>
          {onExploreMore && (
            <button
              onClick={onExploreMore}
              className="text-[10px] text-[#00f2ff]/80 hover:text-white flex items-center gap-1 uppercase"
            >
              <span>EXPLORE ALL MOVIES</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {uniqueMovies.slice(0, 6).map((movie) => (
            <div
              key={`mov-${movie.id}`}
              onClick={() => {
                jarvisAudio.playStreamInit();
                onSelectMedia(movie);
              }}
              className="group relative border border-[#00f2ff]/25 hover:border-[#00f2ff] bg-black/80 overflow-hidden cursor-pointer transition-all"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80';
                  }}
                />
                <div className="absolute top-1 left-1 px-1 py-0.2 bg-emerald-500 text-black text-[8px] font-bold uppercase">
                  HD
                </div>
                <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/90 text-amber-300 text-[8px] font-bold flex items-center gap-0.5">
                  <Star className="w-2 h-2 fill-amber-400" />
                  {movie.rating}
                </div>
              </div>
              <div className="p-1.5">
                <h4 className="text-[11px] font-bold text-white truncate group-hover:text-[#00f2ff]">
                  {movie.title}
                </h4>
                <div className="text-[9px] text-[#00f2ff]/60 flex justify-between">
                  <span>{movie.year}</span>
                  <span>{movie.duration || 'Movie'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Latest TV Shows Transmission Row */}
      <div className="border border-[#00f2ff]/30 bg-[#02050a]/90 p-3 space-y-3">
        <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-2">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-amber-300 tracking-wider uppercase">
              LATEST TV SHOWS & SERIES
            </h3>
          </div>
          {onExploreMore && (
            <button
              onClick={onExploreMore}
              className="text-[10px] text-[#00f2ff]/80 hover:text-white flex items-center gap-1 uppercase"
            >
              <span>EXPLORE ALL SERIES</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {uniqueTv.slice(0, 6).map((tv) => (
            <div
              key={`tv-${tv.id}`}
              onClick={() => {
                jarvisAudio.playStreamInit();
                onSelectMedia(tv, 1, 1);
              }}
              className="group relative border border-[#00f2ff]/25 hover:border-[#00f2ff] bg-black/80 overflow-hidden cursor-pointer transition-all"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                <img
                  src={tv.poster}
                  alt={tv.title}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=500&q=80';
                  }}
                />
                <div className="absolute top-1 left-1 px-1 py-0.2 bg-[#00f2ff] text-black text-[8px] font-bold uppercase">
                  SERIES
                </div>
                <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/90 text-amber-300 text-[8px] font-bold flex items-center gap-0.5">
                  <Star className="w-2 h-2 fill-amber-400" />
                  {tv.rating}
                </div>
              </div>
              <div className="p-1.5">
                <h4 className="text-[11px] font-bold text-white truncate group-hover:text-[#00f2ff]">
                  {tv.title}
                </h4>
                <div className="text-[9px] text-[#00f2ff]/60 flex justify-between">
                  <span>{tv.year}</span>
                  <span>{tv.totalSeasons ? `${tv.totalSeasons} Seasons` : 'TV'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
