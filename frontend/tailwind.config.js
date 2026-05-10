/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101827",
        gov: "#1a4f87",
        success: "#17643b",
        danger: "#b91c1c",
        warning: "#b45309",
      },
      boxShadow: {
        soft: "0 18px 46px rgba(32, 48, 72, 0.12)",
      },
    },
  },
  plugins: [],
};
