/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
        teal: {
          600: '#0d9488',
        },
        // "Wine" — the maroon/burgundy brand scale for the marketing site
        // (Direction C). Shades track Tailwind's positions so utility names read
        // sensibly. Deep, warm, scholarly.
        wine: {
          50:  '#fbf3f4',
          100: '#f6e5e8',
          200: '#eccace',
          300: '#dca3ab',
          400: '#c67480',
          500: '#a94b5b',
          600: '#7a2e39',  // primary
          700: '#67262f',
          800: '#57202a',  // deep panel
          900: '#4a1d25',
          950: '#2a1013',
        },
        // Warm gold accent + cream/ink neutrals for the same world.
        gold: {
          200: '#f4d9a8',
          400: '#d4a94e',
          600: '#b08d4a',
        },
      },
      fontFamily: {
        brand: ['Space Grotesk', 'Inter', '-apple-system', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'Cambria', 'serif'],
        display: ['Spectral', 'Georgia', 'Cambria', 'serif'],
        arabic: ['Amiri Quran', 'Amiri', 'serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}