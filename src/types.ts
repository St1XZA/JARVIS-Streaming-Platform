export type MediaType = 'movie' | 'tv';

export type StreamServer = 'vidfast-vc' | 'vidapi-ru';

export type ActivePage = 'player' | 'latest' | 'hot' | 'explore' | 'search';

export interface VidApiPlayerOptions {
  autoplay?: boolean;
  primaryColor?: string; // e.g. #00f2ff
  resumeAt?: number; // seconds
  startAt?: number;
  showTitle?: boolean;
  subUrl?: string;
  subLang?: string;
  subLabel?: string;
  subDefault?: boolean;
  domain?: 'vaplayer.ru' | 'vidapi.ru';
}

export interface VidFastPlayerOptions {
  title?: boolean;
  poster?: boolean;
  autoPlay?: boolean;
  startAt?: number;
  theme?: string; // hex code format e.g. '00f2ff' or '16A085'
  server?: string;
  hideServer?: boolean;
  fullscreenButton?: boolean;
  chromecast?: boolean;
  sub?: string;
  nextButton?: boolean;
  autoNext?: boolean;
}

export interface VidFastPlayerEventData {
  event: 'play' | 'pause' | 'seeked' | 'ended' | 'timeupdate' | 'playerstatus';
  currentTime: number;
  duration: number;
  tmdbId?: number;
  mediaType?: MediaType;
  season?: number;
  episode?: number;
  playing?: boolean;
  muted?: boolean;
  volume?: number;
}

export interface VidFastPlayerEvent {
  type: 'PLAYER_EVENT';
  data: VidFastPlayerEventData;
}

export interface VidFastMediaDataProgress {
  watched: number;
  duration: number;
}

export interface VidFastMediaDataItem {
  id: number | string;
  type: 'movie' | 'tv';
  title?: string;
  poster_path?: string;
  backdrop_path?: string;
  progress?: VidFastMediaDataProgress;
  last_season_watched?: number;
  last_episode_watched?: number;
  show_progress?: Record<string, {
    season: number;
    episode: number;
    progress: VidFastMediaDataProgress;
    last_updated: number;
  }>;
  last_updated?: number;
}

export type VidFastMediaDataStore = Record<string, VidFastMediaDataItem>;

export interface PlayerEventMessage {
  type: 'PLAYER_EVENT';
  data: {
    player_status?: 'playing' | 'paused' | 'completed' | 'seeked';
    player_progress?: number;
    player_duration?: number;
    imdb?: string;
    tmdb?: string | number;
    mediaType?: MediaType;
    season?: number;
    episode?: number;
    title?: string;
    poster?: string;
  };
}

export interface MediaItem {
  id: string; // IMDB (e.g. tt29623480) or TMDB (e.g. 1184918)
  imdbId?: string;
  tmdbId?: string | number;
  type: MediaType;
  title: string;
  year: number | string;
  poster: string;
  backdrop: string;
  rating: number;
  overview: string;
  genres: string[];
  duration?: string;
  totalSeasons?: number;
  episodesPerSeason?: number;
  seasonsData?: Array<{ seasonNumber: number; episodeCount: number; name?: string }>;
  director?: string;
  cast?: string[];
  category?: 'marvel' | 'scifi' | 'trending' | 'blockbusters' | 'series' | 'cyberpunk' | 'custom' | 'latest';
  isLatest?: boolean;
  releaseDate?: string;
}

export interface WatchHistoryItem {
  media: MediaItem;
  season?: number;
  episode?: number;
  lastWatchedAt: number;
  progressPercent?: number;
}

export interface VoiceCommandResult {
  action: 'search' | 'play' | 'next_ep' | 'prev_ep' | 'change_season' | 'toggle_server' | 'watchlist' | 'clear' | 'help' | 'unknown';
  query?: string;
  mediaType?: MediaType;
  season?: number;
  episode?: number;
  speechResponse: string;
}

export interface JarvisMessage {
  id: string;
  sender: 'jarvis' | 'user' | 'system';
  text: string;
  timestamp: string;
  recommendedMedia?: MediaItem[];
}

export type HudTheme = 'cyan' | 'amber' | 'crimson' | 'emerald';
