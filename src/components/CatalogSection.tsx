import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Film, 
  Tv, 
  Flame, 
  ShieldAlert, 
  Cpu, 
  Bookmark, 
  Layers,
  X,
  Loader2,
  Plus,
  Radio,
  Star
} from 'lucide-react';
import { MediaItem, WatchHistoryItem } from '../types';
import { MediaCard } from './MediaCard';
import { jarvisAudio } from '../utils/audio';

interface CatalogSectionProps {
  catalog: MediaItem[];
  activeMedia: MediaItem | null;
  onSelectMedia: (media: MediaItem) => void;
  watchlist: MediaItem[];
  onToggleWatchlist: (media: MediaItem) => void;
  watchHistory: WatchHistoryItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

type FilterTab = 'all' | 'trending' | 'popular' | 'movies' | 'tv' | 'marvel' | 'scifi' | 'watchlist' | 'history';

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  catalog = [],
  activeMedia,
  onSelectMedia,
  watchlist = [],
  onToggleWatchlist,
  watchHistory = [],
  searchQuery,
  onSearchChange,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [onlineResults, setOnlineResults] = useState<MediaItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [visibleCount, setVisibleCount] = useState(18);
  const [discoveredPages, setDiscoveredPages] = useState<MediaItem[]>([]);
  const [discoverPageNum, setDiscoverPageNum] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Live online search when query has 2+ characters
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    setIsSearchingOnline(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vidapi/search?query=${encodeURIComponent(q)}&type=all`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results)) {
            setOnlineResults(data.results);
          }
        }
      } catch {
        // Fallback handled locally
      } finally {
        setIsSearchingOnline(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combined Catalog with Discovered Pages
  const combinedCatalog = useMemo(() => {
    const seen = new Set<string>();
    const list: MediaItem[] = [];

    for (const item of catalog) {
      seen.add(item.id.toLowerCase());
      list.push(item);
    }
    for (const d of discoveredPages) {
      if (!seen.has(d.id.toLowerCase())) {
        seen.add(d.id.toLowerCase());
        list.push(d);
      }
    }
    return list;
  }, [catalog, discoveredPages]);

  const filteredItems = useMemo(() => {
    let list: MediaItem[] = [];

    if (activeTab === 'watchlist') {
      list = Array.isArray(watchlist) ? [...watchlist] : [];
    } else if (activeTab === 'history') {
      list = Array.isArray(watchHistory) ? watchHistory.map(h => h.media).filter(Boolean) : [];
    } else {
      list = [...combinedCatalog];
      if (activeTab === 'movies') {
        list = list.filter(item => item.type === 'movie');
      } else if (activeTab === 'tv') {
        list = list.filter(item => item.type === 'tv');
      } else if (activeTab === 'marvel') {
        list = list.filter(item => item.category === 'marvel');
      } else if (activeTab === 'scifi') {
        list = list.filter(item => item.category === 'scifi' || item.category === 'cyberpunk');
      } else if (activeTab === 'trending') {
        list = list.filter(item => item.category === 'trending' || item.isLatest || item.category === 'latest');
      } else if (activeTab === 'popular') {
        list = list.filter(item => (item.rating && item.rating >= 8.0) || item.category === 'blockbusters');
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const localMatches = list.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.imdbId && item.imdbId.toLowerCase().includes(q)) ||
        (item.tmdbId && item.tmdbId.toString().includes(q)) ||
        item.genres.some(g => g.toLowerCase().includes(q)) ||
        (item.cast && item.cast.some(c => c.toLowerCase().includes(q))) ||
        (item.overview && item.overview.toLowerCase().includes(q))
      );

      const seen = new Set<string>();
      const combined: MediaItem[] = [];
      for (const item of localMatches) {
        seen.add(item.id.toLowerCase());
        if (item.imdbId) seen.add(item.imdbId.toLowerCase());
        combined.push(item);
      }
      for (const online of onlineResults) {
        if (!seen.has(online.id.toLowerCase()) && (!online.imdbId || !seen.has(online.imdbId.toLowerCase()))) {
          seen.add(online.id.toLowerCase());
          combined.push(online);
        }
      }
      return combined;
    }

    return list;
  }, [combinedCatalog, activeTab, watchlist, watchHistory, searchQuery, onlineResults]);

  const handleTabChange = (tab: FilterTab) => {
    jarvisAudio.playClick();
    setActiveTab(tab);
    setVisibleCount(18);
  };

  const handleLoadMore = async () => {
    jarvisAudio.playClick();
    if (visibleCount < filteredItems.length) {
      setVisibleCount(prev => prev + 18);
      return;
    }

    // Fetch next discover page from API
    setIsLoadingMore(true);
    try {
      const nextPage = discoverPageNum + 1;
      const typeParam = activeTab === 'movies' ? 'movie' : activeTab === 'tv' ? 'tv' : 'all';
      const res = await fetch(`/api/media/discover?page=${nextPage}&pageSize=18&type=${typeParam}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          setDiscoveredPages(prev => [...prev, ...data.results]);
          setDiscoverPageNum(nextPage);
          setVisibleCount(prev => prev + data.results.length);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  };

  const isItemWatchlisted = (item: MediaItem) => {
    return watchlist.some(w => w.id === item.id);
  };

  const displayedList = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length || activeTab === 'all' || activeTab === 'movies' || activeTab === 'tv';

  return (
    <section id="jarvis-catalog-hub" className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 font-mono">
      
      {/* Top Search & Filter Navigation Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        
        {/* Search Input Bar with High Density Styling */}
        <div className="relative flex-1 max-w-lg">
          <div className="relative">
            {isSearchingOnline ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#00f2ff] animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#00f2ff]" />
            )}
            <input
              id="catalog-search-input"
              type="text"
              placeholder="SEARCH ALL MOVIES, TV SERIES, IMDB (tt...), TMDB..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-black border border-[#00f2ff]/40 focus:border-[#00f2ff] focus:shadow-[0_0_12px_rgba(0,242,255,0.3)] text-xs font-mono text-[#00f2ff] placeholder:text-[#00f2ff]/40 focus:outline-none transition-all uppercase"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#00f2ff]/60 hover:text-white"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {isSearchingOnline && (
            <div className="absolute top-full left-0 mt-1 text-[10px] text-[#00f2ff] flex items-center gap-1 animate-pulse z-10 bg-black/90 px-2 py-0.5 border border-[#00f2ff]/30">
              <Radio className="w-2.5 h-2.5" />
              <span>Scanning global TMDb & IMDb transmission nodes...</span>
            </div>
          )}
        </div>

        {/* Filter Category Tabs - Allows toggling between 'All', 'Trending', and 'Popular' */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
          <button
            id="filter-tab-all"
            onClick={() => handleTabChange('all')}
            className={`px-2.5 py-1 border transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                : 'bg-black/60 hover:bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30'
            }`}
          >
            ALL
          </button>

          <button
            id="filter-tab-trending"
            onClick={() => handleTabChange('trending')}
            className={`px-2.5 py-1 border transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'trending'
                ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                : 'bg-black/60 hover:bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            TRENDING
          </button>

          <button
            id="filter-tab-popular"
            onClick={() => handleTabChange('popular')}
            className={`px-2.5 py-1 border transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'popular'
                ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                : 'bg-black/60 hover:bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30'
            }`}
          >
            <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
            POPULAR
          </button>

          <button
            id="filter-tab-movies"
            onClick={() => handleTabChange('movies')}
            className={`px-2.5 py-1 border transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'movies'
                ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                : 'bg-black/60 hover:bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30'
            }`}
          >
            <Film className="w-3 h-3" />
            MOVIES
          </button>

          <button
            id="filter-tab-tv"
            onClick={() => handleTabChange('tv')}
            className={`px-2.5 py-1 border transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'tv'
                ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                : 'bg-black/60 hover:bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30'
            }`}
          >
            <Tv className="w-3 h-3 text-amber-400" />
            SERIES
          </button>

          <button
            id="filter-tab-marvel"
            onClick={() => handleTabChange('marvel')}
            className={`px-2.5 py-1 border transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'marvel'
                ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                : 'bg-black/60 hover:bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            MARVEL
          </button>

          <button
            id="filter-tab-scifi"
            onClick={() => handleTabChange('scifi')}
            className={`px-2.5 py-1 border transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'scifi'
                ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                : 'bg-black/60 hover:bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30'
            }`}
          >
            <Cpu className="w-3 h-3 text-[#00f2ff]" />
            SCI-FI
          </button>

          <button
            id="filter-tab-watchlist"
            onClick={() => handleTabChange('watchlist')}
            className={`px-2.5 py-1 border transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'watchlist'
                ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                : 'bg-black/60 hover:bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            VAULT ({watchlist.length})
          </button>
        </div>
      </div>

      {/* Catalog Grid Header & Result Counter */}
      <div className="flex items-center justify-between mb-3 border-b border-[#00f2ff]/20 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse"></span>
          <h2 className="text-xs font-bold text-[#00f2ff] tracking-wider uppercase text-glow-cyan">
            {activeTab === 'all' && 'ALL DATABASE ARCHIVES'}
            {activeTab === 'trending' && 'TRENDING & ACTIVE TRANSMISSIONS'}
            {activeTab === 'popular' && 'POPULAR & CRITICALLY ACCLAIMED BLOCKBUSTERS'}
            {activeTab === 'marvel' && 'STARK ARCHIVES & MCU TITLES'}
            {activeTab === 'scifi' && 'CYBERPUNK & NEURAL SCI-FI'}
            {activeTab === 'movies' && 'FULL-LENGTH FEATURE FILMS'}
            {activeTab === 'tv' && 'EPISODIC TELEVISION SERIES'}
            {activeTab === 'watchlist' && 'STARK VAULT (WATCHLIST)'}
            {activeTab === 'history' && 'STREAMING LOGS'}
          </h2>
        </div>

        <div className="text-[10px] font-mono text-[#00f2ff]/60">
          SHOWING: <strong className="text-white">{displayedList.length}</strong> OF <strong className="text-white">{filteredItems.length}</strong> {searchQuery ? 'SEARCH HITS' : 'RECORDS'}
        </div>
      </div>

      {/* Media Cards Grid */}
      {displayedList.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {displayedList.map((item, idx) => (
              <MediaCard
                key={`catalog-${item.id}-${idx}`}
                media={item}
                onSelect={onSelectMedia}
                isWatchlisted={isItemWatchlisted(item)}
                onToggleWatchlist={onToggleWatchlist}
                isActive={activeMedia?.id === item.id}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-6 py-2.5 bg-black border border-[#00f2ff]/60 hover:border-[#00f2ff] hover:bg-[#00f2ff]/10 text-[#00f2ff] hover:text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#00f2ff]" />
                    <span>RETRIEVING NEXT TRANSMISSION ARCHIVES...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#00f2ff]" />
                    <span>LOAD MORE MOVIES & TV SERIES ({filteredItems.length - displayedList.length > 0 ? `${filteredItems.length - displayedList.length} REMAINING` : 'FETCH MORE FROM ARCHIVES'})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="border border-[#00f2ff]/30 bg-black/60 p-8 text-center flex flex-col items-center justify-center my-6">
          <Layers className="w-10 h-10 text-[#00f2ff]/40 mb-2 animate-pulse" />
          <h3 className="text-sm font-bold text-[#00f2ff] mb-1 uppercase">
            NO MATCHING ARCHIVES FOUND
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-3">
            No matching titles found for "{searchQuery}". You can stream ANY title directly by entering its IMDb (tt...) or TMDb ID in the Custom ID Launcher above.
          </p>
          <button
            onClick={() => onSearchChange('')}
            className="px-3 py-1 bg-[#00f2ff] text-black text-xs font-bold uppercase shadow-[0_0_10px_#00f2ff]"
          >
            RESET FILTERS
          </button>
        </div>
      )}

    </section>
  );
};

