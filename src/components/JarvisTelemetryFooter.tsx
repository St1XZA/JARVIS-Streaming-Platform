import React from 'react';
import { ShieldCheck, Cpu, Terminal } from 'lucide-react';
import { StreamServer } from '../types';

interface JarvisTelemetryFooterProps {
  server?: StreamServer;
  totalCatalogCount: number;
}

export const JarvisTelemetryFooter: React.FC<JarvisTelemetryFooterProps> = ({
  totalCatalogCount,
}) => {
  return (
    <footer className="w-full border-t border-[#00f2ff]/30 bg-[#02050a] text-[#00f2ff] py-4 px-3 sm:px-6 font-mono text-xs mt-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Stark Brand & Protocol */}
        <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
          <div className="flex items-center gap-2 font-bold text-xs text-glow-cyan">
            <Cpu className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span>STARK STREAMING TERMINAL // J.A.R.V.I.S. PROTOCOL</span>
          </div>
          <p className="text-[10px] text-[#00f2ff]/60 max-w-lg">
            Personal streaming node • Single-Player Movie Matrix & TV Multi-Season Engines (VidAPI exclusive: vidapi.ru).
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-[9px] text-[#00f2ff]/80 pt-0.5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
              <span>TLS 1.3 SECURE PROXY</span>
            </span>
            <span>•</span>
            <span>INDEXED: {totalCatalogCount} TITLES</span>
            <span>•</span>
            <span className="text-white font-bold">GATEWAY: VIDAPI.RU</span>
          </div>
        </div>

        {/* Center/Right: Keyboard Command Hotkeys */}
        <div className="p-2 border border-[#00f2ff]/30 bg-black text-[10px]">
          <div className="font-bold mb-1 flex items-center gap-1 text-[#00f2ff]">
            <Terminal className="w-3 h-3" />
            <span>TERMINAL COMMAND HOTKEYS</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[#00f2ff]/70 text-[9px]">
            <div><kbd className="px-1 py-0.2 bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] font-bold">VOICE</kbd> Mic Command</div>
            <div><kbd className="px-1 py-0.2 bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] font-bold">S9 E1</kbd> Direct Ep Jump</div>
            <div><kbd className="px-1 py-0.2 bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] font-bold">tt...</kbd> IMDb ID Embed</div>
            <div><kbd className="px-1 py-0.2 bg-[#00f2ff]/20 border border-[#00f2ff]/40 text-[#00f2ff] font-bold">1184918</kbd> TMDb ID Embed</div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-[#00f2ff]/10 flex flex-col sm:flex-row items-center justify-between text-[9px] text-[#00f2ff]/40">
        <div>STARK INDUSTRIES STREAMING PROTOCOL • ALL SYSTEMS NOMINAL</div>
        <div className="mt-1 sm:mt-0">NODE ID: 45FEB9AF-9309-47BA • QUANTUM RELAY ACTIVE</div>
      </div>
    </footer>
  );
};
