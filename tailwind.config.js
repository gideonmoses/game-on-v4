/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light mode
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        // Dark mode colors
        dark: {
          bg: {
            primary: '#111827',   // gray-900
            secondary: '#1f2937', // gray-800
            tertiary: '#374151',  // gray-700
          },
          text: {
            primary: '#f3f4f6',   // gray-100
            secondary: '#9ca3af', // gray-400
            tertiary: '#6b7280',  // gray-500
          },
          border: {
            primary: '#374151',   // gray-700
            secondary: '#4b5563', // gray-600
          }
        }
      }
    },
  },
  plugins: [],
  safelist: [
    'stroke-current',
    'stroke-green-500',
    'stroke-red-500',
    'stroke-amber-500',
    'stroke-gray-400',
    'stroke-gray-600',
    'stroke-gray-300',
  ]
} 