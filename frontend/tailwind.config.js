module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // blue theme
        card: '#f3f6fb',
        available: '#22c55e', // green
        booked: '#facc15' // yellow
      }
    }
  },
  plugins: [],
};
