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
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff7828', // Core Radiant Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        cream: {
          50: '#fffdfa',
          100: '#faf7f2', // Light Mode Primary Bg
          200: '#f3ede2', // Light Mode Card Surface
          300: '#e7ddce', // Light Mode Border
          400: '#d5c7b3',
          500: '#b2a088',
          600: '#8c7b64',
          700: '#685946',
          800: '#463b2d',
          900: '#261f17',
        },
        surface: {
          950: '#080b10', // Dark Mode Primary Bg
          900: '#0d1117', // Dark Mode Card Surface
          850: '#121822', // Dark Mode Elevated Surface
          800: '#18212e', // Dark Mode Hover Surface
          750: '#202b3d', // Dark Mode Border
          700: '#29374d',
        },
        recovered: {
          light: '#34d399',
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        risk: {
          light: '#f87171',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        hold: {
          light: '#fbbf24',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-orange': '0 0 25px -4px rgba(255, 120, 40, 0.4)',
        'glow-orange-lg': '0 0 40px -6px rgba(255, 120, 40, 0.5)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 25px -4px rgba(239, 68, 68, 0.35)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'glass-light': '0 8px 32px 0 rgba(100, 80, 60, 0.08)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
