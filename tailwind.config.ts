import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          "50": "#ffffff",
          "100": "#fbf9f4",
          "200": "#f4efe4",
          "300": "#eae2d2",
          "400": "#d9ccb6",
          "500": "#b5a386",
          "800": "#3d3425",
          "900": "#221c13",
        } as Record<string, string>,
        masthead: {
          red: "#b91c1c",
          darkred: "#881337",
          crimson: "#991b1b",
          gold: "#b45309",
          navy: "#1e3a8a",
          dark: "#0f172a",
        },
        ink: {
          black: "#111827",
          charcoal: "#1f2937",
          muted: "#4b5563",
          light: "#6b7280",
        },
      },
      fontFamily: {
        devanagari: ["var(--font-noto-serif-devanagari)", "serif"],
        display: ["var(--font-rozha)", "serif"],
        sahitya: ["var(--font-sahitya)", "serif"],
        sans: ["var(--font-poppins)", "sans-serif"],
        yantra: ["var(--font-yantramanav)", "sans-serif"],
      },
      boxShadow: {
        paper: "0 4px 20px -2px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.08)",
        "paper-lg": "0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.1)",
        newspaper: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
      },
    },
  },
  plugins: [],
};

export default config;

