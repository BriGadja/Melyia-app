import fs from "fs";
import path from "path";

console.log("?? Test déploiement simplifié");

const buildDir = "dist/app";
console.log("?? Vérification build dir:", buildDir);

if (fs.existsSync(buildDir)) {
    console.log("? Build dir existe");
    const files = fs.readdirSync(buildDir);
    console.log("?? Fichiers trouvés:", files);
} else {
    console.log("? Build dir manquant");
}

console.log("? Test terminé");
