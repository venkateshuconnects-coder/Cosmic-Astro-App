export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glass: '0 25px 60px rgba(15,23,42,0.18)',
      },
      backgroundImage: {
        'cosmic-radial': 'radial-gradient(circle at top, rgba(148,163,184,0.25), transparent 40%), radial-gradient(circle at 20% 20%, rgba(129,140,248,0.22), transparent 30%), linear-gradient(180deg, #050816 0%, #0b1226 100%)',
      },
    },
  },
  plugins: [],
};
