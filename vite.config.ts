import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal"; // Temporairement désactivé

export default defineConfig(async ({ mode }) => {
  const isApp = mode === "app";
  const currentApp = isApp ? "app" : "landing";

  return {
    plugins: [
      react(),
      // runtimeErrorOverlay() // Temporairement désactivé
    ],
    // ✅ POSTCSS AVEC CONFIG EXPLICITE
    css: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
        ],
      },
    },
    resolve: {
      alias: {
        "@shared": path.resolve(__dirname, "client", "src", "shared"),
        "@": path.resolve(__dirname, "client", "src", currentApp),
        "@landing": path.resolve(__dirname, "client", "src", "landing"),
        "@app": path.resolve(__dirname, "client", "src", "app"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: isApp
        ? path.resolve(__dirname, "dist/app")
        : path.resolve(__dirname, "dist/landing"),
      emptyOutDir: true,
      rollupOptions: {
        // ✅ CORRECTION : Points d'entrée séparés selon le mode
        input: isApp
          ? path.resolve(__dirname, "client", "index-app.html")
          : path.resolve(__dirname, "client", "index.html"),
      },
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      historyApiFallback: {
        rewrites: [
          { from: /^\/login/, to: "/index.html" },
          { from: /^\/register/, to: "/index.html" },
          { from: /^\/dentist/, to: "/index.html" },
          { from: /^\/patient/, to: "/index.html" },
          { from: /^\/admin/, to: "/index.html" },
          { from: /^\/unauthorized/, to: "/index.html" },
        ],
      },
    },
  };
});