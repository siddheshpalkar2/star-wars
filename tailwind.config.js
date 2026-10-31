/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vapor: {
          dark: '#090414',
          night: '#130924',
          deep: '#1e0c38',
          purple: '#2b1055',
          violet: '#7928ca',
          magenta: '#d946ef',
          pink: '#ff2a85',
          hotpink: '#ff007f',
          peach: '#ff7b90',
          yellow: '#ffde59',
          cyan: '#00f0ff',
          neonblue: '#0284c7',
          grid: '#a855f7',
        }
      },
      fontFamily: {
        arcade: ['"Press Start 2P"', 'monospace', 'cursive'],
        retro: ['"VT323"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 10px #ff2a85, 0 0 25px rgba(255, 42, 133, 0.6), 0 0 50px rgba(255, 42, 133, 0.3)',
        'neon-cyan': '0 0 10px #00f0ff, 0 0 25px rgba(0, 240, 255, 0.6), 0 0 50px rgba(0, 240, 255, 0.3)',
        'neon-purple': '0 0 10px #a855f7, 0 0 25px rgba(168, 85, 247, 0.6), 0 0 50px rgba(168, 85, 247, 0.3)',
        'neon-yellow': '0 0 10px #ffde59, 0 0 25px rgba(255, 222, 89, 0.5)',
        'crt-inner': 'inset 0 0 40px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(255, 42, 133, 0.4)',
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'grid-move': 'gridMove 15s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'text-shimmer': 'textShimmer 3s ease infinite',
        'sun-glow': 'sunGlow 4s ease-in-out infinite alternate',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        gridMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 80px' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(255, 42, 133, 0.8))' },
          '50%': { opacity: '0.85', filter: 'drop-shadow(0 0 5px rgba(255, 42, 133, 0.4))' },
        },
        sunGlow: {
          '0%': { filter: 'drop-shadow(0 0 20px #ff007f) drop-shadow(0 0 40px #ff7b90)' },
          '100%': { filter: 'drop-shadow(0 0 35px #ff2a85) drop-shadow(0 0 65px #ffde59)' },
        },
        textShimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
};
