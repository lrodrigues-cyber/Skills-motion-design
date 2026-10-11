#!/usr/bin/env node
// Crée un projet vidéo « dashboard cinématique » prêt à rendre.
//
//   node <skill>/scripts/nouveau-projet.mjs <dossier-cible> [--sans-installation]
//
// Copie le gabarit (assets/template), installe les dépendances (versions figées)
// et génère la bande-son d'exemple calée sur src/film/montage.json.

import { cpSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const gabarit = path.resolve(ici, "../assets/template");
const [, , cible, ...options] = process.argv;

if (!cible) {
  console.error("usage : node scripts/nouveau-projet.mjs <dossier-cible> [--sans-installation]");
  process.exit(1);
}
const dossier = path.resolve(cible);
if (existsSync(dossier) && readdirSync(dossier).length > 0) {
  console.error(`Le dossier ${dossier} existe déjà et n'est pas vide.`);
  process.exit(1);
}

cpSync(gabarit, dossier, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(gabarit, src);
    return !rel.startsWith("node_modules") && !rel.startsWith("out") && !rel.endsWith(".wav");
  },
});
console.log(`Gabarit copié dans ${dossier}`);

if (!options.includes("--sans-installation")) {
  execFileSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: dossier, stdio: "inherit" });
  execFileSync("node", ["scripts/bande-son.mjs"], { cwd: dossier, stdio: "inherit" });
}

console.log(`
Prêt. Ensuite :
  cd ${path.relative(process.cwd(), dossier) || "."}
  npx remotion studio                                   # aperçu en direct
  node scripts/bande-son.mjs                            # après chaque changement de montage.json
  npx remotion render DashboardFilm out/film.mp4        # rendu final 1920×1080
  node scripts/planche.mjs out/film.mp4 --ref <reference.mp4>   # comparaison visuelle
Navigateur déjà installé ? REMOTION_BROWSER=/chemin/vers/chrome npx remotion render …`);
