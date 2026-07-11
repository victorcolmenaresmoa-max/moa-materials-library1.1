/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#FBFAF8',
        ink: '#37352F',
        muted: '#787774',
        line: '#EAE9E5',
        card: '#FFFFFF',
        brand: {
          50: '#F4F1FE',
          100: '#E7E1FD',
          400: '#A594F9',
          500: '#8B7BF0',
          600: '#7263D9',
        },
        pastel: {
          rose: { bg: '#FCE4EC', text: '#9C4668' },
          peach: { bg: '#FFE8D6', text: '#B5651D' },
          lemon: { bg: '#FFF6CC', text: '#8A7317' },
          mint: { bg: '#DFF3E3', text: '#2E7D4F' },
          sky: { bg: '#DCEEFB', text: '#2B6CA3' },
          lilac: { bg: '#EDE2FE', text: '#6B4FA0' },
          sand: { bg: '#F1E9DD', text: '#7A6650' },
          gray: { bg: '#EDECEA', text: '#5F5D58' },
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(55,53,47,0.06), 0 2px 8px rgba(55,53,47,0.04)',
        card: '0 1px 3px rgba(55,53,47,0.08)',
      },
    },
  },
  plugins: [],
}
