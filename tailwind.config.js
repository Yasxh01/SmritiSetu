/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#07080c',
          900: '#0c0d13',
          800: '#12141c',
          700: '#1a1d29',
          600: '#232736',
        },
        brand: {
          orange: '#ff5a00',
          amber: '#ff9500',
          glow: '#ff6f00',
          dark: '#c44200'
        }
      },
      boxShadow: {
        'glow-orange': '0 0 25px -3px rgba(255, 90, 0, 0.45)',
        'glow-orange-lg': '0 0 50px -5px rgba(255, 90, 0, 0.55)',
        'glow-amber': '0 0 25px -3px rgba(255, 149, 0, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
