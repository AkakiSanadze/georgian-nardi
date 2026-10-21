/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          dark: '#1e110a',
          rim: '#2c1810',
          felt: '#3b2214',
          walnut: '#4a2c1d',
          amber: '#844d28',
          lightWood: '#c89d70',
          pointLight: '#d2b48c',
          pointDark: '#6b3e26',
        },
        checker: {
          white: '#f7f2ea',
          whiteRim: '#ded4c3',
          black: '#1a1818',
          blackRim: '#383333',
          gold: '#d4af37'
        }
      },
      boxShadow: {
        'board-inner': 'inset 0 4px 20px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(0, 0, 0, 0.6)',
        'checker': '0 4px 8px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
        'checker-dark': '0 4px 8px rgba(0, 0, 0, 0.7), inset 0 2px 3px rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
