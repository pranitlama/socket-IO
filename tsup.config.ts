import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"], // Entry point for your server
  outDir: "dist", // Output directory for bundled files
  format: "esm", // Bundle formats: ESM (for modern) and CJS (for legacy)
  target: "es2022", // Target Node.js version (adjust as necessary)
  sourcemap: true, // Generates sourcemaps for debugging
  dts: true, // Generates type declaration files
  clean: true, // Cleans the output directory before bundling
  splitting: false, // Whether to enable code splitting (optional)
  minify: false, // Whether to minify the output (set to true for production)
  tsconfig: "tsconfig.json",
});
