/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080a0f',
          surface: '#111622',
          border: 'rgba(255, 255, 255, 0.1)',
          cyan: '#00f0ff',
          magenta: '#ff007f',
          purple: '#b026ff',
          yellow: '#ffcc00',
          green: '#00ff88',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.5)',
        'neon-magenta': '0 0 15px rgba(255, 0, 127, 0.5)',
        'neon-purple': '0 0 15px rgba(176, 38, 255, 0.5)',
      }
    },
  },
  plugins: [],
}
