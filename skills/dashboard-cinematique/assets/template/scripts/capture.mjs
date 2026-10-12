#!/usr/bin/env node
// Lire une capture d'écran du client AVANT de la reconstruire : on mesure, on ne devine pas.
//
//   node scripts/capture.mjs infos   capture/ecran.png                 taille, thème clair/sombre, palette exacte
//   node scripts/capture.mjs profil  capture/ecran.png y=170            bords et couleurs le long d'une ligne (ou x=300)
//   node scripts/capture.mjs pipette capture/ecran.png 300,170 700,170  couleur exacte en des points
//   node scripts/capture.mjs grille  capture/ecran.png [x,y,l,h] [--pas 50] [--loupe 2]
//                                                                         image quadrillée avec les coordonnées, pour mesurer
//   node scripts/capture.mjs decoupe capture/ecran.png x,y,l,h --sortie public/images/logo.png [--transparent #ffffff]
//                                                                         extrait un logo, un favicon, une photo à poser tel quel
//
// Coordonnées en px de la capture. Une capture « Retina » (×2) se lit en divisant par 2 pour le monde (infos le signale).

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { agrandir, distance, dominante, ecrire, etiquette, hex, lire, luminance, pixel, recadrer, saturation } from "./image.mjs";

const [, , commande, fichier, ...reste] = process.argv;
const options = {};
const libres = [];
for (let i = 0; i < reste.length; i++) {
  if (reste[i].startsWith("--")) {
    const nom = reste[i].slice(2);
    const suivant = reste[i + 1];
    options[nom] = suivant && !suivant.startsWith("--") ? (i++, suivant) : true;
  } else libres.push(reste[i]);
}

const aide = () => {
  console.error(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 13).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(2);
};
if (!commande || !fichier) aide();

const img = lire(fichier);
const nombres = (s) => s.split(",").map((v) => Math.round(Number(v)));

if (commande === "infos") {
  const n = img.l * img.h;
  let lum = 0;
  const compte = new Map();
  const boites = new Map();
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.l; x++) {
      const o = 3 * (y * img.l + x);
      const c = [img.px[o], img.px[o + 1], img.px[o + 2]];
      lum += luminance(c);
      const cle = (c[0] << 16) | (c[1] << 8) | c[2];
      compte.set(cle, (compte.get(cle) ?? 0) + 1);
      const b = boites.get(cle);
      if (!b) boites.set(cle, [x, y, x, y]);
      else (b[0] = Math.min(b[0], x)), (b[1] = Math.min(b[1], y)), (b[2] = Math.max(b[2], x)), (b[3] = Math.max(b[3], y));
    }
  lum /= n;
  // Regroupe les teintes voisines (anticrénelage, dégradés légers) derrière la couleur exacte la plus fréquente.
  const triees = [...compte.entries()].sort((a, b) => b[1] - a[1]);
  const groupes = [];
  for (const [cle, k] of triees) {
    const c = [(cle >> 16) & 255, (cle >> 8) & 255, cle & 255];
    const g = groupes.find((g) => distance(g.c, c) <= 10);
    const b = boites.get(cle);
    if (g) {
      g.n += k;
      g.b = [Math.min(g.b[0], b[0]), Math.min(g.b[1], b[1]), Math.max(g.b[2], b[2]), Math.max(g.b[3], b[3])];
    } else if (groupes.length < 400) groupes.push({ c, n: k, b: [...b] });
  }
  const retina = img.l >= 2400;
  console.log(`Capture ${img.l} × ${img.h} px${retina ? `  → capture Retina probable : monde de ${Math.round(img.l / 2)} × ${Math.round(img.h / 2)} px (diviser les mesures par 2)` : `  → monde de ${img.l} × ${img.h} px (taille de la capture)`}`);
  console.log(`Thème : ${lum > 0.5 ? "CLAIR" : "SOMBRE"} (luminance moyenne ${(lum * 100).toFixed(0)} %). Le film garde ce thème.`);
  const ligne = (g) =>
    `  ${hex(g.c)}  ${((100 * g.n) / n).toFixed(1).padStart(5)} %   zone x ${g.b[0]}–${g.b[2]}, y ${g.b[1]}–${g.b[3]}`;
  console.log("\nSurfaces (fonds, cartes, barres) :");
  groupes.filter((g) => g.n / n >= 0.003 && saturation(g.c) < 0.25).slice(0, 14).forEach((g) => console.log(ligne(g)));
  console.log("\nCouleurs vives (marque, blocs colorés, badges, graphiques) :");
  groupes
    .filter((g) => saturation(g.c) >= 0.25 && g.n >= 40 && Math.max(...g.c) > 40)
    .slice(0, 16)
    .forEach((g) => console.log(ligne(g)));
  console.log("\nTextes et traits sombres/clairs :");
  groupes
    .filter((g) => g.n / n < 0.003 && g.n >= 150 && saturation(g.c) < 0.25)
    .slice(0, 8)
    .forEach((g) => console.log(ligne(g)));
  console.log("\nÉtape suivante : profil y=… sur chaque rangée de cartes pour relever bords et couleurs exactes.");
} else if (commande === "pipette") {
  if (!libres.length) aide();
  for (const p of libres) {
    const [x, y] = nombres(p);
    const exact = pixel(img, x, y);
    const plat = dominante(img, x - 2, y - 2, 5, 5);
    console.log(`${String(x).padStart(5)},${String(y).padEnd(5)} ${hex(exact)}${distance(exact, plat) > 6 ? `   (couleur à plat autour : ${hex(plat)})` : ""}`);
  }
} else if (commande === "profil") {
  const m = /^([xy])=(\d+)$/.exec(libres[0] ?? "");
  if (!m) aide();
  const horizontal = m[1] === "y";
  const fixe = Number(m[2]);
  const longueur = horizontal ? img.l : img.h;
  const [a, b] = options.zone ? options.zone.split("-").map(Number) : [0, longueur - 1];
  const tol = Number(options.tol ?? 8),
    min = Number(options.min ?? 4);
  const au = (t) => (horizontal ? pixel(img, t, fixe) : pixel(img, fixe, t));
  const segments = [];
  for (let t = a; t <= b; t++) {
    const c = au(t);
    const s = segments[segments.length - 1];
    if (s && distance(s.c, c) <= tol) s.fin = t;
    else segments.push({ debut: t, fin: t, c });
  }
  // les morceaux plus courts que `min` sont du texte, une icône ou un bord anticrénelé : regroupés en « détails »
  const sortie = [];
  for (const s of segments) {
    const court = s.fin - s.debut + 1 < min;
    const p = sortie[sortie.length - 1];
    if (court && p?.detail) p.fin = s.fin;
    else if (court) sortie.push({ ...s, detail: true });
    else if (p && !p.detail && distance(p.c, s.c) <= tol) p.fin = s.fin;
    else sortie.push(s);
  }
  console.log(`Profil ${horizontal ? `horizontal y=${fixe}` : `vertical x=${fixe}`} (${horizontal ? "x" : "y"} de ${a} à ${b}) :`);
  for (const s of sortie)
    console.log(
      `  ${String(s.debut).padStart(5)}–${String(s.fin).padEnd(5)} ${s.detail ? "  · détails (texte, icône, bord)" : `${hex(s.c)}  ${s.fin - s.debut + 1} px`}`,
    );
} else if (commande === "grille" || commande === "decoupe") {
  const [x, y, l, h] = libres[0] ? nombres(libres[0]) : [0, 0, img.l, img.h];
  let morceau = recadrer(img, x, y, l, h);
  if (commande === "decoupe") {
    const sortie = options.sortie ?? `out/capture/decoupe-${x}-${y}-${l}x${h}.png`;
    const k = Number(options.loupe ?? 1);
    ecrire(sortie, morceau);
    const filtres = [];
    if (k > 1) filtres.push(`scale=iw*${k}:ih*${k}:flags=lanczos`);
    if (options.transparent) {
      const c = String(options.transparent).replace("#", "0x");
      filtres.push(`format=rgba,colorkey=${c}:0.06:0.04`);
    }
    if (filtres.length) execFileSync("ffmpeg", ["-v", "error", "-y", "-i", sortie, "-vf", filtres.join(","), "-frames:v", "1", sortie + ".tmp.png"]), fs.renameSync(sortie + ".tmp.png", sortie);
    console.log(`→ ${sortie}  (${l * k} × ${h * k} px${options.transparent ? `, fond ${options.transparent} rendu transparent` : ""})`);
    const rel = path.relative("public", sortie).split(path.sep).join("/");
    if (!rel.startsWith(".."))
      console.log(`À poser dans le monde : <Img src={staticFile("${rel}")} style={{ position: "absolute", left: ${x}, top: ${y}, width: ${l}, height: ${h} }} />`);
    else console.log("Pour l'afficher dans la vidéo, enregistre-le dans public/ (ex. --sortie public/images/logo.png).");
  } else {
    const pas = Number(options.pas ?? (l > 900 ? 100 : 50));
    const k = Number(options.loupe ?? (l <= 500 ? 2 : 1));
    morceau = agrandir(morceau, k);
    const trait = [255, 0, 200];
    for (let gx = Math.ceil(x / pas) * pas; gx < x + l; gx += pas)
      for (let j = 0; j < morceau.h; j++) {
        const o = 3 * (j * morceau.l + (gx - x) * k);
        for (let c = 0; c < 3; c++) morceau.px[o + c] = Math.round(morceau.px[o + c] * 0.45 + trait[c] * 0.55);
      }
    for (let gy = Math.ceil(y / pas) * pas; gy < y + h; gy += pas)
      for (let i = 0; i < morceau.l; i++) {
        const o = 3 * ((gy - y) * k * morceau.l + i);
        for (let c = 0; c < 3; c++) morceau.px[o + c] = Math.round(morceau.px[o + c] * 0.45 + trait[c] * 0.55);
      }
    // une étiquette toutes les n lignes pour qu'elles ne se chevauchent pas (4 chiffres ≈ 52 px)
    const n = Math.max(1, Math.ceil(56 / (pas * k)));
    for (let gx = Math.ceil(x / pas) * pas; gx < x + l; gx += pas)
      if ((gx / pas) % n === 0) etiquette(morceau, (gx - x) * k + 2, 2, gx, [255, 255, 255], [160, 0, 130]);
    for (let gy = Math.ceil(y / pas) * pas; gy < y + h; gy += pas)
      if (gy - y > 20 && (gy / pas) % Math.max(1, Math.ceil(20 / (pas * k))) === 0) etiquette(morceau, 2, (gy - y) * k + 2, gy, [255, 255, 255], [160, 0, 130]);
    const sortie = options.sortie ?? `out/capture/grille-${x}-${y}-${l}x${h}.png`;
    ecrire(sortie, morceau);
    console.log(`→ ${sortie}  (lignes tous les ${pas} px de la capture, loupe ×${k})`);
  }
} else aide();
