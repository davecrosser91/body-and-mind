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
        // Habitanimal colors
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
    },
  },
  plugins: [],
}

export default config
