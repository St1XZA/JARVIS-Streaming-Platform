import React, { useState } from 'react';
import { X, Play, Tv, Film } from 'lucide-react';
import { StreamServer } from '../types';
import { buildStreamUrl } from '../data/mediaCatalog';
import { jarvisAudio } from '../utils/audio';

interface DirectLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  server?: StreamServer;
  onLaunch: (id: string, type: 'movie' | 'tv', season?: number, episode?: number) => void;
}

export const DirectLauncherModal: React.FC<DirectLauncherModalProps> = ({
  isOpen,
  onClose,
  onLaunch,
}) => {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [mediaId, setMediaId] = useState('tt29623480');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaId.trim()) return;
    jarvisAudio.playStreamInit();
    onLaunch(mediaId.trim(), mediaType, season, episode);
    onClose();
  };

  const previewUrl = buildStreamUrl(mediaId || 'id', mediaType, season, episode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 font-mono">
      <div className="w-full max-w-lg bg-[#02050a] border border-[#00f2ff]/40 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-[#00f2ff]/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00f2ff] animate-ping"></span>
            <h3 className="font-bold text-xs text-[#00f2ff] text-glow-cyan uppercase">
              DIRECT ID STREAM LAUNCHER
            </h3>
          </div>
          <button
            onClick={() => { jarvisAudio.playClick(); onClose(); }}
            className="p-1 text-[#00f2ff]/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Media Type Selection */}
          <div>
            <label className="block text-[10px] text-[#00f2ff] mb-1.5 font-bold uppercase">
              1. SELECT MEDIA MATRIX:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { jarvisAudio.playClick(); setMediaType('movie'); }}
                className={`py-1.5 px-3 border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  mediaType === 'movie'
                    ? 'bg-[#00f2ff] text-black border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                    : 'bg-black border-[#00f2ff]/30 text-[#00f2ff] hover:border-[#00f2ff]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>SINGLE MOVIE</span>
              </button>

              <button
                type="button"
                onClick={() => { jarvisAudio.playClick(); setMediaType('tv'); }}
                className={`py-1.5 px-3 border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  mediaType === 'tv'
                    ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_10px_#ffaa00]'
                    : 'bg-black border-[#00f2ff]/30 text-[#00f2ff] hover:border-[#00f2ff]'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>EPISODIC TV SHOW</span>
              </button>
            </div>
          </div>

          {/* ID Input */}
          <div>
            <label className="block text-[10px] text-[#00f2ff] mb-1 font-bold uppercase">
              2. ENTER IMDB (tt...) OR TMDB ID:
            </label>
            <input
              type="text"
              required
              value={mediaId}
              onChange={(e) => setMediaId(e.target.value)}
              placeholder="e.g. tt29623480 or 1184918"
              className="w-full px-3 py-1.5 bg-black border border-[#00f2ff]/40 text-[#00f2ff] text-xs placeholder:text-[#00f2ff]/30 focus:outline-none focus:border-[#00f2ff] focus:shadow-[0_0_10px_rgba(0,242,255,0.3)]"
            />
            <p className="text-[9px] text-[#00f2ff]/60 mt-0.5">
              Valid formats: IMDb ID with 'tt' prefix (tt29623480) or TMDb numeric ID (1184918)
            </p>
          </div>

          {/* Season & Episode Inputs (Only for TV Shows) */}
          {mediaType === 'tv' && (
            <div className="grid grid-cols-2 gap-2 p-2 bg-black border border-amber-500/30">
              <div>
                <label className="block text-[9px] text-amber-400 mb-1 font-bold uppercase">
                  SEASON NUMBER:
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={season}
                  onChange={(e) => setSeason(parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1 bg-black border border-amber-500/40 text-amber-200 text-center text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] text-amber-400 mb-1 font-bold uppercase">
                  EPISODE NUMBER:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={episode}
                  onChange={(e) => setEpisode(parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1 bg-black border border-amber-500/40 text-amber-200 text-center text-xs"
                />
              </div>
            </div>
          )}

          {/* Working Presets List */}
          <div>
            <span className="text-[9px] text-[#00f2ff] font-bold block mb-1 uppercase">
              WORKING API PRESETS (CLICK TO LOAD):
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => { setMediaType('movie'); setMediaId('tt29623480'); }}
                className="p-1 text-left bg-black hover:bg-[#00f2ff]/20 border border-[#00f2ff]/20 text-[#00f2ff] truncate"
              >
                🎬 IMDb: tt29623480 (Quiet Place)
              </button>
              <button
                type="button"
                onClick={() => { setMediaType('movie'); setMediaId('1184918'); }}
                className="p-1 text-left bg-black hover:bg-[#00f2ff]/20 border border-[#00f2ff]/20 text-[#00f2ff] truncate"
              >
                🎬 TMDb: 1184918 (Wild Robot)
              </button>
              <button
                type="button"
                onClick={() => { setMediaType('tv'); setMediaId('tt3107288'); setSeason(9); setEpisode(1); }}
                className="p-1 text-left bg-black hover:bg-[#00f2ff]/20 border border-[#00f2ff]/20 text-[#00f2ff] truncate"
              >
                📺 IMDb TV: tt3107288 (S9E1)
              </button>
              <button
                type="button"
                onClick={() => { setMediaType('tv'); setMediaId('60735'); setSeason(9); setEpisode(1); }}
                className="p-1 text-left bg-black hover:bg-[#00f2ff]/20 border border-[#00f2ff]/20 text-[#00f2ff] truncate"
              >
                📺 TMDb TV: 60735 (S9E1)
              </button>
            </div>
          </div>

          {/* URL Preview */}
          <div className="p-2 bg-black border border-[#00f2ff]/20 text-[9px] text-[#00f2ff]/80">
            <span className="text-[#00f2ff] font-bold">PREVIEW: </span>
            <span className="text-white/80 break-all">{previewUrl}</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 bg-[#00f2ff] hover:bg-[#00f2ff]/90 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_#00f2ff] transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>INITIALIZE STREAM PROTOCOL</span>
          </button>
        </form>

      </div>
    </div>
  );
};
