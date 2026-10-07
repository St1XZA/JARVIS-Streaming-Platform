import React, { useState, useEffect, useRef } from 'react';
import { Search, Film, Tv, Star, Play, X, Loader2, ArrowRight } from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';
import { searchVidApiCatalog } from '../data/mediaCatalog';

interface AttackerSearchBarProps {
  onSelectMedia: (media: MediaItem) => void;
  onViewAllResults?: (query: string) => void;
}

export const AttackerSearchBar: React.FC<AttackerSearchBarProps> = ({
  onSelectMedia,
  onViewAllResults,
}) => {
  const [keyword, setKeyword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live auto-suggest search on keyword typing (like attacker.bz /ajax/search)
  useEffect(() => {
    const q = keyword.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vidapi/search?query=${encodeURIComponent(q)}&type=all`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0) {
            setSuggestions(data.results.slice(0, 8));
            setIsOpen(true);
          } else {
            // Local fallback
            const local = searchVidApiCatalog(q);
            setSuggestions(local.slice(0, 8));
            setIsOpen(true);
          }
        } else {
          const local = searchVidApiCatalog(q);
          setSuggestions(local.slice(0, 8));
          setIsOpen(true);
        }
      } catch {
        const local = searchVidApiCatalog(q);
        setSuggestions(local.slice(0, 8));
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [keyword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    if (suggestions.length > 0) {
      handleItemClick(suggestions[0]);
    } else if (onViewAllResults) {
      onViewAllResults(keyword.trim());
      setIsOpen(false);
    }
  };

  const handleItemClick = (item: MediaItem) => {
    jarvisAudio.playStreamInit();
    onSelectMedia(item);
    setIsOpen(false);
    setKeyword('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00f2ff]/60 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#00f2ff]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            if (e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search movies, TV shows, actors, IMDb..."
          className="w-full pl-9 pr-16 py-1.5 bg-[#02050a] border border-[#00f2ff]/40 hover:border-[#00f2ff] focus:border-[#00f2ff] text-xs font-mono text-[#00f2ff] placeholder:text-[#00f2ff]/40 focus:outline-none focus:shadow-[0_0_12px_rgba(0,242,255,0.3)] transition-all rounded-none"
        />

        {keyword && (
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-[#00f2ff]/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black shadow-sm transition-all"
          title="Search"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Attacker.bz styled live search suggestion dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#050b14]/98 border border-[#00f2ff]/50 shadow-[0_10px_30px_rgba(0,0,0,0.9)] backdrop-blur-md z-50 overflow-hidden font-mono max-h-[420px] overflow-y-auto divide-y divide-[#00f2ff]/10">
          <div className="px-3 py-1.5 bg-black/60 border-b border-[#00f2ff]/20 flex items-center justify-between text-[10px] text-[#00f2ff]/70">
            <span className="font-bold uppercase tracking-wider">LIVE SEARCH RESULTS</span>
            <span>{suggestions.length} MATCHES</span>
          </div>

          {suggestions.length === 0 && !loading && (
            <div className="p-4 text-center text-xs text-[#00f2ff]/50">
              No titles found for &quot;{keyword}&quot;
            </div>
          )}

          {suggestions.map((item, idx) => (
            <div
              key={`search-sug-${item.id}-${idx}`}
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-3 p-2 hover:bg-[#00f2ff]/15 cursor-pointer transition-colors group"
            >
              {/* Thumbnail */}
              <div className="relative w-12 h-16 shrink-0 bg-black overflow-hidden border border-[#00f2ff]/30">
                <img
                  src={item.poster || item.backdrop}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-4 h-4 fill-[#00f2ff] text-[#00f2ff]" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00f2ff] truncate">
                    {item.title}
                  </h4>
                  <span className="px-1 py-0.2 text-[8px] font-bold uppercase bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 shrink-0">
                    {item.type === 'movie' ? 'HD MOVIE' : 'HD TV'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[#00f2ff]/70">
                  <span>{item.year}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-amber-300">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    {item.rating || '8.0'}
                  </span>
                  {item.duration && (
                    <>
                      <span>•</span>
                      <span>{item.duration}</span>
                    </>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {item.overview || (item.genres ? item.genres.join(', ') : '')}
                </p>
              </div>

              {/* Quick Stream Icon */}
              <div className="px-2 py-1 bg-[#00f2ff]/10 group-hover:bg-[#00f2ff] text-[#00f2ff] group-hover:text-black text-[10px] font-bold uppercase border border-[#00f2ff]/40 shrink-0 transition-colors">
                STREAM
              </div>
            </div>
          ))}

          {onViewAllResults && keyword.trim() && (
            <div
              onClick={() => {
                onViewAllResults(keyword.trim());
                setIsOpen(false);
              }}
              className="p-2.5 text-center text-xs font-bold text-[#00f2ff] bg-black/80 hover:bg-[#00f2ff]/20 cursor-pointer transition-colors border-t border-[#00f2ff]/20"
            >
              View all results in Discovery Matrix →
            </div>
          )}
        </div>
      )}
    </div>
  );
};
