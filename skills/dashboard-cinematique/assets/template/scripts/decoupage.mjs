#!/usr/bin/env node
// Écrit le découpage du film (src/film/montage.json → plans) d'après le choix du client :
// nombre de plans de coupe et/ou durée totale.
//
//   node scripts/decoupage.mjs --duree 30 --blocs kpi1,courbe,donut,tableau,bouton
//   node scripts/decoupage.mjs --plans 10 --blocs kpi1,kpi3,courbe,donut,tableau,stats,bouton
//   node scripts/decoupage.mjs --duree 45 --plans 9 --blocs … --cadrages macro,travelling,plongee
//
// --blocs      blocs à filmer, dans l'ordre (noms de CENTRES dans src/ui/Dashboard.tsx). S'il y a plus de
//              plans que de blocs, la liste reprend depuis le début avec d'autres cadrages : un même module
//              peut revenir sous un autre angle.
// --cadrages   types de plans à alterner (src/cinema/cadrages.ts) ; par défaut une rotation variée qui
//              ouvre en « macro ». Deux plans qui se suivent n'ont jamais le même cadrage.
// --duree      durée totale en secondes, fin comprise ; --plans : nombre de plans de coupe.
//
// Durée d'un plan : un multiple de 1,5 s (une mesure de musique à 160 BPM), entre 3 et 6 s, pour que
// chaque coupe tombe sur un temps fort. Le script ajuste et dit la durée réelle obtenue.
// La fin, le thème et la musique du montage sont conservés. Ensuite : brouillon, repérage, son.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fichier = path.join(racine, "src/film/montage.json");
const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const CADRAGES = ["macro", "travelling", "plongee", "rasant", "zoom-avant", "eloigne", "orbite"];
const ORDRE = ["macro", "travelling", "rasant", "plongee", "zoom-avant", "orbite", "macro", "travelling", "eloigne"];

const blocs = (opt("blocs") ?? "").split(",").map((b) => b.trim()).filter(Boolean);
if (!blocs.length) {
  console.error("usage : node scripts/decoupage.mjs [--duree <s>] [--plans <n>] --blocs a,b,c [--cadrages macro,travelling,…]");
  process.exit(2);
}
// les blocs doivent exister dans CENTRES (sinon la caméra viserait le milieu de l'écran)
const source = fs.readFileSync(path.join(racine, "src/ui/Dashboard.tsx"), "utf8");
const centres = /CENTRES[^=]*=\s*\{([\s\S]*?)\n\};/.exec(source)?.[1] ?? "";
const connus = new Set([...centres.matchAll(/^\s*["']?([\w-]+)["']?\s*:/gm)].map((m) => m[1]));
const inconnus = blocs.filter((b) => !connus.has(b));
if (inconnus.length) {
  console.error(`Blocs absents de CENTRES (src/ui/Dashboard.tsx) : ${inconnus.join(", ")}. Connus : ${[...connus].join(", ")}`);
  process.exit(1);
}
const cadrages = (opt("cadrages") ?? "").split(",").map((c) => c.trim()).filter(Boolean);
for (const c of cadrages)
  if (!CADRAGES.includes(c)) {
    console.error(`Cadrage inconnu : ${c}. Disponibles : ${CADRAGES.join(", ")}`);
    process.exit(1);
  }

const M = JSON.parse(fs.readFileSync(fichier, "utf8"));
const fps = M.fps ?? 30;
const fin = !M.fin || M.fin.type === "aucune" ? 0 : (M.fin.total ?? 120);
const MESURE = 45; // 1,5 s à 30 i/s
const borne = (v, a, b) => Math.min(b, Math.max(a, v));

const duree = opt("duree") ? Number(opt("duree")) : undefined;
let n = opt("plans") ? Number(opt("plans")) : undefined;
let longueur = 90;
if (duree !== undefined && n === undefined) n = Math.max(1, Math.round((duree * fps - fin) / 90));
if (n === undefined) n = blocs.length;
if (duree !== undefined) longueur = borne(Math.round((duree * fps - fin) / n / MESURE) * MESURE, 90, 180);
n = Math.max(1, Math.round(n));

// cadrages : la liste demandée, ou la rotation par défaut ; jamais deux fois le même d'affilée,
// et un bloc qui revient change d'angle
const choix = cadrages.length ? cadrages : ORDRE;
const plans = [];
for (let i = 0; i < n; i++) {
  const bloc = blocs[i % blocs.length];
  let cadrage = choix[i % choix.length];
  const precedent = plans[i - 1]?.cadrage;
  const memeBloc = plans.filter((p) => p.cible === bloc).map((p) => p.cadrage);
  for (let k = 1; (cadrage === precedent || memeBloc.includes(cadrage)) && k < CADRAGES.length; k++) cadrage = choix[(i + k) % choix.length] ?? CADRAGES[(i + k) % CADRAGES.length];
  const rang = memeBloc.length;
  plans.push({
    id: `${String(i + 1).padStart(2, "0")}-${bloc}${rang ? `-${rang + 1}` : ""}-${cadrage}`,
    duree: longueur,
    cible: bloc,
    cadrage,
    // l'animation du bloc est déjà lancée à la coupe (jamais de début de plan vide) ; un bloc qui revient la rejoue
    horloges: { [bloc]: -8 },
    son: [],
  });
}

M.plans = plans;
fs.writeFileSync(fichier, JSON.stringify(M, null, 2) + "\n");
const total = (n * longueur + fin) / fps;
console.log(`${n} plans de ${(longueur / fps).toFixed(1)} s + fin ${(fin / fps).toFixed(1)} s = ${total.toFixed(1)} s${duree !== undefined && Math.abs(total - duree) > 0.75 ? ` (demandé : ${duree} s ; durée d'un plan arrondie à un multiple de 1,5 s, entre 3 et 6 s)` : ""}`);
for (const p of plans) console.log(`  ${p.id.padEnd(34)} ${p.cadrage.padEnd(11)} ${p.cible}`);
console.log(`→ ${path.relative(process.cwd(), fichier)}. Ensuite : npm run brouillon, puis repérage et son.`);
