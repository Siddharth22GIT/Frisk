/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        noir: {
          950: "#090807",
          900: "#0e0d0c",
          850: "#141312",
          800: "#1b1a18",
          700: "#262421",
          600: "#36332e",
        },
        amber: {
          50:  "#fffaf2",
          100: "#feefdc",
          200: "#fcdbb3",
          300: "#f8c282",
          400: "#f3a854",
          500: "#d99a53",
          600: "#c2833d",
          700: "#9a6229",
          800: "#6c4118",
          900: "#381f09",
        },
        ivory: {
          50:  "#ffffff",
          100: "#faf7f2",
          200: "#f5efe6",
          300: "#ebe4d8",
          400: "#c7beb2",
          500: "#9e9488",
          600: "#6e665d",
          700: "#49433c",
        },
        brand: {
          50:  "#fffaf2",
          100: "#feefdc",
          200: "#fcdbb3",
          300: "#f8c282",
          400: "#f3a854",
          500: "#d99a53",
          600: "#c2833d",
          700: "#9a6229",
          800: "#6c4118",
          900: "#381f09",
        },
        surface: {
          dark:   "#090807",
          card:   "#131211",
          border: "rgba(245, 239, 230, 0.08)",
          muted:  "#1a1917",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      backgroundImage: {
        "gradient-amber": "linear-gradient(135deg, #f7d794 0%, #d99a53 50%, #b87a32 100%)",
        "gradient-dark":  "linear-gradient(180deg, #090807 0%, #131211 100%)",
        "gradient-card":  "linear-gradient(180deg, rgba(24, 22, 20, 0.95) 0%, rgba(15, 14, 13, 0.98) 100%)",
      },
      boxShadow: {
        "glow-amber": "0 0 25px rgba(217, 154, 83, 0.22)",
        "glow-amber-lg": "0 0 45px rgba(217, 154, 83, 0.32)",
        "card-noir": "0 10px 30px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(245, 239, 230, 0.07)",
      },
    },
  },
  plugins: [],
};
