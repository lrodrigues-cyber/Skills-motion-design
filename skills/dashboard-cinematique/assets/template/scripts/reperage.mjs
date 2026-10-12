#!/usr/bin/env node
// Repérage des animations à l'image (ffmpeg requis) : la bande-son se cale ensuite dessus.
//
//   node scripts/reperage.mjs out/brouillon.mp4          → src/film/reperage.json
//
// Le script regarde la vidéo comme un monteur son : à chaque image, il mesure la lumière qui
// APPARAÎT (accents néon qui s'allument, barres qui poussent, courbe qui se trace, texte qui
// arrive). Chaque bouffée de lumière devient un « événement » : image de départ, pic, fin, force,
// et sa courbe exacte. scripts/bande-son.mjs place un effet sur chaque événement et lui donne
// la même enveloppe que l'animation (attaque franche, puis décroissance comme l'ease-out).
//
// À relancer après toute modification de l'interface ou du montage (bande-son.mjs le signale).

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, "..");

/** Empreinte de ce qui se voit (interface + montage, hors son) : si elle change, le repérage est périmé. */
export function empreinteSources() {
  const h = crypto.createHash("sha1");
  const parcours = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) parcours(p);
      else if (e.name === "montage.json") {
        // seuls les réglages qui changent l'image comptent (pas le son ni la musique)
        const m = JSON.parse(fs.readFileSync(p, "utf8"));
        delete m.musique;
        for (const pl of m.plans ?? []) delete pl.son;
        h.update(e.name).update(JSON.stringify(m));
      } else if (/\.(tsx?|json)$/.test(e.name) && e.name !== "reperage.json") h.update(e.name).update(fs.readFileSync(p));
    }
  };
  parcours(path.join(racine, "src"));
  return h.digest("hex").slice(0, 16);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const video = process.argv[2];
  if (!video) {
    console.error("usage : node scripts/reperage.mjs <film.mp4>");
    process.exit(2);
  }
  const sortie = path.join(racine, "src/film/reperage.json");
  const M = JSON.parse(fs.readFileSync(path.join(racine, "src/film/montage.json"), "utf8"));
  const L = 320,
    H = 180;
  const brut = execFileSync("ffmpeg", ["-v", "error", "-i", video, "-vf", `scale=${L}:${H}:flags=area`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], {
    maxBuffer: 2 ** 31,
  });
  const n = Math.floor(brut.length / (L * H * 3));

  // Énergie lumineuse par image : accents saturés (néon) + texte clair (pondéré moins fort).
  const energie = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let neon = 0,
      texte = 0;
    const o = i * L * H * 3;
    for (let k = 0; k < L * H; k++) {
      const r = brut[o + 3 * k] / 255,
        g = brut[o + 3 * k + 1] / 255,
        b = brut[o + 3 * k + 2] / 255;
      const mx = Math.max(r, g, b);
      const sat = (mx - Math.min(r, g, b)) / (mx + 1e-6);
      if (sat > 0.35 && mx > 0.25) neon += mx;
      else if (sat < 0.3 && mx > 0.35) texte += mx;
    }
    energie[i] = neon + 0.35 * texte;
  }

  const fps = M.fps;
  let debut = 0;
  const plans = M.plans.map((p) => {
    const d = { id: p.id, debut, duree: p.duree };
    debut += p.duree;
    return d;
  });
  if (M.fin?.type && M.fin.type !== "aucune") plans.push({ id: "fin", debut, duree: M.fin.total ?? 120, fin: true });

  // Lumière qui apparaît, image par image (les baisses = extinctions, ignorées), lissée sur 3 images.
  const hausse = (i) => (i > 0 ? Math.max(0, energie[i] - energie[i - 1]) : 0);
  const D = Float64Array.from({ length: n }, (_, i) => 0.25 * hausse(i - 1) + 0.5 * hausse(i) + 0.25 * hausse(i + 1));
  const echelle = Math.max(...D) || 1;

  const evenements = [];
  for (const p of plans) {
    const a = p.debut + 3; // les 3 premières images = la coupe et la mise au point (déjà sonorisées)
    const b = Math.min(n - 2, p.debut + p.duree - 2);
    if (p.fin) continue; // la révélation a son propre design sonore
    for (let i = a; i < b; i++) {
      if (!(D[i] >= 0.05 * echelle && D[i] >= D[i - 1] && D[i] > D[i + 1])) continue;
      // départ : on remonte tant que la lumière croît (sans franchir le creux qui précède)
      let depart = i;
      while (depart > a && D[depart - 1] < D[depart] && D[depart - 1] > 0.15 * D[i]) depart--;
      // fin : on descend tant que la lumière décroît et reste notable
      let fin = i;
      while (fin < b && D[fin + 1] <= D[fin] && D[fin + 1] > 0.12 * D[i]) fin++;
      let total = 0;
      for (let k = depart; k <= fin; k++) total += D[k];
      // un vrai événement AJOUTE de la lumière durablement (pas une teinte qui tourne, pas un reflet qui passe)
      const net = energie[Math.min(n - 1, fin + 3)] - energie[Math.max(0, depart - 1)];
      if (net < 0.6 * total) continue;
      evenements.push({
        plan: p.id,
        image: depart - p.debut, // relatif au début du plan
        pic: i - p.debut,
        fin: fin - p.debut,
        force: total / echelle,
        courbe: Array.from(D.slice(depart, fin + 1), (x) => +(x / echelle).toFixed(3)),
      });
    }
  }
  // On ne garde que ce qui se voit : au moins 8 % de l'événement le plus fort du film, 4 par plan au plus.
  const fMax = Math.max(0, ...evenements.map((e) => e.force));
  if (process.env.DEBUG) for (const e of evenements) console.log(e.plan, e.image, e.pic, e.fin, (e.force / fMax).toFixed(3));
  const gardes = [];
  for (const p of plans) {
    const ev = evenements.filter((e) => e.plan === p.id && e.force >= 0.08 * fMax).sort((x, y) => y.force - x.force).slice(0, 4);
    gardes.push(...ev.sort((x, y) => x.image - y.image));
  }
  evenements.length = 0;
  evenements.push(...gardes.map((e) => ({ ...e, force: +(e.force / fMax).toFixed(3) })));

  // Taille relative au plus fort du film : grand (≥ 50 %), moyen (≥ 25 %), petit.
  for (const e of evenements) e.taille = e.force >= 0.5 ? "grand" : e.force >= 0.25 ? "moyen" : "petit";

  const resultat = { video: path.basename(video), images: n, fps, empreinte: empreinteSources(), evenements };
  fs.writeFileSync(sortie, JSON.stringify(resultat, null, 1));
  console.log(`${evenements.length} événements repérés :`);
  for (const p of plans.filter((x) => !x.fin)) {
    const ev = evenements.filter((e) => e.plan === p.id);
    console.log(`  ${p.id.padEnd(22)} ${ev.map((e) => `image ${e.image}→${e.fin} (${e.taille})`).join(" · ") || "—"}`);
  }
  console.log(`→ ${path.relative(process.cwd(), sortie)}`);
}
