import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      colors: {
        primary: '#0f766e',
        'background-light': '#f7f9fc',
        'background-dark': '#0d1620',
      },
      fontFamily: {
        sans: ['Afacad', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [forms, containerQueries],
};
