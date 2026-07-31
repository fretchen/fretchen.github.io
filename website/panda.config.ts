import { defineConfig, defineRecipe } from "@pandacss/dev";

/**
 * The site's one button. Every button style lives here as a variant — there is no
 * second place to define one.
 *
 * `visual` is the button's role, not its colour: pick by what the button *does*.
 * States (hover / active / disabled) are handled by the base, so there is never a
 * separate "…Disabled" class.
 */
const button = defineRecipe({
  className: "btn",
  jsx: [],
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "xs",
    borderRadius: "md",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "all 0.2s ease",
    _disabled: {
      cursor: "not-allowed",
      opacity: 0.6,
      transform: "none",
      boxShadow: "none",
      _hover: { transform: "none", boxShadow: "none" },
    },
  },
  variants: {
    visual: {
      // Brand-filled call to action: submit, send, collect, save.
      primary: {
        backgroundColor: "brand",
        color: "light",
        border: "none",
        boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
        _hover: {
          backgroundColor: "brandHover",
          transform: "translateY(-1px)",
          boxShadow: "0 4px 8px rgba(59, 130, 246, 0.3)",
        },
        _active: {
          transform: "translateY(0)",
          boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
        },
        _disabled: { backgroundColor: "gray.300", color: "gray.500" },
      },
      // Bordered and unfilled: the lower-emphasis choice next to a primary.
      secondary: {
        backgroundColor: "transparent",
        color: "gray.700",
        border: "1px solid",
        borderColor: "gray.300",
        _hover: { backgroundColor: "gray.100", borderColor: "gray.400" },
        _active: { backgroundColor: "gray.200" },
      },
      // Text only — inline actions that must not compete with body copy.
      ghost: {
        background: "none",
        border: "none",
        color: "brand",
        boxShadow: "none",
        padding: 0,
        _hover: { opacity: 0.7, textDecoration: "underline", textUnderlineOffset: "3px" },
      },
      // Destructive: reject, delete.
      danger: {
        backgroundColor: "red.600",
        color: "light",
        border: "none",
        _hover: { backgroundColor: "red.700" },
      },
      // Confirming: approve, or a completed support action.
      success: {
        backgroundColor: "green.600",
        color: "light",
        border: "none",
        _hover: { backgroundColor: "green.700" },
      },
      // The orange tip/collect CTA — deliberately warm and distinct from brand blue.
      support: {
        background: "linear-gradient(135deg, {colors.support} 0%, {colors.supportLight} 100%)",
        color: "light",
        border: "none",
        borderRadius: "999px",
        fontWeight: "semibold",
        lineHeight: 1,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        _hover: { transform: "scale(1.05)", boxShadow: "0 2px 8px rgba(255, 107, 53, 0.4)" },
        _disabled: {
          background: "linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%)",
          color: "textMuted",
        },
      },
      // Sits on top of an image or a dark code block: translucent, blurred backdrop.
      overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        color: "light",
        border: "1px solid rgba(255,255,255,0.2)",
        backdropFilter: "blur(4px)",
        _hover: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
        _active: { transform: "scale(0.95)" },
      },
    },
    size: {
      sm: { paddingY: "xs", paddingX: "md", fontSize: "xs" },
      md: { paddingY: "sm", paddingX: "lg", fontSize: "sm" },
    },
    // Round icon button (44px, 48px on touch) — used over NFT images.
    shape: {
      circle: {
        width: "44px",
        height: "44px",
        padding: 0,
        borderRadius: "full",
        fontSize: "lg",
        _hover: { transform: "scale(1.1)" },
        "@media (max-width: 768px)": { width: "48px", height: "48px", fontSize: "xl" },
      },
    },
    // Currently-selected state for filter chips, tabs and network pickers.
    active: {
      true: {},
    },
    // Full width below 640px — for primary actions that anchor a mobile form.
    fullWidthOnMobile: {
      true: { "@media (max-width: 640px)": { width: "100%", justifyContent: "center" } },
    },
    // Spans its container — stacked modal actions, mobile CTAs.
    fullWidth: {
      true: { width: "100%", justifyContent: "center" },
    },
  },
  compoundVariants: [
    {
      visual: "secondary",
      active: true,
      css: {
        backgroundColor: "gray.200",
        borderColor: "gray.600",
        color: "gray.900",
        _hover: { backgroundColor: "gray.300" },
      },
    },
    {
      visual: "primary",
      active: true,
      css: { backgroundColor: "brandHover", borderColor: "brandHover" },
    },
  ],
  defaultVariants: { visual: "primary", size: "md" },
});

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
          brandHover: { value: "#0052a3" },
          border: { value: "#eeeeee" },
          text: { value: "#333333" },
          textMuted: { value: "#666666" },
          background: { value: "#ffffff" },
          light: { value: "#ffffff" },
          // Quiet background for message bubbles and inset panels
          surface: { value: "#f8f9fa" },
          // Inline code / spec-table background (was written as an undefined token with a
          // literal fallback at every call site; 6 of 7 used this value)
          codeBg: { value: "#f9fafb" },
          danger: { value: "#dc3545" },
          // Support/collect button gradient
          support: { value: "#FF6B35" },
          supportLight: { value: "#FF8255" },
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
      recipes: {
        button,
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
