import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#0f1115",
          card: "#171a21",
          border: "#2a2f3a",
          accent: "#3b82f6",
          muted: "#8b93a7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
