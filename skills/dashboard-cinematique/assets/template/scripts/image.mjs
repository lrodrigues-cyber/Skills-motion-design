// Petits outils d'image partagés par capture.mjs et fidelite.mjs (ffmpeg + ffprobe, aucune dépendance npm).
// Une image = { l, h, px } avec px en RGB 8 bits (3 octets par pixel, ligne par ligne).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function dimensions(fichier) {
  const [l, h] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", fichier])
    .toString()
    .trim()
    .split(",")
    .map(Number);
  return { l, h };
}

/** Lit une image (PNG, JPG, WebP…). `largeur`/`hauteur` : redimensionne ; `flou` : flou gaussien (sigma, px). */
export function lire(fichier, { largeur, hauteur, flou } = {}) {
  if (!fs.existsSync(fichier)) throw new Error(`image introuvable : ${fichier}`);
  const d = dimensions(fichier);
  const l = largeur ?? d.l,
    h = hauteur ?? d.h;
  const filtres = [];
  if (l !== d.l || h !== d.h) filtres.push(`scale=${l}:${h}:flags=area`);
  if (flou) filtres.push(`gblur=sigma=${flou}`);
  const px = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", fichier, ...(filtres.length ? ["-vf", filtres.join(",")] : []), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { maxBuffer: 2 ** 31 },
  );
  return { l, h, px };
}

export function ecrire(fichier, img) {
  fs.mkdirSync(path.dirname(path.resolve(fichier)), { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${img.l}x${img.h}`, "-i", "-", "-frames:v", "1", fichier], {
    input: img.px,
  });
}

export const vide = (l, h, fond = [0, 0, 0]) => {
  const px = Buffer.alloc(l * h * 3);
  for (let k = 0; k < l * h; k++) px.set(fond, 3 * k);
  return { l, h, px };
};

export const pixel = (img, x, y) => {
  const o = 3 * (Math.max(0, Math.min(img.h - 1, y)) * img.l + Math.max(0, Math.min(img.l - 1, x)));
  return [img.px[o], img.px[o + 1], img.px[o + 2]];
};

export const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export const luminance = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

export const saturation = ([r, g, b]) => {
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
};

/** Couleur la plus fréquente d'un rectangle (couleur « à plat », sans l'anticrénelage du texte). */
export function dominante(img, x, y, l, h) {
  const compte = new Map();
  for (let j = Math.max(0, y); j < Math.min(img.h, y + h); j++)
    for (let i = Math.max(0, x); i < Math.min(img.l, x + l); i++) {
      const o = 3 * (j * img.l + i);
      const c = (img.px[o] << 16) | (img.px[o + 1] << 8) | img.px[o + 2];
      compte.set(c, (compte.get(c) ?? 0) + 1);
    }
  let meilleur = 0,
    n = -1;
  for (const [c, k] of compte) if (k > n) (meilleur = c), (n = k);
  return [(meilleur >> 16) & 255, (meilleur >> 8) & 255, meilleur & 255];
}

export function recadrer(img, x, y, l, h) {
  const r = vide(l, h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < l; i++) {
      const sx = x + i,
        sy = y + j;
      if (sx < 0 || sy < 0 || sx >= img.l || sy >= img.h) continue;
      img.px.copy(r.px, 3 * (j * l + i), 3 * (sy * img.l + sx), 3 * (sy * img.l + sx) + 3);
    }
  return r;
}

/** Agrandissement au plus proche voisin : les pixels restent lisibles (pour inspecter, pas pour livrer). */
export function agrandir(img, k) {
  if (k === 1) return img;
  const r = vide(img.l * k, img.h * k);
  for (let j = 0; j < r.h; j++)
    for (let i = 0; i < r.l; i++) {
      const o = 3 * (Math.floor(j / k) * img.l + Math.floor(i / k));
      r.px[3 * (j * r.l + i)] = img.px[o];
      r.px[3 * (j * r.l + i) + 1] = img.px[o + 1];
      r.px[3 * (j * r.l + i) + 2] = img.px[o + 2];
    }
  return r;
}

export function coller(dest, src, x, y) {
  for (let j = 0; j < src.h; j++) {
    const dy = y + j;
    if (dy < 0 || dy >= dest.h) continue;
    for (let i = 0; i < src.l; i++) {
      const dx = x + i;
      if (dx < 0 || dx >= dest.l) continue;
      src.px.copy(dest.px, 3 * (dy * dest.l + dx), 3 * (j * src.l + i), 3 * (j * src.l + i) + 3);
    }
  }
}

/** Mélange une couleur sur un pixel (a = opacité 0–1). */
export function peindre(img, x, y, c, a = 1) {
  if (x < 0 || y < 0 || x >= img.l || y >= img.h) return;
  const o = 3 * (y * img.l + x);
  for (let k = 0; k < 3; k++) img.px[o + k] = Math.round(img.px[o + k] * (1 - a) + c[k] * a);
}

export function rectangle(img, x, y, l, h, c, epaisseur = 2, a = 1) {
  for (let e = 0; e < epaisseur; e++) {
    for (let i = x; i < x + l; i++) peindre(img, i, y + e, c, a), peindre(img, i, y + h - 1 - e, c, a);
    for (let j = y; j < y + h; j++) peindre(img, x + e, j, c, a), peindre(img, x + l - 1 - e, j, c, a);
  }
}

export function pave(img, x, y, l, h, c, a = 1) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + l; i++) peindre(img, i, j, c, a);
}

// Police bitmap 5×7 (chiffres et quelques signes) pour annoter les images sans dépendre d'une police système.
const GLYPHES = {
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ",": ["00000", "00000", "00000", "00000", "00110", "00100", "01000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

/** Écrit un texte (chiffres) avec un fond pour rester lisible sur n'importe quelle image. */
export function etiquette(img, x, y, texte, c = [255, 255, 255], fond = [0, 0, 0], k = 2) {
  const s = String(texte);
  const l = s.length * 6 * k + 2 * k,
    h = 9 * k;
  pave(img, x, y, l, h, fond, 0.75);
  [...s].forEach((ch, n) => {
    const g = GLYPHES[ch] ?? GLYPHES[" "];
    for (let j = 0; j < 7; j++)
      for (let i = 0; i < 5; i++)
        if (g[j][i] === "1") pave(img, x + k + (n * 6 + i) * k, y + k + j * k, k, k, c);
  });
  return { l, h };
}
