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
        primary: {
          50: '#fbf7ee',
          100: '#f5edd7',
          200: '#ebd9ae',
          300: '#dec07f',
          400: '#d0a656',
          500: '#c28c38',
          600: '#a6702c',
          700: '#855325',
          800: '#6d4323',
          900: '#5c3920',
          950: '#341d0f',
        },
        catholic: {
          burgundy: '#800020',
          gold: '#D4AF37',
          marian: '#0c1524',
          olive: '#152016',
          parchment: '#FBF8F1',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        book: ['"Palatino Linotype"', 'Book Antiqua', 'Palatino', 'serif'],
      }
    },
  },
  plugins: [],
}
