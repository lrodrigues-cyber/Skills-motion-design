#!/usr/bin/env node
// Bande-son du style « dashboard cinématique » : musique ORIGINALE + design sonore,
// calés image par image sur src/film/montage.json. Aucune dépendance (Node ≥ 18).
//
//   node scripts/bande-son.mjs                       → public/audio/bande-son.wav
//   node scripts/bande-son.mjs --montage x.json --sortie y.wav --graine 7
//   node scripts/bande-son.mjs --sfx-seuls        → design sonore seul (le client fournit la musique)
//
// Ce que l'analyse des 5 références a montré (et que ce script reproduit) :
//  • UN SEUL accord tenu pendant toute la vidéo (fa mineur, do mineur, la…) : bourdon sur la
//    tonique, couleurs d'accord qui glissent par-dessus, jamais de grille « chanson ».
//  • Sub très profond (énergie forte à 30–45 Hz), médiums chauds, AUCUN aigu brillant
//    (au-dessus de 8 kHz : -35 à -80 dB) : son sombre et doux.
//  • Stéréo large (corrélation G/D 0,5–0,8), réverbération ample.
//  • Une pulsation : motif répétitif en doubles-croches (« pulse », vidéo 4) ou nappe qui
//    respire (« nappe », vidéos 1-2) ; parfois une grosse caisse douce (vidéo 5).
//  • L'arrangement MONTE plan après plan (couches qui s'ajoutent, filtre qui s'ouvre),
//    puis tout s'arrête net à la révélation : souffle inversé, impact grave, longue traîne.
//  • Aucun bruit aux coupes, aucun clic d'interface : les effets sont musicaux
//    (montée tonale ou arpège qui monte pendant qu'un graphique pousse).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, "..");

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]?.startsWith("--") ? true : (all[i + 1] ?? true)]] : acc), []),
);
const SFX_SEULS = Boolean(args["sfx-seuls"]);
const fichierMontage = path.resolve(args.montage ?? path.join(racine, "src/film/montage.json"));
const fichierSortie = path.resolve(args.sortie ?? path.join(racine, "public/audio/bande-son.wav"));
const M = JSON.parse(fs.readFileSync(fichierMontage, "utf8"));

// ───────────────────────────── Chronologie (source unique : montage.json) ─────────────────────────────

const fps = M.fps;
let curseur = 0;
const plans = M.plans.map((p) => {
  const d = { ...p, debut: curseur };
  curseur += p.duree;
  return d;
});
const P = plans.map((p) => p.debut / fps); // début de chaque plan, en secondes
// Garde-fous sur le montage (les erreurs que le contrôle vidéo ne voit pas) :
for (const p of plans) {
  const decalages = Object.values(p.horloges ?? {});
  if (decalages.length && Math.max(...decalages) > -3)
    console.warn(`⚠ plan « ${p.id} » : horloge ≥ -3 → le plan risque de commencer vide (temps mort après la coupe). Mets -6 (ou -12 pour la barre du haut).`);
  if (p.duree < 75 || p.duree > 110) console.warn(`⚠ plan « ${p.id} » : ${p.duree} images (le style tient des plans de 88–92 images).`);
}

const fin = { type: "recul", logo: false, logoDebut: 48, logoDuree: 22, total: 120, ...(M.fin ?? {}) };
const debutFin = curseur;
const DUREE = (debutFin + (fin.type === "aucune" ? 0 : fin.total)) / fps;
const T_LOGO = fin.type === "aucune" || !fin.logo ? null : (debutFin + fin.logoDebut) / fps;
const D_LOGO = fin.logoDuree / fps;
// Révélation : coupe vers le recul, ou début du logo sur la barre du haut, ou début de la fin « barre ».
const T_REV = fin.type === "aucune" ? null : fin.type === "recul" || T_LOGO === null ? debutFin / fps : T_LOGO;
const T_MUSIQUE = T_REV ?? DUREE;
const planA = (k) => P[Math.min(k, P.length - 1)] ?? 0; // entrée des couches, plan par plan

const mus = { bpm: 92, tonique: "E", mode: "mineur", style: "pulse", revelation: "arret", queue: true, volume: 1, ...(M.musique ?? {}) };
const NOTES = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
const pc = NOTES[mus.tonique] ?? 4;
const MAJ = mus.mode === "majeur";
const TEMPS = 60 / mus.bpm;
const DC = TEMPS / 4; // double-croche
const MESURE = TEMPS * 4;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const GAMME = MAJ ? [0, 2, 4, 7, 9] : [0, 3, 7, 10, 14]; // pentatonique pour les arpèges qui montent

// Bourdon sur la tonique + deux couleurs d'accord qui alternent toutes les 2 mesures
// (demi-tons au-dessus de la tonique, octave 3).
const COULEURS = MAJ
  ? [
      [0, 7, 16, 19, 26],
      [-3, 4, 7, 12, 19],
    ]
  : [
      [0, 7, 15, 19, 26], // i (add9), voicing ouvert
      [-4, 3, 7, 12, 19], // VI maj7 au-dessus du bourdon
    ];
const couleurA = (t) => COULEURS[Math.floor(Math.max(0, t) / (MESURE * 2)) % COULEURS.length];
// Motif répétitif sur 2 mesures (tonique, quinte, octave, tierce, neuvième) : il reste sur le bourdon.
const MOTIF = MAJ
  ? [0, 12, 7, 12, 16, 12, 7, 12, 0, 12, 7, 12, 14, 12, 7, 9, 0, 12, 7, 12, 16, 12, 7, 12, 0, 12, 7, 14, 16, 14, 12, 7]
  : [0, 12, 7, 12, 15, 12, 7, 12, 0, 12, 7, 12, 14, 12, 7, 10, 0, 12, 7, 12, 15, 12, 7, 12, 0, 12, 7, 14, 15, 14, 12, 7];

let etat = Number(args.graine ?? 11) >>> 0 || 11;
const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

// ───────────────────────────── Outils DSP ─────────────────────────────

const N = Math.ceil((DUREE + 0.05) * SR);
const tampon = () => [new Float32Array(N), new Float32Array(N)];
const lisse = (x) => x * x * (3 - 2 * x);
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const expInterp = (a, b, t) => a * Math.pow(b / a, borne(t));
const fondu = (t, debut, duree) => lisse(borne((t - debut) / duree));

function polyblep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

/** Filtre d'état variable (TPT) : passe-bas / passe-bande / passe-haut, coupure modifiable à chaque échantillon. */
class SVF {
  constructor() {
    this.ic1 = 0;
    this.ic2 = 0;
  }
  run(x, fc, q = 0.7, mode = "lp") {
    const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const v3 = x - this.ic2;
    const v1 = a1 * this.ic1 + g * a1 * v3;
    const v2 = this.ic2 + g * v1;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    return mode === "bp" ? v1 : mode === "hp" ? x - k * v1 - v2 : v2;
  }
}

/** Réverbération type Freeverb (8 peignes + 4 passe-tout par canal) avec pré-délai. */
function reverb([L, R], { piece = 0.86, amorti = 0.35, predelai = 0.025 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const passes = [556, 441, 341, 225];
  const pd = Math.round(predelai * SR);
  const sortie = tampon();
  [L, R].forEach((entree, canal) => {
    const ecart = canal * 23;
    const cb = combs.map((d) => ({ buf: new Float32Array(d + ecart), i: 0, filt: 0 }));
    const ap = passes.map((d) => ({ buf: new Float32Array(d + ecart), i: 0 }));
    const out = sortie[canal];
    for (let n = 0; n < N; n++) {
      const x = (n >= pd ? entree[n - pd] : 0) * 0.015;
      let s = 0;
      for (const c of cb) {
        const y = c.buf[c.i];
        c.filt = y * (1 - amorti) + c.filt * amorti;
        c.buf[c.i] = x + c.filt * piece;
        if (++c.i === c.buf.length) c.i = 0;
        s += y;
      }
      for (const a of ap) {
        const b = a.buf[a.i];
        a.buf[a.i] = s + b * 0.5;
        if (++a.i === a.buf.length) a.i = 0;
        s = b - s;
      }
      out[n] = s;
    }
  });
  return sortie;
}

/** Écho ping-pong (gauche ↔ droite). */
function pingPong([L, R], retard, retour = 0.35, mixage = 0.3) {
  const d = Math.round(retard * SR);
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  const out = tampon();
  let i = 0;
  for (let n = 0; n < N; n++) {
    const yl = bl[i];
    const yr = br[i];
    bl[i] = (L[n] + R[n]) * 0.5 + yr * retour;
    br[i] = yl * retour;
    if (++i === d) i = 0;
    out[0][n] = L[n] + yl * mixage;
    out[1][n] = R[n] + yr * mixage;
  }
  return out;
}

/** Chorus stéréo : élargit et adoucit les nappes (corrélation G/D des références ≈ 0,5–0,8). */
function chorus([L, R], { base = 0.016, prof = 0.005, vitesse = 0.23, mixage = 0.75 } = {}) {
  const taille = Math.ceil((base + prof) * SR) + 4;
  const out = tampon();
  [L, R].forEach((x, c) => {
    const buf = new Float32Array(taille);
    let w = 0;
    for (let n = 0; n < N; n++) {
      buf[w] = x[n];
      const d = (base + prof * Math.sin(2 * Math.PI * vitesse * (n / SR) + c * Math.PI * 0.5)) * SR;
      let r = w - d;
      while (r < 0) r += taille;
      const i0 = Math.floor(r);
      const fr = r - i0;
      const y = buf[i0] * (1 - fr) + buf[(i0 + 1) % taille] * fr;
      out[c][n] = x[n] * (1 - mixage * 0.5) + y * mixage;
      if (++w === taille) w = 0;
    }
  });
  return out;
}

const ajoute = (dst, src, g = 1) => {
  for (let c = 0; c < 2; c++) for (let n = 0; n < N; n++) dst[c][n] += src[c][n] * g;
};

// Le son s'ouvre jusqu'à la révélation (coupure des filtres qui monte).
const ouverture = (t) => lisse(borne(t / T_MUSIQUE));
// Style « pulse » : la grosse caisse douce entre au 2e plan (tout bas) et creuse le reste à chaque temps.
const T_CAISSE = mus.style === "pulse" ? planA(1) : Infinity;
const pompe = (t, force) => (t < T_CAISSE ? 1 : 1 - force * Math.exp(-((t % TEMPS) / 0.13)));

// ───────────────────────────── Instruments ─────────────────────────────

const marge = 1.2; // on rend un peu au-delà de la révélation (arrêt de bande / filtre)

/** Sub-basse : sinus sur la tonique à l'octave 1 (33–62 Hz), légèrement saturé pour exister sur téléphone. */
function subBasse() {
  const out = tampon();
  const f = hz(24 + pc);
  const drive = 1.6;
  let ph = 0;
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    if (t > T_MUSIQUE + marge) break;
    ph += f / SR;
    const s = Math.tanh(drive * Math.sin(2 * Math.PI * ph)) / Math.tanh(drive);
    const env = fondu(t, 0, 0.35) * (0.75 + 0.25 * ouverture(t)) * pompe(t, 0.5);
    out[0][n] = out[1][n] = s * env * 0.12;
  }
  return out;
}

/** Nappe : 5 scies désaccordées par note, filtrée chaud, couleurs d'accord en fondu enchaîné. */
function nappe() {
  const brut = tampon();
  for (let t0 = 0; t0 < T_MUSIQUE + marge; t0 += MESURE * 2) {
    const voix = [];
    for (const iv of couleurA(t0)) for (let k = 0; k < 5; k++) voix.push({ f: hz(48 + pc + iv) * Math.pow(2, ((k - 2) * 7) / 1200), ph: alea(), pan: k / 4 });
    const debut = Math.max(0, t0 - 0.8);
    const finSeg = t0 + MESURE * 2 + 0.8;
    for (let n = Math.round(debut * SR); n < Math.min(N, finSeg * SR); n++) {
      const t = n / SR;
      const env = (t0 === 0 ? fondu(t, 0, 1.4) : fondu(t, debut, 1.6)) * (1 - fondu(t, finSeg - 1.6, 1.6));
      if (env <= 0) continue;
      let l = 0,
        r = 0;
      for (const v of voix) {
        const dt = v.f / SR;
        v.ph += dt;
        if (v.ph >= 1) v.ph -= 1;
        const s = 2 * v.ph - 1 - polyblep(v.ph, dt);
        l += s * (1 - v.pan);
        r += s * v.pan;
      }
      brut[0][n] += l * env;
      brut[1][n] += r * env;
    }
  }
  const out = tampon();
  const f = [new SVF(), new SVF(), new SVF(), new SVF()];
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    // respiration lente + ouverture progressive ; style « nappe » : trémolo en croches dès le 2e plan
    const fc = expInterp(420, 2300, ouverture(t)) * (1 + 0.15 * Math.sin(2 * Math.PI * t * 0.11));
    const trem = mus.style === "nappe" && t > planA(1) ? 1 - 0.35 * fondu(t, planA(1), 2) * (0.5 + 0.5 * Math.cos(2 * Math.PI * (t / (TEMPS / 2)))) : 1;
    const g = 0.034 * pompe(t, 0.3) * trem;
    for (let c = 0; c < 2; c++) out[c][n] = f[c + 2].run(f[c].run(brut[c][n], fc, 0.6), fc * 1.4, 0.6) * g;
  }
  return chorus(out);
}

/** Note « pluck » douce : triangle + un peu de carré, filtrés, petite cloche FM à l'attaque (côté verre). */
function pluck(out, t0, midi, vel, fcBase, pan, decroissance = 0.16, verre = 0.35) {
  const f = hz(midi);
  const dt = f / SR;
  const svf = new SVF();
  const n0 = Math.round(t0 * SR);
  const len = Math.round(decroissance * 6 * SR);
  let ph = alea(),
    tri = 0,
    phb = 0;
  for (let i = 0; i < len && n0 + i < N; i++) {
    const tn = i / SR;
    ph += dt;
    if (ph >= 1) ph -= 1;
    const sq = (ph < 0.5 ? 1 : -1) + polyblep(ph, dt) - polyblep((ph + 0.5) % 1, dt);
    tri = tri * 0.999 + sq * dt * 4; // carré intégré ≈ triangle
    phb += (f * 2) / SR;
    const cloche = Math.sin(2 * Math.PI * phb + 1.2 * Math.sin(2 * Math.PI * phb * 1.5)) * Math.exp(-tn / 0.05) * verre;
    const env = Math.min(1, tn / 0.003) * Math.exp(-tn / decroissance);
    const fc = fcBase * (1 + 2.5 * Math.exp(-tn / 0.035));
    const s = (svf.run(tri * 0.8 + sq * 0.12, fc, 0.9) + cloche) * env * vel;
    out[0][n0 + i] += s * (1 - pan);
    out[1][n0 + i] += s * pan;
  }
}

/** Motif répétitif en doubles-croches (style « pulse ») — il reste sur le bourdon. */
function ostinato(debut, finT, { gain = 1, octave = 0, densite = 1, fcFixe = null, verre = 0.35 } = {}) {
  const out = tampon();
  for (let i = Math.ceil(debut / DC); i * DC < finT; i++) {
    if (densite < 1 && i % Math.round(1 / densite) !== 0) continue;
    const t = i * DC;
    const note = 60 + pc + MOTIF[i % MOTIF.length] + octave * 12;
    const accent = i % 4 === 0 ? 1 : i % 2 === 0 ? 0.7 : 0.5;
    // discret au 1er plan, présent dès le 2e, plus fort en approchant de la révélation
    const presence = 0.62 + 0.23 * fondu(t, planA(1), 1.5) + 0.15 * ouverture(t);
    const fc = fcFixe ?? expInterp(650, 4200, ouverture(t));
    pluck(out, t, note, accent * presence * gain * 0.3, fc, 0.5 + 0.42 * Math.sin(i * 1.7), 0.16, verre);
  }
  return out;
}

/** Grosse caisse douce (style « pulse », dès le 2e plan) : sinus qui descend, sans clic. */
function caisse(debut, finT) {
  const out = tampon();
  for (let k = Math.ceil(debut / TEMPS); k * TEMPS < finT; k++) {
    const t0 = k * TEMPS;
    const v = (k % 4 === 0 ? 1 : 0.8) * (0.4 + 0.6 * fondu(t0, debut, MESURE * 2));
    let ph = 0;
    const n0 = Math.round(t0 * SR);
    for (let i = 0; i < 1.2 * SR && n0 + i < N; i++) {
      const tn = i / SR;
      ph += expInterp(110, 44, tn / 0.08) / SR;
      const s = Math.sin(2 * Math.PI * ph) * Math.min(1, tn / 0.002) * Math.exp(-tn / 0.22) * v * 0.5;
      out[0][n0 + i] += s;
      out[1][n0 + i] += s;
    }
  }
  return out;
}

/** Scintillement aigu doux (dès le 4e plan) : le motif à l'octave, une note sur deux, filtré. */
const scintillement = (debut, finT) => ostinato(debut, finT, { gain: 0.45, octave: 1, densite: 0.5, fcFixe: 3200, verre: 0.6 });

// ───────────────────────────── Design sonore ─────────────────────────────

/** Montée tonale (graphique qui pousse) : 3 voix triangle qui glissent ensemble + souffle discret. */
function montee(out, t0, duree) {
  const f0 = hz(48 + pc);
  const f1 = f0 * Math.pow(2, 19 / 12);
  const voix = [-6, 0, 6].map((c) => ({ c, ph: alea() }));
  const bp = [new SVF(), new SVF()];
  const n0 = Math.round(t0 * SR);
  for (let i = 0; i < (duree + 1.0) * SR && n0 + i < N; i++) {
    const tn = i / SR;
    const p = borne(tn / duree);
    const f = expInterp(f0, f1, lisse(p));
    let s = 0;
    for (const v of voix) {
      v.ph += (f * Math.pow(2, v.c / 1200)) / SR;
      s += 4 * Math.abs((v.ph % 1) - 0.5) - 1;
    }
    const env = fondu(tn, 0, 0.35) * (tn < duree ? 0.55 + 0.45 * p : Math.exp(-(tn - duree) / 0.18));
    const bruit = bp[0].run(alea() * 2 - 1, f * 4, 2.5, "bp") * 0.5;
    const y = (bp[1].run(s / 3, f * 2.2, 0.8) + bruit) * env * 0.11;
    out[0][n0 + i] += y * 0.85;
    out[1][n0 + i] += y;
  }
}

/** Arpège qui monte, note par note, pendant que des barres poussent. */
function arpege(out, t0, duree) {
  const nb = Math.max(4, Math.round(duree / DC));
  for (let k = 0; k < nb; k++) {
    const deg = GAMME[k % GAMME.length] + 12 * Math.floor(k / GAMME.length);
    const v = 0.5 + 0.5 * (k / (nb - 1));
    pluck(out, t0 + k * DC, 64 + pc + deg, v * 0.22, 5200, 0.25 + 0.5 * (k / (nb - 1)), 0.22, 0.7);
  }
}

/** Souffle qui gonfle et se coupe net (avant une coupe importante). */
function souffle(out, t0, duree) {
  const bp = [new SVF(), new SVF()];
  const n0 = Math.max(0, Math.round(t0 * SR));
  for (let i = 0; i < duree * SR && n0 + i < N; i++) {
    const p = i / (duree * SR);
    const fc = expInterp(300, 2600, p);
    const env = Math.pow(p, 2.4) * borne((1 - p) / 0.03);
    out[0][n0 + i] += bp[0].run(alea() * 2 - 1, fc, 1.2, "bp") * env * 0.2;
    out[1][n0 + i] += bp[1].run(alea() * 2 - 1, fc * 1.08, 1.2, "bp") * env * 0.2;
  }
}

/** Souffle INVERSÉ avant la révélation : la réverbération d'un accord, jouée à l'envers. */
function souffleInverse(out, tFin, duree = 0.9) {
  const acc = tampon();
  const notes = couleurA(tFin - 0.1).map((iv) => hz(60 + pc + iv));
  for (let i = 0; i < 0.25 * SR; i++) {
    let s = 0;
    for (const f of notes) s += Math.sin((2 * Math.PI * f * i) / SR);
    const e = Math.exp(-i / SR / 0.08) * 0.12;
    acc[0][i] += s * e;
    acc[1][i] += s * e;
  }
  const r = reverb(acc, { piece: 0.93, amorti: 0.45, predelai: 0 });
  const n1 = Math.round(tFin * SR);
  const nd = Math.round(duree * SR);
  for (let i = 0; i < nd; i++) {
    const n = n1 - nd + i;
    if (n < 0) continue;
    const src = nd - 1 - i; // lecture à l'envers
    const env = lisse(i / nd);
    out[0][n] += r[0][src] * env * 2.2;
    out[1][n] += r[1][src] * env * 2.2;
  }
}

/** Impact de la révélation : boum grave qui descend + souffle sourd. */
function impact(out, t0) {
  const lp = [new SVF(), new SVF()];
  let ph = 0;
  const n0 = Math.round(t0 * SR);
  for (let i = 0; i < 4.5 * SR && n0 + i < N; i++) {
    const tn = i / SR;
    ph += expInterp(62, 31, borne(tn / 0.9)) / SR;
    const corps = Math.sin(2 * Math.PI * ph) * Math.min(1, tn / 0.004) * Math.exp(-tn / 1.1) * (1 - fondu(tn, 3.6, 0.9)) * 0.6;
    const bruit = (alea() * 2 - 1) * Math.exp(-tn / 0.4) * 0.3;
    out[0][n0 + i] += corps + lp[0].run(bruit, 700, 0.7);
    out[1][n0 + i] += corps + lp[1].run(bruit, 760, 0.7);
  }
}

/** Scintillement du logo (seulement si fin.logo) : souffle aérien + cloche douce. */
function scintillementLogo(out, t0, duree) {
  const bp = [new SVF(), new SVF()];
  const n0 = Math.round(t0 * SR);
  for (let i = 0; i < (duree + 0.5) * SR && n0 + i < N; i++) {
    const tn = i / SR;
    const p = borne(tn / duree);
    const env = lisse(p) * (tn < duree ? 1 : Math.exp(-(tn - duree) / 0.15));
    out[0][n0 + i] += bp[0].run(alea() * 2 - 1, expInterp(800, 2600, p), 2.2, "bp") * env * 0.14;
    out[1][n0 + i] += bp[1].run(alea() * 2 - 1, expInterp(880, 2900, p), 2.2, "bp") * env * 0.14;
  }
  pluck(out, t0 + duree * 0.92, 76 + pc, 0.2, 6000, 0.5, 0.5, 0.9);
  pluck(out, t0 + duree * 0.92, 83 + pc, 0.12, 6000, 0.5, 0.5, 0.9);
}

// ───────────────────────────── Assemblage ─────────────────────────────

console.log(
  `Bande-son : ${DUREE.toFixed(2)} s, ${mus.bpm} BPM, ${mus.tonique} ${mus.mode}, style ${mus.style}, révélation ${T_REV?.toFixed(2) ?? "—"} s${T_LOGO ? `, logo ${T_LOGO.toFixed(2)} s` : ""}`,
);

// 1. musique : l'arrangement s'enrichit plan après plan
const musique = tampon();
if (!SFX_SEULS) {
  const FINM = T_MUSIQUE + marge;
  const nap = nappe();
  ajoute(musique, subBasse(), 1);
  ajoute(musique, nap, 1);
  const envoi = tampon();
  ajoute(envoi, nap, 0.5);
  if (mus.style === "pulse") {
    const ost = pingPong(ostinato(0, FINM), DC * 3, 0.32, 0.28);
    ajoute(musique, ost, 1);
    ajoute(envoi, ost, 0.45);
    ajoute(musique, caisse(T_CAISSE, T_MUSIQUE), 1);
  } else {
    const ost = pingPong(ostinato(planA(2), FINM, { gain: 0.55, densite: 0.5 }), DC * 3, 0.4, 0.35);
    ajoute(musique, ost, 1);
    ajoute(envoi, ost, 0.6);
  }
  const sci = pingPong(scintillement(planA(3), FINM), DC * 3, 0.4, 0.35);
  ajoute(musique, sci, 1);
  ajoute(envoi, sci, 0.7);
  ajoute(musique, reverb(envoi, { piece: 0.88 }), 1.2);
}

// 2. la musique s'arrête à la révélation
if (T_REV !== null && !SFX_SEULS) {
  const n0 = Math.round(T_REV * SR);
  if (mus.revelation === "filtre") {
    // le filtre se ferme d'un coup, le niveau tombe (vidéo 2)
    const lp = [new SVF(), new SVF()];
    for (let n = n0; n < N; n++) {
      const tn = (n - n0) / SR;
      const fc = expInterp(3000, 160, borne(tn / 0.35));
      const g = Math.exp(-tn / 0.9);
      for (let c = 0; c < 2; c++) musique[c][n] = lp[c].run(musique[c][n], fc, 0.7) * g;
    }
  } else {
    // arrêt de bande : la lecture ralentit jusqu'à zéro en 0,45 s (vidéo 4)
    const source = [Float32Array.from(musique[0]), Float32Array.from(musique[1])];
    let lecture = n0;
    const D = 0.45 * SR;
    for (let n = n0; n < N; n++) {
      const k = n - n0;
      const vitesse = k < D ? Math.pow(1 - k / D, 1.5) : 0;
      lecture += vitesse;
      const i = Math.floor(lecture);
      const fr = lecture - i;
      const g = k < D ? 1 - Math.pow(k / D, 3) : 0;
      for (let c = 0; c < 2; c++) musique[c][n] = (source[c][i] * (1 - fr) + (source[c][i + 1] ?? 0) * fr) * g;
    }
  }
}

// 3. design sonore
const sfx = tampon();
for (const p of plans) {
  for (const e of p.son ?? []) {
    const t0 = (p.debut + (e.a ?? 0)) / fps;
    const d = (e.duree ?? 30) / fps;
    if (e.type === "montee") montee(sfx, t0, d);
    if (e.type === "arpege") arpege(sfx, t0, d);
    if (e.type === "souffle") souffle(sfx, t0, d);
    if (e.type === "impact") impact(sfx, t0);
  }
}
if (T_REV !== null) {
  souffleInverse(sfx, T_REV);
  impact(sfx, T_REV);
  // traîne : la nappe continue, très filtrée, et s'éteint (vidéos 1 et 3)
  if (mus.queue !== false && !SFX_SEULS) {
    const q = tampon();
    const lp = [new SVF(), new SVF()];
    const voix = couleurA(T_REV - 0.1).flatMap((iv) => [-8, 8].map((c) => ({ f: hz(48 + pc + iv) * Math.pow(2, c / 1200), ph: alea() })));
    for (let n = Math.round(T_REV * SR); n < N; n++) {
      const tn = n / SR - T_REV;
      let s = 0;
      for (const v of voix) {
        v.ph += v.f / SR;
        if (v.ph >= 1) v.ph -= 1;
        s += 2 * v.ph - 1;
      }
      const env = fondu(tn, 0.15, 0.6) * Math.exp(-tn / 1.4) * 0.016;
      q[0][n] = lp[0].run(s, 380, 0.7) * env;
      q[1][n] = lp[1].run(s, 420, 0.7) * env;
    }
    ajoute(sfx, chorus(q), 1);
  }
}
if (T_LOGO !== null) scintillementLogo(sfx, T_LOGO, D_LOGO);
ajoute(sfx, reverb(sfx, { piece: 0.9, amorti: 0.4, predelai: 0.03 }), 0.6);

// 4. mastering : niveau (RMS -18 dBFS sur la partie musicale, comme les références),
//    aigus adoucis (références sombres au-dessus de 8 kHz), limiteur doux (crêtes ≤ -4 dBFS).
const mix = tampon();
ajoute(mix, musique, 1);
ajoute(mix, sfx, 1);
const nMus = Math.round((T_REV ?? DUREE) * SR);
let somme = 0;
for (let n = 0; n < nMus; n++) somme += (mix[0][n] ** 2 + mix[1][n] ** 2) / 2;
let creteAvant = 0;
for (let c = 0; c < 2; c++) for (let n = 0; n < N; n++) creteAvant = Math.max(creteAvant, Math.abs(mix[c][n]));
const rmsAvant = Math.sqrt(somme / nMus) || 1;
const gain = SFX_SEULS ? (Math.pow(10, -6 / 20) / (creteAvant || 1)) * mus.volume : (Math.pow(10, -18 / 20) / rmsAvant) * mus.volume;
const SEUIL = 0.45;
const PLAFOND = Math.pow(10, -4 / 20);
const limite = (x) => {
  const a = Math.abs(x);
  return a <= SEUIL ? x : Math.sign(x) * (SEUIL + (PLAFOND - SEUIL) * Math.tanh((a - SEUIL) / (PLAFOND - SEUIL)));
};
const doux = [new SVF(), new SVF()];
const fonduFin = Math.round(0.4 * SR);
let crete = 0;
for (let c = 0; c < 2; c++)
  for (let n = 0; n < N; n++) {
    let s = limite(doux[c].run(mix[c][n] * gain, 8500, 0.6));
    if (n > N - fonduFin) s *= (N - n) / fonduFin;
    if (n < 64) s *= n / 64;
    mix[c][n] = s;
    crete = Math.max(crete, Math.abs(s));
  }
somme = 0;
for (let n = 0; n < nMus; n++) somme += (mix[0][n] ** 2 + mix[1][n] ** 2) / 2;
console.log(`Crête ${(20 * Math.log10(crete)).toFixed(1)} dBFS · RMS (partie musicale) ${(10 * Math.log10(somme / nMus)).toFixed(1)} dBFS`);

// 5. écriture WAV 16 bits stéréo
const octets = N * 4;
const wav = Buffer.alloc(44 + octets);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + octets, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(SR, 24);
wav.writeUInt32LE(SR * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(octets, 40);
for (let n = 0; n < N; n++) {
  wav.writeInt16LE(Math.round(borne(mix[0][n], -1, 1) * 32767), 44 + n * 4);
  wav.writeInt16LE(Math.round(borne(mix[1][n], -1, 1) * 32767), 46 + n * 4);
}
fs.mkdirSync(path.dirname(fichierSortie), { recursive: true });
fs.writeFileSync(fichierSortie, wav);
console.log(`→ ${path.relative(process.cwd(), fichierSortie)}`);
