/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f0ff",
          100: "#e1e0ff",
          200: "#c4c1ff",
          300: "#a69aff",
          400: "#8974ff",
          500: "#6c4dff",
          600: "#5a3de8",
          700: "#4830bf",
          800: "#362496",
          900: "#24186d",
        },
        surface: {
          dark:  "#0d0d1a",
          card:  "#12122a",
          border:"#1e1e3f",
          muted: "#1a1a35",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #6c4dff 0%, #a855f7 50%, #ec4899 100%)",
        "gradient-dark":  "linear-gradient(180deg, #0d0d1a 0%, #12122a 100%)",
      },
    },
  },
  plugins: [],
};
