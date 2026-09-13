/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#152c39",
        brand: {
          50: "#eef9f6", 100: "#d9f0e8", 200: "#afe0d1", 300: "#79c8b5",
          400: "#43aa94", 500: "#258d79", 600: "#147461", 700: "#105b4e",
        },
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      boxShadow: {
        soft: "0 12px 40px rgba(101,74,168,.09)",
        "soft-lg": "0 16px 48px rgba(101,74,168,.13)",
        glow: "0 0 20px rgba(139,92,246,.25)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".6" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "rotate(215deg) translateX(-600px)", opacity: "0" },
        },
        "border-beam": {
          "100%": {
            offsetDistance: "100%",
          },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap, 1.5rem)))" },
        },
        "shimmer-slide": {
          to: {
            transform: "translate(calc(100cqw - 100%), 0)",
          },
        },
        "spin-around": {
          "0%": { transform: "translateZ(0) rotate(0)" },
          "15%, 35%": { transform: "translateZ(0) rotate(90deg)" },
          "65%, 85%": { transform: "translateZ(0) rotate(270deg)" },
          "100%": { transform: "translateZ(0) rotate(360deg)" },
        },
        sparkle: {
          "0%, 100%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
          "50%": { transform: "scale(1) rotate(90deg)", opacity: "1" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp .5s ease-out both",
        shimmer: "shimmer 3s ease-in-out infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        slideInRight: "slideInRight .4s ease-out both",
        float: "float 3s ease-in-out infinite",
        "meteor-effect": "meteor 5s linear infinite",
        "border-beam": "border-beam calc(var(--duration, 15)*1s) infinite linear",
        marquee: "marquee var(--duration, 35s) linear infinite",
        "shimmer-slide": "shimmer-slide var(--speed, 3s) ease-in-out infinite alternate",
        "spin-around": "spin-around calc(var(--speed, 3s) * 2) infinite linear",
        sparkle: "sparkle 800ms ease-in-out forwards",
      },
    },
  },
  plugins: [],
};
