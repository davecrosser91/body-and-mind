import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium dark theme base colors
        background: '#0D0D0F',
        surface: {
          DEFAULT: '#1A1A1D',
          light: '#242428',
          lighter: '#2E2E33',
        },

        // Text colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#A1A1AA',
        'text-muted': '#71717A',

        // Body pillar (warm amber)
        body: {
          DEFAULT: '#E8A854',
          light: '#F5C77D',
          dark: '#C78A3A',
          50: '#FEF7EC',
          100: '#FDE9C7',
          glow: 'rgba(232, 168, 84, 0.3)',
        },

        // Mind pillar (cool teal)
        mind: {
          DEFAULT: '#5BCCB3',
          light: '#7EDBC8',
          dark: '#45A894',
          50: '#ECFDF9',
          100: '#C6F7E9',
          glow: 'rgba(91, 204, 179, 0.3)',
        },

        // Ember/streak colors
        ember: {
          dim: 'rgba(232, 168, 84, 0.3)',
          steady: 'rgba(232, 168, 84, 0.6)',
          bright: '#E8A854',
          golden: '#FFD700',
        },

        // Status colors
        success: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
        },
        warning: {
          DEFAULT: '#EAB308',
          light: '#FDE047',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#F87171',
        },

        // Legacy Habitanimal colors (for backward compatibility)
        fitness: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        mindfulness: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        nutrition: {
          50: '#fefce8',
          500: '#eab308',
          600: '#ca8a04',
        },
        sleep: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
        learning: {
          50: '#faf5ff',
          500: '#a855f7',
          600: '#9333ea',
        },
      },

      // Custom box shadows for glow effects
      boxShadow: {
        'body-glow': '0 0 20px rgba(232, 168, 84, 0.3)',
        'body-glow-lg': '0 0 40px rgba(232, 168, 84, 0.4)',
        'mind-glow': '0 0 20px rgba(91, 204, 179, 0.3)',
        'mind-glow-lg': '0 0 40px rgba(91, 204, 179, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },

      // Backdrop blur for glassmorphism
      backdropBlur: {
        xs: '2px',
      },

      // Animation durations
      transitionDuration: {
        '800': '800ms',
        '2000': '2000ms',
        '3000': '3000ms',
      },

      // Custom animations
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },

      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
