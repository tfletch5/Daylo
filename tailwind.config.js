/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1B2A4A",
        secondary: "#F97316",
      },
    },
  },
  plugins: ["nativewind/tailwind"],
};
