/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#f0ad1a",
          50: "#fef9ed",
          100: "#fdf1d1",
          200: "#fbe3a8",
          300: "#f8ce74",
          400: "#f4b33e",
          500: "#f0ad1a",
          600: "#d48b0f",
          700: "#b06a0f",
          800: "#8f5314",
          900: "#764414",
        },
        accent: {
          DEFAULT: "#1a3a52",
          light: "#2d5573",
          dark: "#0f2333",
        },
      },
    },
  },
  plugins: [],
};
