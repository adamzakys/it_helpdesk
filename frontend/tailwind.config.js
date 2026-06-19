/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet warna kustom untuk Berlian Manyar Sejahtera berdasarkan #2596be
        berlian: {
          50: '#f0f9fc',
          100: '#e0f2f8',
          200: '#b9e6f3',
          300: '#7dd0ea',
          400: '#40a9cf',
          500: '#2596be', // Warna utama perwakilan perusahaan
          600: '#1d7fa2',
          700: '#196783',
          800: '#16556e',
          900: '#17475b',
          950: '#092531',
        }
      }
    },
  },
  plugins: [],
}
