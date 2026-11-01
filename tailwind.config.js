/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        polar: {
          950: '#051426',
          900: '#0a2544',
          800: '#0c315b',
          700: '#12437b',
          600: '#0284c7',
          500: '#0ea5e9',
          400: '#38bdf8',
          100: '#e0f2fe',
          50: '#f0f9ff'
        }
      }
    },
  },
  plugins: [],
}
