export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgb(0 0 0 / 0.6)',
        glow: '0 0 0 1px rgb(255 255 255 / 0.05), 0 20px 50px -20px rgb(2 6 23 / 0.8)',
      },
    },
  },
  plugins: [],
};
