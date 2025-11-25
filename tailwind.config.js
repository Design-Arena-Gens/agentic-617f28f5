/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        sans: ["Inter", "sans-serif"]
      },
      colors: {
        primary: {
          DEFAULT: "#7C3AED",
          foreground: "#F5F3FF"
        },
        secondary: {
          DEFAULT: "#0EA5E9",
          foreground: "#ECFEFF"
        },
        surface: "#111827",
        accent: "#22D3EE"
      }
    }
  },
  plugins: []
};
