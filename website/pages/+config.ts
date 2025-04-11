import vikeReact from "vike-react/config";
import type { Config } from "vike/types";
import Layout from "../layouts/LayoutDefault.js";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/Layout
  Layout,

  // https://vike.dev/head-tags
  title: "Notes by fretchen",
  description: "Blog, notepad, whatever you want to call it.",
  prerender: true,
  extends: vikeReact,
} satisfies Config;
