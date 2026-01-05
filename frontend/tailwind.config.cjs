module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-green': '#147A43',
        'brand-green-600': '#1f9a59',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },
      keyframes: {
        'auth-enter': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.995)' },
          '60%': { opacity: '1', transform: 'translateY(-4px) scale(1.002)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'auth-enter': 'auth-enter 380ms ease-out forwards',
      },
    },
  },
  plugins: [],
};