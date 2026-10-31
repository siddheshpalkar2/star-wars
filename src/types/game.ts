export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export type AlienType = 'squid' | 'crab' | 'octopus' | 'ufo';

export interface Alien {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: AlienType;
  points: number;
  color: string;
  glowColor: string;
  frame: number; // For 2-frame retro animation
  alive: boolean;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  glow: string;
  isPlayerBullet: boolean;
  damage: number;
}

export interface BunkerPixel {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number; // 0 to 3
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: 'rapid' | 'shield' | 'spread' | 'multiship';
  color: string;
  icon: string;
  duration: number; // in seconds
}

export interface UFO {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  points: number;
  active: boolean;
  color: string;
}

export interface PlayerStats {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  multiplier: number;
}
