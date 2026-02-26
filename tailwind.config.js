/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#FFFFFF',
          50:  '#E8E5DC',   // border
          100: '#F5F4ED',   // secondary bg / input
          200: '#FAF9F5',   // page bg
          300: '#FFFFFF',   // white (sticky headers)
        },
        brand: {
          DEFAULT: '#C96442',
          50:  '#FDF0EB',
          100: '#FAD9CC',
          200: '#F5B5A0',
          300: '#EE8E73',
          400: '#D97455',
          500: '#C96442',   // terracotta (primary accent)
          600: '#A14A2F',   // dark terracotta (hover)
          700: '#7D3622',
          800: '#5C2519',
          900: '#3D180F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
