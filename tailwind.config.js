/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores oficiais Olist
        navy: {
          50: '#F0F5FA',
          100: '#E1E8EF',
          500: '#102A43',
          700: '#061D32',
          800: '#001D4A', // Olist deep navy
          900: '#000818', // Olist charcoal
        },
        royal: {
          400: '#5490DF',
          500: '#3E84DF', // Olist vibrant blue
          600: '#0050B3',
        },
        lime: {
          400: '#D6FC51', // Bright neon lime (similar to #D4F733)
          500: '#C2E812',
          600: '#A4C900',
        },
        surface: '#F8F9FA', // Light gray bg
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
