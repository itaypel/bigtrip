/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        void: '#05070d',
        night: '#0b1120',
        panel: '#0f172a',
        edge: '#1e293b',
        neon: '#00ff9c',
        cyber: '#22d3ee',
        muted: '#64748b',
      },
    },
  },
  plugins: [],
};
