import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Bookmark, 
  History, 
  Sparkles, 
  Sliders, 
  Radio, 
  Cpu, 
  Tv, 
  Flame, 
  Compass,
  Search
} from 'lucide-react';
import { ActivePage, HudTheme, MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';
import { AttackerSearchBar } from './AttackerSearchBar';

interface JarvisHeaderProps {
  activePage: ActivePage;
  onPageChange: (page: ActivePage) => void;
  isListening: boolean;
  onToggleVoice: () => void;
  watchlistCount: number;
  historyCount: number;
  onOpenWatchlist: () => void;
  onOpenHistory: () => void;
  onOpenAiChat: () => void;
  onOpenDirectLauncher: () => void;
  onSelectMedia?: (media: MediaItem) => void;
  onSearchSubmit?: (query: string) => void;
  hudTheme?: HudTheme;
  onThemeChange?: (theme: HudTheme) => void;
}

export const JarvisHeader: React.FC<JarvisHeaderProps> = ({
  activePage,
  onPageChange,
  isListening,
  onToggleVoice,
  watchlistCount,
  historyCount,
  onOpenWatchlist,
  onOpenHistory,
  onOpenAiChat,
  onOpenDirectLauncher,
  onSelectMedia,
  onSearchSubmit,
}) => {
  const [soundOn, setSoundOn] = useState(true);
  const [time, setTime] = useState('');
  const [coreTemp, setCoreTemp] = useState(37);
  const [reactorOutput, setReactorOutput] = useState(99);

  // Live telemetry clock and dynamic reactor fluctuations (whole integers only)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    const telemetryTimer = setInterval(() => {
      setCoreTemp(Math.round(37 + Math.random() * 2));
      setReactorOutput(Math.round(98 + Math.random() * 2));
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(telemetryTimer);
    };
  }, []);

  const handleToggleSound = () => {
    const newState = jarvisAudio.toggleSound();
    setSoundOn(newState);
    if (newState) jarvisAudio.playClick();
  };

  return (
    <header id="jarvis-main-header" className="sticky top-0 z-40 w-full border-b border-[#00f2ff]/30 bg-[#02050a]/95 backdrop-blur-md">
      {/* Top High-Density Diagnostics Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-1 text-[10px] font-mono tracking-wider border-b border-[#00f2ff]/15 text-[#00f2ff]/70 bg-black/50">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[#00f2ff] font-semibold">CORE: ONLINE</span>
          </div>
          <div className="hidden sm:inline">ARC OUTPUT: <span className="text-[#00f2ff] font-bold">{Math.round(reactorOutput)}%</span></div>
          <div className="hidden sm:inline">TEMP: <span className="text-amber-400">{Math.round(coreTemp)}°C</span></div>
          <div>LOCATION: <span className="text-slate-300">MALIBU - SERVER NODE 7</span></div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-1">
            <span className="text-[#00f2ff]/60">GATEWAY:</span>
            <span className="px-1.5 py-0.2 bg-[#00f2ff]/20 text-[#00f2ff] font-bold border border-[#00f2ff]/40">
              VIDAPI.RU (ACTIVE)
            </span>
          </div>
          <div className="hidden md:inline">SECURITY: <span className="text-emerald-400">AES-256</span></div>
          <div className="text-[#00f2ff]/80">SYS_TIME: <span className="text-white font-mono">{time || '00:00:00'}</span></div>
        </div>
      </div>

      {/* Main High-Density Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Brand Logo & High Density Arc Reactor */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { 
              jarvisAudio.playClick(); 
              onPageChange('player');
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }}
            className="flex items-center gap-3 group text-left"
            title="Return to JARVIS Command Dashboard"
          >
            {/* Dual Ring Arc Reactor */}
            <div className="w-9 h-9 border-2 border-[#00f2ff] rounded-full flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(0,242,255,0.5)] bg-black/40">
              <div className="w-5 h-5 border border-[#00f2ff] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#00f2ff] rounded-full shadow-[0_0_8px_#00f2ff]"></div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-widest uppercase text-[#00f2ff] text-glow-cyan">
                  J.A.R.V.I.S. Core
                </h1>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] uppercase">
                  VIDAPI
                </span>
              </div>
              <p className="text-[9px] font-mono text-[#00f2ff]/60 uppercase tracking-tight">
                STARK STREAM TERMINAL
              </p>
            </div>
          </button>
        </div>

        {/* Primary Page Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-black/70 border border-[#00f2ff]/30 p-0.5 text-xs font-mono">
          <button
            id="nav-tab-terminal"
            onClick={() => { jarvisAudio.playClick(); onPageChange('player'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider transition-all ${
              activePage === 'player'
                ? 'bg-[#00f2ff] text-black font-bold shadow-[0_0_10px_#00f2ff]'
                : 'text-[#00f2ff]/70 hover:text-white hover:bg-[#00f2ff]/15'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TERMINAL</span>
          </button>

          <button
            id="nav-tab-latest"
            onClick={() => { jarvisAudio.playClick(); onPageChange('latest'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider transition-all ${
              activePage === 'latest'
                ? 'bg-[#00f2ff] text-black font-bold shadow-[0_0_10px_#00f2ff]'
                : 'text-[#00f2ff]/70 hover:text-white hover:bg-[#00f2ff]/15'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>LATEST</span>
          </button>

          <button
            id="nav-tab-hot"
            onClick={() => { jarvisAudio.playClick(); onPageChange('hot'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider transition-all ${
              activePage === 'hot'
                ? 'bg-amber-400 text-black font-bold shadow-[0_0_10px_#ffaa00]'
                : 'text-amber-400/80 hover:text-white hover:bg-amber-400/15'
            }`}
            title="Hot Movies, TV Shows & Latest Episodes synced live from VidAPI"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>HOT RADAR</span>
          </button>

          <button
            id="nav-tab-explore"
            onClick={() => { jarvisAudio.playClick(); onPageChange('explore'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider transition-all ${
              activePage === 'explore'
                ? 'bg-[#00f2ff] text-black font-bold shadow-[0_0_10px_#00f2ff]'
                : 'text-[#00f2ff]/70 hover:text-white hover:bg-[#00f2ff]/15'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>EXPLORE</span>
          </button>

          {activePage === 'search' && (
            <button
              id="nav-tab-search"
              onClick={() => { jarvisAudio.playClick(); onPageChange('search'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider transition-all bg-[#00f2ff] text-black font-bold shadow-[0_0_10px_#00f2ff]"
            >
              <Search className="w-3.5 h-3.5" />
              <span>SEARCH</span>
            </button>
          )}
        </nav>

        {/* Attacker.bz High-Density Quick Search Bar */}
        {onSelectMedia && (
          <div className="w-full lg:w-auto flex-1 max-w-sm order-3 lg:order-2">
            <AttackerSearchBar
              onSelectMedia={onSelectMedia}
              onViewAllResults={(q) => {
                if (onSearchSubmit) onSearchSubmit(q);
                onPageChange('search');
              }}
            />
          </div>
        )}

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 order-2 lg:order-3">
          {/* Direct ID Launcher Button */}
          <button
            id="btn-direct-launcher"
            onClick={() => { jarvisAudio.playClick(); onOpenDirectLauncher(); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/40 text-[#00f2ff] text-xs font-mono tracking-tight transition-all"
            title="Launch by IMDb (tt...) or TMDb ID directly on VidAPI"
          >
            <Sliders className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span className="hidden sm:inline">CUSTOM ID</span>
          </button>

          {/* AI Intelligence Assistant */}
          <button
            id="btn-jarvis-ai-assistant"
            onClick={() => { jarvisAudio.playClick(); onOpenAiChat(); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/40 text-[#00f2ff] text-xs font-mono tracking-tight shadow-[0_0_10px_rgba(0,242,255,0.2)] transition-all"
            title="Ask JARVIS for suggestions & smart analysis"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00f2ff] animate-pulse" />
            <span className="hidden sm:inline">AI CORE</span>
          </button>

          {/* Voice Search Primary Trigger */}
          <button
            id="btn-header-voice-search"
            onClick={() => {
              if (!isListening) {
                jarvisAudio.playVoiceListen();
              } else {
                jarvisAudio.playClick();
              }
              onToggleVoice();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold tracking-tight transition-all border ${
              isListening 
                ? 'bg-rose-600/30 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse' 
                : 'bg-[#00f2ff]/15 hover:bg-[#00f2ff]/30 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.25)]'
            }`}
            title="Activate Voice Search / Command"
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
                <span>LISTENING</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span>VOICE</span>
              </>
            )}
          </button>

          {/* Watchlist Counter Button */}
          <button
            id="btn-watchlist-modal"
            onClick={() => { jarvisAudio.playClick(); onOpenWatchlist(); }}
            className="relative px-2 py-1.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/30 text-[#00f2ff] transition-all"
            title="Stark Vault (Watchlist)"
          >
            <Bookmark className="w-3.5 h-3.5" />
            {watchlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00f2ff] text-black text-[9px] font-bold flex items-center justify-center font-mono">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* History Modal Button */}
          <button
            id="btn-history-modal"
            onClick={() => { jarvisAudio.playClick(); onOpenHistory(); }}
            className="relative px-2 py-1.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/30 text-[#00f2ff] transition-all"
            title="Streaming Logs (History)"
          >
            <History className="w-3.5 h-3.5" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-black text-[9px] font-bold flex items-center justify-center font-mono">
                {historyCount}
              </span>
            )}
          </button>

          {/* Audio Controls */}
          <div className="flex items-center gap-1 pl-1 sm:pl-2 border-l border-[#00f2ff]/20">
            <button
              onClick={handleToggleSound}
              className={`p-1.5 text-[#00f2ff] hover:bg-[#00f2ff]/20 border border-[#00f2ff]/30 transition-all ${
                soundOn ? 'opacity-100' : 'opacity-40'
              }`}
              title={soundOn ? 'HUD Sound Effects Active' : 'Sound Effects Muted'}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
