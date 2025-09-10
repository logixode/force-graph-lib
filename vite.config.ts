import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const isLibBuild = process.env.VITE_BUILD_TARGET === "lib";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  console.log("command", command);

  return {
    plugins: [
      dts({
        insertTypesEntry: true,
        rollupTypes: true,
        tsconfigPath: "./tsconfig.lib.json",
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@docs": path.resolve(__dirname, "./docs"),
      },
    },
    build: {
      minify: "esbuild",
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"),
        name: "ForceGraphLib",
        formats: ["es", "umd"],
      },
      rollupOptions: {
        // Make sure to externalize dependencies that shouldn't be bundled
        external: ["vue", "force-graph", "d3"],
        output: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            "force-graph": "ForceGraph",
            d3: "d3",
            vue: "Vue",
          },
        },
      },
    },
  };
});
