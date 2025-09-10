import { defineConfig } from "vitepress";
import path from "node:path";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",

  title: "Force Graph Lib",
  description: "Force-directed graph visualization library.",

  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../src"),
        "@docs": path.resolve(__dirname, "../docs"),
        "@vitepress": path.resolve(__dirname, "../.vitepress"),
      },
    },
    server: {
      fs: {
        allow: ["../"],
      },
    },
  },

  appearance: false,
  themeConfig: {
    search: {
      provider: "local",
    },

    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Getting Started", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
          { text: "API Index", link: "/api-examples" },
        ],
      },
      {
        text: "Visualization",
        collapsed: false,
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Curves Examples", link: "/curves" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
      { text: "About", link: "/about" },
    ],
  },
});
