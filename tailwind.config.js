/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#eff6ff', 100:'#dbeafe', 500:'#3b82f6', 600:'#1a4f9d', 700:'#0f2544', DEFAULT:'#0f2544' },
        accent:  { DEFAULT:'#f97316', hover:'#ea6c00' },
      },
      fontFamily: { sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
