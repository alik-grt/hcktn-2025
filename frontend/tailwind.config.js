/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        'background-light': '#F9FAFB',
        'background-dark': '#111827',
        'card-light': '#FFFFFF',
        'card-dark': '#1F2937',
        'foreground-light': '#ffffff',
        'foreground-dark': '#182431',
        'muted-light': '#e7edf3',
        'muted-dark': '#2d3a46',
        'text-light-primary': '#111827',
        'text-dark-primary': '#F9FAFB',
        'text-light-secondary': '#6B7280',
        'text-dark-secondary': '#9CA3AF',
        'border-light': '#E5E7EB',
        'border-dark': '#374151',
        success: '#10B981',
        error: '#EF4444',
        danger: '#dc3545',
        info: '#137fec',
        warning: '#F59E0B',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
};
