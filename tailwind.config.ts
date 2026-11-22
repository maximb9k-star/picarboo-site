import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0c0d0f', 800: '#15171a', 700: '#1d2024', 600: '#2a2e33', 500: '#454b52' },
        lime: { DEFAULT: '#b5e04b', 400: '#c6ea6f', 600: '#9cc63a', 700: '#7da12a' },
        paper: '#f3f4f1',
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        brand: ['Michroma', '"Manrope Variable"', 'sans-serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(12,13,15,.06), 0 8px 24px rgba(12,13,15,.06)' },
    },
  },
  plugins: [],
};

export default config;
