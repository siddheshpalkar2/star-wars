import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GameState, Alien, Bullet, BunkerPixel, Particle, UFO, AlienType } from '../types/game';
import { sfx } from '../services/soundEffects';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Heart, 
  Zap, 
  Shield, 
  Crosshair, 
  Radio, 
  Tv, 
  Sparkles 
} from 'lucide-react';

interface SpaceInvadersProps {
  onScoreChange?: (score: number, highScore: number) => void;
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
  crtEffectEnabled: boolean;
  onToggleCrt: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const SpaceInvadersGame: React.FC<SpaceInvadersProps> = ({
  onScoreChange,
  scanlinesEnabled,
  onToggleScanlines,
  crtEffectEnabled,
  onToggleCrt,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High score state with localStorage
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('synthwave_invaders_highscore');
    return saved ? parseInt(saved, 10) : 5000;
  });

  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [wave, setWave] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>('START');
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [powerUpTimer, setPowerUpTimer] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);

  // References for mutable game state inside requestAnimationFrame
  const gameStateRef = useRef<GameState>('START');
  gameStateRef.current = gameState;

  const scoreRef = useRef<number>(0);
  scoreRef.current = score;

  const highScoreRef = useRef<number>(highScore);
  highScoreRef.current = highScore;

  const livesRef = useRef<number>(3);
  livesRef.current = lives;

  const waveRef = useRef<number>(1);
  waveRef.current = wave;

  // Key tracking
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Entities
  const playerRef = useRef({
    x: CANVAS_WIDTH / 2 - 22,
    y: CANVAS_HEIGHT - 55,
    width: 44,
    height: 26,
    speed: 6.5,
    lastShot: 0,
    hasShield: false,
    rapidFire: false,
    spreadShot: false,
  });

  const aliensRef = useRef<Alien[]>([]);
  const alienDirectionRef = useRef<number>(1); // 1 = right, -1 = left
  const alienStepTimerRef = useRef<number>(0);
  const alienStepIntervalRef = useRef<number>(750); // ms between steps, decreases as aliens die
  const alienAnimFrameRef = useRef<number>(0);

  const bulletsRef = useRef<Bullet[]>([]);
  const bunkersRef = useRef<BunkerPixel[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const ufoRef = useRef<UFO>({
    x: -80,
    y: 42,
    width: 50,
    height: 22,
    vx: 2.2,
    points: 150,
    active: false,
    color: '#ff007f',
  });
  const ufoTimerRef = useRef<number>(0);

  const floatingTextsRef = useRef<{ x: number; y: number; text: string; alpha: number; color: string }[]>([]);

  // Update High score
  const checkAndUpdateHighScore = useCallback((newScore: number) => {
    if (newScore > highScoreRef.current) {
      setHighScore(newScore);
      localStorage.setItem('synthwave_invaders_highscore', newScore.toString());
    }
  }, []);

  // Initialize Bunker Blocks
  const initBunkers = useCallback(() => {
    const bunkers: BunkerPixel[] = [];
    const bunkerCount = 4;
    const bunkerWidth = 60;
    const bunkerHeight = 36;
    const spacing = (CANVAS_WIDTH - bunkerCount * bunkerWidth) / (bunkerCount + 1);
    const pixelSize = 6;

    for (let b = 0; b < bunkerCount; b++) {
      const startX = spacing + b * (bunkerWidth + spacing);
      const startY = CANVAS_HEIGHT - 125;

      const cols = Math.floor(bunkerWidth / pixelSize);
      const rows = Math.floor(bunkerHeight / pixelSize);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Classic bunker arch cutout: omit pixels in bottom center
          if (r >= rows - 3 && c >= 3 && c <= cols - 4) {
            continue;
          }
          // Bunker top corner rounding
          if (r === 0 && (c === 0 || c === cols - 1)) {
            continue;
          }

          bunkers.push({
            x: startX + c * pixelSize,
            y: startY + r * pixelSize,
            width: pixelSize,
            height: pixelSize,
            health: 3,
          });
        }
      }
    }
    bunkersRef.current = bunkers;
  }, []);

  // Initialize Aliens Wave
  const initAliens = useCallback((currentWave: number) => {
    const aliens: Alien[] = [];
    const rows = 5;
    const cols = 10;
    const alienWidth = 36;
    const alienHeight = 24;
    const hGap = 20;
    const vGap = 16;
    const startX = 80;
    const startY = 80 + Math.min(60, (currentWave - 1) * 12); // Drop slightly per wave

    let id = 0;
    for (let r = 0; r < rows; r++) {
      let type: AlienType = 'octopus';
      let points = 10;
      let color = '#d946ef'; // Magenta
      let glowColor = '#ff2a85';

      if (r === 0) {
        type = 'squid';
        points = 30;
        color = '#ff007f'; // Hot Neon Pink
        glowColor = '#ff7b90';
      } else if (r === 1 || r === 2) {
        type = 'crab';
        points = 20;
        color = '#00f0ff'; // Neon Cyan
        glowColor = '#38bdf8';
      }

      for (let c = 0; c < cols; c++) {
        aliens.push({
          id: id++,
          x: startX + c * (alienWidth + hGap),
          y: startY + r * (alienHeight + vGap),
          width: alienWidth,
          height: alienHeight,
          type,
          points,
          color,
          glowColor,
          frame: 0,
          alive: true,
        });
      }
    }

    aliensRef.current = aliens;
    alienDirectionRef.current = 1;
    // Speed up with wave
    alienStepIntervalRef.current = Math.max(200, 750 - (currentWave - 1) * 80);
    alienStepTimerRef.current = 0;
  }, []);

  // Reset Game for new run
  const startNewGame = () => {
    setScore(0);
    setLives(3);
    setWave(1);
    setCombo(1);
    setActivePowerUp(null);

    scoreRef.current = 0;
    livesRef.current = 3;
    waveRef.current = 1;

    playerRef.current.x = CANVAS_WIDTH / 2 - 22;
    playerRef.current.hasShield = false;
    playerRef.current.rapidFire = false;
    playerRef.current.spreadShot = false;

    bulletsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    ufoRef.current.active = false;

    initBunkers();
    initAliens(1);
    setGameState('PLAYING');
  };

  // Next wave
  const advanceToNextWave = useCallback(() => {
    const nextW = waveRef.current + 1;
    setWave(nextW);
    waveRef.current = nextW;

    // Bonus points for clearing wave
    const waveBonus = nextW * 500;
    const newScore = scoreRef.current + waveBonus;
    setScore(newScore);
    checkAndUpdateHighScore(newScore);

    sfx.playWaveClear();

    // Trigger retro confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff007f', '#00f0ff', '#a855f7', '#ffde59'],
    });

    floatingTextsRef.current.push({
      x: CANVAS_WIDTH / 2 - 80,
      y: CANVAS_HEIGHT / 2,
      text: `WAVE ${nextW} CLEAR! +${waveBonus}`,
      alpha: 1,
      color: '#ffde59',
    });

    initAliens(nextW);
    bulletsRef.current = [];
  }, [checkAndUpdateHighScore, initAliens]);

  // Create particle burst
  const spawnExplosion = (x: number, y: number, color: string, count = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 25 + Math.random() * 20,
      });
    }
  };

  // Player shoot action
  const playerShoot = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;

    const now = Date.now();
    const cooldown = playerRef.current.rapidFire ? 150 : 320;
    if (now - playerRef.current.lastShot < cooldown) return;

    playerRef.current.lastShot = now;
    sfx.playLaser();

    const px = playerRef.current.x + playerRef.current.width / 2;
    const py = playerRef.current.y - 4;

    if (playerRef.current.spreadShot) {
      // 3-way spread
      bulletsRef.current.push(
        { id: Math.random(), x: px, y: py, vx: 0, vy: -9, width: 4, height: 14, color: '#ff007f', glow: '#ff7b90', isPlayerBullet: true, damage: 1 },
        { id: Math.random(), x: px - 6, y: py, vx: -2.2, vy: -8.5, width: 4, height: 14, color: '#00f0ff', glow: '#38bdf8', isPlayerBullet: true, damage: 1 },
        { id: Math.random(), x: px + 6, y: py, vx: 2.2, vy: -8.5, width: 4, height: 14, color: '#00f0ff', glow: '#38bdf8', isPlayerBullet: true, damage: 1 }
      );
    } else {
      // Single laser
      bulletsRef.current.push({
        id: Math.random(),
        x: px - 2,
        y: py,
        vx: 0,
        vy: -9.5,
        width: 4,
        height: 16,
        color: '#00f0ff',
        glow: '#38bdf8',
        isPlayerBullet: true,
        damage: 1,
      });
    }
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on game control keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      keysRef.current[e.code] = true;
      keysRef.current[e.key] = true;

      if (e.code === 'Space' || e.code === 'KeyZ') {
        if (gameStateRef.current === 'START' || gameStateRef.current === 'GAMEOVER') {
          startNewGame();
        } else if (gameStateRef.current === 'PLAYING') {
          playerShoot();
        }
      }

      if (e.code === 'KeyP') {
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerShoot]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(100, currentTime - lastTime);
      lastTime = currentTime;

      // 1. UPDATE STATE (If playing)
      if (gameStateRef.current === 'PLAYING') {
        // Player movement
        const player = playerRef.current;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
          player.x = Math.max(10, player.x - player.speed);
        }
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
          player.x = Math.min(CANVAS_WIDTH - player.width - 10, player.x + player.speed);
        }

        // Alien march timing
        alienStepTimerRef.current += dt;
        if (alienStepTimerRef.current >= alienStepIntervalRef.current) {
          alienStepTimerRef.current = 0;
          alienAnimFrameRef.current = 1 - alienAnimFrameRef.current;

          // Sound step
          sfx.playAlienStep();

          const aliveAliens = aliensRef.current.filter((a) => a.alive);

          // Check if alive aliens empty -> wave complete
          if (aliveAliens.length === 0) {
            advanceToNextWave();
          } else {
            // Find boundaries of alive aliens
            let minX = CANVAS_WIDTH;
            let maxX = 0;
            let maxY = 0;

            aliveAliens.forEach((a) => {
              if (a.x < minX) minX = a.x;
              if (a.x + a.width > maxX) maxX = a.x + a.width;
              if (a.y + a.height > maxY) maxY = a.y + a.height;
            });

            // Check boundary bounce
            const dir = alienDirectionRef.current;
            const willHitRight = dir === 1 && maxX + 18 >= CANVAS_WIDTH - 20;
            const willHitLeft = dir === -1 && minX - 18 <= 20;

            if (willHitRight || willHitLeft) {
              // Reverse and drop down
              alienDirectionRef.current = -dir;
              aliensRef.current.forEach((a) => {
                a.y += 20;
              });

              // Check if aliens reached bunkers / player level -> Game Over
              if (maxY + 20 >= CANVAS_HEIGHT - 100) {
                setGameState('GAMEOVER');
                sfx.playPlayerExplosion();
              }
            } else {
              // Move horizontal
              const stepDistance = 14;
              aliensRef.current.forEach((a) => {
                a.x += dir * stepDistance;
              });
            }

            // Adjust cadence based on alive ratio
            const remainingRatio = aliveAliens.length / 50;
            alienStepIntervalRef.current = Math.max(90, Math.floor(750 * remainingRatio));
          }
        }

        // Alien shooting
        if (Math.random() < 0.035 + waveRef.current * 0.005) {
          const aliveAliens = aliensRef.current.filter((a) => a.alive);
          if (aliveAliens.length > 0) {
            // Pick a random alive alien from bottom of columns
            const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
            bulletsRef.current.push({
              id: Math.random(),
              x: shooter.x + shooter.width / 2 - 2,
              y: shooter.y + shooter.height + 2,
              vx: (Math.random() - 0.5) * 0.8,
              vy: 4.8 + waveRef.current * 0.3,
              width: 4,
              height: 12,
              color: '#d946ef',
              glow: '#ff2a85',
              isPlayerBullet: false,
              damage: 1,
            });
            sfx.playAlienLaser();
          }
        }

        // Mystery UFO Spawning & Movement
        ufoTimerRef.current += dt;
        if (!ufoRef.current.active && ufoTimerRef.current > 18000 + Math.random() * 12000) {
          ufoTimerRef.current = 0;
          ufoRef.current.active = true;
          ufoRef.current.x = -60;
          ufoRef.current.points = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
        }

        if (ufoRef.current.active) {
          ufoRef.current.x += ufoRef.current.vx;
          if (ufoRef.current.x > CANVAS_WIDTH + 60) {
            ufoRef.current.active = false;
          }
        }

        // Update Bullets
        for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
          const b = bulletsRef.current[i];
          b.x += b.vx;
          b.y += b.vy;

          // Out of screen
          if (b.y < -20 || b.y > CANVAS_HEIGHT + 20) {
            bulletsRef.current.splice(i, 1);
            continue;
          }

          // Bullet vs Bunker Collisions
          let bulletRemoved = false;
          for (let k = bunkersRef.current.length - 1; k >= 0; k--) {
            const block = bunkersRef.current[k];
            if (
              b.x + b.width >= block.x &&
              b.x <= block.x + block.width &&
              b.y + b.height >= block.y &&
              b.y <= block.y + block.height
            ) {
              // Hit bunker block!
              block.health -= b.damage;
              sfx.playBunkerHit();
              spawnExplosion(b.x, b.y, '#ffde59', 5);

              if (block.health <= 0) {
                bunkersRef.current.splice(k, 1);
              }

              bulletsRef.current.splice(i, 1);
              bulletRemoved = true;
              break;
            }
          }
          if (bulletRemoved) continue;

          // Player Bullet vs Alien Collisions
          if (b.isPlayerBullet) {
            // Check UFO hit
            if (
              ufoRef.current.active &&
              b.x + b.width >= ufoRef.current.x &&
              b.x <= ufoRef.current.x + ufoRef.current.width &&
              b.y + b.height >= ufoRef.current.y &&
              b.y <= ufoRef.current.y + ufoRef.current.height
            ) {
              ufoRef.current.active = false;
              const pts = ufoRef.current.points;
              const newScore = scoreRef.current + pts;
              setScore(newScore);
              checkAndUpdateHighScore(newScore);
              sfx.playUfoBonus();
              spawnExplosion(ufoRef.current.x + 25, ufoRef.current.y + 11, '#ffde59', 28);

              // Chance of granting power-up!
              const pTypes = ['rapid', 'shield', 'spread'];
              const chosen = pTypes[Math.floor(Math.random() * pTypes.length)];
              if (chosen === 'rapid') {
                playerRef.current.rapidFire = true;
                setActivePowerUp('RAPID FIRE');
              } else if (chosen === 'shield') {
                playerRef.current.hasShield = true;
                setActivePowerUp('ENERGY SHIELD');
              } else {
                playerRef.current.spreadShot = true;
                setActivePowerUp('TRIPLE SPREAD');
              }
              setPowerUpTimer(12);

              floatingTextsRef.current.push({
                x: ufoRef.current.x,
                y: ufoRef.current.y,
                text: `+${pts} UFO!`,
                alpha: 1,
                color: '#ffde59',
              });

              bulletsRef.current.splice(i, 1);
              continue;
            }

            // Check Aliens
            for (let aIdx = 0; aIdx < aliensRef.current.length; aIdx++) {
              const alien = aliensRef.current[aIdx];
              if (!alien.alive) continue;

              if (
                b.x + b.width >= alien.x &&
                b.x <= alien.x + alien.width &&
                b.y <= alien.y + alien.height &&
                b.y + b.height >= alien.y
              ) {
                // Alien Destroyed!
                alien.alive = false;
                bulletsRef.current.splice(i, 1);
                bulletRemoved = true;

                const pts = alien.points * combo;
                const newScore = scoreRef.current + pts;
                setScore(newScore);
                checkAndUpdateHighScore(newScore);

                sfx.playAlienExplosion();
                spawnExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2, alien.color, 14);

                floatingTextsRef.current.push({
                  x: alien.x,
                  y: alien.y,
                  text: `+${pts}`,
                  alpha: 1,
                  color: alien.color,
                });

                break;
              }
            }
          } else {
            // Alien Bullet vs Player Collision
            const player = playerRef.current;
            if (
              b.x + b.width >= player.x &&
              b.x <= player.x + player.width &&
              b.y + b.height >= player.y &&
              b.y <= player.y + player.height
            ) {
              // Player Hit!
              bulletsRef.current.splice(i, 1);

              if (player.hasShield) {
                player.hasShield = false;
                setActivePowerUp(null);
                sfx.playBunkerHit();
                spawnExplosion(player.x + player.width / 2, player.y, '#00f0ff', 18);
              } else {
                sfx.playPlayerExplosion();
                spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff007f', 30);

                const newLives = livesRef.current - 1;
                setLives(newLives);
                livesRef.current = newLives;

                // Reset player position
                player.x = CANVAS_WIDTH / 2 - 22;

                if (newLives <= 0) {
                  setGameState('GAMEOVER');
                }
              }
            }
          }
        }

        // Power-up countdown timer
        if (activePowerUp) {
          setPowerUpTimer((prev) => {
            const next = prev - dt / 1000;
            if (next <= 0) {
              playerRef.current.rapidFire = false;
              playerRef.current.spreadShot = false;
              setActivePowerUp(null);
              return 0;
            }
            return next;
          });
        }

        // Check if all aliens destroyed
        const aliveAliensCount = aliensRef.current.filter((a) => a.alive).length;
        if (aliveAliensCount === 0) {
          advanceToNextWave();
        }
      }

      // Update Particles
      for (let p = particlesRef.current.length - 1; p >= 0; p--) {
        const pt = particlesRef.current[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);
        if (pt.life >= pt.maxLife) {
          particlesRef.current.splice(p, 1);
        }
      }

      // Update Floating Texts
      for (let f = floatingTextsRef.current.length - 1; f >= 0; f--) {
        const ft = floatingTextsRef.current[f];
        ft.y -= 0.8;
        ft.alpha -= 0.025;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(f, 1);
        }
      }

      // 2. RENDER CANVAS
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Deep Space / Retro Starfield Background
      ctx.fillStyle = '#0a0518';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant Stars
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 45; s++) {
        const sx = (s * 47) % CANVAS_WIDTH;
        const sy = (s * 29 + (currentTime * 0.02 * (s % 3 + 1))) % (CANVAS_HEIGHT - 80);
        const size = (s % 3) + 1;
        ctx.globalAlpha = 0.2 + (s % 5) * 0.15;
        ctx.fillRect(sx, sy, size, size);
      }
      ctx.globalAlpha = 1;

      // Bottom Retro Grid Ground (Synthwave Horizon)
      const horizonY = CANVAS_HEIGHT - 65;
      const grad = ctx.createLinearGradient(0, horizonY, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, 'rgba(43, 16, 85, 0.7)');
      grad.addColorStop(1, 'rgba(15, 6, 32, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, horizonY, CANVAS_WIDTH, CANVAS_HEIGHT - horizonY);

      // Grid Lines
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(CANVAS_WIDTH, horizonY);
      ctx.stroke();

      // Perspective grid lines
      const vanishX = CANVAS_WIDTH / 2;
      for (let x = -200; x <= CANVAS_WIDTH + 200; x += 60) {
        ctx.beginPath();
        ctx.moveTo(vanishX, horizonY - 40);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Horizontal moving grid bars
      const gridOffset = (currentTime * 0.05) % 25;
      for (let gy = horizonY; gy < CANVAS_HEIGHT; gy += 12 + (gy - horizonY) * 0.35) {
        ctx.beginPath();
        ctx.moveTo(0, gy + gridOffset);
        ctx.lineTo(CANVAS_WIDTH, gy + gridOffset);
        ctx.stroke();
      }

      // Render Bunkers
      bunkersRef.current.forEach((block) => {
        const alpha = block.health === 3 ? 1 : block.health === 2 ? 0.7 : 0.4;
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = block.health === 3 ? 6 : 2;
        ctx.fillRect(block.x, block.y, block.width, block.height);
      });
      ctx.shadowBlur = 0;

      // Render Aliens (Vaporwave pixel shapes)
      const frame = alienAnimFrameRef.current;
      aliensRef.current.forEach((alien) => {
        if (!alien.alive) return;
        ctx.fillStyle = alien.color;
        ctx.shadowColor = alien.glowColor;
        ctx.shadowBlur = 8;

        drawAlienPixelArt(ctx, alien.x, alien.y, alien.width, alien.height, alien.type, frame);
      });
      ctx.shadowBlur = 0;

      // Render Mystery UFO
      if (ufoRef.current.active) {
        ctx.save();
        ctx.shadowColor = '#ffde59';
        ctx.shadowBlur = 12;
        drawUfo(ctx, ufoRef.current.x, ufoRef.current.y, ufoRef.current.width, ufoRef.current.height);
        ctx.restore();
      }

      // Render Player Ship
      const player = playerRef.current;
      drawPlayerShip(ctx, player.x, player.y, player.width, player.height, player.hasShield);

      // Render Bullets
      bulletsRef.current.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.glow;
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });
      ctx.shadowBlur = 0;

      // Render Particles
      particlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Render Floating Score Texts
      floatingTextsRef.current.forEach((ft) => {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.alpha;
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1;

      // START SCREEN OVERLAY
      if (gameStateRef.current === 'START') {
        renderStartOverlay(ctx, currentTime);
      } else if (gameStateRef.current === 'PAUSED') {
        renderPausedOverlay(ctx);
      } else if (gameStateRef.current === 'GAMEOVER') {
        renderGameOverOverlay(ctx, scoreRef.current, highScoreRef.current);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [advanceToNextWave, checkAndUpdateHighScore]);

  // Helper drawing functions
  function drawPlayerShip(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    hasShield: boolean
  ) {
    ctx.save();
    // Shield aura if active
    if (hasShield) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, w * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ship Neon Body
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff007f';

    // Futuristic synth fighter silhouette
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y); // Nose tip
    ctx.lineTo(x + w, y + h); // Right wing tip
    ctx.lineTo(x + w * 0.7, y + h - 6); // Wing notch
    ctx.lineTo(x + w * 0.5, y + h - 2); // Center thruster
    ctx.lineTo(x + w * 0.3, y + h - 6); // Left wing notch
    ctx.lineTo(x, y + h); // Left wing tip
    ctx.closePath();
    ctx.fill();

    // Cyan Cockpit
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.55, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thruster flame animation
    const flameH = 4 + Math.random() * 8;
    ctx.fillStyle = '#ffde59';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 4, y + h - 2);
    ctx.lineTo(x + w / 2 + 4, y + h - 2);
    ctx.lineTo(x + w / 2, y + h + flameH);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawAlienPixelArt(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    type: AlienType,
    frame: number
  ) {
    // 8x8 or 11x8 retro pixel matrix representation
    let matrix: number[][];

    if (type === 'squid') {
      // 8x8 squid
      matrix =
        frame === 0
          ? [
              [0, 0, 0, 1, 1, 0, 0, 0],
              [0, 0, 1, 1, 1, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 1, 0],
              [1, 1, 0, 1, 1, 0, 1, 1],
              [1, 1, 1, 1, 1, 1, 1, 1],
              [0, 0, 1, 0, 0, 1, 0, 0],
              [0, 1, 0, 1, 1, 0, 1, 0],
              [1, 0, 1, 0, 0, 1, 0, 1],
            ]
          : [
              [0, 0, 0, 1, 1, 0, 0, 0],
              [0, 0, 1, 1, 1, 1, 0, 0],
              [0, 1, 1, 1, 1, 1, 1, 0],
              [1, 1, 0, 1, 1, 0, 1, 1],
              [1, 1, 1, 1, 1, 1, 1, 1],
              [0, 1, 0, 1, 1, 0, 1, 0],
              [1, 0, 0, 0, 0, 0, 0, 1],
              [0, 1, 0, 0, 0, 0, 1, 0],
            ];
    } else if (type === 'crab') {
      // 11x8 crab
      matrix =
        frame === 0
          ? [
              [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
              [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
              [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
              [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
              [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
              [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
              [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
              [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
            ]
          : [
              [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
              [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
              [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
              [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
              [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
              [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
              [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
              [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            ];
    } else {
      // Octopus / Jellyfish (12x8)
      matrix =
        frame === 0
          ? [
              [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
              [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
              [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
              [1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1],
              [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
              [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0],
              [0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0],
              [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
            ]
          : [
              [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
              [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
              [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
              [1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1],
              [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
              [0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0],
              [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
              [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
            ];
    }

    const rows = matrix.length;
    const cols = matrix[0].length;
    const pxSizeW = w / cols;
    const pxSizeH = h / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === 1) {
          ctx.fillRect(x + c * pxSizeW, y + r * pxSizeH, pxSizeW + 0.4, pxSizeH + 0.4);
        }
      }
    }
  }

  function drawUfo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#ffde59';
    // Saucer dome
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.35, w * 0.25, h * 0.35, 0, Math.PI, 0);
    ctx.fill();

    // Saucer disk
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.55, w * 0.5, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flashing lights
    const colors = ['#00f0ff', '#ffde59', '#ff007f', '#a855f7'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[(i + Math.floor(Date.now() / 150)) % colors.length];
      ctx.beginPath();
      ctx.arc(x + w * 0.2 + i * (w * 0.2), y + h * 0.55, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function renderStartOverlay(ctx: CanvasRenderingContext2D, time: number) {
    ctx.fillStyle = 'rgba(9, 4, 20, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Glowing Neon Title
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = '28px "Orbitron", sans-serif';
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 20;
    ctx.fillText('SYNTHWAVE INVADERS', CANVAS_WIDTH / 2, 170);

    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.fillText('1 9 8 4   E D I T I O N', CANVAS_WIDTH / 2, 215);

    // Alien score table
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.shadowBlur = 6;

    // UFO
    drawUfo(ctx, CANVAS_WIDTH / 2 - 110, 270, 36, 16);
    ctx.fillStyle = '#ffde59';
    ctx.fillText('= ?? MYSTERY UFO', CANVAS_WIDTH / 2 + 20, 283);

    // Squid
    drawAlienPixelArt(ctx, CANVAS_WIDTH / 2 - 105, 305, 26, 18, 'squid', 0);
    ctx.fillStyle = '#ff007f';
    ctx.fillText('= 30 POINTS', CANVAS_WIDTH / 2 + 10, 320);

    // Crab
    drawAlienPixelArt(ctx, CANVAS_WIDTH / 2 - 105, 345, 26, 18, 'crab', 0);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('= 20 POINTS', CANVAS_WIDTH / 2 + 10, 360);

    // Octopus
    drawAlienPixelArt(ctx, CANVAS_WIDTH / 2 - 105, 385, 26, 18, 'octopus', 0);
    ctx.fillStyle = '#d946ef';
    ctx.fillText('= 10 POINTS', CANVAS_WIDTH / 2 + 10, 400);

    // Flashing Press Space
    if (Math.sin(time / 250) > 0) {
      ctx.font = '13px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffde59';
      ctx.shadowColor = '#ffde59';
      ctx.shadowBlur = 15;
      ctx.fillText('[ PRESS SPACE OR CLICK TO START ]', CANVAS_WIDTH / 2, 470);
    }

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.fillText('CONTROLS: ARROWS / A-D TO MOVE • SPACE TO SHOOT • P TO PAUSE', CANVAS_WIDTH / 2, 530);

    ctx.restore();
  }

  function renderPausedOverlay(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(9, 4, 20, 0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffde59';
    ctx.shadowColor = '#ffde59';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillText('PRESS P OR SPACE TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    ctx.restore();
  }

  function renderGameOverOverlay(ctx: CanvasRenderingContext2D, finalScore: number, finalHigh: number) {
    ctx.fillStyle = 'rgba(9, 4, 20, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 25;
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 210);

    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillText(`FINAL SCORE: ${finalScore.toString().padStart(5, '0')}`, CANVAS_WIDTH / 2, 280);

    ctx.fillStyle = '#ffde59';
    ctx.shadowColor = '#ffde59';
    ctx.fillText(`HIGH SCORE:  ${finalHigh.toString().padStart(5, '0')}`, CANVAS_WIDTH / 2, 320);

    if (finalScore >= finalHigh && finalScore > 0) {
      ctx.fillStyle = '#ec4899';
      ctx.fillText('★ NEW HIGH SCORE RECORD! ★', CANVAS_WIDTH / 2, 365);
    }

    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillText('[ PRESS SPACE OR CLICK TO PLAY AGAIN ]', CANVAS_WIDTH / 2, 440);

    ctx.restore();
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Arcade Header HUD: Scores, Wave, Lives */}
      <div className="w-full max-w-[800px] mb-3 flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-vapor-night/80 border border-vapor-purple/60 rounded-xl shadow-lg backdrop-blur-sm">
        {/* Score & High Score */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] font-arcade text-vapor-peach tracking-wider">SCORE</div>
            <div className="text-xl font-arcade text-vapor-cyan neon-text-cyan">
              {score.toString().padStart(5, '0')}
            </div>
          </div>

          <div className="flex items-center gap-2 pl-4 border-l border-vapor-purple/50">
            <Trophy className="w-4 h-4 text-vapor-yellow animate-bounce" />
            <div>
              <div className="text-[10px] font-arcade text-vapor-yellow tracking-wider">HIGH SCORE</div>
              <div className="text-xl font-arcade text-vapor-yellow neon-text-yellow">
                {highScore.toString().padStart(5, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Wave and Active Power-up */}
        <div className="flex items-center gap-4">
          {activePowerUp && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-900/60 border border-pink-500/80 rounded-lg text-xs font-arcade text-pink-300 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-vapor-yellow" />
              <span>{activePowerUp} ({Math.ceil(powerUpTimer)}s)</span>
            </div>
          )}

          <div className="text-right">
            <div className="text-[10px] font-arcade text-purple-300 tracking-wider">WAVE</div>
            <div className="text-lg font-arcade text-vapor-pink neon-text-pink">
              STG {wave.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Lives Indicator */}
          <div className="pl-3 border-l border-vapor-purple/50">
            <div className="text-[10px] font-arcade text-vapor-peach tracking-wider mb-1">LIVES</div>
            <div className="flex items-center gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`transition-all duration-300 ${
                    i < lives
                      ? 'text-vapor-pink scale-100 drop-shadow-[0_0_6px_#ff007f]'
                      : 'text-gray-700 scale-75 opacity-30'
                  }`}
                >
                  <Heart className="w-4 h-4 fill-current" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Arcade Screen Container */}
      <div 
        className={`relative overflow-hidden rounded-2xl border-4 border-vapor-purple/80 bg-black shadow-neon-pink group ${
          crtEffectEnabled ? 'crt-curve crt-flicker' : ''
        }`}
        style={{ width: '100%', maxWidth: `${CANVAS_WIDTH}px`, aspectRatio: '4/3' }}
        onClick={() => {
          if (gameState === 'START' || gameState === 'GAMEOVER') {
            startNewGame();
          }
        }}
      >
        {/* Canvas Element */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain cursor-crosshair block"
        />

        {/* Optional 80s CRT Scanline Layer */}
        {scanlinesEnabled && (
          <div className="scanlines absolute inset-0 z-20 pointer-events-none" />
        )}

        {/* Glass reflection gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none z-10" />
      </div>

      {/* Arcade Controls & Toggles Bar */}
      <div className="w-full max-w-[800px] mt-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-vapor-night/70 border border-vapor-purple/40 rounded-xl text-xs">
        {/* Visual FX Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleScanlines}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all border ${
              scanlinesEnabled
                ? 'bg-vapor-pink/20 text-vapor-pink border-vapor-pink/80 shadow-[0_0_8px_rgba(255,42,133,0.5)]'
                : 'bg-vapor-deep/60 text-gray-400 border-vapor-purple/40 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>SCANLINES: {scanlinesEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleCrt}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all border ${
              crtEffectEnabled
                ? 'bg-vapor-cyan/20 text-vapor-cyan border-vapor-cyan/80 shadow-[0_0_8px_rgba(0,240,255,0.5)]'
                : 'bg-vapor-deep/60 text-gray-400 border-vapor-purple/40 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>CRT BEZEL: {crtEffectEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Game State Control Buttons */}
        <div className="flex items-center gap-2">
          {gameState === 'PLAYING' && (
            <button
              onClick={() => setGameState('PAUSED')}
              className="px-3 py-1.5 bg-vapor-purple hover:bg-vapor-violet text-white font-arcade text-[10px] rounded-lg border border-purple-400/40"
            >
              PAUSE
            </button>
          )}

          {gameState === 'PAUSED' && (
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-arcade text-[10px] rounded-lg"
            >
              RESUME
            </button>
          )}

          <button
            onClick={startNewGame}
            className="flex items-center gap-1 px-3 py-1.5 bg-vapor-pink/30 hover:bg-vapor-pink/50 text-vapor-peach font-arcade text-[10px] rounded-lg border border-vapor-pink/60 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{gameState === 'PLAYING' ? 'RESTART' : 'NEW GAME'}</span>
          </button>
        </div>
      </div>

      {/* Mobile / Touch Arcade Controller (Optional onscreen pads) */}
      <div className="w-full max-w-[800px] mt-2 flex items-center justify-between gap-4 p-2.5 bg-vapor-deep/60 border border-vapor-purple/40 rounded-xl md:hidden">
        <div className="flex gap-2">
          <button
            onPointerDown={() => { keysRef.current['ArrowLeft'] = true; }}
            onPointerUp={() => { keysRef.current['ArrowLeft'] = false; }}
            className="w-14 h-12 bg-vapor-purple active:bg-vapor-pink text-white rounded-lg flex items-center justify-center font-arcade text-lg select-none"
          >
            ◀
          </button>
          <button
            onPointerDown={() => { keysRef.current['ArrowRight'] = true; }}
            onPointerUp={() => { keysRef.current['ArrowRight'] = false; }}
            className="w-14 h-12 bg-vapor-purple active:bg-vapor-pink text-white rounded-lg flex items-center justify-center font-arcade text-lg select-none"
          >
            ▶
          </button>
        </div>

        <button
          onClick={playerShoot}
          className="flex-1 h-12 bg-gradient-to-r from-vapor-pink to-vapor-hotpink active:opacity-80 text-white rounded-lg flex items-center justify-center font-arcade text-xs tracking-wider shadow-neon-pink select-none"
        >
          FIRE [SPACE]
        </button>
      </div>
    </div>
  );
};
