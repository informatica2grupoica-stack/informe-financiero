import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#1f4e79",
          600: "#173e61",
          700: "#0f2d47",
          900: "#0a2235",
        },
        ingreso: "#15803d",
        egreso: "#b91c1c",
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
