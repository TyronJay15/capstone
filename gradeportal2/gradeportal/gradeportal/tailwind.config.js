/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0b2b5a',
        gold: '#d4a017',
        red: '#b71c1c',
        text: '#1f2937',
        bg: '#f7f8fa',
        green900: '#0b3a22',
        green700: '#0b5a36',
        green500: '#5a8c69'
      }
    }
  },
  corePlugins: {
    // Avoid changing your existing CSS baseline (you already have resets).
    preflight: false
  }
};

