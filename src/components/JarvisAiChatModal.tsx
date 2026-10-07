import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Play, Loader2 } from 'lucide-react';
import { MediaItem } from '../types';
import { jarvisAudio } from '../utils/audio';

interface Message {
  id: string;
  sender: 'jarvis' | 'user';
  text: string;
  items?: MediaItem[];
}

interface JarvisAiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayMedia: (media: MediaItem) => void;
}

export const JarvisAiChatModal: React.FC<JarvisAiChatModalProps> = ({
  isOpen,
  onClose,
  onPlayMedia,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'jarvis',
      text: 'Good day, sir. J.A.R.V.I.S. neural intelligence online. How may I assist your entertainment selection today? You can ask for recommendations, plot searches, or curations.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isLoading) return;

    jarvisAudio.playClick();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: prompt,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/jarvis/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error('Query failed');
      const data = await res.json();

      const jarvisMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'jarvis',
        text: data.reply || 'Analysis completed, sir. Here are the matching archives retrieved from the database.',
        items: data.items?.map((item: any) => ({
          id: item.id || item.imdbId || 'tt0371746',
          imdbId: item.imdbId,
          tmdbId: item.tmdbId,
          type: item.type === 'tv' ? 'tv' : 'movie',
          title: item.title,
          year: item.year || '2024',
          poster: item.poster || 'https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg',
          backdrop: item.backdrop || 'https://image.tmdb.org/t/p/original/cyecbWc1gWpT2L3W4h4rF27iT2s.jpg',
          rating: item.rating || 8.0,
          overview: item.overview,
          genres: item.genres || ['Sci-Fi'],
          duration: item.duration,
          category: 'scifi',
        })),
      };

      setMessages(prev => [...prev, jarvisMsg]);
      jarvisAudio.playAcknowledge();
      jarvisAudio.speak(jarvisMsg.text);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'jarvis',
          text: 'My apologies, sir. Communication uplink experienced a minor disruption. You can still access and launch titles directly via IMDb or TMDb IDs.',
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 font-mono">
      <div className="w-full max-w-2xl h-[560px] max-h-[90vh] flex flex-col overflow-hidden bg-[#02050a] border border-[#00f2ff]/40 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-[#00f2ff]/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#00f2ff]/20 border border-[#00f2ff] flex items-center justify-center text-[#00f2ff]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#00f2ff] text-glow-cyan uppercase">
                J.A.R.V.I.S. INTELLIGENCE CORE
              </h3>
              <p className="text-[9px] text-[#00f2ff]/60">
                GEMINI NEURAL MEDIA ADVISOR
              </p>
            </div>
          </div>

          <button
            onClick={() => { jarvisAudio.playClick(); onClose(); }}
            className="p-1 text-[#00f2ff]/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Log Stream */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-black/40 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'jarvis' && (
                <div className="w-6 h-6 bg-[#00f2ff]/20 border border-[#00f2ff] flex items-center justify-center text-[#00f2ff] shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#00f2ff]/15 text-[#00f2ff] border border-[#00f2ff]/40'
                      : 'bg-black/90 text-slate-200 border border-[#00f2ff]/30'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Render Playable Media Recommendation Cards */}
                {msg.items && msg.items.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {msg.items.map((item, idx) => (
                      <div
                        key={`chat-rec-${msg.id}-${item.id}-${idx}`}
                        className="p-2 bg-black border border-[#00f2ff]/30 hover:border-[#00f2ff] flex items-center justify-between gap-2 group transition-all"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00f2ff]">
                            {item.title} ({item.year})
                          </h4>
                          <span className="text-[9px] text-[#00f2ff]/70 uppercase">
                            {item.type} • ID: {item.id}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            jarvisAudio.playStreamInit();
                            onPlayMedia(item);
                            onClose();
                          }}
                          className="px-2 py-0.5 bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold text-[10px] uppercase flex items-center gap-1 shadow-[0_0_8px_#00f0ff] shrink-0"
                        >
                          <Play className="w-2.5 h-2.5 fill-black" />
                          <span>STREAM</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-6 h-6 bg-[#00f2ff] text-black flex items-center justify-center shrink-0 font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-[#00f2ff] text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>J.A.R.V.I.S. is analyzing neural media parameters...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-black border-t border-[#00f2ff]/20 flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px]">
          <span className="text-[#00f2ff]/60 shrink-0 uppercase text-[9px]">SUGGESTIONS:</span>
          <button
            onClick={() => handleSend('Recommend mind-bending movies like Inception')}
            className="px-2 py-0.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/20 text-[#00f2ff] whitespace-nowrap"
          >
            "Like Inception"
          </button>
          <button
            onClick={() => handleSend('What are the best Marvel movies to watch?')}
            className="px-2 py-0.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/20 text-[#00f2ff] whitespace-nowrap"
          >
            "Marvel Movies"
          </button>
          <button
            onClick={() => handleSend('Recommend dark sci-fi TV series like Cyberpunk')}
            className="px-2 py-0.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/20 text-[#00f2ff] whitespace-nowrap"
          >
            "Sci-Fi TV Series"
          </button>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-2 bg-black border-t border-[#00f2ff]/30 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask J.A.R.V.I.S. for recommendations or describe what to watch..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-black border border-[#00f2ff]/30 px-3 py-1.5 text-xs text-[#00f2ff] placeholder:text-[#00f2ff]/40 focus:outline-none focus:border-[#00f2ff]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-[#00f2ff] hover:bg-[#00f2ff]/90 text-black disabled:opacity-40 disabled:pointer-events-none transition-all shadow-[0_0_10px_#00f0ff]"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
