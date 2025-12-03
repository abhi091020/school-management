/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      /* ------------------------------------------------
         1. Shadows (Claymorphism + Neumorphism)
      ------------------------------------------------ */
      boxShadow: {
        clay: "0px 10px 20px rgba(0, 0, 0, 0.1), 0px 5px 10px rgba(0, 0, 0, 0.05)",
        "clay-lg":
          "0px 15px 30px rgba(0, 0, 0, 0.15), 0px 7px 14px rgba(0, 0, 0, 0.08)",

        neumorphic: "6px 6px 12px #b8b8b8, -6px -6px 12px #ffffff",
        "neumorphic-inset":
          "inset 3px 3px 6px #b8b8b8, inset -3px -3px 6px #ffffff",

        "shadow-inner-neumorphic":
          "5px 5px 10px #b8b8b8, -5px -5px 10px #ffffff",
      },

      /* ------------------------------------------------
         2. Animations (Combined Global + Your Custom)
      ------------------------------------------------ */
      animation: {
        "spin-slow": "spin 1.5s linear infinite",
        "waving-hand": "wave 2s linear infinite",
        "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",

        // Added from your global index.css
        "scale-in": "scale-in 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        blink: "blink 2.5s infinite",
        pulse: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite", // matches your CSS
      },

      /* ------------------------------------------------
         3. Keyframes (All merged & non-conflicting)
      ------------------------------------------------ */
      keyframes: {
        // Existing
        wave: {
          "0%": { transform: "rotate(0deg)" },
          "10%": { transform: "rotate(14deg)" },
          "20%": { transform: "rotate(-8deg)" },
          "30%": { transform: "rotate(14deg)" },
          "40%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(10deg)" },
          "60%, 100%": { transform: "rotate(0deg)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },

        // Added animations from your global CSS
        "scale-in": {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        blink: {
          "0%, 50%, 100%": { opacity: 1 },
          "25%, 75%": { opacity: 0 },
        },
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
};
