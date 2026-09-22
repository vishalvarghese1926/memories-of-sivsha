import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07070d",
        foreground: "#f4edea",
        romantic: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#4c0519",
        },
        lavender: {
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          900: "#3b0764",
          950: "#1a042e",
        },
        gold: {
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
        },
        deepnight: "#090913",
        deepNight: "#07050d",
        starveil: "rgba(18, 16, 32, 0.75)",
        cyanPrimary: "#22d3ee",
        cyanGlow: "rgba(34, 211, 238, 0.35)",
        cyanDeep: "#0e3a47",
        softBlue: "#93c5fd",
        moonlight: "#e0f2fe",
        warmIvory: "#fefcf8",
        roseAccent: "#fb7185",
        lavenderMist: "#e9d5ff",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", filter: "drop-shadow(0 0 15px rgba(244, 63, 94, 0.4))" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 25px rgba(244, 63, 94, 0.8))" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "romantic-glow": "0 0 40px -10px rgba(244, 63, 94, 0.35)",
        "gold-glow": "0 0 30px -5px rgba(234, 179, 8, 0.3)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
    },
  },
  plugins: [],
};

export default config;
