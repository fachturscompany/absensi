import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: "node",
    root: path.resolve(__dirname),
    setupFiles: [],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
