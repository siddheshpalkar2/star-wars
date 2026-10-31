import { Track } from '../types/music';

export const DUMMY_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Outrun 1984 (Neon Highway)',
    artist: 'Kavinsky Wave & The Dreamers',
    album: 'Cassette Tape Vol. 1',
    year: '1984',
    duration: 184, // 3:04
    bpm: 120,
    genre: 'Synthwave / Darksynth',
    coverGradient: 'from-pink-600 via-purple-700 to-indigo-950',
    mood: 'High-speed highway chase under glowing pink neon lights',
  },
  {
    id: 'track-2',
    title: 'Sunset Mirage (Palms & CRT)',
    artist: 'Vapor Dream Corp.',
    album: 'Floral Shoppe Memories',
    year: '1986',
    duration: 215, // 3:35
    bpm: 94,
    genre: 'Chillwave / Vaporwave',
    coverGradient: 'from-purple-600 via-pink-500 to-amber-500',
    mood: 'Dreamy Miami twilight, VHS tracking glitch, ocean breeze',
  },
  {
    id: 'track-3',
    title: 'Cyber Grid Overdrive',
    artist: 'Laser Knight 2088',
    album: 'Arcade Apocalypse',
    year: '1988',
    duration: 198, // 3:18
    bpm: 132,
    genre: 'Cyberpunk Electro',
    coverGradient: 'from-cyan-500 via-blue-600 to-purple-950',
    mood: 'Adrenaline vector dogfight through cybernetic defense grids',
  },
];

type MusicListener = () => void;

class SynthwaveMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  private isPlaying: boolean = false;
  private currentTrackIdx: number = 0;
  private volume: number = 0.55;
  private isMuted: boolean = false;

  private timerId: number | null = null;
  private step: number = 0;
  private elapsedSeconds: number = 0;
  private trackTimerInterval: number | null = null;

  private listeners: Set<MusicListener> = new Set();

  private initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(listener: MusicListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): Track {
    return DUMMY_TRACKS[this.currentTrackIdx];
  }

  public getCurrentTrackIndex(): number {
    return this.currentTrackIdx;
  }

  public getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public async play() {
    this.initAudio();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;

    // Start 16th note step sequencer loop
    const track = this.getCurrentTrack();
    const intervalMs = (60 / track.bpm / 4) * 1000;

    this.timerId = window.setInterval(() => {
      this.tick();
    }, intervalMs);

    // Track elapsed time counter
    this.trackTimerInterval = window.setInterval(() => {
      this.elapsedSeconds++;
      if (this.elapsedSeconds >= this.getCurrentTrack().duration) {
        this.nextTrack();
      } else {
        this.notify();
      }
    }, 1000);

    this.notify();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.trackTimerInterval !== null) {
      clearInterval(this.trackTimerInterval);
      this.trackTimerInterval = null;
    }

    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public nextTrack() {
    const wasPlaying = this.isPlaying;
    this.pause();
    this.currentTrackIdx = (this.currentTrackIdx + 1) % DUMMY_TRACKS.length;
    this.step = 0;
    this.elapsedSeconds = 0;
    if (wasPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  public prevTrack() {
    const wasPlaying = this.isPlaying;
    this.pause();
    this.currentTrackIdx = (this.currentTrackIdx - 1 + DUMMY_TRACKS.length) % DUMMY_TRACKS.length;
    this.step = 0;
    this.elapsedSeconds = 0;
    if (wasPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  public selectTrack(index: number) {
    if (index < 0 || index >= DUMMY_TRACKS.length) return;
    const wasPlaying = this.isPlaying;
    this.pause();
    this.currentTrackIdx = index;
    this.step = 0;
    this.elapsedSeconds = 0;
    if (wasPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  // Sequencer synthesis step
  private tick() {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;

    const trackIdx = this.currentTrackIdx;
    const step16 = this.step % 16;
    const bar = Math.floor(this.step / 16) % 4;
    const now = this.ctx.currentTime;

    if (trackIdx === 0) {
      // Track 1: Outrun 1984 (120 BPM D-minor synthwave drive)
      this.playTrack1Step(step16, bar, now);
    } else if (trackIdx === 1) {
      // Track 2: Sunset Mirage (94 BPM chill vaporwave vibes)
      this.playTrack2Step(step16, bar, now);
    } else {
      // Track 3: Cyber Grid Overdrive (132 BPM electro darksynth)
      this.playTrack3Step(step16, bar, now);
    }

    this.step++;
  }

  // --- TRACK 1: OUTRUN 1984 ---
  private playTrack1Step(step: number, bar: number, now: number) {
    // 80s Kick on beats 0, 4, 8, 12
    if (step % 4 === 0) {
      this.synthKick(now, 130, 45, 0.28, 0.6);
    }

    // Snare / Clap on beats 4, 12
    if (step === 4 || step === 12) {
      this.synthSnare(now, 0.45);
    }

    // Hi-hat on every odd 16th or 8th
    if (step % 2 === 0) {
      this.synthHiHat(now, step % 4 === 2 ? 0.14 : 0.08, step % 4 === 2);
    }

    // Bassline: Dm -> Bb -> F -> C
    const bassNotes = [
      73.42, // D2
      58.27, // Bb1
      87.31, // F2
      65.41, // C2
    ];
    const root = bassNotes[bar];

    // Synthwave 16th rolling bass
    if (step % 2 === 0 || step % 4 === 3) {
      const freq = step % 4 === 3 ? root * 2 : root;
      this.synthAnalogBass(now, freq, 0.12, 'sawtooth', 600);
    }

    // Pad Chords on beat 0 of each bar
    if (step === 0) {
      const chords = [
        [293.66, 349.23, 440.0],       // Dm (D4, F4, A4)
        [233.08, 293.66, 349.23, 466.16], // Bb (Bb3, D4, F4, Bb4)
        [261.63, 329.63, 392.0, 523.25], // F (C4, E4, G4, C5)
        [261.63, 329.63, 392.0],       // C (C4, E4, G4)
      ];
      this.synthPolyPad(now, chords[bar], 1.8, 0.18);
    }

    // Arpeggio Lead
    const arpPatterns = [
      [587.33, 698.46, 880.0, 1046.5, 880.0, 698.46, 587.33, 440.0], // D5, F5, A5, C6, A5...
      [466.16, 587.33, 698.46, 932.33, 698.46, 587.33, 466.16, 349.23],
      [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 392.0],
      [523.25, 659.25, 783.99, 987.77, 783.99, 659.25, 523.25, 440.0],
    ];
    const currentArp = arpPatterns[bar];
    const noteFreq = currentArp[step % currentArp.length];
    if (step % 2 === 1) {
      this.synthLeadArp(now, noteFreq, 0.1, 0.12);
    }
  }

  // --- TRACK 2: SUNSET MIRAGE (Vaporwave Chill) ---
  private playTrack2Step(step: number, bar: number, now: number) {
    // Laid-back beat
    if (step === 0 || step === 10) {
      this.synthKick(now, 100, 40, 0.35, 0.5);
    }
    if (step === 4 || step === 12) {
      this.synthSnare(now, 0.3, true); // softer rimshot/clap
    }
    if (step % 2 === 0) {
      this.synthHiHat(now, 0.06, false);
    }

    // Vapor chords (Fmaj7 - G - Em7 - Am9)
    if (step === 0) {
      const vaporChords = [
        [349.23, 440.0, 523.25, 659.25], // Fmaj7
        [392.0, 493.88, 587.33, 783.99], // G
        [329.63, 392.0, 493.88, 587.33], // Em7
        [440.0, 523.25, 659.25, 783.99, 987.77], // Am9
      ];
      this.synthPolyPad(now, vaporChords[bar], 2.2, 0.22, 'triangle');
    }

    // Funky warm bass
    const bassTones = [87.31, 98.0, 82.41, 110.0];
    if (step === 0 || step === 3 || step === 6 || step === 10 || step === 14) {
      this.synthAnalogBass(now, bassTones[bar] / 2, 0.22, 'triangle', 380);
    }

    // Dreamy bell melody
    const melody = [
      [880.0, 0, 783.99, 0, 659.25, 0, 587.33, 0],
      [0, 659.25, 0, 783.99, 0, 880.0, 0, 1046.5],
      [987.77, 0, 783.99, 0, 659.25, 0, 493.88, 0],
      [523.25, 0, 659.25, 0, 783.99, 0, 880.0, 0],
    ];
    const melNote = melody[bar][step % 8];
    if (melNote > 0) {
      this.synthVaporBell(now, melNote, 0.4, 0.15);
    }
  }

  // --- TRACK 3: CYBER GRID OVERDRIVE (High-energy darksynth) ---
  private playTrack3Step(step: number, bar: number, now: number) {
    // Aggressive four-on-the-floor
    if (step % 4 === 0) {
      this.synthKick(now, 150, 50, 0.22, 0.7);
    }
    if (step === 4 || step === 12) {
      this.synthSnare(now, 0.55);
    }
    // Fast 16th hats
    this.synthHiHat(now, step % 2 === 0 ? 0.1 : 0.05, step % 4 === 2);

    // Dark synth bassline (E1 - G1 - A1 - B1 with octave bounce)
    const roots = [82.41 / 2, 98.0 / 2, 110.0 / 2, 123.47 / 2];
    const bRoot = roots[bar];
    const isOctave = step % 2 === 1;
    this.synthAnalogBass(now, isOctave ? bRoot * 2 : bRoot, 0.09, 'sawtooth', 900);

    // Fast cyberpunk arpeggiator
    const arpCyber = [
      [329.63 * 2, 392.0 * 2, 493.88 * 2, 659.25 * 2],
      [392.0 * 2, 493.88 * 2, 587.33 * 2, 783.99 * 2],
      [440.0 * 2, 523.25 * 2, 659.25 * 2, 880.0 * 2],
      [493.88 * 2, 587.33 * 2, 739.99 * 2, 987.77 * 2],
    ];
    const note = arpCyber[bar][step % 4];
    this.synthLeadArp(now, note, 0.08, 0.16);
  }

  // --- INSTRUMENT SYNTHESIS MODULES ---
  private synthKick(now: number, startFreq: number, endFreq: number, duration: number, gainVol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(gainVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private synthSnare(now: number, vol: number, isSoft: boolean = false) {
    if (!this.ctx || !this.masterGain) return;

    // Noise component
    const dur = isSoft ? 0.12 : 0.2;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isSoft ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(isSoft ? 1500 : 1000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    oscGain.gain.setValueAtTime(vol * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start(now);
    osc.start(now);
    noise.stop(now + dur + 0.01);
    osc.stop(now + 0.09);
  }

  private synthHiHat(now: number, vol: number, isOpen: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const dur = isOpen ? 0.1 : 0.04;

    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + dur + 0.01);
  }

  private synthAnalogBass(now: number, freq: number, dur: number, wave: OscillatorType, cutoff: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(cutoff * 0.4, now + dur);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private synthPolyPad(now: number, freqs: number[], dur: number, vol: number, wave: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.masterGain) return;

    freqs.forEach((f) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = wave;
      // Detune slightly for lush 80s chorus width
      osc.frequency.setValueAtTime(f * (1 + (Math.random() - 0.5) * 0.008), now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.linearRampToValueAtTime(800, now + dur);

      // Smooth envelope attack and release
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol / freqs.length, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + dur + 0.05);
    });
  }

  private synthLeadArp(now: number, freq: number, dur: number, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + dur);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  private synthVaporBell(now: number, freq: number, dur: number, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
}

export const musicEngine = new SynthwaveMusicEngine();
