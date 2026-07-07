/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9f6',
          100: '#d9f0e6',
          500: '#0f9d78',
          600: '#0c7d60',
          700: '#0a6650',
        },
      },
    },
  },
  plugins: [],
};
