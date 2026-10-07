import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Film, 
  Tv, 
  Star, 
  Play, 
  Bookmark, 
  BookmarkCheck, 
  ArrowLeft,
  Sparkles, 
  SlidersHorizontal,
  Compass, 
  Radio, 
  Loader2,
  RefreshCw,
  Zap,
  Mic,
  Home,
  Info
} from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface SearchResultsViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  catalog: MediaItem[];
  onSelectMedia: (media: MediaItem, season?: number, episode?: number) => void;
  watchlist: MediaItem[];
  onToggleWatchlist: (media: MediaItem) => void;
  onNavigateToPlayer: () => void;
  onOpenDirectLauncher: () => void;
  onToggleVoice: () => void;
  onOpenDossier?: (media: MediaItem) => void;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  searchQuery,
  onSearchChange,
  catalog,
  onSelectMedia,
  watchlist,
  onToggleWatchlist,
  onNavigateToPlayer,
  onOpenDirectLauncher,
  onToggleVoice,
  onOpenDossier,
}) => {
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'year'>('relevance');
  const [tmdbResults, setTmdbResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localQuery, setLocalQuery] = useState<string>(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Fetch live search results from TMDb when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTmdbResults([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(() => {
      fetch(`/api/tmdb/search?query=${encodeURIComponent(searchQuery.trim())}`)
        .then(res => (res.ok ? res.json() : { results: [] }))
        .then(data => {
          if (isMounted) {
            setTmdbResults(data.results || []);
            setIsLoading(false);
          }
        })
        .catch(err => {
          console.warn('TMDb search fetch notice:', err);
          if (isMounted) {
            setTmdbResults([]);
            setIsLoading(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Combined Catalog + TMDb deduplicated search results
  const combinedResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    // Filter local catalog
    const localMatches = catalog.filter(item => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.overview?.toLowerCase().includes(q) ||
        item.genres?.some(g => g.toLowerCase().includes(q)) ||
        item.cast?.some(c => c.toLowerCase().includes(q)) ||
        item.director?.toLowerCase().includes(q) ||
        item.id.toLowerCase() === q ||
        item.imdbId?.toLowerCase() === q
      );
    });

    // Merge with TMDb results, avoiding duplicates by id/imdbId
    const seenIds = new Set<string>();
    const merged: MediaItem[] = [];

    for (const item of localMatches) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        if (item.imdbId) seenIds.add(item.imdbId);
        merged.push(item);
      }
    }

    for (const item of tmdbResults) {
      const idKey = item.id;
      const imdbKey = item.imdbId;
      if (!seenIds.has(idKey) && (!imdbKey || !seenIds.has(imdbKey))) {
        seenIds.add(idKey);
        if (imdbKey) seenIds.add(imdbKey);
        merged.push(item);
      }
    }

    // Apply Media Type filter
    let filtered = merged;
    if (mediaTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === mediaTypeFilter);
    }

    // Sort
    if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'year') {
      filtered.sort((a, b) => {
        const yA = typeof a.year === 'number' ? a.year : parseInt(String(a.year)) || 0;
        const yB = typeof b.year === 'number' ? b.year : parseInt(String(b.year)) || 0;
        return yB - yA;
      });
    }

    return filtered;
  }, [searchQuery, catalog, tmdbResults, mediaTypeFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      jarvisAudio.playClick();
      onSearchChange(localQuery.trim());
    }
  };

  const handleQuickPlay = (item: MediaItem) => {
    jarvisAudio.playStreamInit();
    onSelectMedia(item);
    onNavigateToPlayer();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 font-mono">
      {/* Top Breadcrumb & Return to Terminal Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 bg-gradient-to-r from-black via-[#051a2b] to-black border border-[#00f2ff]/40 shadow-[0_0_20px_rgba(0,242,255,0.15)]">
        <button
          onClick={() => {
            jarvisAudio.playClick();
            onNavigateToPlayer();
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_#00f2ff]"
          title="Return to Main Player Terminal (or say 'JARVIS go back' / 'JARVIS go back home')"
        >
          <Home className="w-4 h-4" />
          <span>← RETURN TO MAIN TERMINAL</span>
        </button>

        {/* Voice Command Hint Pill */}
        <div className="flex items-center gap-2 px-3 py-1 bg-black/80 border border-[#00f2ff]/30 text-[11px] text-[#00f2ff]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>VOICE NAVIGATION: Say <strong className="text-white">"JARVIS GO BACK"</strong> or <strong className="text-white">"JARVIS GO BACK HOME"</strong></span>
        </div>
      </div>

      {/* Main Search Query HUD Matrix */}
      <div className="p-4 sm:p-6 bg-black/90 border border-[#00f2ff]/30 relative mb-6 shadow-[0_0_25px_rgba(0,242,255,0.1)]">
        {/* Hologram Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00f2ff] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00f2ff] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#00f2ff]/20 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#00f2ff] animate-pulse" />
              <span className="text-xs uppercase text-[#00f2ff]/70 tracking-widest">
                JARVIS DEEP SEARCH MATRIX
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span>QUERY:</span>
              <span className="text-[#00f2ff] text-glow-cyan">"{searchQuery || 'ALL ARCHIVES'}"</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#00f2ff]/80">
            <div className="px-2.5 py-1 bg-[#00f2ff]/10 border border-[#00f2ff]/30">
              MATCHES FOUND: <strong className="text-white">{combinedResults.length}</strong>
            </div>
            <div className="px-2.5 py-1 bg-black border border-[#00f2ff]/30 hidden sm:block">
              ENGINE: <strong className="text-[#00f2ff]">TMDb + STARK ARCHIVES</strong>
            </div>
          </div>
        </div>

        {/* Live Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f2ff]/60" />
            <input
              type="text"
              value={localQuery}
              onChange={e => setLocalQuery(e.target.value)}
              placeholder="Search by title, actor, director, genre, or IMDb ID..."
              className="w-full bg-black/80 border border-[#00f2ff]/40 pl-9 pr-10 py-2 text-sm text-white placeholder:text-[#00f2ff]/30 focus:outline-none focus:border-[#00f2ff] font-mono shadow-inner"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => { setLocalQuery(''); onSearchChange(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#00f2ff]/60 hover:text-white"
              >
                CLEAR
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_10px_#00f2ff] transition-all flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>SEARCH MATRIX</span>
          </button>

          <button
            type="button"
            onClick={() => { jarvisAudio.playClick(); onToggleVoice(); }}
            className="px-3 py-2 bg-[#00f2ff]/15 hover:bg-[#00f2ff]/30 border border-[#00f2ff] text-[#00f2ff] text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
            title="Ask JARVIS by voice"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>VOICE</span>
          </button>
        </form>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#00f2ff]/15 text-xs">
          {/* Media Type Filter */}
          <div className="flex items-center gap-1 bg-black/60 border border-[#00f2ff]/30 p-0.5">
            <button
              onClick={() => { jarvisAudio.playClick(); setMediaTypeFilter('all'); }}
              className={`px-3 py-1 transition-all ${
                mediaTypeFilter === 'all'
                  ? 'bg-[#00f2ff] text-black font-bold'
                  : 'text-[#00f2ff]/70 hover:text-white'
              }`}
            >
              ALL RESULTS
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setMediaTypeFilter('movie'); }}
              className={`flex items-center gap-1 px-3 py-1 transition-all ${
                mediaTypeFilter === 'movie'
                  ? 'bg-[#00f2ff] text-black font-bold'
                  : 'text-[#00f2ff]/70 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>MOVIES</span>
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setMediaTypeFilter('tv'); }}
              className={`flex items-center gap-1 px-3 py-1 transition-all ${
                mediaTypeFilter === 'tv'
                  ? 'bg-[#00f2ff] text-black font-bold'
                  : 'text-[#00f2ff]/70 hover:text-white'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>TV SHOWS</span>
            </button>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <span className="text-[#00f2ff]/60 text-[10px]">SORT BY:</span>
            <select
              value={sortBy}
              onChange={e => { jarvisAudio.playClick(); setSortBy(e.target.value as any); }}
              className="bg-black border border-[#00f2ff]/40 px-2 py-1 text-xs text-[#00f2ff] font-mono focus:outline-none focus:border-[#00f2ff]"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Highest Rating</option>
              <option value="year">Newest Release</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#00f2ff]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs uppercase tracking-widest animate-pulse">
            JARVIS SEARCH PROTOCOL IN PROGRESS...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && combinedResults.length === 0 && (
        <div className="p-8 sm:p-12 bg-black/80 border border-[#00f2ff]/30 text-center relative shadow-[0_0_20px_rgba(0,242,255,0.1)]">
          <div className="w-12 h-12 border-2 border-[#00f2ff]/40 rounded-full flex items-center justify-center mx-auto mb-4 text-[#00f2ff]">
            <Search className="w-6 h-6 text-[#00f2ff]/60" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white uppercase mb-2">
            No Exact Archival Match Found for "{searchQuery}"
          </h3>
          <p className="text-xs text-[#00f2ff]/70 max-w-md mx-auto mb-6">
            Try adjusting your search query, or launch any movie/show directly using its IMDb (tt...) or TMDb ID on VidAPI.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                jarvisAudio.playClick();
                onOpenDirectLauncher();
              }}
              className="px-4 py-2 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_10px_#00f2ff] transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>DIRECT ID LAUNCHER</span>
            </button>
            <button
              onClick={() => {
                jarvisAudio.playClick();
                onNavigateToPlayer();
              }}
              className="px-4 py-2 bg-black hover:bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] text-xs font-bold uppercase tracking-wider transition-all"
            >
              RETURN TO TERMINAL
            </button>
          </div>
        </div>
      )}

      {/* Search Results Grid */}
      {!isLoading && combinedResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {combinedResults.map((item, index) => {
            const isSaved = watchlist.some(w => w.id === item.id);
            return (
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
                className="group relative bg-[#02050a] border border-[#00f2ff]/30 hover:border-[#00f2ff] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,242,255,0.25)]"
              >
                {/* Poster Container - Clicking opens Dossier */}
                <div 
                  onClick={() => onOpenDossier ? onOpenDossier(item) : handleQuickPlay(item)}
                  className="relative aspect-[2/3] w-full bg-black overflow-hidden cursor-pointer"
                >
                  <img
                    src={item.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80'}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                  />

                  {/* Corner Accent */}
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#00f2ff] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    <span className="px-1.5 py-0.5 bg-black/80 border border-[#00f2ff]/50 text-[9px] font-bold text-[#00f2ff] uppercase">
                      {item.type}
                    </span>
                  </div>

                  {/* Rating Badge */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 border border-amber-400/60 text-amber-300 text-[10px] font-bold flex items-center gap-1 z-10">
                    <Star className="w-2.5 h-2.5 fill-amber-300" />
                    <span>{item.rating ? item.rating.toFixed(1) : '7.5'}</span>
                  </div>

                  {/* Hover Overlay Stream Play & Dossier Button */}
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickPlay(item);
                      }}
                      className="w-11 h-11 bg-[#00f2ff] hover:bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_15px_#00f2ff] transition-transform duration-200 hover:scale-110"
                      title="Stream on Terminal"
                    >
                      <Play className="w-5 h-5 fill-black translate-x-0.5" />
                    </button>
                    <span className="text-[9px] text-[#00f2ff] font-bold uppercase tracking-wider">
                      CLICK FOR DOSSIER
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-2.5 flex-1 flex flex-col justify-between bg-black/90 border-t border-[#00f2ff]/20">
                  <div 
                    onClick={() => onOpenDossier ? onOpenDossier(item) : handleQuickPlay(item)}
                    className="cursor-pointer"
                  >
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00f2ff] transition-colors uppercase">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-[#00f2ff]/60 mt-1">
                      <span>{item.year || '2024'}</span>
                      <span className="text-slate-400 truncate max-w-[100px] text-right">
                        {item.genres?.[0] || 'Feature'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 mt-2 border-t border-[#00f2ff]/15">
                    <button
                      onClick={() => onOpenDossier ? onOpenDossier(item) : handleQuickPlay(item)}
                      className="flex-1 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[10px] font-bold uppercase border border-[#00f2ff]/40 flex items-center justify-center gap-1 transition-all"
                    >
                      <Info className="w-3 h-3 text-[#00f2ff]" />
                      <span>DOSSIER</span>
                    </button>

                    <button
                      onClick={() => {
                        jarvisAudio.playClick();
                        onToggleWatchlist(item);
                      }}
                      className={`p-1 border transition-all ${
                        isSaved
                          ? 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff]'
                          : 'bg-black border-[#00f2ff]/30 text-slate-400 hover:text-white'
                      }`}
                      title={isSaved ? 'Remove from Stark Vault' : 'Save to Stark Vault'}
                    >
                      {isSaved ? <BookmarkCheck className="w-3 h-3 text-[#00f2ff]" /> : <Bookmark className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
