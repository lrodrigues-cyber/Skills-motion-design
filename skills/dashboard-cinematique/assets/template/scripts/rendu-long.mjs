#!/usr/bin/env node
// Rendu d'une vidéo longue (plus de ~25 s) par morceaux de 15 s, assemblés ensuite sans réencodage.
// Un seul rendu de 1 700 images sature la mémoire du navigateur (rendu tué en cours de route).
//
//   node scripts/rendu-long.mjs brouillon        → out/brouillon.mp4 (demi-résolution, muet)
//   node scripts/rendu-long.mjs final            → out/film.mp4 (1920×1080 + bande-son public/audio/bande-son.wav)
//
// REMOTION_CONCURRENCY (2 par défaut) et REMOTION_BROWSER sont repris de l'environnement.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] ?? "final";
const M = JSON.parse(fs.readFileSync(path.join(racine, "src/film/montage.json"), "utf8"));
const total = M.plans.reduce((s, p) => s + p.duree, 0) + (!M.fin || M.fin.type === "aucune" ? 0 : (M.fin.total ?? 120));
const MORCEAU = 450;
const options = mode === "brouillon" ? ["--scale=0.5", "--crf=20", "--x264-preset=veryfast"] : [];
const dossier = path.join(racine, "out", "morceaux");
fs.rmSync(dossier, { recursive: true, force: true });
fs.mkdirSync(dossier, { recursive: true });

const liste = [];
for (let debut = 0; debut < total; debut += MORCEAU) {
  const fin = Math.min(total - 1, debut + MORCEAU - 1);
  const f = path.join(dossier, `${String(debut).padStart(5, "0")}.mp4`);
  const t = Date.now();
  execFileSync("npx", ["remotion", "render", "DashboardFilmMuet", f, `--frames=${debut}-${fin}`, "--muted", "--timeout=180000", "--log=error", ...options], {
    cwd: racine,
    stdio: ["ignore", "ignore", "inherit"],
  });
  liste.push(`file '${f}'`);
  console.log(`images ${debut}–${fin} / ${total} rendues (${Math.round((Date.now() - t) / 1000)} s)`);
}
fs.writeFileSync(path.join(dossier, "liste.txt"), liste.join("\n") + "\n");
const muet = mode === "brouillon" ? path.join(racine, "out/brouillon.mp4") : path.join(dossier, "film-muet.mp4");
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(dossier, "liste.txt"), "-c", "copy", muet]);
if (mode !== "brouillon") {
  const sortie = path.join(racine, "out/film.mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", muet, "-i", path.join(racine, "public/audio/bande-son.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", sortie]);
  console.log(`→ ${path.relative(process.cwd(), sortie)}`);
} else console.log(`→ ${path.relative(process.cwd(), muet)}`);
