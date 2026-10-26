/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8edf2',
          100: '#c5d0db',
          200: '#9fb1c2',
          300: '#7991a9',
          400: '#5c7896',
          500: '#3f5f83',
          600: '#2d4d6e',
          700: '#1c3a59',
          800: '#0e2940',
          900: '#0B1F2A',
          950: '#071420',
        },
        emerald: {
          DEFAULT: '#0F9D74',
          50: '#e6f7f2',
          100: '#c0eadc',
          200: '#96dcc4',
          300: '#6bceab',
          400: '#3fc193',
          500: '#0F9D74',
          600: '#0d8863',
          700: '#0a7252',
          800: '#085c42',
          900: '#054531',
        },
        amber: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
        },
        surface: '#F6F8FA',
        card: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
        telugu: ['Noto Sans Telugu', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08)',
        nav: '0 -1px 12px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
      },
    },
  },
  plugins: [],
};
