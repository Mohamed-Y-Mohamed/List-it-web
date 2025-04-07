/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for your application
        'gray-850': '#1a1d23', // A bit lighter than gray-900 for dark mode content areas
        'gray-750': '#2d3138', // A lighter shade for card backgrounds in dark mode
        
        // Custom orange shades
        'orange-950': '#7c2d12', // Deep orange for dark mode gradients
        
        // List colors
        'list-red': '#FF3B30',
        'list-blue': '#007AFF',
        'list-green': '#34C759',
        'list-yellow': '#FFD60A',
        'list-purple': '#AF52DE',
        'list-pink': '#FF2D55',
        'list-indigo': '#5856D6',
        'list-mint': '#00C7BE',
        'list-orange': '#FF9500',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'custom-light': '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        'custom-dark': '0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    },
  },
  plugins: [],
}