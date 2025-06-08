import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  // Déterminer quel app on build
  const isLanding = mode === 'landing';
  const isApp = mode === 'app';
  const isDev = mode === 'development' || !mode || mode === 'dev';

  // Par défaut = landing pour le dev
  const currentApp = isApp ? 'app' : 'landing';

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        // Alias pour le design system partagé
        "@shared": path.resolve(import.meta.dirname, "client", "src", "shared"),

        // Alias pour l'app courante (dynamique selon le mode)
        "@": path.resolve(import.meta.dirname, "client", "src", currentApp),

        // Alias spécifiques
        "@landing": path.resolve(import.meta.dirname, "client", "src", "landing"),
        "@app": path.resolve(import.meta.dirname, "client", "src", "app"),

        // Assets
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: isApp 
        ? path.resolve(import.meta.dirname, "dist/app")
        : path.resolve(import.meta.dirname, "dist/landing"),
      emptyOutDir: true,
      rollupOptions: {
        input: isApp
          ? path.resolve(import.meta.dirname, "client", "src", "app", "main.tsx")
          : path.resolve(import.meta.dirname, "client", "src", "landing", "main.tsx")
      }
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});