import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Cascadia Code"', '"Fira Code"', "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      colors: {
        term: {
          bg: "#05070a",
          panel: "#0c1310",
          border: "#1c2620",
          green: "#39ff6a",
          "green-dim": "#6b8f78",
          amber: "#ffb703",
          red: "#ff4d4f",
          cyan: "#4dd0e1",
        },
      },
    },
  },
  plugins: [],
};

export default config;
