# 🕹️ SYNTHWAVE INVADERS // 1984 VAPOR EDITION

An authentic 1980s Vaporwave Space Invaders arcade game combined with a retro Hi-Fi Synthwave Music Player. Built with React, TypeScript, Tailwind CSS, HTML5 Canvas, and the Web Audio API.

---

## 🌟 Highlights

### 👾 Space Invaders Arcade Game (Center Screen)
- **Authentic Arcade Gameplay**: 5 rows of animated pixel invaders marching horizontally and descending as they bounce off screen boundaries.
- **Dynamic Cadence**: As alien numbers decrease, their march accelerates and the 4-note audio cadence speeds up.
- **Mystery UFO**: Glides across the top of the screen periodically, awarding 50–300 bonus points and granting power-ups.
- **Destructible Defense Bunkers**: 4 defensive shelters constructed from degradable micro-blocks that chip away when hit by player or alien shots.
- **Power-Ups**: Energy Shield, Triple Spread Laser, and Rapid Fire.
- **High-Score Counter**: Displays live current score and all-time High Score, persisted in `localStorage`.
- **Celebration Effects**: Confetti bursts on wave completions and new high score records.
- **Vaporwave CRT Filter**: Authentic scanline overlay and curved CRT bezel flicker with one-click toggles.

### 📻 Retro Walkman Synthwave Music Player
- **Zero-Dependency Web Audio Synthesizer**: 3 procedural 80s synthwave / chillwave tracks generated in-browser with analog-modeled oscillators, filter sweeps, sidechained basslines, and retro gated drums:
  1. **"Outrun 1984 (Neon Highway)"** by *Kavinsky Wave & The Dreamers* (120 BPM)
  2. **"Sunset Mirage (Palms & CRT)"** by *Vapor Dream Corp.* (94 BPM)
  3. **"Cyber Grid Overdrive"** by *Laser Knight 2088* (132 BPM)
- **Real-Time Spectrum Visualizer**: 24-bar audio equalizer bouncing dynamically to the synthesizer's frequency output.
- **Controls**: Play / Pause, Next Track (Skip), Previous Track, Volume slider, Mute, Game SFX Mute, and Tracklist Selector.
- **Animated Spinning Cassette Reels**: Analog cassette tape animation synced to playback state.

---

## 🎮 Controls

| Action | Key / Control |
|---|---|
| **Move Left / Right** | `←` / `→` Arrow Keys or `A` / `D` |
| **Fire Laser** | `Spacebar` or `Z` |
| **Pause / Resume** | `P` Key |
| **Start / Restart** | `Spacebar` or On-screen button |
| **Scanlines Toggle** | On-screen CRT Switch |
| **Mobile / Touch** | On-screen Left/Right pads & Fire button |

---

## 🚀 Running the Project

```bash
cd synthwave-invaders
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
