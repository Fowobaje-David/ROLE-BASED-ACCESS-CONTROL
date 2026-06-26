/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        owner: "#7c3aed", // purple
        moderator: "#ea580c", // orange
        regular: "#2563eb", // blue
        none: "#6b7280", // gray
      },
    },
  },
  plugins: [],
};
