/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101827",
        gov: "#1d5a96",
        success: "#17643b",
      },
      boxShadow: {
        soft: "0 18px 46px rgba(32, 48, 72, 0.12)",
      },
    },
  },
  plugins: [],
};
