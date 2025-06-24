import fs from "fs";
import path from "path";
import { execSync } from "child_process";

console.log("🔄 Force rebuild complet...");

// Supprimer tous les caches
const cacheDirs = [
  "node_modules/.vite",
  "node_modules/.cache",
  "dist",
  ".vite",
];

cacheDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`🗑️ Suppression ${dir}...`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

console.log("🏗️ Rebuild avec cache vide...");
execSync("npm run build:app", { stdio: "inherit" });

console.log("🚀 Deploy...");
execSync("node deploy-to-app-dev.js", { stdio: "inherit" });

console.log("✅ Rebuild complet terminé !");
