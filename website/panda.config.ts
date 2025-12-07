import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: [
    "./components/**/*.{js,jsx,ts,tsx}",
    "./layouts/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./blog/**/*.{js,jsx,ts,tsx}",
  ],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          brand: { value: "#0066cc" },
          border: { value: "#eeeeee" },
          text: { value: "#333333" },
          background: { value: "#ffffff" },
          light: { value: "#ffffff" },
        },
      },
      semanticTokens: {
        colors: {
          // Alpha/Experimental banner colors
          alphaBanner: {
            bg: { value: "{colors.indigo.50}" },
            border: { value: "{colors.indigo.300}" },
            text: { value: "{colors.indigo.800}" },
            icon: { value: "{colors.indigo.600}" },
          },
        },
        spacing: {
          "0": { value: "0px" },
          xs: { value: "5px" },
          sm: { value: "10px" },
          md: { value: "20px" },
          lg: { value: "40px" },
          xl: { value: "50px" },
          "2xl": { value: "60px" },
        },
        sizes: {
          container: { value: "900px" },
        },
        borders: {
          light: { value: "2px solid {colors.border}" },
        },
        radii: {
          sm: { value: "4px" },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
