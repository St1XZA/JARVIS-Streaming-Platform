import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Film, 
  Tv, 
  Play, 
  Star, 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  Search, 
  Zap, 
  ChevronRight, 
  Radio, 
  ShieldCheck,
  Info
} from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface JarvisTerminalHomeProps {
  catalog: MediaItem[];
  activeMedia: MediaItem | null;
  onSelectMedia: (media: MediaItem, season?: number, episode?: number) => void;
  watchlist: MediaItem[];
  onToggleWatchlist: (media: MediaItem) => void;
  onOpenDirectLauncher?: () => void;
  onExploreMore?: () => void;
  onSearchSubmit?: (query: string) => void;
  onOpenDossier?: (media: MediaItem) => void;
}

export const JarvisTerminalHome: React.FC<JarvisTerminalHomeProps> = ({
  catalog,
  onSelectMedia,
  watchlist,
  onToggleWatchlist,
  onOpenDirectLauncher,
  onExploreMore,
  onSearchSubmit,
  onOpenDossier,
}) => {
  // Hot list filter tab
  const [hotListTab, setHotListTab] = useState<'all' | 'movies' | 'tv'>('all');
  
  // Latest movies genre filter
  const [movieGenreFilter, setMovieGenreFilter] = useState<string>('All');
  
  // Latest TV genre filter
  const [tvGenreFilter, setTvGenreFilter] = useState<string>('All');

  // Quick Direct Search Bar
  const [quickInput, setQuickInput] = useState<string>('');

  // Real-time live API feeds state
  const [liveLatestMovies, setLiveLatestMovies] = useState<MediaItem[]>([]);
  const [liveLatestTv, setLiveLatestTv] = useState<MediaItem[]>([]);
  const [liveHottest, setLiveHottest] = useState<MediaItem[]>([]);

  // Fetch real-time live feeds on mount
  useEffect(() => {
    let isMounted = true;
    const fetchFeeds = async () => {
      try {
        const [movRes, tvRes, hotRes] = await Promise.all([
          fetch('/api/media/latest-movies').catch(() => null),
          fetch('/api/media/latest-tv').catch(() => null),
          fetch('/api/media/hottest').catch(() => null),
        ]);

        if (movRes && movRes.ok) {
          const movData = await movRes.json();
          if (isMounted && Array.isArray(movData.results) && movData.results.length > 0) {
            setLiveLatestMovies(movData.results);
          }
        }

        if (tvRes && tvRes.ok) {
          const tvData = await tvRes.json();
          if (isMounted && Array.isArray(tvData.results) && tvData.results.length > 0) {
            setLiveLatestTv(tvData.results);
          }
        }

        if (hotRes && hotRes.ok) {
          const hotData = await hotRes.json();
          if (isMounted && Array.isArray(hotData.results) && hotData.results.length > 0) {
            setLiveHottest(hotData.results);
          }
        }
      } catch (err) {
        console.warn('Live media feeds load error:', err);
      }
    };

    fetchFeeds();
    return () => { isMounted = false; };
  }, []);

  // Hot List (Top 10 ranked)
  const hotListItems = useMemo(() => {
    const combinedHot = [...liveHottest, ...catalog.filter(m => m.rating >= 7.5 || m.isLatest || m.category === 'trending')];
    const unique = Array.from(new Map(combinedHot.map(item => [item.id, item])).values());
    let items = unique;
    if (hotListTab === 'movies') {
      items = items.filter(m => m.type === 'movie');
    } else if (hotListTab === 'tv') {
      items = items.filter(m => m.type === 'tv');
    }
    return items.sort((a, b) => b.rating - a.rating).slice(0, 10);
  }, [catalog, liveHottest, hotListTab]);

  // Latest Movies
  const latestMovies = useMemo(() => {
    const combined = [...liveLatestMovies, ...catalog.filter(m => m.type === 'movie')];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    let movies = unique;
    if (movieGenreFilter !== 'All') {
      movies = movies.filter(m => m.genres?.some(g => g.toLowerCase().includes(movieGenreFilter.toLowerCase())));
    }
    return movies.slice(0, 12);
  }, [catalog, liveLatestMovies, movieGenreFilter]);

  // Latest TV Series
  const latestTvShows = useMemo(() => {
    const combined = [...liveLatestTv, ...catalog.filter(m => m.type === 'tv')];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    let shows = unique;
    if (tvGenreFilter !== 'All') {
      shows = shows.filter(m => m.genres?.some(g => g.toLowerCase().includes(tvGenreFilter.toLowerCase())));
    }
    return shows.slice(0, 12);
  }, [catalog, liveLatestTv, tvGenreFilter]);

  // Marvel & Sci-Fi Collections
  const marvelVault = useMemo(() => {
    return catalog.filter(m => m.category === 'marvel').slice(0, 8);
  }, [catalog]);

  const scifiVault = useMemo(() => {
    return catalog.filter(m => m.category === 'scifi' || m.category === 'cyberpunk').slice(0, 8);
  }, [catalog]);

  const isItemWatchlisted = (id: string) => watchlist.some((w) => w.id === id);

  const handleLaunchMedia = (media: MediaItem, s: number = 1, e: number = 1) => {
    jarvisAudio.playAcknowledge();
    onSelectMedia(media, s, e);
    // Smooth scroll to video player
    const playerEl = document.getElementById('jarvis-stream-player');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCardClick = (item: MediaItem) => {
    if (onOpenDossier) {
      jarvisAudio.playClick();
      onOpenDossier(item);
    } else {
      handleLaunchMedia(item);
    }
  };

  // Search submit -> NEVER auto-plays immediately; routes directly to search results
  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickInput.trim();
    if (!query) return;

    jarvisAudio.playClick();
    if (onSearchSubmit) {
      onSearchSubmit(query);
    }
  };

  const movieGenres = ['All', 'Sci-Fi', 'Action', 'Horror', 'Adventure', 'Animation', 'Drama', 'Comedy'];
  const tvGenres = ['All', 'Sci-Fi', 'Drama', 'Action', 'Fantasy', 'Animation', 'Crime'];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 font-mono space-y-8">

      {/* ========================================================= */}
      {/* 1. QUICK TERMINAL SEARCH & DIRECT ID LAUNCHER MATRIX      */}
      {/* ========================================================= */}
      <section className="bg-black/80 border border-[#00f2ff]/40 p-3.5 sm:p-4 shadow-[0_0_20px_rgba(0,242,255,0.1)]">
        <form onSubmit={handleQuickSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#00f2ff] font-bold uppercase shrink-0">
            <Search className="w-4 h-4 text-[#00f2ff] animate-pulse" />
            <span>TERMINAL QUERY:</span>
          </div>
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Search movies, series, or actors (e.g. Inception, Shōgun, Batman)..."
              className="w-full bg-black/90 border border-[#00f2ff]/40 px-3 py-2 text-xs font-mono text-white placeholder-[#00f2ff]/40 focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2 bg-[#00f2ff] hover:bg-white text-black text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_10px_rgba(0,242,255,0.3)] flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>SEARCH</span>
            </button>
            {onOpenDirectLauncher && (
              <button
                type="button"
                onClick={() => {
                  jarvisAudio.playClick();
                  onOpenDirectLauncher();
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1"
                title="Open Direct ID Launcher"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>DIRECT ID</span>
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ========================================================= */}
      {/* 2. 🔥 JARVIS HOT LIST (TOP 10 LIVE TRENDING RADAR)         */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00f2ff]/30 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-500/20 border border-rose-400 text-rose-400">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase text-glow-cyan flex items-center gap-2">
                <span>JARVIS HOT LIST</span>
                <span className="text-[10px] px-2 py-0.2 bg-rose-500/20 border border-rose-400 text-rose-300 font-bold">
                  TOP 10 STREAMING
                </span>
              </h2>
              <p className="text-[10px] text-[#00f2ff]/70">Most transmitted media titles across VidFast & VidAPI clusters</p>
            </div>
          </div>

          {/* Hot list filter tabs */}
          <div className="flex items-center gap-1 bg-black/80 border border-[#00f2ff]/30 p-0.5 text-[11px]">
            <button
              onClick={() => { jarvisAudio.playClick(); setHotListTab('all'); }}
              className={`px-2.5 py-1 transition-all ${
                hotListTab === 'all'
                  ? 'bg-[#00f2ff] text-black font-bold'
                  : 'text-[#00f2ff]/70 hover:text-white'
              }`}
            >
              ALL TOP 10
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setHotListTab('movies'); }}
              className={`px-2.5 py-1 transition-all ${
                hotListTab === 'movies'
                  ? 'bg-[#00f2ff] text-black font-bold'
                  : 'text-[#00f2ff]/70 hover:text-white'
              }`}
            >
              MOVIES
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setHotListTab('tv'); }}
              className={`px-2.5 py-1 transition-all ${
                hotListTab === 'tv'
                  ? 'bg-[#00f2ff] text-black font-bold'
                  : 'text-[#00f2ff]/70 hover:text-white'
              }`}
            >
              TV SERIES
            </button>
          </div>
        </div>

        {/* Hot List Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {hotListItems.map((item, idx) => {
            const rank = idx + 1;
            const rankStr = rank < 10 ? `0${rank}` : `${rank}`;
            return (
              <div
                key={item.id}
                className="group relative bg-[#030914] border border-[#00f2ff]/30 hover:border-[#00f2ff] transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(0,242,255,0.25)]"
              >
                {/* Poster Frame */}
                <div 
                  onClick={() => handleCardClick(item)}
                  className="relative aspect-[2/3] overflow-hidden bg-black cursor-pointer"
                >
                  <img
                    src={item.poster}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030914] via-transparent to-transparent opacity-80"></div>

                  {/* Giant Rank Number Hologram */}
                  <div className="absolute top-1 left-2 font-black text-3xl sm:text-4xl text-[#00f2ff]/30 group-hover:text-[#00f2ff] transition-colors pointer-events-none drop-shadow-[0_2px_8px_rgba(0,242,255,0.4)]">
                    #{rankStr}
                  </div>

                  {/* Top Right Type Tag */}
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] px-1.5 py-0.5 bg-black/80 border border-[#00f2ff]/50 text-[#00f2ff] uppercase font-bold">
                      {item.type === 'tv' ? 'TV' : 'MOVIE'}
                    </span>
                  </div>

                  {/* Hover Overlay Buttons */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/65 backdrop-blur-[2px] p-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchMedia(item);
                      }}
                      className="w-11 h-11 rounded-full bg-[#00f2ff] text-black flex items-center justify-center shadow-[0_0_20px_#00f2ff] hover:scale-110 transition-transform"
                      title={`Stream ${item.title}`}
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                    <span className="text-[9px] text-[#00f2ff] font-bold tracking-wider uppercase">
                      CLICK FOR DOSSIER
                    </span>
                  </div>
                </div>

                {/* Card Intel Details */}
                <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div 
                    onClick={() => handleCardClick(item)}
                    className="cursor-pointer"
                  >
                    <h3 className="text-xs font-bold text-white group-hover:text-[#00f2ff] line-clamp-1 transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-center justify-between text-[10px] text-[#00f2ff]/70 pt-0.5">
                      <span>{item.year}</span>
                      <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                        <Star className="w-2.5 h-2.5 fill-amber-300" />
                        {item.rating ? item.rating.toFixed(1) : '8.0'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-[#00f2ff]/20">
                    <button
                      onClick={() => handleCardClick(item)}
                      className="flex-1 py-1 bg-[#00f2ff]/15 hover:bg-[#00f2ff] text-[#00f2ff] hover:text-black border border-[#00f2ff]/40 text-[9px] font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-1"
                    >
                      <Info className="w-2.5 h-2.5" />
                      <span>DOSSIER</span>
                    </button>

                    <button
                      onClick={() => {
                        jarvisAudio.playClick();
                        onToggleWatchlist(item);
                      }}
                      className={`p-1 border transition-all ${
                        isItemWatchlisted(item.id)
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-black border-[#00f2ff]/30 text-[#00f2ff]/60 hover:text-white'
                      }`}
                      title="Toggle Stark Vault"
                    >
                      <Bookmark className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. 🎬 LATEST MOVIES (2024-2025 CINEMATIC FEED)             */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00f2ff]/30 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#00f2ff]/20 border border-[#00f2ff] text-[#00f2ff]">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase text-glow-cyan flex items-center gap-2">
                <span>LATEST MOVIES</span>
                <span className="text-[10px] px-2 py-0.2 bg-[#00f2ff]/15 border border-[#00f2ff]/40 text-[#00f2ff] font-bold">
                  NOW PLAYING
                </span>
              </h2>
              <p className="text-[10px] text-[#00f2ff]/70">Fresh cinema masters ready for instant 4K transmission</p>
            </div>
          </div>

          {/* Movie Genre Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px]">
            {movieGenres.map((g) => (
              <button
                key={g}
                onClick={() => { jarvisAudio.playClick(); setMovieGenreFilter(g); }}
                className={`px-2 py-0.5 transition-all border whitespace-nowrap ${
                  movieGenreFilter === g
                    ? 'bg-[#00f2ff] text-black border-[#00f2ff] font-bold'
                    : 'bg-black/60 border-[#00f2ff]/30 text-slate-300 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {latestMovies.map((movie) => (
            <div
              key={movie.id}
              className="group relative bg-[#030914] border border-[#00f2ff]/30 hover:border-[#00f2ff] transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div 
                onClick={() => handleCardClick(movie)}
                className="relative aspect-[2/3] overflow-hidden bg-black cursor-pointer"
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                />
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] px-1 bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono font-bold">
                    4K UHD
                  </span>
                </div>
                <div className="absolute top-1.5 right-1.5">
                  <span className="text-[9px] px-1 bg-black/80 border border-[#00f2ff]/40 text-[#00f2ff] font-mono">
                    {movie.year}
                  </span>
                </div>

                {/* Hover Play Button */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/65 backdrop-blur-[2px] p-2 gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchMedia(movie);
                    }}
                    className="w-10 h-10 rounded-full bg-[#00f2ff] text-black flex items-center justify-center shadow-[0_0_15px_#00f2ff] hover:scale-110 transition-transform"
                    title={`Stream ${movie.title}`}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                  <span className="text-[8px] text-[#00f2ff] font-bold uppercase">DOSSIER</span>
                </div>
              </div>

              <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
                <div 
                  onClick={() => handleCardClick(movie)}
                  className="cursor-pointer"
                >
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00f2ff] line-clamp-1 transition-colors">
                    {movie.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{movie.duration || 'Feature'}</span>
                    <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      {movie.rating ? movie.rating.toFixed(1) : '7.8'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-1 border-t border-[#00f2ff]/20">
                  <button
                    onClick={() => handleCardClick(movie)}
                    className="flex-1 py-0.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff] text-[#00f2ff] hover:text-black border border-[#00f2ff]/30 text-[9px] font-bold uppercase transition-all tracking-wider text-center"
                  >
                    DOSSIER
                  </button>
                  <button
                    onClick={() => {
                      jarvisAudio.playClick();
                      onToggleWatchlist(movie);
                    }}
                    className={`p-1 border text-[9px] ${
                      isItemWatchlisted(movie.id)
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-black border-[#00f2ff]/30 text-[#00f2ff]/60'
                    }`}
                  >
                    <Bookmark className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. 📺 LATEST TV SERIES & SHOWS (BINGE TELEMETRY)          */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00f2ff]/30 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/20 border border-amber-400 text-amber-300">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase text-glow-cyan flex items-center gap-2">
                <span>LATEST TV SERIES & EPISODES</span>
                <span className="text-[10px] px-2 py-0.2 bg-amber-500/20 border border-amber-400 text-amber-300 font-bold">
                  ON THE AIR
                </span>
              </h2>
              <p className="text-[10px] text-[#00f2ff]/70">Full seasons and episodic streams with VidFast & VidAPI auto-next</p>
            </div>
          </div>

          {/* TV Genre Filters */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px]">
            {tvGenres.map((g) => (
              <button
                key={g}
                onClick={() => { jarvisAudio.playClick(); setTvGenreFilter(g); }}
                className={`px-2 py-0.5 transition-all border whitespace-nowrap ${
                  tvGenreFilter === g
                    ? 'bg-amber-400 text-black border-amber-400 font-bold'
                    : 'bg-black/60 border-[#00f2ff]/30 text-slate-300 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* TV Series Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {latestTvShows.map((tvShow) => (
            <div
              key={tvShow.id}
              className="group relative bg-[#030914] border border-[#00f2ff]/30 hover:border-[#00f2ff] transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div 
                onClick={() => handleCardClick(tvShow)}
                className="relative aspect-[2/3] overflow-hidden bg-black cursor-pointer"
              >
                <img
                  src={tvShow.poster}
                  alt={tvShow.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                />
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] px-1 bg-purple-500/20 border border-purple-400 text-purple-300 font-mono font-bold">
                    SERIES
                  </span>
                </div>
                <div className="absolute top-1.5 right-1.5">
                  <span className="text-[9px] px-1 bg-black/80 border border-[#00f2ff]/40 text-[#00f2ff] font-mono font-bold">
                    {tvShow.totalSeasons ? `${tvShow.totalSeasons} S` : 'Series'}
                  </span>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/65 backdrop-blur-[2px] p-2 gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchMedia(tvShow, 1, 1);
                    }}
                    className="w-10 h-10 rounded-full bg-[#00f2ff] text-black flex items-center justify-center shadow-[0_0_15px_#00f2ff] hover:scale-110 transition-transform"
                    title={`Stream ${tvShow.title}`}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                  <span className="text-[8px] text-[#00f2ff] font-bold uppercase">DOSSIER</span>
                </div>
              </div>

              <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
                <div 
                  onClick={() => handleCardClick(tvShow)}
                  className="cursor-pointer"
                >
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00f2ff] line-clamp-1 transition-colors">
                    {tvShow.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{tvShow.year}</span>
                    <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                      {tvShow.rating ? tvShow.rating.toFixed(1) : '8.2'}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-1 border-t border-[#00f2ff]/20">
                  <button
                    onClick={() => handleCardClick(tvShow)}
                    className="flex-1 py-0.5 bg-amber-500/15 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-500/40 text-[9px] font-bold uppercase transition-all tracking-wider text-center"
                  >
                    DOSSIER
                  </button>
                  <button
                    onClick={() => {
                      jarvisAudio.playClick();
                      onToggleWatchlist(tvShow);
                    }}
                    className={`p-1 border text-[9px] ${
                      isItemWatchlisted(tvShow.id)
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-black border-[#00f2ff]/30 text-[#00f2ff]/60'
                    }`}
                  >
                    <Bookmark className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. 🌌 STARK MCU & SCI-FI ARCHIVES                          */}
      {/* ========================================================= */}
      <section className="space-y-4 bg-black/60 border border-[#00f2ff]/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00f2ff]/20 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00f2ff]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#00f2ff] text-glow-cyan">
              STARK INDUSTRIES CLASSIFIED ARCHIVES (MARVEL & SCI-FI)
            </h2>
          </div>
          {onExploreMore && (
            <button
              onClick={() => {
                jarvisAudio.playClick();
                onExploreMore();
              }}
              className="text-xs text-[#00f2ff]/80 hover:text-[#00f2ff] flex items-center gap-1"
            >
              <span>EXPLORE ALL ARCHIVES</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {[...marvelVault.slice(0, 4), ...scifiVault.slice(0, 4)].map((item) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="group cursor-pointer bg-black border border-[#00f2ff]/20 hover:border-[#00f2ff] p-1.5 transition-all flex flex-col justify-between"
            >
              <div className="aspect-[2/3] overflow-hidden bg-black mb-1">
                <img
                  src={item.poster}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <h5 className="text-[10px] font-bold text-white group-hover:text-[#00f2ff] line-clamp-1">
                {item.title}
              </h5>
              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                <span>{item.year}</span>
                <span className="text-amber-300 font-bold">{item.rating?.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
