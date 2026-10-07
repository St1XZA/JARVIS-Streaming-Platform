import React, { useState } from 'react';
import { X, Play, Trash2, Bookmark, History, Clock } from 'lucide-react';
import { MediaItem, WatchHistoryItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface WatchlistHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'watchlist' | 'history';
  watchlist: MediaItem[];
  watchHistory: WatchHistoryItem[];
  onPlayMedia: (media: MediaItem, season?: number, episode?: number) => void;
  onRemoveWatchlist: (id: string) => void;
  onClearHistory: () => void;
}

export const WatchlistHistoryModal: React.FC<WatchlistHistoryModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'watchlist',
  watchlist = [],
  watchHistory = [],
  onPlayMedia,
  onRemoveWatchlist,
  onClearHistory,
}) => {
  const [tab, setTab] = useState<'watchlist' | 'history'>(defaultTab);

  if (!isOpen) return null;

  const handleTab = (t: 'watchlist' | 'history') => {
    jarvisAudio.playClick();
    setTab(t);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 font-mono">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden bg-[#02050a] border border-[#00f2ff]/40 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
        
        {/* Header & Tabs */}
        <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-[#00f2ff]/30">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleTab('watchlist')}
              className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 transition-all uppercase border ${
                tab === 'watchlist'
                  ? 'bg-[#00f2ff] text-black border-[#00f2ff] shadow-[0_0_10px_#00f2ff]'
                  : 'text-[#00f2ff] border-[#00f2ff]/20 hover:bg-[#00f2ff]/10'
              }`}
            >
              <Bookmark className="w-3 h-3" />
              <span>STARK VAULT ({watchlist.length})</span>
            </button>

            <button
              onClick={() => handleTab('history')}
              className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 transition-all uppercase border ${
                tab === 'history'
                  ? 'bg-amber-400 text-black border-amber-400 shadow-[0_0_10px_#ffaa00]'
                  : 'text-[#00f2ff] border-[#00f2ff]/20 hover:bg-[#00f2ff]/10'
              }`}
            >
              <History className="w-3 h-3" />
              <span>LOGS ({watchHistory.length})</span>
            </button>
          </div>

          <button
            onClick={() => { jarvisAudio.playClick(); onClose(); }}
            className="p-1 text-[#00f2ff]/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-black/50 text-xs">
          {tab === 'watchlist' ? (
            watchlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {watchlist.map((item, idx) => (
                  <div
                    key={`watchlist-${item.id}-${idx}`}
                    className="p-2 bg-black border border-[#00f2ff]/30 hover:border-[#00f2ff] flex items-center gap-2.5 group transition-all"
                  >
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-10 h-14 object-cover shrink-0 border border-[#00f2ff]/20"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00f2ff]">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-[#00f2ff]/60 truncate font-mono">
                        ID: {item.id} • {item.year}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => {
                            jarvisAudio.playStreamInit();
                            onPlayMedia(item);
                            onClose();
                          }}
                          className="px-2 py-0.5 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black text-[9px] font-bold uppercase flex items-center gap-1 shadow-[0_0_8px_#00f0ff]"
                        >
                          <Play className="w-2.5 h-2.5 fill-black" />
                          <span>PLAY</span>
                        </button>
                        <button
                          onClick={() => {
                            jarvisAudio.playClick();
                            onRemoveWatchlist(item.id);
                          }}
                          className="p-1 text-[#00f2ff]/50 hover:text-rose-400 transition-colors"
                          title="Remove from vault"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                Your Stark Vault is currently empty. Click the bookmark icon on any movie or show to save it.
              </div>
            )
          ) : (
            /* History Logs */
            watchHistory.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex justify-end pb-1">
                  <button
                    onClick={() => {
                      jarvisAudio.playClick();
                      onClearHistory();
                    }}
                    className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 transition-colors uppercase"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>PURGE LOGS</span>
                  </button>
                </div>

                {watchHistory.map((entry, idx) => (
                  <div
                    key={`${entry.media.id}-${idx}`}
                    className="p-2 bg-black border border-[#00f2ff]/20 hover:border-[#00f2ff] flex items-center justify-between gap-2 group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={entry.media.poster}
                        alt={entry.media.title}
                        className="w-8 h-12 object-cover shrink-0 border border-[#00f2ff]/20"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00f2ff]">
                          {entry.media.title}
                        </h4>
                        <div className="text-[9px] text-[#00f2ff]/70">
                          {entry.media.type === 'tv' ? `Season ${entry.season || 1} • Episode ${entry.episode || 1}` : 'Feature Film'}
                        </div>
                        <div className="text-[8px] text-[#00f2ff]/40 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(entry.lastWatchedAt).toLocaleDateString()} {new Date(entry.lastWatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        jarvisAudio.playStreamInit();
                        onPlayMedia(entry.media, entry.season, entry.episode);
                        onClose();
                      }}
                      className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-bold uppercase flex items-center gap-1 shadow-[0_0_8px_#ffaa00] shrink-0"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>RESUME</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No streaming sessions recorded yet. Launch a title to log your session.
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};
