import fs from "fs";
import path from "path";

console.log("?? Test d�ploiement simplifi�");

const buildDir = "dist/app";
console.log("?? V�rification build dir:", buildDir);

if (fs.existsSync(buildDir)) {
    console.log("? Build dir existe");
    const files = fs.readdirSync(buildDir);
    console.log("?? Fichiers trouv�s:", files);
} else {
    console.log("? Build dir manquant");
}

console.log("? Test termin�");
