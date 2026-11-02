import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        serif: ["Georgia", "Times New Roman", "Songti SC", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)",
        float: "0 12px 40px rgba(37,99,235,0.14)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        rise: "rise .45s cubic-bezier(.22,1,.36,1) both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
