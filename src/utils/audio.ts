/**
 * Audio Synthesizer for JARVIS HUD & Speech Feedback
 * Uses Web Audio API for zero-latency futuristic sci-fi sound effects
 */

class JarvisAudioEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private speechEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleSound(enabled?: boolean) {
    this.soundEnabled = enabled !== undefined ? enabled : !this.soundEnabled;
    return this.soundEnabled;
  }

  public isSoundEnabled() {
    return this.soundEnabled;
  }

  public toggleSpeech(enabled?: boolean) {
    this.speechEnabled = enabled !== undefined ? enabled : !this.speechEnabled;
    return this.speechEnabled;
  }

  public isSpeechEnabled() {
    return this.speechEnabled;
  }

  // Futuristic Holographic Click
  public playClick() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio context error ignore
    }
  }

  // JARVIS Command Acknowledged Chime
  public playAcknowledge() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const freqs = [523.25, 659.25, 1046.50]; // C5, E5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.04;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.13);
      });
    } catch {
      // ignore
    }
  }

  // Stream Player Initialized Warp Hum
  public playStreamInit() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // ignore
    }
  }

  // Voice Listening Activated Wake Chime (JARVIS prompt sound)
  public playVoiceListen() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const freqs = [784, 1174.66]; // G5, D6 harmonic chime
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, startTime + 0.14);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.18);
      });
    } catch {
      // ignore
    }
  }

  // JARVIS Speech Synthesis Engine
  public speak(text: string, onEnd?: () => void) {
    if (!this.speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a refined British English voice or male high-clarity voice
      const voices = window.speechSynthesis.getVoices();
      const jarvisVoice = voices.find(v => 
        (v.lang.includes('en-GB') || v.name.includes('British') || v.name.includes('UK English') || v.name.includes('Daniel') || v.name.includes('George')) && !v.name.includes('Female')
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

      if (jarvisVoice) {
        utterance.voice = jarvisVoice;
      }

      utterance.pitch = 0.95; // Slightly lower, authoritative
      utterance.rate = 1.05;  // Crisp, responsive
      utterance.volume = 0.85;

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const jarvisAudio = new JarvisAudioEngine();
