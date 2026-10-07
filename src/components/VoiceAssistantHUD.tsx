import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  AlertCircle, 
  Activity,
  Play,
  X,
  Star,
  Film,
  Tv,
  MessageSquare,
  Radio,
  Volume2
} from 'lucide-react';
import { jarvisAudio } from '../utils/audio';
import { MediaItem } from '../types';

export interface JarvisRecommendation {
  title: string;
  year?: string;
  type?: 'movie' | 'tv';
  imdbId?: string;
  tmdbId?: string;
  overview?: string;
  rating?: number;
  genres?: string[];
  poster?: string;
}

interface VoiceAssistantHUDProps {
  isListening: boolean;
  onToggleListening: () => void;
  onCommandRecognized: (commandText: string) => void;
  lastJarvisResponse: string;
  activeMedia: MediaItem | null;
  recommendations?: JarvisRecommendation[];
  onSelectRecommendation?: (rec: JarvisRecommendation) => void;
  onClearRecommendations?: () => void;
  onOpenAiChat?: () => void;
}

export const VoiceAssistantHUD: React.FC<VoiceAssistantHUDProps> = ({
  isListening,
  onToggleListening,
  onCommandRecognized,
  lastJarvisResponse,
  recommendations = [],
  onSelectRecommendation,
  onClearRecommendations,
  onOpenAiChat,
}) => {
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('SAY "JARVIS" OR CLICK MIC TO ENGAGE');
  const [isAwakeAwaitingCommand, setIsAwakeAwaitingCommand] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;
  const isAwakeRef = useRef(isAwakeAwaitingCommand);
  isAwakeRef.current = isAwakeAwaitingCommand;

  // Visual audio pulse simulator during active listening
  useEffect(() => {
    let interval: any;
    if (isListening || isAwakeAwaitingCommand) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.7 + 0.3);
      }, 120);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isListening, isAwakeAwaitingCommand]);

  // Handle Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setErrorMessage('Browser does not support Web Speech API (Chrome/Edge recommended)');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setErrorMessage(null);
        if (isAwakeRef.current) {
          setStatusMessage('J.A.R.V.I.S. LISTENING: State your command or query...');
        } else if (isListeningRef.current) {
          setStatusMessage('J.A.R.V.I.S. ACTIVE: State your command (e.g. "play Inception", "pause", "search Dune")...');
        } else {
          setStatusMessage('STANDBY: Say "JARVIS [command]" or "JARVIS" to activate...');
        }
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        const cleanTranscript = currentTranscript.trim();
        setTranscript(cleanTranscript);

        if (event.results[0].isFinal) {
          const finalStr = cleanTranscript.toLowerCase();
          
          // Check for dismissal: "thank you jarvis" or "thanks jarvis" or "goodbye jarvis"
          if (finalStr.includes('thank you jarvis') || finalStr.includes('thanks jarvis') || finalStr.includes('goodbye jarvis')) {
            jarvisAudio.playAcknowledge();
            jarvisAudio.speak('You are very welcome, sir. Standing by.', () => {
              if (isListeningRef.current) {
                onToggleListening();
              }
              setIsAwakeAwaitingCommand(false);
            });
            setStatusMessage('COMMAND: "THANK YOU" -> STANDING BY');
            setTimeout(() => {
              setTranscript('');
              setStatusMessage('SAY "JARVIS" OR CLICK MIC TO ENGAGE');
            }, 3000);
            return;
          }

          // Check if the user said JUST "JARVIS" / "HEY JARVIS" / "OK JARVIS" to wake him up
          const justWakeWordMatch = /^(hey\s+jarvis|ok\s+jarvis|okay\s+jarvis|jarvis)[.?!,\s]*$/i.test(finalStr);

          if (justWakeWordMatch) {
            // WAKE UP: Do NOT speak words, ONLY play the futuristic wake chime so the user knows he's listening!
            jarvisAudio.playVoiceListen();
            setIsAwakeAwaitingCommand(true);
            if (!isListeningRef.current) {
              onToggleListening();
            }
            setStatusMessage('J.A.R.V.I.S. LISTENING: State your command (e.g. "play Inception", "pause", "search Dune")...');
            setTranscript('JARVIS (Listening...)');
            return;
          }

          // Check if speech has hotword prefix: "JARVIS [command]"
          const hasHotword = /^(hey\s+jarvis|ok\s+jarvis|okay\s+jarvis|jarvis)\b/i.test(finalStr);

          if (!hasHotword && !isAwakeRef.current && !isListeningRef.current) {
            // Ambient speech without hotword while in standby -> Ignore quietly
            setStatusMessage('IGNORED: Say "JARVIS [command]" to activate');
            setTimeout(() => {
              setStatusMessage('SAY "JARVIS" OR CLICK MIC TO ENGAGE');
            }, 2500);
            return;
          }

          // Command validated!
          // Remove the "jarvis" prefix for clean execution if present
          jarvisAudio.playAcknowledge();
          setIsAwakeAwaitingCommand(false);
          onCommandRecognized(cleanTranscript);
          setStatusMessage(`EXECUTING: "${cleanTranscript.toUpperCase()}"`);

          setTimeout(() => {
            setTranscript('');
            if (isListeningRef.current) {
              setStatusMessage('J.A.R.V.I.S. ACTIVE: Say "JARVIS [command]"...');
            } else {
              setStatusMessage('SAY "JARVIS" OR CLICK MIC TO ENGAGE');
            }
          }, 4500);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition notice:', event.error);
          setErrorMessage(`Audio sensor notice: ${event.error}`);
        }
        if (isListeningRef.current || isAwakeRef.current) {
          setStatusMessage('J.A.R.V.I.S. LISTENING: Say "JARVIS [command]"...');
        } else {
          setStatusMessage('SAY "JARVIS" OR CLICK MIC TO ENGAGE');
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current || isAwakeRef.current) {
          // Keep speech recognition armed and listening continuously
          setTimeout(() => {
            if ((isListeningRef.current || isAwakeRef.current) && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                // Already running
              }
            }
          }, 200);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Speech recognition setup error:', e);
    }
  }, [onCommandRecognized, onToggleListening]);

  // Handle manual activation / deactivation
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        setStatusMessage('J.A.R.V.I.S. LISTENING: Speak command now...');
      } catch {
        // Already started
      }
    } else {
      setIsAwakeAwaitingCommand(false);
      try {
        recognitionRef.current.stop();
        setStatusMessage('SAY "JARVIS" OR CLICK MIC TO ENGAGE');
      } catch {
        // ignore
      }
    }
  }, [isListening]);

  const handleMicClick = () => {
    if (isListening) {
      jarvisAudio.playClick();
      setIsAwakeAwaitingCommand(false);
      onToggleListening();
    } else {
      // Waking up manually: Play chime sound ONLY (no spoken greeting), so user knows he's listening
      jarvisAudio.playVoiceListen();
      setIsAwakeAwaitingCommand(true);
      onToggleListening();
    }
  };

  const handleQuickCommand = (text: string) => {
    jarvisAudio.playClick();
    setTranscript(text);
    onCommandRecognized(text);
  };

  const isHudActive = isListening || isAwakeAwaitingCommand;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 font-mono"
    >
      <div className="hud-dense-panel p-3 relative overflow-hidden bg-black/80 border border-[#00f2ff]/40 shadow-[0_0_25px_rgba(0,242,255,0.15)] backdrop-blur-sm">
        
        {/* Hologram Scanlines & Grid */}
        <div className="absolute inset-0 hud-grid-bg opacity-15 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-2.5">
          
          {/* Top Row: JARVIS Voice Neural Matrix Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00f2ff]/20 pb-2">
            
            {/* Left: Main Acoustic Sensor & Arc Reactor Mic Button */}
            <div className="flex items-center gap-3">
              {/* Arc Reactor Mic Button */}
              <button
                id="voice-orb-button"
                onClick={handleMicClick}
                className="relative group focus:outline-none shrink-0"
                title={isHudActive ? 'Click to deactivate voice listening' : 'Click or Say "JARVIS" to activate'}
              >
                <div className={`relative flex items-center justify-center w-11 h-11 border transition-all duration-300 ${
                  isHudActive 
                    ? 'bg-rose-950/80 border-rose-400 shadow-[0_0_25px_#f43f5e]' 
                    : 'bg-black/80 border-[#00f2ff]/50 hover:border-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.25)]'
                }`}>
                  {/* Rotating Ring */}
                  <div className={`absolute inset-0.5 border-t border-r border-[#00f2ff] transition-all ${
                    isHudActive ? 'animate-spin border-rose-400' : ''
                  }`} style={{ animationDuration: '2s' }}></div>

                  {isHudActive ? (
                    <Mic className="w-5 h-5 text-rose-400 animate-pulse drop-shadow-[0_0_8px_#f43f5e]" />
                  ) : (
                    <MicOff className="w-5 h-5 text-[#00f2ff]/70 group-hover:text-[#00f2ff] transition-colors" />
                  )}
                </div>
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold tracking-wider text-[#00f2ff] uppercase text-glow-cyan">
                    J.A.R.V.I.S. VOICE MATRIX
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 border uppercase font-bold tracking-tight transition-colors ${
                    isHudActive 
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse' 
                      : 'bg-[#00f2ff]/15 border-[#00f2ff]/50 text-[#00f2ff]'
                  }`}>
                    {isHudActive ? 'VOICE LISTENING' : 'STANDBY (SAY "JARVIS")'}
                  </span>
                </div>

                {/* Subtitle / Status Display */}
                <p className="text-[10px] text-[#00f2ff]/80 flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3 h-3 text-[#00f2ff] shrink-0 animate-pulse" />
                  <span className="font-semibold text-white tracking-wide">{statusMessage}</span>
                </p>
              </div>
            </div>

            {/* Center: Wake-word & Status Badge */}
            <div className="flex items-center gap-2 bg-black/70 border border-[#00f2ff]/30 px-3 py-1.5">
              <Radio className={`w-3.5 h-3.5 ${isHudActive ? 'text-rose-400 animate-pulse' : 'text-[#00f2ff]/60'}`} />
              <div className="flex flex-col">
                <span className="text-[9px] text-[#00f2ff]/70 font-bold uppercase tracking-wider">ACTIVATION PROTOCOL</span>
                <span className="text-[11px] text-white font-mono font-bold tracking-tight">
                  {isHudActive ? (
                    <span className="text-rose-400 animate-pulse">● JARVIS LISTENING TO COMMAND</span>
                  ) : (
                    <span className="text-[#00f2ff]">SAY "JARVIS [COMMAND]"</span>
                  )}
                </span>
              </div>
            </div>

            {/* Right: Audio Waveform Visualizer */}
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-[9px] text-[#00f2ff]/70">
                  <Volume2 className="w-3 h-3 text-[#00f2ff]" />
                  <span>VOICE SENSOR:</span>
                  <span className="font-mono text-white font-bold">{isHudActive ? 'ACTIVE' : 'IDLE'}</span>
                </div>
                {/* Visual EQ Bars */}
                <div className="flex items-end gap-1 h-3.5 mt-0.5">
                  {[0.4, 0.8, 0.5, 1.0, 0.6, 0.9, 0.3].map((h, i) => (
                    <div 
                      key={i} 
                      className={`w-1 transition-all duration-100 ${
                        isHudActive ? 'bg-[#00f2ff] shadow-[0_0_6px_#00f2ff]' : 'bg-[#00f2ff]/20'
                      }`}
                      style={{ height: isHudActive ? `${Math.max(20, Math.min(100, h * audioLevel * 100))}%` : '20%' }}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Row: Speech Transcript / Jarvis Spoken Response & Quick Prompts */}
          <div className="flex flex-col md:flex-row items-stretch gap-2">
            
            {/* Live Transcript / JARVIS Speech Box */}
            <div className="flex-1 p-2.5 bg-black/90 border border-[#00f2ff]/30 min-h-[44px] flex flex-col justify-center">
              {errorMessage ? (
                <div className="flex items-center gap-1.5 text-rose-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : transcript ? (
                <div className="text-xs text-[#00f2ff] flex items-start gap-1.5">
                  <span className="font-bold text-white shrink-0">YOU:</span>
                  <span className="italic font-mono text-white">"{transcript}"</span>
                </div>
              ) : lastJarvisResponse ? (
                <div className="text-xs text-[#00f2ff] flex items-start gap-1.5 leading-tight">
                  <span className="font-bold text-amber-300 shrink-0">JARVIS:</span>
                  <span className="text-cyan-100">"{lastJarvisResponse}"</span>
                </div>
              ) : (
                <div className="text-xs text-[#00f2ff]/60 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#00f2ff] shrink-0 animate-pulse" />
                  <span>Say: "JARVIS pause", "JARVIS volume up", "JARVIS go back home", "JARVIS search Inception", "JARVIS play Iron Man"</span>
                </div>
              )}
            </div>

            {/* Quick Command & Banter Prompts */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px] shrink-0">
              <span className="text-[#00f2ff]/60 shrink-0 text-[9px] uppercase font-bold">JARVIS COMMANDS:</span>
              <button
                onClick={() => handleQuickCommand('JARVIS pause')}
                className="px-2 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/30 hover:border-[#00f2ff] text-[#00f2ff] whitespace-nowrap transition-all"
                title='Say "JARVIS pause"'
              >
                ⏸️ "JARVIS pause"
              </button>
              <button
                onClick={() => handleQuickCommand('JARVIS volume up')}
                className="px-2 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/30 hover:border-[#00f2ff] text-[#00f2ff] whitespace-nowrap transition-all"
                title='Say "JARVIS volume up"'
              >
                🔊 "JARVIS volume up"
              </button>
              <button
                onClick={() => handleQuickCommand('JARVIS go back home')}
                className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 whitespace-nowrap transition-all"
                title='Say "JARVIS go back home"'
              >
                🏠 "JARVIS go back home"
              </button>
              <button
                onClick={() => handleQuickCommand('JARVIS search Dune')}
                className="px-2 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/30 hover:border-[#00f2ff] text-[#00f2ff] whitespace-nowrap transition-all"
                title='Say "JARVIS search Dune"'
              >
                🔍 "JARVIS search Dune"
              </button>
              <button
                onClick={() => handleQuickCommand('JARVIS play Iron Man')}
                className="px-2 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/30 hover:border-[#00f2ff] text-[#00f2ff] whitespace-nowrap transition-all"
                title='Say "JARVIS play Iron Man"'
              >
                ▶ "JARVIS play Iron Man"
              </button>
              <button
                onClick={() => handleQuickCommand('JARVIS recommend a sci-fi thriller')}
                className="px-2 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/30 hover:border-[#00f2ff] text-[#00f2ff] whitespace-nowrap transition-all"
                title='Say "JARVIS recommend a sci-fi thriller"'
              >
                🌌 "JARVIS recommend sci-fi"
              </button>
              {onOpenAiChat && (
                <button
                  onClick={() => { jarvisAudio.playClick(); onOpenAiChat(); }}
                  className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 whitespace-nowrap transition-all flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>AI CHAT</span>
                </button>
              )}
            </div>

          </div>

          {/* Hologram Recommendations Tray */}
          <AnimatePresence>
            {recommendations && recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-1 p-3 bg-gradient-to-r from-black/95 via-[#02111a]/95 to-black/95 border border-[#00f2ff]/50 shadow-[0_0_20px_rgba(0,242,255,0.2)]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#00f2ff]/30 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00f2ff] text-glow-cyan">
                      J.A.R.V.I.S. MOOD & NEURAL RECOMMENDATIONS
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40">
                      {recommendations.length} MATCHES
                    </span>
                  </div>

                  {onClearRecommendations && (
                    <button
                      onClick={() => { jarvisAudio.playClick(); onClearRecommendations(); }}
                      className="text-xs text-[#00f2ff]/60 hover:text-white p-1"
                      title="Dismiss recommendations"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Grid of Recommended Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {recommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className="group relative flex flex-col justify-between p-2.5 bg-black/80 hover:bg-[#00f2ff]/10 border border-[#00f2ff]/30 hover:border-[#00f2ff] transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-bold text-xs text-white group-hover:text-[#00f2ff] line-clamp-1">
                            {rec.title}
                          </h4>
                          <span className="text-[9px] px-1 bg-[#00f2ff]/15 border border-[#00f2ff]/40 text-[#00f2ff] uppercase font-mono shrink-0">
                            {rec.type === 'tv' ? <Tv className="w-2.5 h-2.5 inline mr-0.5" /> : <Film className="w-2.5 h-2.5 inline mr-0.5" />}
                            {rec.type || 'movie'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#00f2ff]/70">
                          {rec.year && <span>{rec.year}</span>}
                          {rec.rating && (
                            <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-300" />
                              {rec.rating.toFixed(1)}
                            </span>
                          )}
                          {rec.genres && rec.genres.length > 0 && (
                            <span className="text-slate-400 line-clamp-1">{rec.genres.slice(0, 2).join(' • ')}</span>
                          )}
                        </div>

                        {rec.overview && (
                          <p className="text-[10px] text-slate-300 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                            {rec.overview}
                          </p>
                        )}
                      </div>

                      {/* Stream Button */}
                      <button
                        onClick={() => {
                          jarvisAudio.playClick();
                          if (onSelectRecommendation) {
                            onSelectRecommendation(rec);
                          }
                        }}
                        className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2 py-1 bg-[#00f2ff]/20 hover:bg-[#00f2ff] text-[#00f2ff] hover:text-black border border-[#00f2ff] text-[10px] font-bold tracking-wider uppercase transition-all shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>STREAM DIRECT</span>
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </motion.div>
  );
};
