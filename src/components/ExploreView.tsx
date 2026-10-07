import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Film, 
  Tv, 
  Star, 
  Play, 
  Bookmark, 
  BookmarkCheck, 
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown,
  X,
  Compass,
  Zap,
  Tag,
  Radio,
  Plus,
  Loader2
} from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface ExploreViewProps {
  catalog: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  watchlist: MediaItem[];
  onToggleWatchlist: (media: MediaItem) => void;
  onNavigateToPlayer: () => void;
  onOpenDirectLauncher: () => void;
  initialSearchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const ALL_GENRES = [
  'All',
  'Sci-Fi',
  'Action',
  'Adventure',
  'Animation',
  'Crime',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Thriller'
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  catalog = [],
  onSelectMedia,
  watchlist = [],
  onToggleWatchlist,
  onNavigateToPlayer,
  onOpenDirectLauncher,
  initialSearchQuery = '',
  onSearchChange,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'rating' | 'newest' | 'oldest' | 'title'>('rating');

  // Direct quick stream input
  const [directInput, setDirectInput] = useState('');

  // Online TMDb / Free Media Search State
  const [onlineResults, setOnlineResults] = useState<MediaItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [searchEngine, setSearchEngine] = useState<string>('TMDb & VidAPI Neural Index');

  // Multi-page Discovery Stream
  const [discoveredItems, setDiscoveredItems] = useState<MediaItem[]>([]);
  const [discoverPage, setDiscoverPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMorePages, setHasMorePages] = useState<boolean>(true);

  // Sync external search query if changed
  useEffect(() => {
    if (initialSearchQuery !== undefined && initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleSearchInputChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Live TMDb & Free Suggestions Search with debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(`/api/vidapi/search?query=${encodeURIComponent(q)}&type=${selectedType}`);
        if (res.ok) {
          const data = await res.json();
          setOnlineResults(data.results || []);
          if (data.engine) setSearchEngine(data.engine);
        }
      } catch {
        // Continue with local results on network error
      } finally {
        setIsSearchingOnline(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedType]);

  // Load next page of media from discover endpoint
  const handleLoadMore = async () => {
    jarvisAudio.playClick();
    setIsLoadingMore(true);
    try {
      const nextPage = discoverPage + 1;
      const res = await fetch(`/api/media/discover?page=${nextPage}&pageSize=18&type=${selectedType}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          setDiscoveredItems(prev => [...prev, ...data.results]);
          setDiscoverPage(nextPage);
          setHasMorePages(Boolean(data.hasMore));
        } else {
          setHasMorePages(false);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Combined Catalog (initial catalog + dynamically discovered items)
  const masterCatalog = useMemo(() => {
    const seen = new Set<string>();
    const list: MediaItem[] = [];

    for (const item of catalog) {
      seen.add(item.id.toLowerCase());
      list.push(item);
    }
    for (const item of discoveredItems) {
      if (!seen.has(item.id.toLowerCase())) {
        seen.add(item.id.toLowerCase());
        list.push(item);
      }
    }
    return list;
  }, [catalog, discoveredItems]);

  // Filtering & Sorting
  const filteredCatalog = useMemo(() => {
    let result = masterCatalog.filter((item) => {
      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      // Genre filter
      if (selectedGenre !== 'All' && !item.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase())) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q) || 
                          (item.imdbId && item.imdbId.toLowerCase().includes(q)) || 
                          (item.tmdbId && String(item.tmdbId).includes(q));
        const matchesOverview = item.overview && item.overview.toLowerCase().includes(q);
        const matchesCast = item.cast && item.cast.some(c => c.toLowerCase().includes(q));
        const matchesDirector = item.director && item.director.toLowerCase().includes(q);
        const matchesGenre = item.genres.some(g => g.toLowerCase().includes(q));

        if (!matchesTitle && !matchesId && !matchesOverview && !matchesCast && !matchesDirector && !matchesGenre) {
          return false;
        }
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'newest') {
        const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year).substring(0, 4), 10) || 0;
        const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year).substring(0, 4), 10) || 0;
        return yearB - yearA;
      }
      if (sortBy === 'oldest') {
        const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year).substring(0, 4), 10) || 0;
        const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year).substring(0, 4), 10) || 0;
        return yearA - yearB;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [masterCatalog, searchQuery, selectedType, selectedGenre, sortBy]);

  // Combined Results: Merges local catalog matches with online TMDb / Free index results
  const displayedItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredCatalog;
    }

    const seenIds = new Set<string>();
    const combined: MediaItem[] = [];

    // Prioritize exact/local catalog matches
    for (const item of filteredCatalog) {
      const key = item.imdbId || String(item.tmdbId) || item.id;
      seenIds.add(key.toLowerCase());
      combined.push(item);
    }

    // Append online results from TMDb / free index
    for (const online of onlineResults) {
      const key = online.imdbId || String(online.tmdbId) || online.id;
      if (!seenIds.has(key.toLowerCase()) && !seenIds.has(online.id.toLowerCase())) {
        seenIds.add(key.toLowerCase());
        seenIds.add(online.id.toLowerCase());
        combined.push(online);
      }
    }

    return combined;
  }, [filteredCatalog, onlineResults, searchQuery]);

  const handlePlayMedia = (item: MediaItem) => {
    jarvisAudio.playClick();
    onSelectMedia(item);
    onNavigateToPlayer();
  };

  const handleQuickDirectStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directInput.trim()) return;

    const val = directInput.trim();
    const isImdb = val.toLowerCase().startsWith('tt');
    const type = isImdb ? 'movie' : 'movie';

    const customMedia: MediaItem = {
      id: val,
      imdbId: isImdb ? val : undefined,
      tmdbId: !isImdb ? val : undefined,
      title: `Stream [${val.toUpperCase()}]`,
      type: type,
      year: new Date().getFullYear(),
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60',
      backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
      rating: 8.0,
      overview: `Custom stream loaded directly for identifier ${val} via VidAPI protocol.`,
      genres: ['Custom', 'Direct Stream'],
    };

    jarvisAudio.playAcknowledge();
    onSelectMedia(customMedia);
    onNavigateToPlayer();
  };

  const isItemWatchlisted = (id: string) => watchlist.some(w => w.id === id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-4 font-mono"
    >
      {/* Search & Explore Control HUD */}
      <div className="border border-[#00f2ff]/30 bg-black/70 p-3 sm:p-4 text-xs space-y-3 relative overflow-hidden">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#00f2ff]/20 pb-2.5">
          <div className="flex items-center gap-2 text-[#00f2ff]">
            <Compass className="w-4 h-4 text-[#00f2ff] animate-spin-slow" />
            <span className="font-bold text-sm tracking-wider">MEDIA MATRIX EXPLORER // VIDAPI PROTOCOL</span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {isSearchingOnline && (
              <span className="flex items-center gap-1 text-[#00f2ff] animate-pulse">
                <Radio className="w-3 h-3 text-[#00f2ff]" />
                <span>QUERYING TMDB & GLOBAL ARCHIVES...</span>
              </span>
            )}
            <span className="text-[#00f2ff]/70">MATCHES:</span>
            <span className="px-2 py-0.5 bg-[#00f2ff] text-black font-bold font-mono">
              {displayedItems.length}
            </span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f2ff]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              placeholder="Search by title, IMDb tt..., TMDb ID, actor (e.g. Inception, Gladiator, Breaking Bad)..."
              className="w-full pl-9 pr-8 py-2 bg-black border border-[#00f2ff]/40 text-[#00f2ff] placeholder-[#00f2ff]/40 text-xs focus:outline-none focus:border-[#00f2ff] focus:shadow-[0_0_10px_rgba(0,242,255,0.3)] transition-all uppercase"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchInputChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#00f2ff]/60 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Direct Stream launcher input */}
          <form onSubmit={handleQuickDirectStream} className="flex items-center gap-1">
            <input
              type="text"
              value={directInput}
              onChange={(e) => setDirectInput(e.target.value)}
              placeholder="Instant ID (e.g. tt29623480)"
              className="w-44 px-2.5 py-2 bg-black border border-[#00f2ff]/40 text-[#00f2ff] placeholder-[#00f2ff]/40 text-xs focus:outline-none focus:border-[#00f2ff]"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold text-xs shrink-0 flex items-center gap-1 shadow-[0_0_8px_#00f2ff]"
              title="Launch custom ID immediately"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>LAUNCH</span>
            </button>
          </form>
        </div>

        {/* Quick Suggestion Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] pt-1 border-t border-[#00f2ff]/10">
          <span className="text-[#00f2ff]/50 shrink-0 font-bold">HOT SEARCHES:</span>
          {['Deadpool & Wolverine', 'Oppenheimer', 'Interstellar', 'The Last of Us', 'The Boys', 'Stranger Things', 'Transformers One', 'Inside Out 2', 'The Batman'].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                jarvisAudio.playClick();
                handleSearchInputChange(preset);
              }}
              className="px-2 py-0.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/30 text-[#00f2ff] border border-[#00f2ff]/20 shrink-0 transition-all text-[10px]"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Filters and Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#00f2ff]/15">
          {/* Media Type Buttons */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#00f2ff]/60 mr-1">TYPE:</span>
            <button
              onClick={() => { jarvisAudio.playClick(); setSelectedType('all'); }}
              className={`px-2.5 py-1 text-[10px] border transition-all ${
                selectedType === 'all'
                  ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff]'
                  : 'bg-black/50 text-[#00f2ff]/70 border-[#00f2ff]/20 hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setSelectedType('movie'); }}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] border transition-all ${
                selectedType === 'movie'
                  ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff]'
                  : 'bg-black/50 text-[#00f2ff]/70 border-[#00f2ff]/20 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>MOVIES</span>
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setSelectedType('tv'); }}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] border transition-all ${
                selectedType === 'tv'
                  ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff]'
                  : 'bg-black/50 text-[#00f2ff]/70 border-[#00f2ff]/20 hover:text-white'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>TV SHOWS</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#00f2ff]/60 mr-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
              <span>SORT:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                jarvisAudio.playClick();
                setSortBy(e.target.value as any);
              }}
              className="bg-black border border-[#00f2ff]/30 text-[#00f2ff] text-[10px] px-2 py-1 focus:outline-none focus:border-[#00f2ff]"
            >
              <option value="rating">Highest Rated</option>
              <option value="newest">Release Year (Newest)</option>
              <option value="oldest">Release Year (Oldest)</option>
              <option value="title">Title (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Genre Tags Scroll */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px]">
          <span className="text-[#00f2ff]/60 shrink-0 mr-1">GENRES:</span>
          {ALL_GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => {
                jarvisAudio.playClick();
                setSelectedGenre(genre);
              }}
              className={`px-2 py-0.5 shrink-0 border uppercase transition-all ${
                selectedGenre === genre
                  ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff]'
                  : 'bg-black/60 text-[#00f2ff]/70 border-[#00f2ff]/20 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Explorable Media Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayedItems.map((item, idx) => {
          const watchlisted = isItemWatchlisted(item.id);
          return (
            <div
              key={`explore-card-${item.id}-${idx}`}
              className="group relative border border-[#00f2ff]/30 bg-black/80 hover:border-[#00f2ff] flex flex-col justify-between transition-all duration-200 overflow-hidden"
            >
              {/* Corner HUD Accent Brackets */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00f2ff] pointer-events-none z-10"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00f2ff] pointer-events-none z-10"></div>

              <div>
                {/* Poster Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/90">
                  <img
                    src={item.backdrop || item.poster}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                    <span className="px-1.5 py-0.5 bg-black/80 text-[#00f2ff] text-[9px] font-mono border border-[#00f2ff]/40 uppercase">
                      {item.type}
                    </span>
                    {item.isLatest && (
                      <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-mono font-bold uppercase border border-rose-400">
                        LATEST
                      </span>
                    )}
                    {item.tmdbId && (
                      <span className="px-1.5 py-0.5 bg-[#00f2ff]/20 text-[#00f2ff] text-[8px] font-mono border border-[#00f2ff]/40 uppercase">
                        TMDB
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/80 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </div>

                  {/* Play Overlay */}
                  <div 
                    onClick={() => handlePlayMedia(item)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur-[2px] transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-[#00f2ff] bg-black/80 flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_#00f2ff] group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-[#00f2ff] translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 space-y-2 font-mono">
                  <h3 
                    onClick={() => handlePlayMedia(item)}
                    className="text-xs font-bold text-white group-hover:text-[#00f2ff] cursor-pointer line-clamp-1 transition-colors"
                    title={item.title}
                  >
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[10px] text-[#00f2ff]/70">
                    <span>{item.year}</span>
                    <span>•</span>
                    <span>{item.duration || `${item.totalSeasons || 1} Seasons`}</span>
                    {item.imdbId && (
                      <>
                        <span>•</span>
                        <span className="text-[#00f2ff] font-bold">{item.imdbId}</span>
                      </>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                    {item.overview}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="px-1.5 py-0.5 bg-[#00f2ff]/10 border border-[#00f2ff]/25 text-[#00f2ff] text-[9px]"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2 border-t border-[#00f2ff]/20 bg-black/90 flex items-center justify-between gap-1.5 font-mono text-[10px]">
                <button
                  onClick={() => handlePlayMedia(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold transition-all shadow-[0_0_8px_rgba(0,242,255,0.4)]"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>STREAM (VIDAPI)</span>
                </button>

                <button
                  onClick={() => {
                    jarvisAudio.playClick();
                    onToggleWatchlist(item);
                  }}
                  className={`p-1.5 border transition-all ${
                    watchlisted
                      ? 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff]'
                      : 'bg-black border-[#00f2ff]/30 text-[#00f2ff]/70 hover:text-white hover:border-[#00f2ff]'
                  }`}
                  title={watchlisted ? 'Saved in Stark Vault' : 'Add to Stark Vault'}
                >
                  {watchlisted ? <BookmarkCheck className="w-3.5 h-3.5 text-[#00f2ff]" /> : <Bookmark className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button for Discovery Mode */}
      {displayedItems.length > 0 && !searchQuery.trim() && hasMorePages && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-black border border-[#00f2ff]/60 hover:border-[#00f2ff] hover:bg-[#00f2ff]/10 text-[#00f2ff] hover:text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#00f2ff]" />
                <span>RECEIVING NEXT TRANSMISSION MATRIX (PAGE {discoverPage + 1})...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-[#00f2ff]" />
                <span>LOAD MORE TITLES // TRANSMISSION PAGE {discoverPage + 1}</span>
              </>
            )}
          </button>
        </div>
      )}

      {displayedItems.length === 0 && (
        <div className="p-12 border border-dashed border-[#00f2ff]/30 text-center font-mono text-xs space-y-2">
          <p className="text-[#00f2ff]">NO MEDIA MATCHING CURRENT MATRIX CRITERIA</p>
          <p className="text-[10px] text-[#00f2ff]/60">
            Try searching for any title (e.g. "Gladiator", "Inception", "Dune") or use the Instant ID field above to stream any IMDb / TMDb ID directly via VidAPI.
          </p>
        </div>
      )}
    </motion.div>
  );
};
