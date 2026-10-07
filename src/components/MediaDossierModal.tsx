import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Play, 
  Star, 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  Calendar, 
  Film, 
  Tv, 
  ExternalLink, 
  Shield, 
  Users, 
  Clapperboard,
  Sparkles,
  Activity,
  Layers,
  Radio
} from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface MediaDossierModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (media: MediaItem, season?: number, episode?: number) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (media: MediaItem) => void;
}

export const MediaDossierModal: React.FC<MediaDossierModalProps> = ({
  media,
  isOpen,
  onClose,
  onPlay,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Reset season/episode and fetch enriched TMDb details when media changes
  useEffect(() => {
    if (!media) return;
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setEnrichedData(null);

    let isMounted = true;
    const fetchEnriched = async () => {
      setLoadingDetails(true);
      try {
        const fetchId = media.tmdbId || media.imdbId || media.id;
        const res = await fetch(`/api/tmdb/details/${media.type}/${fetchId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.media) {
            setEnrichedData(data.media);
          }
        }
      } catch (e) {
        console.warn('Dossier enrichment error:', e);
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    };

    fetchEnriched();
    return () => { isMounted = false; };
  }, [media]);

  if (!isOpen || !media) return null;

  const displayData = {
    ...media,
    ...(enrichedData || {}),
  };

  const totalSeasons = displayData.totalSeasons || (displayData.type === 'tv' ? 4 : undefined);
  const currentSeasonData = displayData.seasonsData?.find((s: any) => s.seasonNumber === selectedSeason);
  const episodeCount = currentSeasonData?.episodeCount || displayData.episodesPerSeason || 10;

  const handlePlayStream = () => {
    jarvisAudio.playAcknowledge();
    onClose();
    if (displayData.type === 'tv') {
      onPlay(displayData, selectedSeason, selectedEpisode);
    } else {
      onPlay(displayData);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-mono">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { jarvisAudio.playClick(); onClose(); }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-[#030914] border border-[#00f2ff]/50 shadow-[0_0_40px_rgba(0,242,255,0.25)] overflow-hidden z-10 my-auto max-h-[90vh] flex flex-col"
        >
          {/* Hologram Corner Brackets */}
          <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#00f2ff] z-20 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#00f2ff] z-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#00f2ff] z-20 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00f2ff] z-20 pointer-events-none"></div>

          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/90 border-b border-[#00f2ff]/30 text-xs text-[#00f2ff] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse"></span>
              <span className="font-bold tracking-wider uppercase text-glow-cyan">
                STARK CLASSIFIED MEDIA DOSSIER // {displayData.title}
              </span>
            </div>

            <button
              onClick={() => { jarvisAudio.playClick(); onClose(); }}
              className="p-1 hover:bg-[#00f2ff]/20 text-[#00f2ff] hover:text-white border border-transparent hover:border-[#00f2ff]/40 transition-all"
              title="Close Dossier"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            
            {/* Top Media Showcase Hero Banner */}
            <div className="relative rounded-none border border-[#00f2ff]/30 bg-black overflow-hidden flex flex-col md:flex-row gap-5 p-4 md:p-5">
              {/* Backdrop image overlay */}
              {displayData.backdrop && (
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                  <img
                    src={displayData.backdrop}
                    alt={displayData.title}
                    className="w-full h-full object-cover filter brightness-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                </div>
              )}

              {/* Poster Artwork */}
              <div className="relative z-10 w-32 sm:w-44 md:w-52 shrink-0 aspect-[2/3] border border-[#00f2ff]/40 shadow-[0_0_20px_rgba(0,242,255,0.15)] bg-black self-center md:self-start">
                <img
                  src={displayData.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80'}
                  alt={displayData.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/80 border border-[#00f2ff]/50 text-[9px] font-bold text-[#00f2ff] uppercase">
                  {displayData.type === 'tv' ? 'TV SERIES' : 'MOVIE'}
                </div>
              </div>

              {/* Media Dossier Details */}
              <div className="relative z-10 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-white font-bold">{displayData.year}</span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      {displayData.rating ? displayData.rating.toFixed(1) : '8.0'} IMDb
                    </span>
                    {displayData.duration && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {displayData.duration}
                        </span>
                      </>
                    )}
                    {totalSeasons && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className="text-[#00f2ff] font-bold">
                          {totalSeasons} {totalSeasons > 1 ? 'Seasons' : 'Season'}
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight mt-1">
                    {displayData.title}
                  </h2>

                  {/* Genres */}
                  {displayData.genres && displayData.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {displayData.genres.map((genre: string, idx: number) => (
                        <span 
                          key={idx} 
                          className="text-[10px] px-2 py-0.5 bg-black/70 border border-[#00f2ff]/30 text-[#00f2ff]"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Synopsis / Mission Briefing */}
                  <div className="mt-3">
                    <h4 className="text-[10px] text-[#00f2ff] font-bold uppercase tracking-wider mb-1">
                      MISSION SYNOPSIS & BRIEFING:
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal">
                      {displayData.overview || 'Archived intelligence dossier ready for immediate transmission.'}
                    </p>
                  </div>
                </div>

                {/* Cast & Personnel */}
                {displayData.cast && displayData.cast.length > 0 && (
                  <div className="pt-2 border-t border-[#00f2ff]/20 text-xs">
                    <span className="text-[10px] text-[#00f2ff] font-bold uppercase mr-2">STARRING:</span>
                    <span className="text-slate-300 text-[11px] font-sans">
                      {Array.isArray(displayData.cast) ? displayData.cast.slice(0, 5).join(', ') : displayData.cast}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* TV Show Season & Episode Navigation Grid (If TV) */}
            {displayData.type === 'tv' && totalSeasons && (
              <div className="p-3.5 bg-black/70 border border-[#00f2ff]/30 space-y-3">
                <div className="flex items-center justify-between border-b border-[#00f2ff]/20 pb-2">
                  <span className="text-xs font-bold text-[#00f2ff] uppercase flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5" />
                    <span>SELECT SEASON & EPISODE:</span>
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold">
                    SEASON {selectedSeason} • EPISODE {selectedEpisode}
                  </span>
                </div>

                {/* Season Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((sNum) => (
                    <button
                      key={sNum}
                      onClick={() => {
                        jarvisAudio.playClick();
                        setSelectedSeason(sNum);
                        setSelectedEpisode(1);
                      }}
                      className={`px-3 py-1 font-mono text-xs border transition-all shrink-0 ${
                        selectedSeason === sNum
                          ? 'bg-[#00f2ff] text-black border-[#00f2ff] font-bold shadow-[0_0_10px_#00f2ff]'
                          : 'bg-black/60 border-[#00f2ff]/30 text-slate-300 hover:text-[#00f2ff]'
                      }`}
                    >
                      SEASON {sNum}
                    </button>
                  ))}
                </div>

                {/* Episodes Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 pt-1">
                  {Array.from({ length: episodeCount }, (_, i) => i + 1).map((eNum) => (
                    <button
                      key={eNum}
                      onClick={() => {
                        jarvisAudio.playClick();
                        setSelectedEpisode(eNum);
                      }}
                      className={`py-1.5 px-2 text-center text-xs font-mono border transition-all ${
                        selectedEpisode === eNum
                          ? 'bg-[#00f2ff] text-black border-[#00f2ff] font-bold shadow-[0_0_8px_#00f2ff]'
                          : 'bg-black/80 border-[#00f2ff]/20 text-[#00f2ff]/80 hover:border-[#00f2ff] hover:text-white'
                      }`}
                    >
                      EP {eNum}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Telemetry Matrix Bar */}
            <div className="p-3 bg-black/60 border border-[#00f2ff]/20 flex flex-wrap items-center justify-between gap-3 text-[10px] text-[#00f2ff]/80">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#00f2ff]" />
                  GATEWAY: VIDFAST + VIDAPI
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-bold">4K ULTRA HD / HDR10+</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-300">DOLBY ATMOS 7.1</span>
              </div>

              {displayData.imdbId && (
                <a
                  href={`https://www.imdb.com/title/${displayData.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors"
                >
                  <span>IMDb: {displayData.imdbId}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

          </div>

          {/* Modal Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-black/95 border-t border-[#00f2ff]/30 shrink-0">
            <button
              onClick={() => {
                jarvisAudio.playClick();
                onToggleWatchlist(displayData);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border transition-all ${
                isWatchlisted
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-black border-[#00f2ff]/30 text-[#00f2ff] hover:bg-[#00f2ff]/15'
              }`}
            >
              {isWatchlisted ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-amber-400" />
                  <span>IN STARK VAULT</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>ADD TO STARK VAULT</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { jarvisAudio.playClick(); onClose(); }}
                className="px-4 py-2 bg-black border border-[#00f2ff]/30 text-[#00f2ff]/80 hover:text-white text-xs font-bold uppercase transition-all"
              >
                DISMISS
              </button>

              <button
                id="dossier-play-stream-btn"
                onClick={handlePlayStream}
                className="flex items-center gap-2 px-6 py-2 bg-[#00f2ff] hover:bg-white text-black text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,242,255,0.5)] active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY {displayData.type === 'tv' ? `S${selectedSeason}:E${selectedEpisode}` : 'STREAM'} NOW</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
