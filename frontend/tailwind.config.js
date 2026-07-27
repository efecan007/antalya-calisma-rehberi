/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9f6',
          100: '#d9f0e6',
          200: '#b3e0cc',
          300: '#83cbae',
          400: '#4cb18d',
          500: '#0f9d78',
          600: '#0c7d60',
          700: '#0a6650',
          800: '#095141',
          900: '#074336',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 8px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        floatHeart: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translateY(-140px) scale(1.2)', opacity: '0' },
        },
      },
      animation: {
        'float-heart': 'floatHeart 2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
