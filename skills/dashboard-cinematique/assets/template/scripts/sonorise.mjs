#!/usr/bin/env node
// Pose la bande-son actuelle sur une vidéo déjà rendue, sans refaire le rendu (ffmpeg requis).
//
//   node scripts/sonorise.mjs out/brouillon.mp4                → out/brouillon-son.mp4
//   node scripts/sonorise.mjs out/film.mp4 out/film-v2.mp4
//
// Sert après chaque `node scripts/bande-son.mjs` : on écoute le nouveau son sur le brouillon
// en quelques secondes. Le rendu final, lui, intègre directement public/audio/bande-son.wav.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [, , video, sortieArg] = process.argv;
if (!video) {
  console.error("usage : node scripts/sonorise.mjs <video.mp4> [sortie.mp4]");
  process.exit(2);
}
const sortie = sortieArg ?? video.replace(/\.mp4$/i, "") + "-son.mp4";
execFileSync(
  "ffmpeg",
  ["-v", "error", "-y", "-i", video, "-i", path.join(racine, "public/audio/bande-son.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest", "-movflags", "+faststart", sortie],
  { stdio: "inherit" },
);
console.log(`→ ${sortie}`);
