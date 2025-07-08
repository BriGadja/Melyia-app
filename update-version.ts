import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

// Chemins
const root = process.cwd();
const pkgPath = join(root, "package.json");
const versionFile = join(root, "client", "src", "version.ts");

// Lecture version package.json
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const VERSION = pkg.version || "v0.0.0";

// Date/heure courante (format YYYY-MM-DD HH:mm)
const now = new Date();
const pad = (n: number) => n.toString().padStart(2, "0");
const DEPLOY_DATETIME = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
  now.getDate()
)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

// Contenu du fichier version.ts
const content = `// Version et horodatage de déploiement - Généré automatiquement

export const VERSION = "${VERSION}";
export const DEPLOY_DATETIME = "${DEPLOY_DATETIME}";
`;

writeFileSync(versionFile, content, "utf-8");
console.log(
  `✅ client/src/version.ts mis à jour : ${VERSION} – ${DEPLOY_DATETIME}`
);
