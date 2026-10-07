import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Film, 
  Tv, 
  Sparkles, 
  Play, 
  Bookmark, 
  BookmarkCheck, 
  Flame, 
  Calendar, 
  Clock, 
  Star, 
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Plus,
  Loader2
} from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface LatestReleasesViewProps {
  catalog: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  watchlist: MediaItem[];
  onToggleWatchlist: (media: MediaItem) => void;
  onNavigateToPlayer: () => void;
}

export const LatestReleasesView: React.FC<LatestReleasesViewProps> = ({
  catalog = [],
  onSelectMedia,
  watchlist = [],
  onToggleWatchlist,
  onNavigateToPlayer,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'blockbusters' | 'series' | 'trending'>('all');
  const [discoveredLatest, setDiscoveredLatest] = useState<MediaItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const handleLoadMore = async () => {
    jarvisAudio.playClick();
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const typeParam = filterType === 'movie' ? 'movie' : filterType === 'tv' ? 'tv' : 'all';
      const res = await fetch(`/api/media/discover?page=${nextPage}&pageSize=18&type=${typeParam}&category=latest`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          setDiscoveredLatest(prev => [...prev, ...data.results]);
          setPage(nextPage);
          setHasMore(Boolean(data.hasMore));
        } else {
          setHasMore(false);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter latest titles (2024+ or isLatest)
  const latestItems = useMemo(() => {
    const combined = [...catalog, ...discoveredLatest];
    const seen = new Set<string>();
    const uniqueList: MediaItem[] = [];

    for (const item of combined) {
      if (!seen.has(item.id.toLowerCase())) {
        seen.add(item.id.toLowerCase());
        uniqueList.push(item);
      }
    }

    return uniqueList.filter(item => {
      const isRecentYear = typeof item.year === 'number' ? item.year >= 2024 : String(item.year).includes('2024') || String(item.year).includes('2025');
      const matchesLatest = item.isLatest || isRecentYear || item.category === 'latest';
      
      if (!matchesLatest) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      
      return true;
    });
  }, [catalog, discoveredLatest, filterType, selectedCategory]);

  const handlePlayMedia = (item: MediaItem) => {
    jarvisAudio.playClick();
    onSelectMedia(item);
    onNavigateToPlayer();
  };

  const isItemWatchlisted = (id: string) => watchlist.some(w => w.id === id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-4"
    >
      {/* High Density Header Section */}
      <div className="border border-[#00f2ff]/30 bg-black/60 p-3 sm:p-4 text-xs font-mono relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00f2ff]/5 rounded-bl-full pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#00f2ff]/20 pb-3">
          <div>
            <div className="flex items-center gap-2 text-[#00f2ff] font-bold text-sm sm:text-base tracking-wider">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>LATEST ARCHIVAL RELEASES // NEW MOVIES & TV SERIES</span>
            </div>
            <p className="text-[11px] text-[#00f2ff]/70 mt-0.5">
              Real-time ingestion stream • Certified 2024–2025 releases configured for VidAPI single-click launch.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <div className="px-2.5 py-1 bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>VIDAPI GATEWAY ACTIVE</span>
            </div>
            <div className="px-2.5 py-1 bg-black border border-[#00f2ff]/30 text-white font-bold">
              {latestItems.length} DETECTED
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#00f2ff]/60 uppercase tracking-widest mr-1">FORMAT:</span>
            <button
              onClick={() => { jarvisAudio.playClick(); setFilterType('all'); }}
              className={`px-2.5 py-1 text-[10px] border transition-all ${
                filterType === 'all' 
                  ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_8px_#00f2ff]' 
                  : 'bg-black/50 text-[#00f2ff]/70 border-[#00f2ff]/20 hover:text-white'
              }`}
            >
              ALL RELEASES
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setFilterType('movie'); }}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] border transition-all ${
                filterType === 'movie' 
                  ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_8px_#00f2ff]' 
                  : 'bg-black/50 text-[#00f2ff]/70 border-[#00f2ff]/20 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>NEW MOVIES</span>
            </button>
            <button
              onClick={() => { jarvisAudio.playClick(); setFilterType('tv'); }}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] border transition-all ${
                filterType === 'tv' 
                  ? 'bg-[#00f2ff] text-black font-bold border-[#00f2ff] shadow-[0_0_8px_#00f2ff]' 
                  : 'bg-black/50 text-[#00f2ff]/70 border-[#00f2ff]/20 hover:text-white'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>NEW SERIES</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#00f2ff]/60 uppercase tracking-widest mr-1">TAG:</span>
            {(['all', 'trending', 'blockbusters', 'series'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => { jarvisAudio.playClick(); setSelectedCategory(cat); }}
                className={`px-2 py-0.5 text-[9px] border uppercase transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#00f2ff]/30 text-white font-bold border-[#00f2ff]'
                    : 'bg-black/40 text-[#00f2ff]/50 border-[#00f2ff]/20 hover:text-[#00f2ff]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Latest Media Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {latestItems.map((item, idx) => {
          const watchlisted = isItemWatchlisted(item.id);
          return (
            <div
              key={`latest-card-${item.id}-${idx}`}
              className="group relative border border-[#00f2ff]/30 bg-black/70 hover:border-[#00f2ff] flex flex-col justify-between transition-all duration-200 overflow-hidden"
            >
              {/* Corner HUD Accent Brackets */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#00f2ff] pointer-events-none z-10"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#00f2ff] pointer-events-none z-10"></div>

              <div>
                {/* Poster Image Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/80">
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
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                    <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-mono font-bold tracking-wider uppercase border border-rose-400 shadow-sm">
                      NEW {item.year}
                    </span>
                    <span className="px-1.5 py-0.5 bg-black/70 text-[#00f2ff] text-[9px] font-mono border border-[#00f2ff]/40 uppercase">
                      {item.type}
                    </span>
                  </div>

                  {/* Star Rating Overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/80 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </div>

                  {/* Play Overlay On Hover */}
                  <div 
                    onClick={() => handlePlayMedia(item)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur-[2px] transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-[#00f2ff] bg-black/80 flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_#00f2ff] group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-[#00f2ff] translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-3 space-y-2 font-mono">
                  <div className="flex items-start justify-between gap-1">
                    <h3 
                      onClick={() => handlePlayMedia(item)}
                      className="text-xs font-bold text-white group-hover:text-[#00f2ff] cursor-pointer line-clamp-1 transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-2 text-[10px] text-[#00f2ff]/70">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{item.releaseDate || item.year}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{item.duration || `${item.totalSeasons || 1} Seasons`}</span>
                    </span>
                  </div>

                  {/* Synopsis */}
                  <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                    {item.overview}
                  </p>

                  {/* Genre Chips */}
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

              {/* Bottom Actions Bar */}
              <div className="p-2 border-t border-[#00f2ff]/20 bg-black/90 flex items-center justify-between gap-1.5 font-mono text-[10px]">
                <button
                  onClick={() => handlePlayMedia(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold transition-all shadow-[0_0_8px_rgba(0,242,255,0.4)]"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>STREAM NOW</span>
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

      {/* Load More Releases Button */}
      {latestItems.length > 0 && hasMore && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-black border border-[#00f2ff]/60 hover:border-[#00f2ff] hover:bg-[#00f2ff]/10 text-[#00f2ff] hover:text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#00f2ff]" />
                <span>SYNCING NEXT 2024–2026 RELEASES MATRIX (PAGE {page + 1})...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-[#00f2ff]" />
                <span>LOAD MORE 2024–2026 RELEASES // PAGE {page + 1}</span>
              </>
            )}
          </button>
        </div>
      )}

      {latestItems.length === 0 && (
        <div className="p-8 border border-dashed border-[#00f2ff]/30 text-center font-mono text-xs text-[#00f2ff]/60">
          NO LATEST RELEASES MATCHING CURRENT PARAMETERS
        </div>
      )}
    </motion.div>
  );
};
