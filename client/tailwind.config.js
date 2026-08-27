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
          500: '#c2410c', // WCAG AA Compliant High-Contrast Orange (5.2:1 against white)
          600: '#9a3412',
          700: '#7c2d12',
          800: '#6c2710',
          900: '#431407',
          950: '#2a0c04',
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
          950: '#020202', // Pure Obsidian Background
          900: '#09090b', // Deep Glass Card Base
          850: '#121215', // Elevated Card Surface
          800: '#18181b', // Interactive / Hover Surface
          750: 'rgba(255, 255, 255, 0.08)', // Ultra-fine 1px border
          700: 'rgba(255, 255, 255, 0.14)', // Strong border
        },
        textToken: {
          primary: '#f5f5f7',
          secondary: '#9ca3af',
          tertiary: '#6b7280',
          inverse: '#09090b',
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
        sans: ['Geist', 'Inter', 'Outfit', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'GeistMono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-orange': '0 0 25px -4px rgba(249, 115, 22, 0.35)',
        'glow-orange-lg': '0 0 45px -6px rgba(249, 115, 22, 0.45)',
        'glow-blue': '0 0 25px -4px rgba(59, 130, 246, 0.35)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 25px -4px rgba(239, 68, 68, 0.35)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
        'glass-light': '0 8px 32px 0 rgba(100, 80, 60, 0.08)',
        'card-token': '0 0 0 1px rgba(255, 255, 255, 0.07), 0 4px 20px -2px rgba(0, 0, 0, 0.5)',
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
