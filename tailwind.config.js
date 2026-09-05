/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          950: "#0a0f1e",
          900: "#0d1630",
          800: "#111d40",
          700: "#1a2d5a",
          600: "#1e3a7a",
          accent: "#3b82f6",
          glow: "#60a5fa",
        },
      },
    },
  },
  plugins: [],
};

