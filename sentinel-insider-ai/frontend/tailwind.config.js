/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9F8F6',
        surface: '#FFFFFF',
        sidebar: '#F4F3F0',
        primary: {
          DEFAULT: '#E06D53',
          hover: '#D15C43',
          active: '#B84D35',
          text: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#7B9EA8',
          hover: '#6A8C96'
        },
        success: {
          DEFAULT: '#5A7D59',
          background: '#EEF3EE',
          text: '#2C402B'
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#5C5A56',
          disabled: '#A3A19D'
        },
        border: {
          DEFAULT: '#EAE8E2',
          focus: '#E06D53'
        }
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif']
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [],
}
