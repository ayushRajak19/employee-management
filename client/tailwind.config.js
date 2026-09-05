/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#302947",
        brand: {
          50: "#f8f5ff", 100: "#efe8ff", 200: "#dfd2ff", 300: "#cbb8ff",
          400: "#b39af7", 500: "#9b7be8", 600: "#8062c9", 700: "#654aa8",
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
      },
      animation: {
        fadeInUp: "fadeInUp .5s ease-out both",
        shimmer: "shimmer 3s ease-in-out infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        slideInRight: "slideInRight .4s ease-out both",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
