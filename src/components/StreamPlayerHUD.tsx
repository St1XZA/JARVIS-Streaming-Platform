import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, 
  Film, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  RefreshCw, 
  Sliders,
  ExternalLink,
  Zap,
  Globe,
  FastForward,
  Server,
  Star,
  Calendar,
  Clock,
  Users,
  User,
  Clapperboard,
  Sparkles,
  Shield,
  Info,
  Layers,
  X
} from 'lucide-react';
import { MediaItem, StreamServer } from '../types';
import { buildStreamUrl, buildVidFastUrl, VIDFAST_ORIGINS } from '../data/mediaCatalog';
import { jarvisAudio } from '../utils/audio';

interface StreamPlayerHUDProps {
  activeMedia: MediaItem;
  season: number;
  episode: number;
  server?: StreamServer;
  onSeasonChange: (season: number) => void;
  onEpisodeChange: (episode: number) => void;
  onServerChange?: (server: StreamServer) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (media: MediaItem) => void;
  onDirectLaunch: (id: string, type: 'movie' | 'tv', s?: number, e?: number) => void;
  onClosePlayer?: () => void;
}

export const StreamPlayerHUD: React.FC<StreamPlayerHUDProps> = ({
  activeMedia,
  season,
  episode,
  server = 'vidfast-vc',
  onSeasonChange,
  onEpisodeChange,
  onServerChange,
  isWatchlisted,
  onToggleWatchlist,
  onDirectLaunch,
  onClosePlayer,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [activeServer, setActiveServer] = useState<StreamServer>(server);
  const [playerDomain, setPlayerDomain] = useState<'vaplayer.ru' | 'vidapi.ru'>('vaplayer.ru');
  const [customId, setCustomId] = useState(activeMedia.id);
  const [customType, setCustomType] = useState<'movie' | 'tv'>(activeMedia.type);
  const [customSeason, setCustomSeason] = useState(season);
  const [customEpisode, setCustomEpisode] = useState(episode);
  const [copied, setCopied] = useState(false);
  const [showIdOverride, setShowIdOverride] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  const [playerStatus, setPlayerStatus] = useState<'idle' | 'buffering' | 'playing' | 'paused' | 'ended'>('buffering');
  const [autoNextEnabled, setAutoNextEnabled] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hudNotice, setHudNotice] = useState<{ message: string; type: 'info' | 'success' | 'warn'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  });
  const [liveShowData, setLiveShowData] = useState<{
    totalSeasons?: number;
    episodesPerSeason?: number;
    seasonsData?: Array<{ seasonNumber: number; episodeCount: number; name?: string }>;
  } | null>(null);

  // Sync activeServer with prop if it changes
  useEffect(() => {
    if (server && server !== activeServer) {
      setActiveServer(server);
    }
  }, [server]);

  const handleServerSwitch = (newServer: StreamServer) => {
    jarvisAudio.playClick();
    setActiveServer(newServer);
    if (onServerChange) {
      onServerChange(newServer);
    }
    setIframeKey(k => k + 1);
    const label = newServer === 'vidfast-vc' ? 'VIDFAST.VC' : 'VIDAPI.RU';
    showNotice(`STREAMING GATEWAY SWITCHED: ${label}`, 'success');
  };

  const showNotice = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setHudNotice({ message, type, visible: true });
    jarvisAudio.playClick();
    setTimeout(() => {
      setHudNotice(prev => ({ ...prev, visible: false }));
    }, 2800);
  };
  const [customSeasonInput, setCustomSeasonInput] = useState<string>('');
  const [customEpisodeInput, setCustomEpisodeInput] = useState<string>('');

  // Fetch full live metadata for TV shows
  useEffect(() => {
    if (activeMedia.type === 'tv') {
      const fetchId = activeMedia.tmdbId || activeMedia.imdbId || activeMedia.id;
      fetch(`/api/tmdb/details/tv/${fetchId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.media) {
            setLiveShowData({
              totalSeasons: data.media.totalSeasons,
              episodesPerSeason: data.media.episodesPerSeason,
              seasonsData: data.media.seasonsData,
            });
          }
        })
        .catch(() => {});
    } else {
      setLiveShowData(null);
    }
  }, [activeMedia.id, activeMedia.type, activeMedia.tmdbId, activeMedia.imdbId]);

  // Determine total available seasons
  const effectiveTotalSeasons = Math.max(
    activeMedia.totalSeasons || 0,
    liveShowData?.totalSeasons || 0,
    activeMedia.seasonsData?.length || 0,
    liveShowData?.seasonsData?.length || 0,
    season,
    activeMedia.title?.toLowerCase().includes('always sunny') ? 18 : 1
  );

  // Determine episode count for current season
  const currentSeasonMeta = (activeMedia.seasonsData || liveShowData?.seasonsData)?.find(s => s.seasonNumber === season);
  const effectiveEpisodesCount = Math.max(
    currentSeasonMeta?.episodeCount || 0,
    activeMedia.episodesPerSeason || 0,
    liveShowData?.episodesPerSeason || 0,
    episode,
    10
  );

  // Construct active stream URL based on active provider
  const streamUrl = activeServer === 'vidfast-vc'
    ? buildVidFastUrl(activeMedia.id, activeMedia.type, season, episode, {
        autoPlay: true,
        theme: '00f2ff',
        nextButton: true,
        autoNext: autoNextEnabled,
        fullscreenButton: true,
        chromecast: true,
      })
    : buildStreamUrl(activeMedia.id, activeMedia.type, season, episode, playerDomain);

  // Sync state when active media changes
  useEffect(() => {
    setCustomId(activeMedia.id);
    setCustomType(activeMedia.type);
    setCustomSeason(season);
    setCustomEpisode(episode);
    setIframeKey(k => k + 1);
    setPlayerStatus('buffering');
    setPlaybackProgress(0);
  }, [activeMedia.id, activeMedia.type, season, episode]);

  // Listen for VidFast & VidAPI postMessage player events and MEDIA_DATA
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const isVidFast = VIDFAST_ORIGINS.includes(event.origin);
        const raw = event.data;
        const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;

        if (!payload) return;

        // 1. Handle VidFast Direct Media Data Progress persistence
        if (payload.type === 'MEDIA_DATA' || payload.event === 'MEDIA_DATA') {
          try {
            const dataToStore = payload.data || payload;
            localStorage.setItem('vidFastProgress', JSON.stringify(dataToStore));
          } catch (e) {
            console.warn('Failed to store vidFastProgress:', e);
          }
        }

        // 2. Handle VidFast & VidAPI Unified PLAYER_EVENT
        if (payload.type === 'PLAYER_EVENT' || payload.event === 'PLAYER_EVENT' || payload.event === 'timeupdate' || payload.event === 'ended') {
          const data = payload.data || payload;

          // VidFast data format: { event, currentTime, duration, playing, muted, volume }
          if (data.currentTime !== undefined) {
            setPlaybackProgress(Math.floor(data.currentTime));
          } else if (data.player_progress !== undefined) {
            setPlaybackProgress(Math.floor(data.player_progress));
          }

          if (data.duration !== undefined) {
            setPlaybackDuration(Math.floor(data.duration));
          } else if (data.player_duration !== undefined) {
            setPlaybackDuration(Math.floor(data.player_duration));
          }

          const evt = data.event || data.player_status;
          if (evt === 'play' || evt === 'playing') {
            setPlayerStatus('playing');
          } else if (evt === 'pause' || evt === 'paused') {
            setPlayerStatus('paused');
          } else if (evt === 'ended' || evt === 'completed') {
            setPlayerStatus('ended');
            if (activeMedia.type === 'tv' && autoNextEnabled) {
              handleNextEpisode();
            }
          }

          if (data.volume !== undefined) {
            setVolumeLevel(Math.round(data.volume <= 1 ? data.volume * 100 : data.volume));
          }
          if (data.muted !== undefined) {
            setIsMuted(Boolean(data.muted));
          }
        }
      } catch {
        // Safe ignore non-JSON postMessage from other extensions
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeMedia.type, autoNextEnabled, episode, season]);

  // Listen for Global Voice Video Control directives from J.A.R.V.I.S.
  useEffect(() => {
    const handleJarvisVideoControl = (event: Event) => {
      const customEvt = event as CustomEvent;
      const { action } = customEvt.detail || {};
      const iframe = iframeRef.current;

      const post = (msg: any) => {
        try {
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(msg, '*');
          }
        } catch (e) {
          console.warn('Video postMessage notice:', e);
        }
      };

      switch (action) {
        case 'pause': {
          post({ type: 'pause', command: 'pause' });
          post(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }));
          post(JSON.stringify({ type: 'PLAYER_COMMAND', command: 'pause' }));
          setPlayerStatus('paused');
          showNotice('JARVIS PROTOCOL: PLAYBACK PAUSED', 'info');
          break;
        }
        case 'play':
        case 'resume': {
          post({ type: 'play', command: 'play' });
          post(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }));
          post(JSON.stringify({ type: 'PLAYER_COMMAND', command: 'play' }));
          setPlayerStatus('playing');
          showNotice('JARVIS PROTOCOL: PLAYBACK RESUMED', 'success');
          break;
        }
        case 'volume_up': {
          setVolumeLevel(prev => {
            const next = Math.min(100, prev + 20);
            post({ type: 'setVolume', volume: next / 100 });
            post(JSON.stringify({ event: 'command', func: 'setVolume', args: [next] }));
            showNotice(`JARVIS AUDIO: VOLUME INCREASED TO ${next}%`, 'info');
            return next;
          });
          setIsMuted(false);
          break;
        }
        case 'volume_down': {
          setVolumeLevel(prev => {
            const next = Math.max(0, prev - 20);
            post({ type: 'setVolume', volume: next / 100 });
            post(JSON.stringify({ event: 'command', func: 'setVolume', args: [next] }));
            showNotice(`JARVIS AUDIO: VOLUME LOWERED TO ${next}%`, 'info');
            return next;
          });
          break;
        }
        case 'mute': {
          setIsMuted(true);
          post({ type: 'mute', command: 'mute' });
          post(JSON.stringify({ event: 'command', func: 'mute', args: '' }));
          showNotice('JARVIS AUDIO: OUTPUT MUTED', 'warn');
          break;
        }
        case 'unmute': {
          setIsMuted(false);
          post({ type: 'unmute', command: 'unmute' });
          post(JSON.stringify({ event: 'command', func: 'unMute', args: '' }));
          showNotice('JARVIS AUDIO: OUTPUT RESTORED', 'success');
          break;
        }
        case 'fullscreen': {
          const container = playerContainerRef.current;
          if (container) {
            if (container.requestFullscreen) {
              container.requestFullscreen().catch(() => {});
            }
          }
          showNotice('JARVIS DISPLAY: FULLSCREEN ENGAGED', 'info');
          break;
        }
        case 'exit_fullscreen': {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          showNotice('JARVIS DISPLAY: FULLSCREEN EXITED', 'info');
          break;
        }
        case 'restart': {
          setIframeKey(k => k + 1);
          showNotice('JARVIS STREAM: REINITIALIZED FROM START', 'info');
          break;
        }
        case 'forward': {
          post({ type: 'seek', seconds: 30 });
          post(JSON.stringify({ event: 'command', func: 'seekTo', args: [playbackProgress + 30, true] }));
          showNotice('JARVIS STREAM: ADVANCED +30 SECONDS', 'info');
          break;
        }
        case 'rewind': {
          post({ type: 'seek', seconds: -30 });
          post(JSON.stringify({ event: 'command', func: 'seekTo', args: [Math.max(0, playbackProgress - 30), true] }));
          showNotice('JARVIS STREAM: REWOUND -30 SECONDS', 'info');
          break;
        }
        case 'next_ep': {
          handleNextEpisode();
          showNotice('JARVIS QUEUE: ADVANCING TO NEXT EPISODE', 'success');
          break;
        }
        case 'prev_ep': {
          handlePrevEpisode();
          showNotice('JARVIS QUEUE: RETURNING TO PREVIOUS EPISODE', 'info');
          break;
        }
        case 'toggle_server': {
          const next = activeServer === 'vidfast-vc' ? 'vidapi-ru' : 'vidfast-vc';
          handleServerSwitch(next);
          break;
        }
      }
    };

    window.addEventListener('jarvis-video-control', handleJarvisVideoControl);
    return () => window.removeEventListener('jarvis-video-control', handleJarvisVideoControl);
  }, [playbackProgress, effectiveEpisodesCount, effectiveTotalSeasons, episode, season, activeServer]);

  const handleNextEpisode = () => {
    jarvisAudio.playClick();
    const maxEp = effectiveEpisodesCount;
    if (episode < maxEp) {
      onEpisodeChange(episode + 1);
    } else {
      const maxSeason = effectiveTotalSeasons;
      if (season < maxSeason) {
        onSeasonChange(season + 1);
        onEpisodeChange(1);
      }
    }
  };

  const handlePrevEpisode = () => {
    jarvisAudio.playClick();
    if (episode > 1) {
      onEpisodeChange(episode - 1);
    } else if (season > 1) {
      onSeasonChange(season - 1);
      onEpisodeChange(1);
    }
  };

  const handleCopyLink = () => {
    jarvisAudio.playClick();
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    jarvisAudio.playClick();
    setIframeKey(k => k + 1);
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId.trim()) return;
    jarvisAudio.playStreamInit();
    onDirectLaunch(customId.trim(), customType, customSeason, customEpisode);
    setShowIdOverride(false);
  };

  const handleCustomSeasonJump = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseInt(customSeasonInput, 10);
    if (!isNaN(s) && s > 0) {
      jarvisAudio.playClick();
      onSeasonChange(s);
      onEpisodeChange(1);
      setCustomSeasonInput('');
    }
  };

  const handleCustomEpisodeJump = (e: React.FormEvent) => {
    e.preventDefault();
    const ep = parseInt(customEpisodeInput, 10);
    if (!isNaN(ep) && ep > 0) {
      jarvisAudio.playClick();
      onEpisodeChange(ep);
      setCustomEpisodeInput('');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 font-mono">
      {/* Outer HUD Container */}
      <div className="relative bg-[#02050a]/95 border border-[#00f2ff]/40 shadow-[0_0_40px_rgba(0,242,255,0.15)] flex flex-col">
        
        {/* Top Header / Telemetry Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:px-3 sm:py-2 bg-gradient-to-r from-black via-[#041424] to-black border-b border-[#00f2ff]/30">
          
          {/* Title & Metadata */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 bg-[#00f2ff]/10 border border-[#00f2ff]/40 text-[#00f2ff]">
              {activeMedia.type === 'movie' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-[#00f2ff] tracking-wide truncate uppercase">
                  {activeMedia.title}
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/40 uppercase shrink-0">
                  {activeMedia.type}
                </span>
                {activeMedia.type === 'tv' && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold shrink-0">
                    S{season}:E{episode}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] text-[#00f2ff]/60">
                <span>NODE_ID: <strong className="text-white">{activeMedia.id}</strong></span>
                {activeMedia.imdbId && <span className="hidden md:inline">IMDb: <strong className="text-white">{activeMedia.imdbId}</strong></span>}
                {activeMedia.tmdbId && <span className="hidden md:inline">TMDb: <strong className="text-white">{activeMedia.tmdbId}</strong></span>}
                <span>GATEWAY: <strong className="text-[#00f2ff] uppercase">{activeServer === 'vidfast-vc' ? 'VIDFAST.VC' : playerDomain}</strong></span>
                <span className="hidden sm:inline">SCORE: <strong className="text-amber-300">★ {activeMedia.rating}</strong></span>
              </div>
            </div>
          </div>

          {/* Top Right Quick Actions & Provider Switcher */}
          <div className="flex items-center gap-1.5">
            {/* Streaming Provider Switcher (VIDFAST.VC vs VIDAPI.RU) */}
            <div className="flex items-center border border-[#00f2ff]/40 bg-black/60 p-0.5">
              <button
                onClick={() => handleServerSwitch('vidfast-vc')}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                  activeServer === 'vidfast-vc'
                    ? 'bg-[#00f2ff] text-black shadow-[0_0_8px_#00f2ff]'
                    : 'text-[#00f2ff]/70 hover:text-[#00f2ff] hover:bg-[#00f2ff]/10'
                }`}
                title="Use VidFast High-Speed Matrix (vidfast.vc with AutoNext & Progress)"
              >
                <Zap className="w-2.5 h-2.5" />
                <span>VIDFAST</span>
              </button>
              <button
                onClick={() => handleServerSwitch('vidapi-ru')}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                  activeServer === 'vidapi-ru'
                    ? 'bg-[#00f2ff] text-black shadow-[0_0_8px_#00f2ff]'
                    : 'text-[#00f2ff]/70 hover:text-[#00f2ff] hover:bg-[#00f2ff]/10'
                }`}
                title="Use VidAPI Russian Gateway (vidapi.ru / vaplayer.ru)"
              >
                <Server className="w-2.5 h-2.5" />
                <span>VIDAPI</span>
              </button>
            </div>

            {/* If VidAPI is active, allow mirror switching */}
            {activeServer === 'vidapi-ru' && (
              <button
                onClick={() => {
                  jarvisAudio.playClick();
                  setPlayerDomain(d => d === 'vaplayer.ru' ? 'vidapi.ru' : 'vaplayer.ru');
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono border border-[#00f2ff]/30 bg-black/50 hover:bg-[#00f2ff]/20 text-[#00f2ff] transition-all"
                title="Toggle between official VidAPI embed mirrors: vaplayer.ru and vidapi.ru"
              >
                <Globe className="w-3 h-3 text-[#00f2ff]" />
                <span className="hidden sm:inline">MIRROR:</span>
                <span className="font-bold">{playerDomain}</span>
              </button>
            )}

            {/* Custom ID Toggle */}
            <button
              onClick={() => {
                jarvisAudio.playClick();
                setShowIdOverride(!showIdOverride);
              }}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono border transition-all ${
                showIdOverride 
                  ? 'bg-[#00f2ff] text-black border-[#00f2ff] font-bold' 
                  : 'bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border-[#00f2ff]/30 text-[#00f2ff]'
              }`}
              title="Override with custom IMDb / TMDb ID"
            >
              <Sliders className="w-3 h-3" />
              <span>CUSTOM ID</span>
            </button>

            {/* Watchlist Toggle */}
            <button
              onClick={() => {
                jarvisAudio.playClick();
                onToggleWatchlist(activeMedia);
              }}
              className={`p-1 sm:px-2 sm:py-1 border text-[10px] flex items-center gap-1 transition-all ${
                isWatchlisted 
                  ? 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.3)]' 
                  : 'bg-black/40 border-[#00f2ff]/30 text-slate-300 hover:border-[#00f2ff]'
              }`}
              title={isWatchlisted ? 'Remove from Stark Vault' : 'Save to Stark Vault'}
            >
              {isWatchlisted ? <BookmarkCheck className="w-3 h-3 text-[#00f2ff]" /> : <Bookmark className="w-3 h-3" />}
              <span className="hidden sm:inline">{isWatchlisted ? 'SAVED' : 'SAVE'}</span>
            </button>

            {/* Reload Stream */}
            <button
              onClick={handleReload}
              className="p-1 bg-black/40 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/30 text-[#00f2ff] transition-all"
              title="Reload stream player"
            >
              <RefreshCw className="w-3 h-3" />
            </button>

            {/* Direct Detach / Popout in New Tab */}
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => jarvisAudio.playClick()}
              className="p-1 bg-black/40 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/30 text-[#00f2ff] transition-all flex items-center justify-center"
              title="Open direct embed in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Close / Collapse Player Button */}
            {onClosePlayer && (
              <button
                id="btn-close-stream-player"
                onClick={() => {
                  jarvisAudio.playClick();
                  onClosePlayer();
                }}
                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-white text-[10px] font-mono font-bold transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                title="Close Stream Player and return to browse view"
              >
                <X className="w-3 h-3 text-rose-400" />
                <span className="hidden sm:inline">CLOSE</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom ID Input Matrix Tray */}
        {showIdOverride && (
          <form 
            onSubmit={handleOverrideSubmit}
            className="p-3 bg-[#031120] border-b border-[#00f2ff]/40 flex flex-wrap items-center gap-3 animate-in fade-in"
          >
            <span className="text-[10px] text-[#00f2ff] font-bold">MANUAL ID OVERRIDE:</span>
            
            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setCustomType('movie')}
                className={`px-2 py-0.5 border text-[10px] ${customType === 'movie' ? 'bg-[#00f2ff] text-black font-bold' : 'border-[#00f2ff]/30 text-[#00f2ff]'}`}
              >
                MOVIE
              </button>
              <button
                type="button"
                onClick={() => setCustomType('tv')}
                className={`px-2 py-0.5 border text-[10px] ${customType === 'tv' ? 'bg-[#00f2ff] text-black font-bold' : 'border-[#00f2ff]/30 text-[#00f2ff]'}`}
              >
                TV SHOW
              </button>
            </div>

            <input
              type="text"
              placeholder="e.g. tt29623480 or 762441"
              value={customId}
              onChange={e => setCustomId(e.target.value)}
              className="px-2 py-1 bg-black border border-[#00f2ff]/50 text-[#00f2ff] text-xs font-mono w-48 focus:outline-none focus:border-[#00f2ff]"
            />

            {customType === 'tv' && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-amber-400 font-bold text-[10px]">S:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customSeason}
                  onChange={e => setCustomSeason(parseInt(e.target.value) || 1)}
                  className="w-12 bg-black border border-amber-500/40 px-1 py-1 text-amber-200 text-center text-xs"
                />
                <span className="text-amber-400 font-bold text-[10px]">E:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customEpisode}
                  onChange={e => setCustomEpisode(parseInt(e.target.value) || 1)}
                  className="w-12 bg-black border border-amber-500/40 px-1 py-1 text-amber-200 text-center text-xs"
                />
              </div>
            )}

            <button
              type="submit"
              className="px-3 py-1 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold text-xs uppercase shadow-[0_0_10px_#00f2ff] transition-all"
            >
              LAUNCH
            </button>
          </form>
        )}

        {/* Responsive 16:9 Aspect Ratio Video Stage */}
        <div 
          ref={playerContainerRef}
          className="relative w-full pt-[56.25%] bg-black flex items-center justify-center border-b border-[#00f2ff]/20 overflow-hidden"
        >
          {/* Live Feed Status Chip */}
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/70 px-2 py-0.5 border border-red-500/40">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest">
              {activeServer === 'vidfast-vc' ? 'VIDFAST_LIVE' : 'VIDAPI_LIVE'}
            </span>
            {isMuted && (
              <span className="ml-1 px-1 bg-amber-500/30 text-amber-300 text-[8px] border border-amber-500/50">MUTED</span>
            )}
          </div>

          {/* JARVIS Live HUD Command Notice Overlay */}
          <AnimatePresence>
            {hudNotice.visible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className={`absolute top-4 z-40 px-4 py-2 bg-black/90 border font-mono font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(0,242,255,0.4)] flex items-center gap-2 ${
                  hudNotice.type === 'warn' 
                    ? 'border-amber-400 text-amber-300' 
                    : hudNotice.type === 'success' 
                    ? 'border-emerald-400 text-emerald-300' 
                    : 'border-[#00f2ff] text-[#00f2ff]'
                }`}
              >
                <div className={`w-2 h-2 rounded-full animate-ping ${
                  hudNotice.type === 'warn' ? 'bg-amber-400' : hudNotice.type === 'success' ? 'bg-emerald-400' : 'bg-[#00f2ff]'
                }`} />
                <span>{hudNotice.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hologram Corner Brackets */}
          <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#00f2ff] z-20 pointer-events-none"></div>
          <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff] z-20 pointer-events-none"></div>
          <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff] z-20 pointer-events-none"></div>
          <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#00f2ff] z-20 pointer-events-none"></div>

          {/* Video IFrame Embed - Responsive 16:9 with Fullscreen and Encrypted-Media Permissions */}
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={streamUrl}
            title={`${activeMedia.title} - ${activeServer === 'vidfast-vc' ? 'VidFast' : 'VidAPI'} Stream Player`}
            className="absolute top-0 left-0 w-full h-full border-0 z-10"
            referrerPolicy="origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />

          {/* Stream Progress Indicator Bar */}
          <div className="absolute bottom-1 left-3 right-3 h-0.5 bg-white/10 z-20 pointer-events-none">
            <div className="h-full bg-[#00f2ff] w-3/4 shadow-[0_0_10px_#00f2ff]"></div>
          </div>

          {copied && (
            <div className="absolute top-4 right-4 z-30 px-3 py-1 bg-[#00f2ff] text-black font-mono font-bold text-xs shadow-lg animate-bounce">
              STREAM LINK COPIED
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* TV SHOW SEASONS & EPISODES DIRECTORY (UNDER THE PLAYER)   */}
        {/* ========================================================= */}
        {activeMedia.type === 'tv' ? (
          <div className="p-3 sm:p-4 bg-gradient-to-r from-black via-[#031524] to-black border-t-2 border-[#00f2ff]/40 text-xs font-mono space-y-3">
            
            {/* Control Deck Header: Now Playing Telemetry & Quick Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#00f2ff]/20">
              {/* Left: Active Episode Status */}
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse"></div>
                <span className="font-bold text-[#00f2ff] uppercase tracking-wider text-xs">
                  NOW PLAYING: <span className="text-white font-bold">{activeMedia.title}</span> — <span className="text-amber-300 font-bold">SEASON {season} • EPISODE {episode}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#00f2ff]/15 border border-[#00f2ff]/30 text-[#00f2ff] font-bold">
                  {effectiveTotalSeasons} {effectiveTotalSeasons > 1 ? 'SEASONS' : 'SEASON'}
                </span>
              </div>

              {/* Right: Step Controls & Auto-Next Toggle */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handlePrevEpisode}
                  disabled={season === 1 && episode === 1}
                  className="flex items-center gap-1 px-2.5 py-1 bg-black/70 border border-[#00f2ff]/40 hover:bg-[#00f2ff]/20 text-[#00f2ff] disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>PREV EP</span>
                </button>

                <button
                  onClick={handleNextEpisode}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#00f2ff]/20 hover:bg-[#00f2ff] border border-[#00f2ff] text-[#00f2ff] hover:text-black transition-all text-xs font-bold"
                >
                  <span>NEXT EP</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    jarvisAudio.playClick();
                    setAutoNextEnabled(!autoNextEnabled);
                  }}
                  className={`px-2 py-1 text-[10px] border flex items-center gap-1 transition-all ${
                    autoNextEnabled 
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]' 
                      : 'bg-black/50 border-gray-600 text-gray-400'
                  }`}
                  title="Automatically advance to the next episode upon completion"
                >
                  <FastForward className="w-3 h-3" />
                  <span>AUTO-NEXT: {autoNextEnabled ? 'ON' : 'OFF'}</span>
                </button>

                {/* Direct Pop-Out Theater */}
                <a
                  href={streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => jarvisAudio.playClick()}
                  className="px-2 py-1 bg-black/60 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] text-[10px] uppercase flex items-center gap-1 transition-all"
                  title="Pop-out in new standalone theater window"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden md:inline">POP-OUT</span>
                </a>
              </div>
            </div>

            {/* Season Selector Tabs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#00f2ff]/80 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00f2ff]" />
                  <span>SELECT SEASON:</span>
                </span>
                
                {/* Jump to Season Form */}
                <form onSubmit={handleCustomSeasonJump} className="flex items-center gap-1">
                  <span className="text-[9px] text-[#00f2ff]/60">JUMP TO SEASON:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="S#"
                    value={customSeasonInput}
                    onChange={e => setCustomSeasonInput(e.target.value)}
                    className="w-12 px-1 py-0.5 bg-black border border-[#00f2ff]/40 text-[#00f2ff] text-[11px] text-center focus:outline-none focus:border-[#00f2ff]"
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 bg-[#00f2ff]/20 hover:bg-[#00f2ff] hover:text-black border border-[#00f2ff]/50 text-[#00f2ff] text-[10px] font-bold"
                  >
                    GO
                  </button>
                </form>
              </div>

              {/* Season Buttons Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                {Array.from({ length: effectiveTotalSeasons }).map((_, idx) => {
                  const sNum = idx + 1;
                  const seasonInfo = (activeMedia.seasonsData || liveShowData?.seasonsData)?.find(s => s.seasonNumber === sNum);
                  return (
                    <button
                      key={sNum}
                      onClick={() => {
                        jarvisAudio.playClick();
                        onSeasonChange(sNum);
                        onEpisodeChange(1);
                      }}
                      className={`px-3 py-1.5 text-xs border font-mono transition-all shrink-0 flex items-center gap-1.5 ${
                        season === sNum 
                          ? 'bg-[#00f2ff] text-black border-[#00f2ff] font-bold shadow-[0_0_12px_#00f2ff] scale-105' 
                          : 'bg-black/80 border-[#00f2ff]/30 text-slate-300 hover:text-[#00f2ff] hover:border-[#00f2ff]'
                      }`}
                    >
                      <span>SEASON {sNum}</span>
                      {seasonInfo?.episodeCount && (
                        <span className="text-[10px] opacity-75">({seasonInfo.episodeCount} eps)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Episode Selector Matrix */}
            <div className="space-y-1.5 pt-2 border-t border-[#00f2ff]/20">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-amber-300" />
                  <span>EPISODES FOR SEASON {season} ({effectiveEpisodesCount} TOTAL):</span>
                </span>

                {/* Jump to Episode Form */}
                <form onSubmit={handleCustomEpisodeJump} className="flex items-center gap-1">
                  <span className="text-[9px] text-[#00f2ff]/60">JUMP TO EP:</span>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    placeholder="EP#"
                    value={customEpisodeInput}
                    onChange={e => setCustomEpisodeInput(e.target.value)}
                    className="w-12 px-1 py-0.5 bg-black border border-amber-500/40 text-amber-300 text-[11px] text-center focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-400 hover:text-black border border-amber-500/50 text-amber-300 text-[10px] font-bold"
                  >
                    GO
                  </button>
                </form>
              </div>

              {/* Episode Buttons Grid / Selector */}
              {effectiveEpisodesCount > 36 ? (
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-[11px] text-[#00f2ff] font-bold shrink-0">SELECT EPISODE:</label>
                  <select
                    value={episode}
                    onChange={(e) => {
                      jarvisAudio.playClick();
                      onEpisodeChange(parseInt(e.target.value, 10));
                    }}
                    className="flex-1 bg-black border border-[#00f2ff]/50 text-white px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00f2ff]"
                  >
                    {Array.from({ length: effectiveEpisodesCount }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        Episode {idx + 1} (Season {season})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 p-1.5 bg-black/60 border border-[#00f2ff]/20 max-h-48 overflow-y-auto">
                  {Array.from({ length: effectiveEpisodesCount }).map((_, idx) => {
                    const epNum = idx + 1;
                    const isCurrent = episode === epNum;
                    return (
                      <button
                        key={epNum}
                        onClick={() => {
                          jarvisAudio.playClick();
                          onEpisodeChange(epNum);
                        }}
                        className={`py-1.5 px-2 text-xs font-mono border transition-all text-center ${
                          isCurrent
                            ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-[0_0_10px_#fbbf24] scale-105 z-10'
                            : 'bg-black/90 border-[#00f2ff]/20 text-slate-300 hover:text-white hover:border-[#00f2ff] hover:bg-[#00f2ff]/10'
                        }`}
                      >
                        EP {epNum}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Telemetry Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#00f2ff]/15 text-[10px] text-[#00f2ff]/70">
              <div className="flex items-center gap-3">
                <span>GATEWAY: <strong className="text-white uppercase">{activeServer}</strong></span>
                <span>QUALITY: <strong className="text-emerald-400">1080p / 4K STREAM</strong></span>
                <span>AUDIO: <strong className="text-amber-300">DOLBY 5.1</strong></span>
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 text-[#00f2ff] hover:text-white"
              >
                <Share2 className="w-3 h-3" />
                <span>COPY EPISODE STREAM LINK</span>
              </button>
            </div>

          </div>
        ) : (
          /* ========================================================= */
          /* MOVIE STREAM TELEMETRY BAR (UNDER THE PLAYER)             */
          /* ========================================================= */
          <div className="p-3 bg-gradient-to-r from-black via-[#031524] to-black border-t-2 border-[#00f2ff]/40 text-xs font-mono flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-[#00f2ff] shadow-[0_0_8px_#00f2ff] animate-pulse"></div>
              <div>
                <span className="font-bold text-white uppercase text-xs">{activeMedia.title}</span>
                <span className="text-[#00f2ff] ml-1.5 font-bold">({activeMedia.year})</span>
                {activeMedia.duration && (
                  <span className="text-slate-400 ml-2">[{activeMedia.duration}]</span>
                )}
              </div>
              <span className="text-[10px] px-2 py-0.2 bg-amber-400/15 border border-amber-400/40 text-amber-300 font-bold">
                ★ {activeMedia.rating} IMDb
              </span>
            </div>

            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-emerald-400 font-bold">4K UHD 2160p</span>
              <span className="text-slate-400">|</span>
              <span className="text-amber-300 font-bold">DOLBY ATMOS</span>
              
              {/* Direct Dedicated Popout Button */}
              <a
                href={streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => jarvisAudio.playClick()}
                className="px-2.5 py-1 bg-[#00f2ff]/20 hover:bg-[#00f2ff] text-[#00f2ff] hover:text-black border border-[#00f2ff] font-mono font-bold text-[10px] uppercase flex items-center gap-1 transition-all shadow-[0_0_8px_rgba(0,242,255,0.25)]"
                title="Pop-out in new standalone theater window"
              >
                <ExternalLink className="w-3 h-3" />
                <span>POP-OUT THEATER</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="p-1 bg-black/60 border border-[#00f2ff]/30 hover:border-[#00f2ff] text-[#00f2ff] transition-all flex items-center gap-1"
                title="Copy stream link"
              >
                <Share2 className="w-3 h-3" />
                <span className="hidden sm:inline">COPY LINK</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
