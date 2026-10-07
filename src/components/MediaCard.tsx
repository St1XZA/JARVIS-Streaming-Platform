import React from 'react';
import { Play, Tv, Film, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface MediaCardProps {
  media: MediaItem;
  onSelect: (media: MediaItem) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (media: MediaItem) => void;
  isActive?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onSelect,
  isWatchlisted,
  onToggleWatchlist,
  isActive = false,
}) => {
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    jarvisAudio.playStreamInit();
    onSelect(media);
  };

  const handleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    jarvisAudio.playClick();
    onToggleWatchlist(media);
  };

  return (
    <div
      onClick={handlePlay}
      className={`group relative overflow-hidden cursor-pointer transition-all duration-200 flex flex-col bg-[#02050a] border font-mono ${
        isActive 
          ? 'border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.4)]' 
          : 'border-[#00f2ff]/30 hover:border-[#00f2ff] hover:shadow-[0_0_15px_rgba(0,242,255,0.25)]'
      }`}
    >
      {/* Corner Bracket Details */}
      <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t border-l border-[#00f2ff] z-20 pointer-events-none"></div>
      <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-[#00f2ff] z-20 pointer-events-none"></div>

      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
        <img
          src={media.poster}
          alt={media.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80';
          }}
        />

        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
          <div className="w-10 h-10 bg-[#00f2ff] text-black flex items-center justify-center shadow-[0_0_15px_#00f2ff] transition-transform">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10">
          <span className="px-1.5 py-0.2 bg-black/80 border border-[#00f2ff]/40 text-[9px] text-[#00f2ff] font-bold uppercase flex items-center gap-1">
            {media.type === 'movie' ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5 text-amber-400" />}
            {media.type}
          </span>
        </div>

        {/* Top Right Watchlist Bookmark Button */}
        <button
          onClick={handleWatchlist}
          className={`absolute top-1.5 right-1.5 p-1 z-20 border transition-all ${
            isWatchlisted 
              ? 'bg-[#00f2ff] text-black border-[#00f2ff] shadow-[0_0_8px_#00f2ff]' 
              : 'bg-black/80 text-[#00f2ff] hover:bg-[#00f2ff]/20 border-[#00f2ff]/30'
          }`}
          title={isWatchlisted ? 'Remove from Stark Vault' : 'Save to Stark Vault'}
        >
          {isWatchlisted ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
        </button>

        {/* Bottom Rating Chip */}
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 z-10">
          <span className="px-1 py-0.2 bg-black/90 border border-amber-400/40 text-[9px] text-amber-300 font-bold flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            {media.rating}
          </span>
          <span className="px-1 py-0.2 bg-black/90 border border-[#00f2ff]/30 text-[9px] text-[#00f2ff]">
            {media.year}
          </span>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="p-2 flex-1 flex flex-col justify-between gap-1 border-t border-[#00f2ff]/20">
        <div>
          <h3 className="text-xs font-bold text-white tracking-tight truncate group-hover:text-[#00f2ff] transition-colors">
            {media.title}
          </h3>
          <div className="text-[10px] text-[#00f2ff]/60 truncate font-mono">
            {media.id}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {media.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[8px] px-1 py-0.2 bg-[#00f2ff]/5 border border-[#00f2ff]/20 text-[#00f2ff]/80 uppercase"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
