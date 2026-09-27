/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#07111F',
        'background-secondary': '#0A1628',
        surface: '#0B1728',
        'surface-elevated': '#101E32',
        'surface-hover': '#14283F',
        'surface-active': '#1A2F4A',
        border: '#1B3048',
        'border-light': '#243B56',
        'border-hover': '#2F4A6A',
        'text-primary': '#F8FAFC',
        'text-secondary': '#E2E8F0',
        'text-muted': '#94A3B8',
        primary: '#3B82F6',
        'primary-hover': '#60A5FA',
        'primary-active': '#2563EB',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#60A5FA',
      },
    },
  },
  plugins: [],
}