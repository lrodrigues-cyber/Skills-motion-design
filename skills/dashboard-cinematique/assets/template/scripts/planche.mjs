#!/usr/bin/env node
// Planche-contact pour la vérification visuelle (ffmpeg requis).
//
//   node scripts/planche.mjs out/film.mp4                       → out/planche.png
//   node scripts/planche.mjs out/film.mp4 --ref ref.mp4         → rendu | référence, côte à côte
//   node scripts/planche.mjs out/film.mp4 --pas 0.25 --de 2 --a 6 --sortie out/zoom.png
//
// Chaque vignette porte son horodatage. Lire la planche et comparer à la référence :
// cadrage, flou, lumière, rythme des apparitions, moment des coupes.

import { execFileSync } from "node:child_process";
import path from "node:path";

const [, , film, ...reste] = process.argv;
if (!film) {
  console.error("usage : node scripts/planche.mjs <film.mp4> [--ref ref.mp4] [--pas 0.5] [--de s] [--a s] [--sortie fichier.png]");
  process.exit(1);
}
const opt = {};
for (let i = 0; i < reste.length; i += 2) opt[reste[i].replace(/^--/, "")] = reste[i + 1];
const pas = Number(opt.pas ?? 0.5);
const de = Number(opt.de ?? 0);
const duree = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
const a = Number(opt.a ?? Math.min(duree(film), opt.ref ? duree(opt.ref) : Infinity));
const sortie = opt.sortie ?? path.join(path.dirname(film), opt.ref ? "planche-comparaison.png" : "planche.png");
const n = Math.max(1, Math.floor((a - de) / pas));
const etiquette = (nom) =>
  `drawtext=text='${nom} %{pts\\:hms}':x=6:y=6:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.6`;
const vignette = (i, nom) => `[${i}:v]trim=start=${de}:end=${a},setpts=PTS-STARTPTS+${de}/TB,fps=1/${pas},scale=480:-2,${etiquette(nom)}`;

const entrees = ["-ss", "0", "-i", film];
let graphe;
if (opt.ref) {
  entrees.push("-i", opt.ref);
  graphe = `${vignette(0, "rendu")}[a];${vignette(1, "ref")},scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2[b];[a]scale=480:270[a2];[a2][b]hstack,tile=2x${Math.ceil(n / 2)}`;
} else {
  graphe = `${vignette(0, "rendu")},tile=4x${Math.ceil(n / 4)}`;
}
execFileSync("ffmpeg", ["-v", "error", "-y", ...entrees, "-filter_complex", graphe, "-frames:v", "1", sortie], { stdio: "inherit" });
console.log(`→ ${sortie}  (${n} vignettes, de ${de}s à ${a}s, pas ${pas}s)`);
