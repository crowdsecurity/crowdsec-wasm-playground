import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), wasm(), topLevelAwait()],
  resolve: {
    alias: [
      {
        find: "src",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
});
