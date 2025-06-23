import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig(async ({ mode }) => {
  const isApp = mode === "app";
  const currentApp = isApp ? "app" : "landing";

  return {
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
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
        input: path.resolve(
          __dirname,
          "client",
          isApp ? "index-app.html" : "index-landing.html"
        ),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: "https://app-dev.melyia.com",
          changeOrigin: true,
          secure: true,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("🔴 Erreur proxy:", err.message);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "🚀 Proxy API:",
                req.method,
                req.url,
                "→",
                proxyReq.path
              );
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log("✅ Réponse:", req.url, "→", proxyRes.statusCode);
            });
          },
        },
      },
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
          { from: /^\/unauthorized/, to: "/index.html" },
        ],
      },
    },
  };
});
