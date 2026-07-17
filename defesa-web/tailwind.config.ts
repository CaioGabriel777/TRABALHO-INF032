import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#fcfcfb",
        page: "#f5f6f8",
        ink: {
          primary: "#0b0b0b",
          secondary: "#52514e",
          muted: "#898781",
        },
        brand: {
          DEFAULT: "#2a78d6",
          dark: "#184f95",
        },
        status: {
          good: "#0ca30c",
          warning: "#fab219",
          critical: "#d03b3b",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,11,11,0.06), 0 1px 12px rgba(11,11,11,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
