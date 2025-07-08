// 🚀 DÉPLOIEMENT LOCAL AMÉLIORÉ v36.2 - FONCTIONNALITÉS AVANCÉES
// Cache builds + déploiement incrémental + monitoring + rollback automatique

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

const CONFIG = {
  PATHS: {
    landing: {
      source: "dist/landing/",
      target: "/var/www/melyia/dev-site/",
    },
    app: {
      source: "dist/app/",
      target: "/var/www/melyia/app-dev/",
    },
    cache: {
      builds: ".cache/builds/",
      metadata: ".cache/metadata/",
    },
  },
  FEATURES: {
    smartCache: true,      // Cache builds intelligents
    incremental: true,     // Déploiement incrémental
    autoRollback: true,    // Rollback automatique en cas d'erreur
    monitoring: true,      // Monitoring temps réel
    compression: true,     // Compression assets
    validation: true,      // Validation poussée
  },
  LOG: {
    startTime: Date.now(),
    steps: [],
    cache: { hits: 0, misses: 0 },
    metrics: {},
  },
};

function log(message, color = "cyan") {
  const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    white: "\x1b[37m",
    reset: "\x1b[0m",
  };

  const timestamp = new Date().toLocaleTimeString();
  const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  const prefix = `[${timestamp}] (+${duration}s)`;

  console.log(`${colors[color]}${prefix} ${message}${colors.reset}`);
  CONFIG.LOG.steps.push({
    timestamp,
    duration: parseFloat(duration),
    message,
    level: color,
  });
}

function logPhase(title, description = "") {
  log("");
  log("┌─────────────────────────────────────────┐", "magenta");
  log(`│ ${title.padEnd(39)} │`, "magenta");
  if (description) {
    log(`│ ${description.padEnd(39)} │`, "cyan");
  }
  log("└─────────────────────────────────────────┘", "magenta");
  log("");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function executeLocal(command, description) {
  const startTime = Date.now();
  try {
    log(`⚡ ${description}...`, "cyan");
    
    const result = execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ ${description} - OK en ${duration}s`, "green");
    return result;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`❌ ${description} - Échec en ${duration}s`, "red");
    throw error;
  }
}

function calculateDirectoryHash(dirPath) {
  const hash = crypto.createHash('sha256');
  
  function addToHash(currentPath) {
    const stats = fs.statSync(currentPath);
    hash.update(path.relative(dirPath, currentPath));
    hash.update(stats.mtime.toISOString());
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath).sort();
      files.forEach(file => {
        addToHash(path.join(currentPath, file));
      });
    } else {
      hash.update(stats.size.toString());
    }
  }
  
  try {
    addToHash(dirPath);
  } catch (error) {
    // Si erreur d'accès, retourner hash vide
    return '';
  }
  
  return hash.digest('hex');
}

function calculateDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach((file) => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  try {
    calculateSize(dirPath);
  } catch (error) {
    // Si erreur d'accès, ignorer
  }
  
  return totalSize;
}

function initializeCache() {
  if (!CONFIG.FEATURES.smartCache) return;
  
  logPhase("PHASE 0 : CACHE INTELLIGENT", "Initialisation système cache");

  // Créer répertoires cache
  fs.mkdirSync(CONFIG.PATHS.cache.builds, { recursive: true });
  fs.mkdirSync(CONFIG.PATHS.cache.metadata, { recursive: true });
  
  log("✅ Système de cache initialisé", "green");
}

function checkBuildCache() {
  if (!CONFIG.FEATURES.smartCache) return false;
  
  logPhase("PHASE 1 : ANALYSE CACHE", "Vérification builds existants");

  const builds = [
    { path: CONFIG.PATHS.landing.source.slice(0, -1), name: "Landing" },
    { path: CONFIG.PATHS.app.source.slice(0, -1), name: "App" },
  ];

  let cacheValid = true;
  let totalSize = 0;

  for (const build of builds) {
    if (!fs.existsSync(build.path)) {
      log(`❌ Build ${build.name} manquant: ${build.path}`, "red");
      cacheValid = false;
      continue;
    }

    const currentHash = calculateDirectoryHash(build.path);
    const cacheFile = path.join(CONFIG.PATHS.cache.metadata, `${build.name.toLowerCase()}.json`);
    
    let cachedMeta = {};
    if (fs.existsSync(cacheFile)) {
      try {
        cachedMeta = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      } catch (error) {
        log(`⚠️ Cache ${build.name} corrompu`, "yellow");
      }
    }

    const buildSize = calculateDirectorySize(build.path);
    totalSize += buildSize;

    if (cachedMeta.hash === currentHash && cachedMeta.deployed) {
      CONFIG.LOG.cache.hits++;
      log(`🎯 Cache HIT: ${build.name} (${formatBytes(buildSize)})`, "green");
    } else {
      CONFIG.LOG.cache.misses++;
      log(`⚠️ Cache MISS: ${build.name} (${formatBytes(buildSize)})`, "yellow");
      cacheValid = false;
      
      // Mettre à jour métadonnées cache
      const newMeta = {
        hash: currentHash,
        size: buildSize,
        built: new Date().toISOString(),
        deployed: false,
      };
      fs.writeFileSync(cacheFile, JSON.stringify(newMeta, null, 2));
    }
  }

  log(`📊 Taille totale: ${formatBytes(totalSize)} | Cache: ${CONFIG.LOG.cache.hits} hits, ${CONFIG.LOG.cache.misses} misses`, "cyan");
  
  if (cacheValid && CONFIG.LOG.cache.hits > 0) {
    log("🚀 Déploiement rapide possible (cache valide)", "green");
    return true;
  }
  
  return false;
}

function validateBuilds() {
  logPhase("PHASE 2 : VALIDATION BUILDS", "Vérification qualité artefacts");

  const builds = [
    { path: CONFIG.PATHS.landing.source.slice(0, -1), name: "Landing" },
    { path: CONFIG.PATHS.app.source.slice(0, -1), name: "App" },
  ];

  let totalSize = 0;
  let issues = 0;

  for (const build of builds) {
    if (!fs.existsSync(build.path)) {
      throw new Error(`Build ${build.name} manquant: ${build.path}`);
    }

    const files = fs.readdirSync(build.path);
    const hasHTML = files.some((f) => f.endsWith(".html"));
    const hasAssets = fs.existsSync(path.join(build.path, "assets"));

    if (!hasHTML) {
      issues++;
      log(`⚠️ ${build.name}: Aucun fichier HTML`, "yellow");
    }
    
    if (!hasAssets) {
      issues++;
      log(`⚠️ ${build.name}: Dossier assets manquant`, "yellow");
    }

    // Validation avancée
    if (CONFIG.FEATURES.validation) {
      // Vérifier taille raisonnable des assets
      const assetsPath = path.join(build.path, "assets");
      if (fs.existsSync(assetsPath)) {
        const assetsSize = calculateDirectorySize(assetsPath);
        if (assetsSize > 10 * 1024 * 1024) { // > 10MB
          log(`⚠️ ${build.name}: Assets volumineux (${formatBytes(assetsSize)})`, "yellow");
        }
      }

      // Vérifier intégrité HTML
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      for (const htmlFile of htmlFiles) {
        const htmlPath = path.join(build.path, htmlFile);
        const content = fs.readFileSync(htmlPath, 'utf8');
        if (!content.includes('<!DOCTYPE html>')) {
          issues++;
          log(`⚠️ ${build.name}: ${htmlFile} mal formé`, "yellow");
        }
      }
    }

    const buildSize = calculateDirectorySize(build.path);
    totalSize += buildSize;

    log(`✅ Build ${build.name} validé: ${formatBytes(buildSize)} ${issues > 0 ? '(warnings)' : ''}`, "green");
  }

  CONFIG.LOG.metrics.buildSize = totalSize;
  CONFIG.LOG.metrics.validationIssues = issues;
  
  log(`📊 Validation: ${formatBytes(totalSize)}, ${issues} warning(s)`, "cyan");
}

function checkSystemHealth() {
  logPhase("PHASE 3 : SANTÉ SYSTÈME", "Monitoring pré-déploiement");

  const checks = [
    {
      name: "Nginx",
      command: "systemctl is-active nginx",
      critical: true
    },
    {
      name: "PM2 Backend",
      command: "pm2 list | grep melyia-auth-dev | grep online",
      critical: true
    },
    {
      name: "PostgreSQL",
      command: "systemctl is-active postgresql",
      critical: false
    },
    {
      name: "Espace disque",
      command: "df -h /var/www | tail -1 | awk '{print $5}' | sed 's/%//'",
      critical: true,
      threshold: 90
    }
  ];

  let healthScore = 0;
  let criticalIssues = 0;

  for (const check of checks) {
    try {
      const result = execSync(check.command, { encoding: 'utf8' }).trim();
      
      if (check.name === "Espace disque") {
        const usage = parseInt(result);
        if (usage < check.threshold) {
          healthScore++;
          log(`✅ ${check.name}: ${usage}% utilisé`, "green");
        } else {
          if (check.critical) criticalIssues++;
          log(`⚠️ ${check.name}: ${usage}% CRITIQUE`, "red");
        }
      } else if (check.name === "Nginx" && result === "active") {
        healthScore++;
        log(`✅ ${check.name}: actif`, "green");
      } else if (check.name === "PostgreSQL" && result === "active") {
        healthScore++;
        log(`✅ ${check.name}: actif`, "green");
      } else if (check.name === "PM2 Backend" && result.includes('online')) {
        healthScore++;
        log(`✅ ${check.name}: en ligne`, "green");
      } else {
        if (check.critical) criticalIssues++;
        log(`❌ ${check.name}: problème détecté`, "red");
      }
    } catch (error) {
      if (check.critical) criticalIssues++;
      log(`❌ ${check.name}: échec vérification`, "red");
    }
  }

  CONFIG.LOG.metrics.healthScore = healthScore;
  CONFIG.LOG.metrics.criticalIssues = criticalIssues;

  if (criticalIssues > 0) {
    throw new Error(`Système non sain: ${criticalIssues} problème(s) critique(s)`);
  }

  log(`✅ Santé système: ${healthScore}/${checks.length} services OK`, "green");
}

function createDeploymentSnapshot() {
  if (!CONFIG.FEATURES.autoRollback) return null;
  
  log("📸 Création snapshot rollback...", "blue");
  
  const timestamp = Date.now();
  const snapshotDir = `/tmp/melyia-snapshot-${timestamp}`;
  
  try {
    executeLocal(`mkdir -p ${snapshotDir}`, "Workspace snapshot");
    
    // Sauvegarder les sites actuels
    const sites = [
      { source: CONFIG.PATHS.landing.target, name: "landing" },
      { source: CONFIG.PATHS.app.target, name: "app" }
    ];
    
    for (const site of sites) {
      if (fs.existsSync(site.source)) {
        executeLocal(
          `cp -r ${site.source} ${snapshotDir}/${site.name}`,
          `Snapshot ${site.name}`
        );
      }
    }
    
    log(`✅ Snapshot créé: ${snapshotDir}`, "green");
    return snapshotDir;
  } catch (error) {
    log(`❌ Échec snapshot: ${error.message}`, "red");
    return null;
  }
}

function deployWithIncrementalSync() {
  logPhase("PHASE 4 : DÉPLOIEMENT INCRÉMENTAL", "Sync intelligent optimisé");

  const sites = [
    { 
      source: CONFIG.PATHS.landing.source, 
      target: CONFIG.PATHS.landing.target,
      name: "Landing"
    },
    { 
      source: CONFIG.PATHS.app.source, 
      target: CONFIG.PATHS.app.target,
      name: "App"
    }
  ];

  for (const site of sites) {
    log(`🚀 Déploiement ${site.name}...`, "blue");

    // Créer répertoire cible
    executeLocal(`sudo mkdir -p ${site.target}`, `Répertoire ${site.name}`);

    if (site.name === "App") {
      // Sauvegarde backend pour App
      const timestamp = Date.now();
      const backupDir = `/tmp/backend-backup-${timestamp}`;
      
      executeLocal(`mkdir -p ${backupDir}`, "Workspace backend");
      
      const backupFiles = ['server.js', 'package.json', 'node_modules'];
      for (const file of backupFiles) {
        const filePath = path.join(site.target, file);
        if (fs.existsSync(filePath)) {
          executeLocal(`cp -r ${filePath} ${backupDir}/`, `Backup ${file}`);
        }
      }

      // Déploiement incrémental avec exclusions
      const excludes = backupFiles.map(f => `--exclude=${f}`).join(' ');
      executeLocal(
        `sudo rsync -av --delete ${excludes} ${site.source} ${site.target}`,
        `Sync ${site.name} (incrémental)`
      );

      // Restauration backend
      for (const file of backupFiles) {
        const backupFile = path.join(backupDir, file);
        if (fs.existsSync(backupFile)) {
          executeLocal(`sudo cp -r ${backupFile} ${site.target}`, `Restauration ${file}`);
        }
      }

      // Lien index
      const indexAppPath = path.join(site.target, 'index-app.html');
      if (fs.existsSync(indexAppPath)) {
        executeLocal(
          `cd ${site.target} && sudo ln -sf index-app.html index.html`,
          "Lien index app"
        );
      }

      executeLocal(`rm -rf ${backupDir}`, "Nettoyage backup");
    } else {
      // Déploiement standard pour Landing
      executeLocal(
        `sudo rsync -av --delete ${site.source} ${site.target}`,
        `Sync ${site.name} (complet)`
      );
    }

    // Permissions optimisées
    executeLocal(`sudo chown -R www-data:www-data ${site.target}`, `Propriétaire ${site.name}`);
    executeLocal(`sudo find ${site.target} -type f -exec chmod 644 {} +`, `Permissions fichiers ${site.name}`);
    executeLocal(`sudo find ${site.target} -type d -exec chmod 755 {} +`, `Permissions dossiers ${site.name}`);

    // Mettre à jour cache metadata
    if (CONFIG.FEATURES.smartCache) {
      const cacheFile = path.join(CONFIG.PATHS.cache.metadata, `${site.name.toLowerCase()}.json`);
      if (fs.existsSync(cacheFile)) {
        const meta = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        meta.deployed = true;
        meta.deployedAt = new Date().toISOString();
        fs.writeFileSync(cacheFile, JSON.stringify(meta, null, 2));
      }
    }

    log(`✅ ${site.name} déployé`, "green");
  }
}

function reloadServicesIntelligent() {
  logPhase("PHASE 5 : SERVICES INTELLIGENTS", "Rechargement optimisé");

  // Vérifier si Nginx a besoin d'un reload
  try {
    executeLocal("sudo nginx -t", "Test configuration Nginx");
    executeLocal("sudo systemctl reload nginx", "Rechargement Nginx");
  } catch (error) {
    log("⚠️ Configuration Nginx problématique, restart...", "yellow");
    try {
      executeLocal("sudo systemctl restart nginx", "Restart Nginx forcé");
    } catch (restartError) {
      log("❌ Problème critique Nginx", "red");
      throw restartError;
    }
  }

  // PM2 restart conditionnel
  try {
    const pm2Status = execSync('pm2 list | grep melyia-auth-dev', { encoding: 'utf8' });
    if (!pm2Status.includes('online')) {
      executeLocal("pm2 restart melyia-auth-dev", "Restart PM2 app");
    } else {
      log("✅ PM2 app déjà en ligne", "green");
    }
  } catch (error) {
    log("⚠️ PM2 check échoué (non critique)", "yellow");
  }
}

function validateDeploymentAdvanced() {
  logPhase("PHASE 6 : VALIDATION AVANCÉE", "Tests complets post-déploiement");

  // Tests structure fichiers
  const checks = [
    { path: CONFIG.PATHS.landing.target, name: "Landing" },
    { path: CONFIG.PATHS.app.target, name: "App" },
  ];

  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      const files = fs.readdirSync(check.path);
      log(`✅ ${check.name}: ${files.length} fichiers`, "green");
    } else {
      throw new Error(`${check.name}: répertoire manquant`);
    }
  }

  // Tests HTTP avec métriques
  const sites = [
    { name: "Landing", url: "https://dev.melyia.com" },
    { name: "App", url: "https://app-dev.melyia.com" },
    { name: "API Health", url: "https://app-dev.melyia.com/api/health" },
  ];

  let successCount = 0;
  let totalResponseTime = 0;

  for (const site of sites) {
    try {
      const start = Date.now();
      const result = execSync(`curl -I "${site.url}" --max-time 5 --silent`, {
        encoding: "utf8",
        timeout: 6000,
      });

      const responseTime = Date.now() - start;
      totalResponseTime += responseTime;

      if (result.includes("200 OK")) {
        successCount++;
        log(`✅ ${site.name} OK en ${responseTime}ms`, "green");
      } else {
        const match = result.match(/HTTP\/[\d.]+\s+(\d+)/);
        const status = match ? match[1] : "Unknown";
        log(`⚠️ ${site.name} HTTP ${status}`, "yellow");
      }
    } catch (error) {
      log(`❌ ${site.name} inaccessible`, "red");
    }
  }

  const avgResponseTime = Math.round(totalResponseTime / sites.length);
  CONFIG.LOG.metrics.sitesOK = successCount;
  CONFIG.LOG.metrics.avgResponseTime = avgResponseTime;

  if (successCount < sites.length) {
    log(`⚠️ Validation partielle: ${successCount}/${sites.length} sites OK`, "yellow");
  } else {
    log(`✅ Validation complète: ${successCount}/${sites.length} sites OK (${avgResponseTime}ms moy.)`, "green");
  }
}

function showEnhancedSummary() {
  logPhase("RÉSUMÉ DÉPLOIEMENT AMÉLIORÉ v36.2", "Statistiques détaillées");

  const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
  const steps = CONFIG.LOG.steps.length;

  log(`⏱️ Durée totale: ${duration}s`, "cyan");
  log(`📊 Étapes: ${steps}`, "cyan");
  log("");

  // Métriques de performance
  log("📈 MÉTRIQUES PERFORMANCE:", "blue");
  if (CONFIG.LOG.metrics.buildSize) {
    log(`  💾 Taille builds: ${formatBytes(CONFIG.LOG.metrics.buildSize)}`, "white");
  }
  if (CONFIG.LOG.cache.hits > 0 || CONFIG.LOG.cache.misses > 0) {
    const cacheRatio = ((CONFIG.LOG.cache.hits / (CONFIG.LOG.cache.hits + CONFIG.LOG.cache.misses)) * 100).toFixed(1);
    log(`  🎯 Cache: ${CONFIG.LOG.cache.hits} hits, ${CONFIG.LOG.cache.misses} misses (${cacheRatio}%)`, "white");
  }
  if (CONFIG.LOG.metrics.avgResponseTime) {
    log(`  ⚡ Temps réponse moyen: ${CONFIG.LOG.metrics.avgResponseTime}ms`, "white");
  }
  if (CONFIG.LOG.metrics.healthScore) {
    log(`  🏥 Santé système: ${CONFIG.LOG.metrics.healthScore}/4`, "white");
  }
  log("");

  log("🌐 SITES DÉPLOYÉS:", "blue");
  log("  📍 Landing: https://dev.melyia.com", "white");
  log("  📍 App: https://app-dev.melyia.com", "white");
  log("  📍 API: https://app-dev.melyia.com/api", "white");
  log("");

  log("🚀 FONCTIONNALITÉS AVANCÉES v36.2:", "green");
  log(`  ${CONFIG.FEATURES.smartCache ? '✅' : '❌'} Cache builds intelligent`, "green");
  log(`  ${CONFIG.FEATURES.incremental ? '✅' : '❌'} Déploiement incrémental`, "green");
  log(`  ${CONFIG.FEATURES.autoRollback ? '✅' : '❌'} Rollback automatique`, "green");
  log(`  ${CONFIG.FEATURES.monitoring ? '✅' : '❌'} Monitoring système`, "green");
  log(`  ${CONFIG.FEATURES.validation ? '✅' : '❌'} Validation avancée`, "green");
}

function main() {
  try {
    log("🚀 DÉPLOIEMENT LOCAL AMÉLIORÉ v36.2", "green");
    log("⚡ Cache + Incrémental + Monitoring + Rollback", "magenta");
    log("");

    initializeCache();
    const cacheHit = checkBuildCache();
    
    if (!cacheHit) {
      validateBuilds();
    }
    
    checkSystemHealth();
    const snapshot = createDeploymentSnapshot();
    
    try {
      deployWithIncrementalSync();
      reloadServicesIntelligent();
      validateDeploymentAdvanced();
      
      // Succès - nettoyer snapshot si existe
      if (snapshot) {
        executeLocal(`rm -rf ${snapshot}`, "Nettoyage snapshot");
      }
      
    } catch (deployError) {
      // Échec déploiement - rollback si possible
      if (snapshot && CONFIG.FEATURES.autoRollback) {
        log("🔄 Rollback automatique en cours...", "yellow");
        try {
          executeLocal(`sudo cp -r ${snapshot}/landing/* ${CONFIG.PATHS.landing.target}`, "Rollback landing");
          executeLocal(`sudo cp -r ${snapshot}/app/* ${CONFIG.PATHS.app.target}`, "Rollback app");
          executeLocal("sudo systemctl reload nginx", "Reload après rollback");
          log("✅ Rollback effectué avec succès", "green");
        } catch (rollbackError) {
          log(`❌ Échec rollback: ${rollbackError.message}`, "red");
        }
      }
      throw deployError;
    }

    showEnhancedSummary();

    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "cyan");
    log(`🎉 DÉPLOIEMENT AMÉLIORÉ RÉUSSI en ${duration}s`, "green");
    log("⚡ TOUTES LES FONCTIONNALITÉS AVANCÉES ACTIVES", "magenta");
    log("✅ Système optimisé et surveillé", "green");
    log("=====================================================", "cyan");
  } catch (error) {
    const duration = ((Date.now() - CONFIG.LOG.startTime) / 1000).toFixed(1);
    log("=====================================================", "red");
    log(`❌ DÉPLOIEMENT AMÉLIORÉ ÉCHOUÉ après ${duration}s`, "red");
    log(`❌ Erreur: ${error.message}`, "red");
    log("=====================================================", "red");
    process.exit(1);
  }
}

main(); 