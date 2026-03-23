import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "site",
  base: "/awesome-codex-subagents/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
