import type { Config } from "tailwindcss";

/**
 * Institutional design system.
 * - Navy (#1F3A5F) primary, muted gold used sparingly, neutral gray text.
 * - 4–6px corners, 1px borders, very subtle shadows, 8px spacing grid.
 * - One sans-serif for everything; a classic serif is reserved for the hero.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface / background grays (white + light gray).
        paper: {
          DEFAULT: "#F7F8FA",
          50: "#FFFFFF",
          100: "#F7F8FA",
          200: "#F1F3F6",
          300: "#E5E8ED",
        },
        // Primary navy + neutral text scale.
        ink: {
          DEFAULT: "#1F3A5F",
          50: "#F4F7FA",
          100: "#E4EAF1",
          200: "#C7D3E0",
          300: "#9FB2C8",
          400: "#5A6B80",
          500: "#43536A",
          600: "#1F3A5F",
          700: "#182E4C",
          800: "#1F2A37",
          900: "#111827",
        },
        // Muted gold secondary accent (used sparingly).
        pencil: {
          DEFAULT: "#A67C2E",
          100: "#F5EEDC",
          200: "#E7D6A8",
          300: "#C9A961",
          400: "#A67C2E",
          500: "#8A6524",
        },
        // Neutral / semantic state colors.
        eraser: {
          DEFAULT: "#B42318",
          soft: "#FEF3F2",
        },
        leaf: {
          DEFAULT: "#067647",
          soft: "#ECFDF3",
        },
        teal: {
          DEFAULT: "#1F6F6B",
          100: "#E6F2F1",
        },
      },
      fontFamily: {
        // Headings and body share one sans-serif; serif is hero-only.
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.04)",
        lift: "0 4px 12px rgba(16,24,40,0.08)",
        drawer: "-8px 0 24px rgba(16,24,40,0.12)",
      },
      borderRadius: {
        card: "6px",
      },
      keyframes: {
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
