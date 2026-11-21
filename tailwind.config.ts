import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ghar-Kharcha
        gk: {
          primary: '#E07A2F',
          bg: '#FFF6EA',
          surface: '#FFFFFF',
          text: '#3B2A1A',
          accent: '#2E7D4F',
        },
        // CGPA Buddy
        cgpa: {
          primary: '#3F6FD8',
          bg: '#F2F6FF',
          surface: '#FFFFFF',
          text: '#1B2440',
          accent: '#F2A93B',
        },
        // My Cycle
        cycle: {
          primary: '#E88AA6',
          bg: '#FFF3F7',
          surface: '#FFFFFF',
          text: '#4A2B38',
          accent: '#8FB8E8',
        },
        // Vault (real)
        vault: {
          primary: '#2F6F73',
          bg: '#F4F8F8',
          surface: '#FFFFFF',
          text: '#16302F',
          accent: '#E0A030',
        },
        // Fake Vault
        fake: {
          primary: '#6B7280',
          bg: '#FAFAF7',
          surface: '#FFFFFF',
          text: '#222222',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
        heading: ['Poppins', 'Noto Sans Devanagari', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
} satisfies Config;
