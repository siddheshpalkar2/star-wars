export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: string;
  duration: number; // in seconds
  bpm: number;
  genre: string;
  coverGradient: string;
  mood: string;
}

export interface MusicPlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  sfxVolume: number;
  sfxMuted: boolean;
}
