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
        primary: {
          DEFAULT: '#25343F',
          50:  '#EEF1F3',
          100: '#D4DCE1',
          200: '#A9BAC3',
          300: '#7D97A6',
          400: '#527588',
          500: '#25343F',  // main
          600: '#1E2A33',
          700: '#171F26',
          800: '#0F151A',
          900: '#080A0D',
        },
        secondary: {
          DEFAULT: '#FF9B51',
          50:  '#FFF4EC',
          100: '#FFE4CC',
          200: '#FFC999',
          300: '#FFAE66',
          400: '#FF9B51',  // main
          500: '#FF7A1F',
          600: '#E55E00',
          700: '#B24900',
          800: '#7F3400',
          900: '#4C1F00',
        },
        dark: {
          bg:      '#0F1419',
          surface: '#1A2332',
          border:  '#2A3A4A',
          card:    '#1E2D3D',
        },
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card':       '0 4px 24px rgba(37,52,63,0.08)',
        'card-dark':  '0 4px 24px rgba(0,0,0,0.4)',
        'glow':       '0 0 20px rgba(255,155,81,0.3)',
      },
    },
  },
  plugins: [],
};
