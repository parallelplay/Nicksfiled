/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0f11',
        sidebar: '#121518',
        card: '#16191d',
        cardHover: '#1c2026',
        border: '#22272e',
        primaryYellow: '#e2fb42',
        primaryYellowHover: '#d0ea35',
        accentPill: '#22262d',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
