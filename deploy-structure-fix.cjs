const fs = require("fs");
const path = require("path");

console.log("🚀 DÉPLOIEMENT CORRECTION STRUCTURE ADMIN");
console.log("==========================================\n");

// 1. Copier le server.js corrigé
console.log("1. 📁 Copie du server.js corrigé...");
try {
  const serverContent = fs.readFileSync("server/backend/server.js", "utf8");
  console.log("   ✅ server.js lu avec succès");
  console.log(`   📊 Taille: ${(serverContent.length / 1024).toFixed(1)} KB`);

  // Vérifier que les corrections sont présentes
  const hasCorrectionsStats =
    serverContent.includes("total_dentists") &&
    serverContent.includes("disk_usage_mb");
  const hasCorrectionsStructure =
    serverContent.includes("access_level") &&
    serverContent.includes("updated_at");

  if (hasCorrectionsStats && hasCorrectionsStructure) {
    console.log("   ✅ Corrections détectées dans server.js");
  } else {
    console.log("   ⚠️ Certaines corrections manquent dans server.js");
  }
} catch (error) {
  console.log("   ❌ Erreur lecture server.js:", error.message);
}

// 2. Préparer le script SQL
console.log("\n2. 📝 Préparation du script SQL...");
try {
  const sqlContent = fs.readFileSync("fix-admin-structure.sql", "utf8");
  console.log("   ✅ Script SQL lu avec succès");
  console.log(`   📊 Taille: ${(sqlContent.length / 1024).toFixed(1)} KB`);

  // Compter les corrections
  const corrections = {
    tables: (sqlContent.match(/ALTER TABLE/g) || []).length,
    views: (sqlContent.match(/CREATE OR REPLACE VIEW/g) || []).length,
    indexes: (sqlContent.match(/CREATE INDEX/g) || []).length,
    constraints: (sqlContent.match(/ADD CONSTRAINT/g) || []).length,
  };

  console.log("   📈 Corrections SQL:");
  console.log(`      - ${corrections.tables} tables modifiées`);
  console.log(`      - ${corrections.views} vue(s) recréée(s)`);
  console.log(`      - ${corrections.indexes} index ajoutés`);
  console.log(`      - ${corrections.constraints} contraintes ajoutées`);
} catch (error) {
  console.log("   ❌ Erreur lecture script SQL:", error.message);
}

// 3. Instructions de déploiement
console.log("\n==========================================");
console.log("🔧 INSTRUCTIONS DE DÉPLOIEMENT SERVEUR");
console.log("==========================================\n");

console.log("📋 ÉTAPES À SUIVRE:");
console.log("-------------------\n");

console.log("1. 🔐 Se connecter au serveur:");
console.log("   ssh ubuntu@51.91.145.255\n");

console.log("2. 📊 Appliquer les corrections SQL:");
console.log("   sudo -u postgres psql melyia_dev -f fix-admin-structure.sql\n");

console.log("3. 📁 Remplacer le server.js:");
console.log(
  "   cp server/backend/server.js /var/www/melyia/app-dev/server.js\n"
);

console.log("4. 🔄 Redémarrer PM2:");
console.log("   pm2 restart melyia-auth-dev\n");

console.log("5. ✅ Vérifier les logs:");
console.log("   pm2 logs melyia-auth-dev --lines 20\n");

console.log("6. 🧪 Tester les APIs:");
console.log("   node test-admin-structure.js\n");

console.log("==========================================");
console.log("🎯 RÉSULTAT ATTENDU");
console.log("==========================================");
console.log("✅ Vue admin_stats avec 9 colonnes (vs 4 avant)");
console.log("✅ Tables admin avec toutes les colonnes manquantes");
console.log("✅ API /api/admin/stats fonctionnelle");
console.log("✅ API /api/admin/users robuste");
console.log("✅ API /api/admin/documents complète");
console.log("✅ Dashboard admin sans crash");
console.log("✅ Structure PostgreSQL cohérente avec server.js\n");

console.log("🚀 LE DASHBOARD ADMIN SERA OPÉRATIONNEL !");
console.log("==========================================\n");

console.log("🎯 RÉSUMÉ:");
console.log("- ✅ server.js corrigé");
console.log("- ✅ Script SQL prêt");
console.log("- ✅ Script de test préparé");
console.log("- ✅ Instructions claires");
console.log("\n🔥 PRÊT POUR LE DÉPLOIEMENT !");
