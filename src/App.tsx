import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaItem, StreamServer, WatchHistoryItem, HudTheme, ActivePage } from './types';
import { MEDIA_CATALOG } from './data/mediaCatalog';
import { JarvisHeader } from './components/JarvisHeader';
import { VoiceAssistantHUD } from './components/VoiceAssistantHUD';
import { StreamPlayerHUD } from './components/StreamPlayerHUD';
import { CatalogSection } from './components/CatalogSection';
import { LatestReleasesView } from './components/LatestReleasesView';
import { HotReleasesView } from './components/HotReleasesView';
import { ExploreView } from './components/ExploreView';
import { SearchResultsView } from './components/SearchResultsView';
import { AttackerLandingHub } from './components/AttackerLandingHub';
import { JarvisTerminalHome } from './components/JarvisTerminalHome';
import { MediaDossierModal } from './components/MediaDossierModal';
import { JarvisAiChatModal } from './components/JarvisAiChatModal';
import { DirectLauncherModal } from './components/DirectLauncherModal';
import { WatchlistHistoryModal } from './components/WatchlistHistoryModal';
import { JarvisTelemetryFooter } from './components/JarvisTelemetryFooter';
import { jarvisAudio } from './utils/audio';

const STORAGE_KEYS = {
  WATCHLIST: 'jarvis_stream_watchlist_v1',
  HISTORY: 'jarvis_stream_history_v1',
  PAGE: 'jarvis_stream_page_v1',
};

export default function App() {
  // Default active media
  const [activeMedia, setActiveMedia] = useState<MediaItem>(MEDIA_CATALOG[0]);
  const [season, setSeason] = useState<number>(1);
  const [episode, setEpisode] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<ActivePage>('player');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastJarvisResponse, setLastJarvisResponse] = useState<string>(
    'Systems active and standing by, sir. VidAPI engine initialized. Speak or select any title to initialize stream.'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hudTheme, setHudTheme] = useState<HudTheme>('cyan');
  const [voiceRecommendations, setVoiceRecommendations] = useState<any[]>([]);

  // Modals
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isDirectLauncherOpen, setIsDirectLauncherOpen] = useState(false);
  const [isWatchlistHistoryOpen, setIsWatchlistHistoryOpen] = useState(false);
  const [watchlistHistoryTab, setWatchlistHistoryTab] = useState<'watchlist' | 'history'>('watchlist');
  const [selectedDossierMedia, setSelectedDossierMedia] = useState<MediaItem | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const handleOpenDossier = (media: MediaItem) => {
    setSelectedDossierMedia(media);
    setIsDossierOpen(true);
  };

  // Local Storage Persistence
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return saved ? JSON.parse(saved) : [MEDIA_CATALOG[0], MEDIA_CATALOG[1], MEDIA_CATALOG[4]];
    } catch {
      return [];
    }
  });

  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [
        { media: MEDIA_CATALOG[0], lastWatchedAt: Date.now() - 3600000 },
        { media: MEDIA_CATALOG[2], season: 9, episode: 1, lastWatchedAt: Date.now() - 86400000 }
      ];
    } catch {
      return [];
    }
  });

  // Save watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [watchlist]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(watchHistory));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [watchHistory]);

  // Record playback history whenever activeMedia or season/episode updates
  const recordHistory = useCallback((media: MediaItem, s?: number, e?: number) => {
    setWatchHistory(prev => {
      const filtered = prev.filter(item => item.media.id !== media.id);
      const newEntry: WatchHistoryItem = {
        media,
        season: media.type === 'tv' ? (s || 1) : undefined,
        episode: media.type === 'tv' ? (e || 1) : undefined,
        lastWatchedAt: Date.now(),
      };
      return [newEntry, ...filtered].slice(0, 30);
    });
  }, []);

  const handleSelectMedia = (media: MediaItem, s: number = 1, e: number = 1) => {
    setActiveMedia(media);
    setSeason(s);
    setEpisode(e);
    setIsPlaying(true);
    setActivePage('player');
    recordHistory(media, s, e);

    // If TV show, fetch live details to ensure complete seasons & episode structure
    if (media.type === 'tv') {
      const fetchId = media.tmdbId || media.imdbId || media.id;
      fetch(`/api/tmdb/details/tv/${fetchId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.media) {
            setActiveMedia(prev => {
              if (prev.id === media.id) {
                return {
                  ...prev,
                  totalSeasons: data.media.totalSeasons || prev.totalSeasons || 18,
                  episodesPerSeason: data.media.episodesPerSeason || prev.episodesPerSeason,
                  seasonsData: data.media.seasonsData || prev.seasonsData,
                  overview: data.media.overview || prev.overview,
                  genres: (data.media.genres && data.media.genres.length > 0) ? data.media.genres : prev.genres,
                  cast: data.media.cast || prev.cast,
                };
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }

    const spokenMsg = `Accessing stream for ${media.title}, sir.`;
    setLastJarvisResponse(spokenMsg);
    jarvisAudio.speak(spokenMsg);

    // Smooth scroll to stream player
    setTimeout(() => {
      const playerEl = document.getElementById('jarvis-stream-player');
      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleToggleWatchlist = (media: MediaItem) => {
    setWatchlist(prev => {
      const exists = prev.some(item => item.id === media.id);
      if (exists) {
        const spoken = `Removed ${media.title} from your Stark vault.`;
        setLastJarvisResponse(spoken);
        jarvisAudio.speak(spoken);
        return prev.filter(item => item.id !== media.id);
      } else {
        const spoken = `Archived ${media.title} to your Stark vault.`;
        setLastJarvisResponse(spoken);
        jarvisAudio.speak(spoken);
        return [media, ...prev];
      }
    });
  };

  const handleRemoveWatchlist = (id: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };

  const handleClearHistory = () => {
    setWatchHistory([]);
    setLastJarvisResponse('Streaming logs purged, sir.');
    jarvisAudio.speak('Streaming logs purged, sir.');
  };

  // Direct ID launcher handler
  const handleDirectLaunch = (id: string, type: 'movie' | 'tv', s: number = 1, e: number = 1) => {
    // Check if ID matches an existing catalog item
    const existing = MEDIA_CATALOG.find(
      m => m.id.toLowerCase() === id.toLowerCase() ||
           (m.imdbId && m.imdbId.toLowerCase() === id.toLowerCase()) ||
           (m.tmdbId && m.tmdbId.toString() === id)
    );

    if (existing) {
      handleSelectMedia(existing, s, e);
      return;
    }

    // Otherwise construct custom direct stream item
    const customItem: MediaItem = {
      id: id.trim(),
      imdbId: id.startsWith('tt') ? id.trim() : undefined,
      tmdbId: !id.startsWith('tt') ? id.trim() : undefined,
      type,
      title: `Stream: ${id.trim().toUpperCase()}`,
      year: new Date().getFullYear(),
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80',
      backdrop: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80',
      rating: 8.5,
      overview: `Direct stream initialized for ${type.toUpperCase()} node [${id}]. Connecting to vidapi.ru gateway.`,
      genres: ['Stream', type.toUpperCase()],
      totalSeasons: type === 'tv' ? Math.max(s, 10) : undefined,
      episodesPerSeason: type === 'tv' ? Math.max(e, 24) : undefined,
      category: 'custom'
    };

    handleSelectMedia(customItem, s, e);
  };

  // Voice Command Processing
  const handleVoiceCommand = async (transcript: string) => {
    // Keep continuous listening loop alive, only execute the command
    const rawClean = transcript.toLowerCase().trim();
    // Strip hotword "jarvis", "hey jarvis", "ok jarvis"
    const clean = rawClean.replace(/^(hey\s+jarvis|ok\s+jarvis|okay\s+jarvis|jarvis[,:\s]*)/i, '').trim();

    // Fast-path Navigation & Return Home Directives
    if (
      clean === 'go back' || 
      clean === 'go back home' || 
      clean === 'go home' || 
      clean === 'return home' || 
      clean === 'back to terminal' || 
      clean === 'return to terminal' || 
      clean === 'main page' || 
      clean === 'home' ||
      clean.includes('go back home') ||
      clean.includes('go back') ||
      clean.includes('go home')
    ) {
      setActivePage('player');
      const spoken = 'Returning to the main streaming terminal, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }

    // Fast-path Video Controls: Pause
    if (clean === 'pause' || clean.includes('pause video') || clean.includes('pause stream') || clean.includes('pause playback')) {
      window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: 'pause' } }));
      const spoken = 'Pausing stream playback, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }

    // Fast-path Video Controls: Resume / Play
    if (clean === 'resume' || clean === 'unpause' || clean.includes('resume video') || clean.includes('resume stream') || clean.includes('resume playback')) {
      window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: 'resume' } }));
      const spoken = 'Resuming stream playback, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }

    // Fast-path Video Controls: Volume Up
    if (clean.includes('volume up') || clean.includes('turn up volume') || clean.includes('increase volume') || clean === 'louder') {
      window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: 'volume_up' } }));
      const spoken = 'Increasing audio output, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }

    // Fast-path Video Controls: Volume Down
    if (clean.includes('volume down') || clean.includes('turn down volume') || clean.includes('lower volume') || clean === 'quieter') {
      window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: 'volume_down' } }));
      const spoken = 'Lowering audio output, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }

    // Fast-path Video Controls: Mute
    if (clean.includes('mute') || clean.includes('silence audio')) {
      window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: 'mute' } }));
      const spoken = 'Muting stream audio, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }

    // Fast-path Video Controls: Unmute
    if (clean.includes('unmute') || clean.includes('restore audio') || clean.includes('audio on')) {
      window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: 'unmute' } }));
      const spoken = 'Restoring stream audio, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }

    // Fast-path Video Controls: Fullscreen
    if (clean.includes('fullscreen') || clean.includes('full screen')) {
      window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: 'fullscreen' } }));
      const spoken = 'Engaging full-screen holographic display, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }

    if (clean.includes('latest') || clean.includes('new release') || clean.includes('new movies')) {
      setActivePage('latest');
      const spoken = 'Displaying latest movie and television transmissions on VidAPI, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }
    if (clean.includes('explore') || clean.includes('browse catalog') || clean.includes('discovery')) {
      setActivePage('explore');
      const spoken = 'Exploration matrix activated, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }
    if (clean.includes('terminal') || clean.includes('player') || clean.includes('dashboard')) {
      setActivePage('player');
      const spoken = 'Returning to primary streaming terminal, sir.';
      setLastJarvisResponse(spoken);
      jarvisAudio.speak(spoken);
      return;
    }

    try {
      const response = await fetch('/api/jarvis/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: rawClean,
          currentMedia: activeMedia ? { title: activeMedia.title, type: activeMedia.type, season, episode } : null,
        }),
      });

      if (!response.ok) throw new Error('Voice command processing failed');
      const data = await response.json();

      if (data.speechResponse) {
        setLastJarvisResponse(data.speechResponse);
        jarvisAudio.speak(data.speechResponse);
      }

      if (data.recommendations && data.recommendations.length > 0) {
        setVoiceRecommendations(data.recommendations);
      }

      // Execute Action
      if (data.action === 'go_home') {
        setActivePage('player');
      } else if (
        data.action === 'pause' || 
        data.action === 'resume' || 
        data.action === 'volume_up' || 
        data.action === 'volume_down' || 
        data.action === 'mute' || 
        data.action === 'unmute' || 
        data.action === 'fullscreen' || 
        data.action === 'exit_fullscreen' || 
        data.action === 'restart' || 
        data.action === 'forward' || 
        data.action === 'rewind'
      ) {
        window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: data.action } }));
      } else if (data.action === 'play') {
        const queryTitle = data.title || data.query || clean.replace(/play|stream|watch/gi, '').trim();
        if (queryTitle) {
          // Search catalog first
          const found = MEDIA_CATALOG.find(m => 
            m.title.toLowerCase().includes(queryTitle.toLowerCase()) ||
            queryTitle.toLowerCase().includes(m.title.toLowerCase()) ||
            (data.imdbId && m.id === data.imdbId) ||
            (data.tmdbId && m.id === data.tmdbId.toString())
          );

          if (found) {
            handleSelectMedia(found, data.season || 1, data.episode || 1);
            setActivePage('player');
          } else if (data.imdbId || data.tmdbId) {
            handleDirectLaunch(data.imdbId || data.tmdbId, data.mediaType || 'movie', data.season || 1, data.episode || 1);
            setActivePage('player');
          } else {
            // Route to dedicated search results page
            setSearchQuery(queryTitle);
            setActivePage('search');
          }
        }
      } else if (data.action === 'search') {
        const q = data.title || data.query || clean.replace(/search for|find|look up|show me|search/gi, '').trim();
        setSearchQuery(q);
        setActivePage('search');
      } else if (data.action === 'next_ep') {
        window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: 'next_ep' } }));
      } else if (data.action === 'prev_ep') {
        window.dispatchEvent(new CustomEvent('jarvis-video-control', { detail: { action: 'prev_ep' } }));
      } else if (data.action === 'change_season') {
        if (activeMedia.type === 'tv' && data.season) {
          setSeason(data.season);
          setEpisode(1);
          recordHistory(activeMedia, data.season, 1);
        }
      } else if (data.action === 'toggle_server') {
        const spoken = 'VidAPI is the exclusive streaming gateway configured for this terminal, sir.';
        setLastJarvisResponse(spoken);
        jarvisAudio.speak(spoken);
      } else if (data.action === 'watchlist') {
        setWatchlistHistoryTab('watchlist');
        setIsWatchlistHistoryOpen(true);
      } else if (data.action === 'recommend') {
        // Recommendations already set in voiceRecommendations for in-HUD display
      }
    } catch {
      // Fallback local pattern matching
      if (clean.includes('play flash') || clean.includes('the flash')) {
        const flash = MEDIA_CATALOG.find(m => m.id === 'tt3107288') || MEDIA_CATALOG[2];
        handleSelectMedia(flash, 9, 1);
        setActivePage('player');
      } else if (clean.includes('quiet place')) {
        handleSelectMedia(MEDIA_CATALOG[0]);
        setActivePage('player');
      } else if (clean.includes('wild robot')) {
        handleSelectMedia(MEDIA_CATALOG[1]);
        setActivePage('player');
      } else if (clean.includes('iron man')) {
        const im = MEDIA_CATALOG.find(m => m.title === 'Iron Man') || MEDIA_CATALOG[4];
        handleSelectMedia(im);
        setActivePage('player');
      } else {
        const query = clean.replace(/search for|find|play|watch/gi, '').trim();
        setSearchQuery(query);
        setActivePage('search');
      }
    }
  };

  const handleSelectVoiceRecommendation = (rec: any) => {
    const catalogMatch = MEDIA_CATALOG.find(m => 
      m.title.toLowerCase() === rec.title.toLowerCase() || 
      (rec.imdbId && m.imdbId === rec.imdbId) ||
      (rec.tmdbId && m.tmdbId === rec.tmdbId)
    );
    if (catalogMatch) {
      handleSelectMedia(catalogMatch);
    } else {
      handleDirectLaunch(rec.imdbId || rec.tmdbId || rec.title, rec.type || 'movie', 1, 1);
    }
    setActivePage('player');
    const spoken = `Streaming ${rec.title} right away, sir.`;
    setLastJarvisResponse(spoken);
    jarvisAudio.speak(spoken);
  };

  const isWatchlisted = watchlist.some(w => w.id === activeMedia.id);

  return (
    <div className="min-h-screen bg-[#02050a] text-[#00f2ff] font-mono flex flex-col selection:bg-[#00f2ff]/30 selection:text-white">
      
      {/* Background Hologram Mesh */}
      <div className="fixed inset-0 hud-grid-bg opacity-15 pointer-events-none z-0"></div>

      {/* Main JARVIS Telemetry Header */}
      <JarvisHeader
        activePage={activePage}
        onPageChange={setActivePage}
        isListening={isListening}
        onToggleVoice={() => setIsListening(!isListening)}
        watchlistCount={watchlist.length}
        historyCount={watchHistory.length}
        onOpenWatchlist={() => { setWatchlistHistoryTab('watchlist'); setIsWatchlistHistoryOpen(true); }}
        onOpenHistory={() => { setWatchlistHistoryTab('history'); setIsWatchlistHistoryOpen(true); }}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onOpenDirectLauncher={() => setIsDirectLauncherOpen(true)}
        onSelectMedia={handleSelectMedia}
        onSearchSubmit={(q) => {
          setSearchQuery(q);
          setActivePage('search');
        }}
        hudTheme={hudTheme}
        onThemeChange={setHudTheme}
      />

      <main className="relative z-10 flex-1 flex flex-col items-center w-full">
        
        {/* Terminal / Player Page View */}
        {activePage === 'player' && (
          <>
            {/* Voice Command & Interactive Hologram Waveform HUD */}
            <VoiceAssistantHUD
              isListening={isListening}
              onToggleListening={() => setIsListening(!isListening)}
              onCommandRecognized={handleVoiceCommand}
              lastJarvisResponse={lastJarvisResponse}
              activeMedia={activeMedia}
              recommendations={voiceRecommendations}
              onSelectRecommendation={handleSelectVoiceRecommendation}
              onClearRecommendations={() => setVoiceRecommendations([])}
              onOpenAiChat={() => setIsAiChatOpen(true)}
            />

            {/* Central Video Stream Player Frame (Visible only when playing a selected series/movie) */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full overflow-hidden"
                >
                  <StreamPlayerHUD
                    activeMedia={activeMedia}
                    season={season}
                    episode={episode}
                    onSeasonChange={(s) => { setSeason(s); recordHistory(activeMedia, s, episode); }}
                    onEpisodeChange={(e) => { setEpisode(e); recordHistory(activeMedia, season, e); }}
                    isWatchlisted={isWatchlisted}
                    onToggleWatchlist={handleToggleWatchlist}
                    onDirectLaunch={handleDirectLaunch}
                    onClosePlayer={() => setIsPlaying(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* JARVIS Stream Terminal Homepage Showcase (Hot List, Latest Movies & Series, Stark Archives) */}
            <JarvisTerminalHome
              catalog={MEDIA_CATALOG}
              activeMedia={activeMedia}
              onSelectMedia={handleSelectMedia}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDirectLauncher={() => setIsDirectLauncherOpen(true)}
              onExploreMore={() => setActivePage('explore')}
              onSearchSubmit={(q) => {
                setSearchQuery(q);
                setActivePage('search');
              }}
              onOpenDossier={handleOpenDossier}
            />

            {/* Search, Filter & Master Catalog Grid Hub */}
            <CatalogSection
              catalog={MEDIA_CATALOG}
              activeMedia={activeMedia}
              onSelectMedia={handleSelectMedia}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              watchHistory={watchHistory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </>
        )}

        {/* Dedicated Search Results Matrix Page View */}
        {activePage === 'search' && (
          <SearchResultsView
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            catalog={MEDIA_CATALOG}
            onSelectMedia={handleSelectMedia}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onNavigateToPlayer={() => setActivePage('player')}
            onOpenDirectLauncher={() => setIsDirectLauncherOpen(true)}
            onToggleVoice={() => setIsListening(!isListening)}
            onOpenDossier={handleOpenDossier}
          />
        )}

        {/* Latest Releases Page View */}
        {activePage === 'latest' && (
          <LatestReleasesView
            catalog={MEDIA_CATALOG}
            onSelectMedia={handleSelectMedia}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onNavigateToPlayer={() => setActivePage('player')}
          />
        )}

        {/* Hot Releases Radar Page View (Live VidAPI Sync) */}
        {activePage === 'hot' && (
          <HotReleasesView
            onSelectMedia={handleSelectMedia}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onNavigateToPlayer={() => setActivePage('player')}
          />
        )}

        {/* Explore & Search Matrix Page View */}
        {activePage === 'explore' && (
          <ExploreView
            catalog={MEDIA_CATALOG}
            onSelectMedia={handleSelectMedia}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onNavigateToPlayer={() => setActivePage('player')}
            onOpenDirectLauncher={() => setIsDirectLauncherOpen(true)}
            initialSearchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

      </main>

      {/* Footer Telemetry */}
      <JarvisTelemetryFooter
        totalCatalogCount={MEDIA_CATALOG.length}
      />

      {/* Classified Media Dossier & Intel Modal */}
      <MediaDossierModal
        media={selectedDossierMedia}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        onPlay={handleSelectMedia}
        isWatchlisted={selectedDossierMedia ? watchlist.some(w => w.id === selectedDossierMedia.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* Modals */}
      <JarvisAiChatModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        onPlayMedia={handleSelectMedia}
      />

      <DirectLauncherModal
        isOpen={isDirectLauncherOpen}
        onClose={() => setIsDirectLauncherOpen(false)}
        onLaunch={handleDirectLaunch}
      />

      <WatchlistHistoryModal
        isOpen={isWatchlistHistoryOpen}
        onClose={() => setIsWatchlistHistoryOpen(false)}
        defaultTab={watchlistHistoryTab}
        watchlist={watchlist}
        watchHistory={watchHistory}
        onPlayMedia={handleSelectMedia}
        onRemoveWatchlist={handleRemoveWatchlist}
        onClearHistory={handleClearHistory}
      />

    </div>
  );
}
