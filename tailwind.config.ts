import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        /** Azul estilo botões/links do Instagram */
        primary: {
          50: "#e6f4fe",
          100: "#cce9fd",
          200: "#99d3fb",
          300: "#66bdf9",
          400: "#33a7f7",
          500: "#0095f6",
          600: "#0085d9",
          700: "#0075bd",
          800: "#0064a0",
          900: "#005484",
          950: "#003a5c",
        },
        ig: {
          bg: "#fafafa",
          border: "#dbdbdb",
          muted: "#8e8e8e",
          text: "#262626",
        },
      },
      boxShadow: {
        ig: "0 1px 2px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
