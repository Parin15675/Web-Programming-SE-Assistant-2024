/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Include all JS/JSX/TS/TSX files in `src`
    './public/index.html',        // Include the HTML file for Tailwind utility classes
  ],
  theme: {
    extend: {
      colors: {
        customBlue: '#1a2a49', // Dark Blue for backgrounds or headings
        customGray: '#e5e5e0', // Light Gray for neutral sections
        subjectblue: '#2a3f68', // Blue for specific subject-related sections
        coursebg: '#2e426a',   // Background for course sections
        navy: {
          500: "#2b3a67", // Mid-tone navy for lighter sections
          600: "#223a5e", // Medium navy for active UI
          800: "#1a2a4a", // Dark navy for backgrounds
          900: "#101a34", // Very dark navy for footer or contrast
        },
      },
    },
  },
  plugins: [],
};
