/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0066CC',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          500: '#10B981',
        },
        gray: {
          50: '#F9FAFB',
          100: '#f3f4f6',
          800: '#1f2937',
          900: '#111827',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
}