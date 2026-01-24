/** @type {import('tailwindcss').Config} */
export default {
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
        }
      },
      fontFamily: {
        brand: ['Space Grotesk', 'Inter', '-apple-system', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'Cambria', 'serif'],
        arabic: ['Amiri Quran', 'serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}