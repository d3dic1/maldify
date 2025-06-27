/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0C22', // Deep dark blue/purple
        primary: '#1E1A3B',    // Slightly lighter dark blue for cards/modals
        accent: '#34D399',      // Vibrant green/cyan for highlights
        'accent-hover': '#2CB989',
        secondary: '#A855F7',   // A secondary pop of purple
        text: '#E0E0E0',        // Light gray for primary text
        'text-secondary': '#A0A0A0', // Muted gray for secondary text
        border: '#2D2A4C',      // Border color
        success: '#10B981',
        warning: '#FBBF24',
        danger: '#F472B6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
      backgroundImage: {
        'abstract-1': "url('/public/assets/abstract-1.svg')",
        'abstract-2': "url('/public/assets/abstract-2.svg')",
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 