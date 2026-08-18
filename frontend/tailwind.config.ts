import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class", // toggle by adding/removing `dark` on <html>
  theme: {
    extend: {
      colors: {
        // brand
        brand: {
          DEFAULT: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          dark: "var(--brand-third)",
          accent: "var(--brand-accent)",
          "accent-soft": "var(--brand-accent-2)",
          light: "var(--brand-light)",
          cream: "var(--brand-cream)",
        },
        // backgrounds → bg-bg, bg-surface, bg-surface-2
        bg: {
          DEFAULT: "var(--bg-default)",
          surface: "var(--bg-surface)",
          "surface-2": "var(--bg-surface-2)",
        },
        // text → text-text, text-text-secondary, text-text-placeholder
        text: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          placeholder: "var(--text-placeholder)",
        },
        // borders → border-line
        line: "var(--border-default)",
        // status → text-success, bg-success-bg
        success: {
          DEFAULT: "var(--status-success)",
          bg: "var(--status-success-bg)",
        },
      },
      fontFamily: {
        sans: ["Inter", "Koh Santepheap", "system-ui", "sans-serif"],
        khmer: ["Koh Santepheap", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
