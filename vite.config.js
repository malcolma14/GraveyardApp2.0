import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The /api directory holds Vercel serverless functions and is not part of the
// Vite client build. Vercel auto-detects this Vite app (output: dist) and the
// functions in /api with zero extra config.
export default defineConfig({
  plugins: [react()],
});
