/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        ink: {
          950: "#08090d",
          900: "#0c0e14",
          850: "#11141c",
          800: "#161a24",
          700: "#1e2330",
          600: "#2a3040",
        },
        // Role colors (spec: owner purple, moderator orange, user blue, none gray)
        owner: "#a855f7",
        moderator: "#f59e0b",
        regular: "#3b82f6",
        none: "#6b7280",
        brand: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.4), 0 12px 32px -14px rgba(0,0,0,.7)",
        glow: "0 8px 30px -10px rgba(124,58,237,.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "none" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
        ping2: {
          "75%,100%": { transform: "scale(2)", opacity: 0 },
        },
      },
      animation: {
        "fade-up": "fade-up .35s cubic-bezier(.22,1,.36,1) both",
        shimmer: "shimmer 1.6s linear infinite",
        ping2: "ping2 1.6s cubic-bezier(0,0,.2,1) infinite",
      },
    },
  },
  plugins: [],
};
