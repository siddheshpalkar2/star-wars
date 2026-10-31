import React, { useState } from 'react';
import { SpaceInvadersGame } from './components/SpaceInvadersGame';
import { VaporMusicPlayer } from './components/VaporMusicPlayer';
import { 
  Gamepad2, 
  Disc, 
  Sparkles, 
  Volume2, 
  Tv, 
  Trophy, 
  Flame, 
  Info, 
  ShieldCheck 
} from 'lucide-react';

export const App: React.FC = () => {
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);
  const [crtEffectEnabled, setCrtEffectEnabled] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-[#090414] text-white flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Dynamic 80s Synthwave Background Elements */}
      
      {/* Ambient Radial Neon Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-vapor-hotpink/15 via-vapor-violet/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Retro Synthwave Striped Neon Sun */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none z-0 opacity-80 animate-sun-glow">
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: 'linear-gradient(to bottom, #ffde59 0%, #ff7b90 35%, #ff007f 65%, #7928ca 100%)',
            maskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 45%, transparent 48%, black 48%, black 60%, transparent 60%, transparent 64%, black 64%, black 75%, transparent 75%, transparent 80%, black 80%, black 90%, transparent 90%, transparent 96%, black 96%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 45%, transparent 48%, black 48%, black 60%, transparent 60%, transparent 64%, black 64%, black 75%, transparent 75%, transparent 80%, black 80%, black 90%, transparent 90%, transparent 96%, black 96%)'
          }}
        />
      </div>

      {/* Floating Retro Wireframe Landscape / 3D Perspective Grid */}
      <div className="absolute bottom-0 left-0 right-0 h-64 overflow-hidden pointer-events-none z-0">
        <div 
          className="w-full h-[300%] vapor-grid opacity-35"
          style={{
            transform: 'perspective(220px) rotateX(68deg) translateY(-30px)',
          }}
        />
        {/* Horizon Fade Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#090414]/70 to-[#090414]" />
      </div>

      {/* Top Vaporwave Navigation Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-vapor-purple/40 pb-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-vapor-hotpink to-vapor-cyan p-0.5 shadow-neon-pink flex items-center justify-center">
              <div className="w-full h-full bg-vapor-night rounded-[14px] flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-vapor-pink animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="font-display font-black text-2xl md:text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-vapor-pink via-vapor-peach to-vapor-cyan neon-text-pink">
                  SYNTHWAVE INVADERS
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-arcade bg-pink-500/20 text-pink-300 border border-pink-500/40 rounded">
                  1984
                </span>
              </div>
              <p className="text-xs font-mono text-purple-300 tracking-widest uppercase">
                VAPORWAVE ARCADE & HI-FI SYNTHESIZER
              </p>
            </div>
          </div>

          {/* Quick System Badges */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-vapor-deep/80 border border-vapor-purple/50 text-[11px] font-mono text-vapor-cyan flex items-center gap-1.5 shadow-inner">
              <Tv className="w-3.5 h-3.5" />
              <span>CRT ENGINE ACTIVE</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-vapor-deep/80 border border-vapor-purple/50 text-[11px] font-mono text-vapor-yellow flex items-center gap-1.5 shadow-inner">
              <Disc className="w-3.5 h-3.5 text-vapor-yellow" />
              <span>WEB AUDIO SYNTH</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 py-4 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        {/* Left Column (Desktop) / Center: Space Invaders Arcade Game */}
        <div className="w-full lg:flex-1 max-w-[800px] flex flex-col items-center">
          <SpaceInvadersGame
            scanlinesEnabled={scanlinesEnabled}
            onToggleScanlines={() => setScanlinesEnabled(!scanlinesEnabled)}
            crtEffectEnabled={crtEffectEnabled}
            onToggleCrt={() => setCrtEffectEnabled(!crtEffectEnabled)}
          />
        </div>

        {/* Right Column (Desktop) / Bottom: Synthwave Music Player & Lore Deck */}
        <div className="w-full lg:w-[360px] flex flex-col gap-4">
          {/* Vaporwave Hi-Fi Music Player */}
          <VaporMusicPlayer />

          {/* Retro Arcade Instructions & Tips */}
          <div className="bg-vapor-night/80 border border-vapor-purple/50 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 text-vapor-cyan">
              <Info className="w-4 h-4" />
              <h4 className="font-arcade text-[10px] tracking-wider uppercase">HOW TO PLAY</h4>
            </div>
            <div className="space-y-2 text-xs font-mono text-gray-300">
              <div className="flex items-center justify-between border-b border-vapor-purple/30 pb-1.5">
                <span className="text-gray-400">MOVE SHIP:</span>
                <span className="text-vapor-peach font-bold">← / → ARROWS or A / D</span>
              </div>
              <div className="flex items-center justify-between border-b border-vapor-purple/30 pb-1.5">
                <span className="text-gray-400">FIRE LASER:</span>
                <span className="text-vapor-yellow font-bold">SPACEBAR or Z</span>
              </div>
              <div className="flex items-center justify-between border-b border-vapor-purple/30 pb-1.5">
                <span className="text-gray-400">PAUSE GAME:</span>
                <span className="text-vapor-cyan font-bold">P KEY</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">MYSTERY UFO:</span>
                <span className="text-vapor-pink font-bold">BONUS 50-300 PTS + POWER-UP</span>
              </div>
            </div>
          </div>

          {/* Vaporwave Lore / Flavor Box */}
          <div className="bg-gradient-to-r from-purple-950/60 via-pink-950/30 to-purple-950/60 border border-vapor-pink/30 rounded-2xl p-3.5 text-center">
            <p className="text-[11px] font-mono text-purple-200 leading-relaxed italic">
              "Insert 25¢ into the arcade slot. Put your Walkman on. Defend the neon grid from outer space invaders."
            </p>
            <div className="mt-2 text-[9px] font-arcade text-vapor-peach">
              ★ TOKYO • LOS ANGELES • MIAMI 1984 ★
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 border-t border-vapor-purple/30 bg-[#090414]/80 text-[11px] font-mono text-gray-500">
        <p>
          SYNTHWAVE INVADERS & MUSIC PLAYER • CRAFTED WITH REACT, TAILWIND CSS & WEB AUDIO API
        </p>
      </footer>
    </div>
  );
};
