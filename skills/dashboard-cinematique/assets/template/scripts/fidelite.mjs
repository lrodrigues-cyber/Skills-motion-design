#!/usr/bin/env node
// Contrôle de fidélité : l'interface reconstruite est-elle IDENTIQUE à la capture du client ?
//
//   node scripts/fidelite.mjs capture/ecran.png              rend le monde à plat (composition MondeAPlat) et compare
//   node scripts/fidelite.mjs capture/ecran.png --rendu out/fidelite/rendu.png   compare une image déjà rendue
//   node scripts/fidelite.mjs capture/ecran.png --rendu out/fidelite/rendu.png --zone 240,100,420,140
//                                                            agrandit une région : capture au-dessus, reconstruction en dessous
//
// Produit dans out/fidelite/ :
//   comparaison.png  la capture (en haut) et la reconstruction (en bas), à la même échelle
//   ecarts.png       la reconstruction grisée, les écarts en rouge, les zones à corriger numérotées
//   zones/zone-N.png chaque zone agrandie : capture au-dessus, reconstruction en dessous
// et liste les zones à corriger avec les couleurs exactes attendues. Code de sortie 1 tant que ça ne passe pas.
//
// À lancer avant le premier brouillon, puis après chaque changement de l'interface.

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agrandir, coller, distance, dominante, ecrire, etiquette, hex, lire, pave, recadrer, rectangle, vide } from "./image.mjs";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (nom, def) => {
  const i = args.indexOf(`--${nom}`);
  return i >= 0 ? args[i + 1] : def;
};
const capture = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
if (!capture) {
  console.error("usage : node scripts/fidelite.mjs <capture.png> [--rendu image.png] [--sortie out/fidelite]");
  process.exit(2);
}
const dossier = path.resolve(opt("sortie", path.join(racine, "out/fidelite")));
fs.rmSync(path.join(dossier, "zones"), { recursive: true, force: true });
fs.mkdirSync(path.join(dossier, "zones"), { recursive: true });

// 1. Le monde à plat, état final (toutes les animations terminées), à sa taille réelle.
let rendu = opt("rendu");
if (!rendu) {
  rendu = path.join(dossier, "rendu.png");
  console.log("Rendu du monde à plat (MondeAPlat)…");
  // CLI Remotion lancé par node (execFileSync("npx") échoue sous Windows : npx y est un .cmd)
  execFileSync(process.execPath, [path.join(racine, "node_modules/@remotion/cli/remotion-cli.js"), "still", "MondeAPlat", rendu, "--frame=0", "--log=error"], { cwd: racine, stdio: ["ignore", "ignore", "inherit"] });
}

const R = lire(rendu);
const brute = lire(capture, { largeur: undefined });
const ratioC = brute.l / brute.h,
  ratioR = R.l / R.h;
const echelle = brute.l / R.l;
console.log(
  `Capture ${brute.l}×${brute.h} · monde ${R.l}×${R.h}${Math.abs(echelle - 1) > 0.01 ? ` (capture ramenée à l'échelle du monde, ×${(1 / echelle).toFixed(2)})` : ""}`,
);
if (Math.abs(ratioC - ratioR) / ratioR > 0.01)
  console.log(`⚠ Proportions différentes : capture ${ratioC.toFixed(3)}, monde ${ratioR.toFixed(3)}. Donne au monde (MONDE) les proportions de la capture.`);

const C = lire(capture, { largeur: R.l, hauteur: R.h });
// versions légèrement floues : l'anticrénelage du texte diffère d'un système à l'autre, on ne le compte pas comme un écart
const Cf = lire(capture, { largeur: R.l, hauteur: R.h, flou: 1.2 });
const Rf = lire(rendu, { flou: 1.2 });
const captureAuMonde = path.join(dossier, "capture-au-monde.png");

// --zone x,y,l,h : seulement la comparaison agrandie d'une région (capture à gauche ou au-dessus, reconstruction à côté).
if (opt("zone")) {
  const [x, y, l, h] = opt("zone").split(",").map(Number);
  const cote = h > l * 0.6; // région haute : côte à côte ; région large : l'une sous l'autre
  const k = Math.max(1, Math.min(8, Math.floor(Math.min(1400 / (cote ? 2 * l : l), 1100 / (cote ? h : 2 * h)))));
  const a = agrandir(recadrer(C, x, y, l, h), k),
    b = agrandir(recadrer(R, x, y, l, h), k);
  const planche = cote ? vide(a.l * 2 + 8, a.h, [255, 0, 200]) : vide(a.l, a.h * 2 + 8, [255, 0, 200]);
  coller(planche, a, 0, 0);
  coller(planche, b, cote ? a.l + 8 : 0, cote ? 0 : a.h + 8);
  const f = path.join(dossier, `zone-${x}-${y}-${l}x${h}.png`);
  ecrire(f, planche);
  console.log(`→ ${path.relative(process.cwd(), f)} (×${k} : capture ${cote ? "à gauche" : "au-dessus"}, reconstruction ${cote ? "à droite" : "en dessous"})`);
  process.exit(0);
}
ecrire(captureAuMonde, C);

// 2. Écart pixel par pixel, puis par cases de 24 px.
const ecart = new Float32Array(R.l * R.h);
let somme = 0;
for (let k = 0; k < R.l * R.h; k++) {
  const d = Math.max(Math.abs(Cf.px[3 * k] - Rf.px[3 * k]), Math.abs(Cf.px[3 * k + 1] - Rf.px[3 * k + 1]), Math.abs(Cf.px[3 * k + 2] - Rf.px[3 * k + 2])) / 255;
  ecart[k] = d;
  somme += d;
}
const T = 24;
const NX = Math.ceil(R.l / T),
  NY = Math.ceil(R.h / T);
const mauvaise = new Uint8Array(NX * NY);
const moyCase = new Float32Array(NX * NY);
for (let cy = 0; cy < NY; cy++)
  for (let cx = 0; cx < NX; cx++) {
    let s = 0,
      n = 0;
    for (let y = cy * T; y < Math.min(R.h, (cy + 1) * T); y++) for (let x = cx * T; x < Math.min(R.l, (cx + 1) * T); x++) (s += ecart[y * R.l + x]), n++;
    const m = s / n;
    moyCase[cy * NX + cx] = m;
    const couleur = estCouleur(cx * T, cy * T, T, T);
    if (m > 0.05 || (couleur && m > 0.02)) mauvaise[cy * NX + cx] = 1;
  }

// 3. Cases voisines regroupées en zones.
// Écart de COULEUR : la couleur à plat (la plus fréquente) n'est pas la même ET la teinte moyenne a bougé.
// (Un texte un peu décalé change la moyenne mais pas la couleur à plat ; un aplat mal choisi change les deux.)
function estCouleur(x, y, l, h) {
  return distance(dominante(C, x, y, l, h), dominante(R, x, y, l, h)) > 12 && distance(moyenne(Cf, x, y, l, h), moyenne(Rf, x, y, l, h)) > 5;
}
function moyenne(img, x, y, l, h) {
  const m = [0, 0, 0];
  let n = 0;
  for (let j = y; j < Math.min(img.h, y + h); j++)
    for (let i = x; i < Math.min(img.l, x + l); i++, n++) for (let k = 0; k < 3; k++) m[k] += img.px[3 * (j * img.l + i) + k];
  return m.map((v) => v / Math.max(1, n));
}
const vue = new Uint8Array(NX * NY);
const zones = [];
for (let i = 0; i < NX * NY; i++) {
  if (!mauvaise[i] || vue[i]) continue;
  const pile = [i];
  vue[i] = 1;
  let x0 = NX,
    y0 = NY,
    x1 = 0,
    y1 = 0,
    n = 0,
    s = 0;
  while (pile.length) {
    const c = pile.pop();
    const cx = c % NX,
      cy = Math.floor(c / NX);
    (x0 = Math.min(x0, cx)), (y0 = Math.min(y0, cy)), (x1 = Math.max(x1, cx)), (y1 = Math.max(y1, cy));
    n++;
    s += moyCase[c];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const vx = cx + dx,
          vy = cy + dy;
        if (vx < 0 || vy < 0 || vx >= NX || vy >= NY) continue;
        const v = vy * NX + vx;
        if (mauvaise[v] && !vue[v]) (vue[v] = 1), pile.push(v);
      }
  }
  const x = x0 * T,
    y = y0 * T,
    l = Math.min(R.l, (x1 + 1) * T) - x,
    h = Math.min(R.h, (y1 + 1) * T) - y;
  // « couleur » : la teinte moyenne de la zone diffère (fond, carte, aplat) ; sinon c'est le contenu (texte, forme, position)
  zones.push({ x, y, l, h, cases: n, ecart: s / n, attendu: hex(dominante(C, x, y, l, h)), obtenu: hex(dominante(R, x, y, l, h)), couleur: estCouleur(x, y, l, h) });
}
// les écarts de couleur d'abord (ce sont les plus visibles), puis les plus grandes zones
zones.sort((a, b) => Number(b.couleur) - Number(a.couleur) || b.cases * b.ecart - a.cases * a.ecart);

// 4. Score.
// SSIM (similarité de structure, 1 = identique), calculée par ffmpeg sur l'image entière.
const mesure = spawnSync("ffmpeg", ["-hide_banner", "-i", captureAuMonde, "-i", rendu, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
const ssim = Number(/All:([\d.]+)/.exec(mesure.stderr ?? "")?.[1]);
const pctCases = (100 * mauvaise.reduce((a, b) => a + b, 0)) / (NX * NY);
const ressemblance = 100 * (1 - somme / (R.l * R.h));

// 5. Images de contrôle.
const demi = (img) => (img.l > 1600 ? lire(ecrireTmp(img), { largeur: Math.round(img.l / 2), hauteur: Math.round(img.h / 2) }) : img);
function ecrireTmp(img) {
  const f = path.join(dossier, `.tmp-${img.l}x${img.h}-${Math.random().toString(36).slice(2)}.png`);
  ecrire(f, img);
  process.on("exit", () => fs.rmSync(f, { force: true }));
  return f;
}
const cD = demi(C),
  rD = demi(R);
const comp = vide(cD.l, cD.h * 2 + 12, [255, 0, 200]);
coller(comp, cD, 0, 0);
coller(comp, rD, 0, cD.h + 12);
ecrire(path.join(dossier, "comparaison.png"), comp);

const E = { l: R.l, h: R.h, px: Buffer.from(R.px) };
for (let k = 0; k < R.l * R.h; k++) {
  const g = (E.px[3 * k] + E.px[3 * k + 1] + E.px[3 * k + 2]) / 3;
  const a = Math.min(1, ecart[k] * 4);
  E.px[3 * k] = Math.round((g * 0.35 + 150) * (1 - a) + 255 * a);
  E.px[3 * k + 1] = Math.round((g * 0.35 + 150) * (1 - a) + 20 * a);
  E.px[3 * k + 2] = Math.round((g * 0.35 + 150) * (1 - a) + 40 * a);
}
zones.slice(0, 30).forEach((z, i) => {
  rectangle(E, z.x, z.y, z.l, z.h, [255, 200, 0], 3);
  etiquette(E, z.x + 3, z.y + 3, i + 1, [0, 0, 0], [255, 200, 0], 3);
});
ecrire(path.join(dossier, "ecarts.png"), E);

zones.slice(0, 12).forEach((z, i) => {
  const marge = 16;
  const x = Math.max(0, z.x - marge),
    y = Math.max(0, z.y - marge),
    l = Math.min(R.l - x, z.l + 2 * marge),
    h = Math.min(R.h - y, z.h + 2 * marge);
  const k = Math.max(1, Math.min(4, Math.floor(900 / Math.max(l, h * 2))));
  const a = agrandir(recadrer(C, x, y, l, h), k),
    b = agrandir(recadrer(R, x, y, l, h), k);
  const planche = vide(a.l, a.h * 2 + 8, [255, 0, 200]);
  coller(planche, a, 0, 0);
  coller(planche, b, 0, a.h + 8);
  pave(planche, 0, a.h, a.l, 8, [255, 0, 200]);
  ecrire(path.join(dossier, "zones", `zone-${i + 1}.png`), planche);
});

// 6. Rapport.
const ok = pctCases <= 2.5 && (Number.isNaN(ssim) || ssim >= 0.9) && !zones.some((z) => z.couleur && z.cases >= 4);
console.log(`\nFidélité : ${ressemblance.toFixed(1)} % de ressemblance · SSIM ${Number.isNaN(ssim) ? "?" : ssim.toFixed(3)} · ${pctCases.toFixed(1)} % de la surface en écart`);
if (zones.length) {
  console.log(`${zones.length} zone(s) à corriger (les plus grosses d'abord ; coordonnées du monde, en px) :`);
  zones.slice(0, 15).forEach((z, i) =>
    console.log(
      `  ${String(i + 1).padStart(2)}. x ${z.x}–${z.x + z.l}, y ${z.y}–${z.y + z.h}  ${
        z.couleur ? `COULEUR : attendu ${z.attendu}, obtenu ${z.obtenu}` : `contenu (texte, forme, position ou taille) · fond ${z.attendu}`
      }`,
    ),
  );
  if (zones.length > 15) console.log(`  … et ${zones.length - 15} autres (voir ecarts.png)`);
}
console.log(`\nÀ regarder : ${path.relative(process.cwd(), path.join(dossier, "ecarts.png"))}, comparaison.png et zones/zone-1.png …`);
console.log(ok ? "✔ L'interface est fidèle à la capture." : "✘ Pas encore fidèle : corrige les zones (en commençant par les couleurs), puis relance.");
process.exit(ok ? 0 : 1);
