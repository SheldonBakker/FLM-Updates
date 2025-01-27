/* eslint-disable prettier/prettier */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      animation: {
        'loading-pulse': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      transitionDuration: {
        4000: '4000ms'
      }
    }
  },
  plugins: []
}
