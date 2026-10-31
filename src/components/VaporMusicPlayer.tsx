import React, { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Disc3, 
  Radio, 
  Music2, 
  Flame, 
  Headphones, 
  ListMusic 
} from 'lucide-react';
import { musicEngine, DUMMY_TRACKS } from '../services/synthwaveMusic';
import { sfx } from '../services/soundEffects';
import { Track } from '../types/music';

export const VaporMusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(musicEngine.getIsPlaying());
  const [currentTrack, setCurrentTrack] = useState<Track>(musicEngine.getCurrentTrack());
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(musicEngine.getCurrentTrackIndex());
  const [elapsed, setElapsed] = useState<number>(musicEngine.getElapsedSeconds());
  const [volume, setVolume] = useState<number>(musicEngine.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(musicEngine.getIsMuted());
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(false);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);

  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to audio engine updates
  useEffect(() => {
    const unsubscribe = musicEngine.subscribe(() => {
      setIsPlaying(musicEngine.getIsPlaying());
      setCurrentTrack(musicEngine.getCurrentTrack());
      setCurrentTrackIndex(musicEngine.getCurrentTrackIndex());
      setElapsed(musicEngine.getElapsedSeconds());
      setVolume(musicEngine.getVolume());
      setIsMuted(musicEngine.getIsMuted());
    });
    return unsubscribe;
  }, []);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Real-time Audio Spectrum Visualizer Loop
  useEffect(() => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const numBars = 24;
    const dataArray = new Uint8Array(32);

    const render = () => {
      if (musicEngine.analyser && isPlaying) {
        musicEngine.analyser.getByteFrequencyData(dataArray);
      } else {
        // Idle ambient gentle wave
        const now = Date.now() / 600;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.max(8, (Math.sin(now + i * 0.4) + 1) * 14);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / numBars) - 2;
      for (let i = 0; i < numBars; i++) {
        const val = dataArray[i % dataArray.length];
        const barHeight = Math.max(3, (val / 255) * canvas.height * 0.95);
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // 80s Synthwave Gradient: Cyan -> Violet -> Hot Pink -> Yellow
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#00f0ff');
        grad.addColorStop(0.5, '#d946ef');
        grad.addColorStop(0.85, '#ff007f');
        grad.addColorStop(1, '#ffde59');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, Math.max(0, y - 2), barWidth, 1.5);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  const handleTogglePlay = () => {
    musicEngine.togglePlay();
  };

  const handleNext = () => {
    musicEngine.nextTrack();
  };

  const handlePrev = () => {
    musicEngine.prevTrack();
  };

  const handleSelectTrack = (index: number) => {
    musicEngine.selectTrack(index);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    musicEngine.setVolume(val);
  };

  const handleToggleMute = () => {
    musicEngine.toggleMute();
  };

  const handleToggleSfx = () => {
    const next = !isSfxMuted;
    setIsSfxMuted(next);
    sfx.setMuted(next);
  };

  const progressPercent = Math.min(100, (elapsed / (currentTrack.duration || 1)) * 100);

  return (
    <div className="w-full bg-vapor-night/90 border-2 border-vapor-purple rounded-2xl p-4 shadow-neon-purple backdrop-blur-md relative overflow-hidden">
      {/* Background synth lines */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cassette Deck Header */}
      <div className="flex items-center justify-between border-b border-vapor-purple/50 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-vapor-pink animate-pulse" />
          <span className="font-arcade text-[10px] text-vapor-peach tracking-widest uppercase">
            SYNTHWAVE WALKMAN // HI-FI STEREO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-vapor-deep border border-pink-500/30 text-pink-300">
            DOLBY B NR
          </span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all border ${
            isPlaying ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-vapor-deep text-gray-500 border-gray-700'
          }`}>
            {isPlaying ? '● PLAY' : '■ PAUSE'}
          </span>
        </div>
      </div>

      {/* Vintage Cassette Tape / Track Visual Representation */}
      <div className="relative bg-vapor-dark border-2 border-vapor-purple/70 rounded-xl p-3 mb-3 shadow-inner">
        {/* Cassette Shell Design */}
        <div className="flex items-center justify-between gap-3">
          {/* Left Reel */}
          <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-900 border-2 border-gray-700 rounded-full shadow-md">
            <div 
              className={`w-10 h-10 border-2 border-dashed border-vapor-pink/80 rounded-full flex items-center justify-center ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '3s' }}
            >
              <div className="w-3 h-3 bg-white rounded-full shadow-glow" />
            </div>
          </div>

          {/* Center Cassette Label */}
          <div className="flex-1 min-w-0 px-2 py-1 bg-gradient-to-r from-vapor-deep via-purple-950 to-vapor-deep rounded-lg border border-pink-500/40 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-arcade text-vapor-yellow uppercase tracking-wider mb-0.5">
              <Headphones className="w-3 h-3 text-vapor-yellow" />
              <span>SIDE A • {currentTrack.bpm} BPM</span>
            </div>
            <h3 className="font-display font-bold text-sm text-white truncate neon-text-pink tracking-wide">
              {currentTrack.title}
            </h3>
            <p className="text-xs text-vapor-peach truncate font-mono">
              {currentTrack.artist}
            </p>
          </div>

          {/* Right Reel */}
          <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-900 border-2 border-gray-700 rounded-full shadow-md">
            <div 
              className={`w-10 h-10 border-2 border-dashed border-vapor-cyan/80 rounded-full flex items-center justify-center ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '3s' }}
            >
              <div className="w-3 h-3 bg-white rounded-full shadow-glow" />
            </div>
          </div>
        </div>

        {/* Real-time Spectrum Visualizer */}
        <div className="mt-3 pt-2 border-t border-purple-900/60">
          <canvas
            ref={visualizerCanvasRef}
            width={340}
            height={36}
            className="w-full h-9 rounded bg-black/50 block"
          />
        </div>
      </div>

      {/* Timeline & Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-1">
          <span className="text-vapor-cyan font-bold">{formatTime(elapsed)}</span>
          <span className="text-gray-500">{formatTime(currentTrack.duration)}</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-purple-800/60">
          <div 
            className="h-full bg-gradient-to-r from-vapor-cyan via-vapor-magenta to-vapor-pink rounded-full transition-all duration-300 shadow-[0_0_8px_#ff007f]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Playback Transport Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* SFX Mute Button */}
        <button
          onClick={handleToggleSfx}
          title={isSfxMuted ? 'Unmute Game SFX' : 'Mute Game SFX'}
          className={`p-2 rounded-xl border font-mono text-xs flex items-center gap-1 transition-all ${
            isSfxMuted
              ? 'bg-red-950/40 text-red-400 border-red-500/50'
              : 'bg-vapor-deep/80 text-vapor-peach border-vapor-purple/50 hover:bg-vapor-purple/50'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[10px] hidden sm:inline">SFX</span>
        </button>

        {/* Previous, Play/Pause, Next Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            title="Previous Track"
            className="w-10 h-10 rounded-xl bg-vapor-deep hover:bg-vapor-purple text-vapor-cyan border border-vapor-cyan/50 flex items-center justify-center transition-all active:scale-95 shadow-[0_0_8px_rgba(0,240,255,0.3)]"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={handleTogglePlay}
            title={isPlaying ? 'Pause' : 'Play Synthwave'}
            className="w-13 h-13 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-vapor-pink to-vapor-hotpink hover:brightness-110 text-white border-2 border-white/60 flex items-center justify-center shadow-neon-pink transition-all active:scale-95 group"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5 group-hover:scale-110 transition-transform" />
            )}
          </button>

          <button
            onClick={handleNext}
            title="Skip Track"
            className="w-10 h-10 rounded-xl bg-vapor-deep hover:bg-vapor-purple text-vapor-pink border border-vapor-pink/50 flex items-center justify-center transition-all active:scale-95 shadow-[0_0_8px_rgba(255,42,133,0.3)]"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Playlist Toggle */}
        <button
          onClick={() => setShowPlaylist(!showPlaylist)}
          title="Toggle Tracklist"
          className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
            showPlaylist 
              ? 'bg-vapor-pink/30 text-vapor-pink border-vapor-pink shadow-[0_0_8px_#ff007f]' 
              : 'bg-vapor-deep/80 text-gray-300 border-vapor-purple/50 hover:bg-vapor-purple/50'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span className="text-[10px] hidden sm:inline">3 TRACKS</span>
        </button>
      </div>

      {/* Volume Control Bar */}
      <div className="flex items-center gap-3 px-2 py-1.5 bg-black/40 rounded-xl border border-vapor-purple/40">
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="text-vapor-cyan hover:text-white transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-vapor-pink"
        />
        <span className="text-[10px] font-mono text-gray-400 min-w-[28px] text-right">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>

      {/* Dummy Tracks Playlist Selector */}
      {showPlaylist && (
        <div className="mt-3 pt-3 border-t border-vapor-purple/60 space-y-1.5 animate-fadeIn">
          <div className="text-[9px] font-arcade text-vapor-yellow tracking-wider mb-1 flex items-center gap-1">
            <Disc3 className="w-3 h-3 text-vapor-yellow" />
            <span>SYNTH-WAVE CASSETTE TRACKLIST</span>
          </div>
          {DUMMY_TRACKS.map((track, idx) => {
            const isSelected = idx === currentTrackIndex;
            return (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(idx)}
                className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-vapor-purple/60 border-vapor-pink text-white shadow-[0_0_10px_rgba(255,42,133,0.4)]'
                    : 'bg-vapor-dark/60 border-vapor-purple/30 text-gray-400 hover:bg-vapor-deep/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded flex items-center justify-center font-arcade text-[10px] ${
                    isSelected ? 'bg-vapor-pink text-white' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {isSelected && isPlaying ? '▶' : idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isSelected ? 'text-vapor-cyan' : 'text-gray-200'}`}>
                      {track.title}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate font-mono">
                      {track.artist} • {track.genre}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                  {formatTime(track.duration)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
