import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'fw-bg': '#1A1A1A',
        'fw-surface': '#3D3F47',
        'fw-text': '#EDEDEE',
        'fw-accent': '#5C8A2E',
        'fw-hover': '#3D6B1E',
      },
    },
  },
  plugins: [],
};
export default config;
