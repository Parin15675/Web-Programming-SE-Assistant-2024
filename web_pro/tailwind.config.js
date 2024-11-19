/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',  // This will scan all files in the `src` directory, including subdirectories
    './public/index.html',         // Include your HTML file if needed
  ],
  theme: {
    extend: {
      colors: {
        customBlue: '#1a2a49', // Dark Blue
        customGray: '#e5e5e0', // Light Gray
      },
    },
  },
  plugins: [],
}
