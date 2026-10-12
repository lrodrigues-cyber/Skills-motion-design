#!/usr/bin/env node
// Contrôle automatique de la fluidité d'un rendu (ffmpeg requis).
//
//   node scripts/controle.mjs out/film.mp4
//
// Détecte, image par image :
//  • les IMAGES RATÉES : une image qui ne ressemble à aucune de ses deux voisines alors que
//    les voisines se ressemblent (tuile non dessinée, rectangle noir, flash) ;
//  • les PLONGÉES AU NOIR aux coupes : la luminosité chute nettement juste après une coupe
//    (le plan suivant doit arriver déjà visible, flou, puis devenir net) ;
//  • les ARRÊTS : plusieurs images identiques d'affilée avant les 4 dernières secondes (caméra figée).
// Code de sortie 1 s'il y a au moins un problème.

import { execFileSync } from "node:child_process";

const fichier = process.argv[2];
if (!fichier) {
  console.error("usage : node scripts/controle.mjs <film.mp4>");
  process.exit(2);
}
const L = 96,
  H = 54;
const brut = execFileSync("ffmpeg", ["-v", "error", "-i", fichier, "-vf", `scale=${L}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"], {
  maxBuffer: 1 << 30,
});
const n = Math.floor(brut.length / (L * H));
const img = (i) => brut.subarray(i * L * H, (i + 1) * L * H);
const diff = (a, b) => {
  const x = img(a),
    y = img(b);
  let s = 0;
  for (let k = 0; k < x.length; k++) s += Math.abs(x[k] - y[k]);
  return s / x.length;
};
const lum = (i) => img(i).reduce((s, v) => s + v, 0) / (L * H);

const d = Array.from({ length: n - 1 }, (_, i) => diff(i, i + 1));
const mediane = [...d].sort((a, b) => a - b)[Math.floor(d.length / 2)] || 1;
const coupes = d.map((v, i) => (v > Math.max(6, mediane * 5) ? i + 1 : -1)).filter((i) => i > 0);

const problemes = [];
for (let i = 1; i < n - 1; i++) {
  const avant = d[i - 1],
    apres = d[i],
    voisins = diff(i - 1, i + 1);
  if (avant > 2.5 && apres > 2.5 && voisins < Math.min(avant, apres) * 0.45) problemes.push(`image ratée ${i} (${(i / 30).toFixed(2)} s)`);
}
for (const c of coupes) {
  const avant = lum(Math.max(0, c - 1));
  const creux = Math.min(...[0, 1, 2, 3].map((k) => lum(Math.min(n - 1, c + k))));
  const ensuite = lum(Math.min(n - 1, c + 12));
  if (creux < Math.min(avant, ensuite) * 0.6) problemes.push(`plongée au noir à la coupe ${c} (${(c / 30).toFixed(2)} s) : luminosité ${creux.toFixed(1)} contre ${Math.min(avant, ensuite).toFixed(1)}`);
}
let fige = 0;
for (let i = 0; i < n - 1; i++) {
  fige = d[i] < 0.05 ? fige + 1 : 0;
  if (fige === 6 && i < n - 120) problemes.push(`image figée vers ${i} (${(i / 30).toFixed(2)} s)`);
}

console.log(`${n} images · coupes détectées : ${coupes.map((c) => `${c} (${(c / 30).toFixed(2)} s)`).join(", ") || "aucune"}`);
if (problemes.length) {
  console.log(`${problemes.length} problème(s) :\n  - ${problemes.join("\n  - ")}`);
  process.exit(1);
}
console.log("Aucun problème de fluidité détecté.");
