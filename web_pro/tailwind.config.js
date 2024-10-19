/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',  // This will scan all files in the `src` directory, including subdirectories
    './public/index.html',         // Include your HTML file if needed
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
