#!/usr/bin/env node
// Bande-son du style « dashboard cinématique » : musique ORIGINALE + design sonore,
// calés image par image sur src/film/montage.json. Aucune dépendance (Node ≥ 18).
//
//   node scripts/bande-son.mjs                       → public/audio/bande-son.wav
//   node scripts/bande-son.mjs --montage x.json --sortie y.wav --graine 7
//   node scripts/bande-son.mjs --sfx-seuls        → design sonore seul (le client fournit la musique)
//
// Grammaire sonore relevée sur les 5 références :
//  • Nappe électronique sombre, mode mineur, ~90–100 BPM : sub-basse tenue, accords de pad
//    filtrés, pulsation en doubles-croches (arpège « pluck ») qui pompe sur chaque temps.
//  • Le filtre s'ouvre lentement pendant tous les plans rapprochés (le son s'éclaircit
//    jusqu'à la révélation) : centroïde spectral ≈ 600 Hz au début → 1 700 Hz avant la fin.
//  • Effets calés sur l'image (peu nombreux, musicaux, jamais de « clic » d'UI) :
//      montee   : glissando tonal qui monte pendant qu'un graphique pousse (barres, courbe)
//      souffle  : souffle de bruit qui gonfle et se coupe net sur une coupe importante
//      revelation (recul / logo) : la musique s'arrête (arrêt de bande ou filtre qui se ferme)
//                 + impact grave + queue de réverbération
//      logo     : scintillement aérien qui suit le tracé, cloche douce quand il se termine
//      echo     : l'arpège continue tout bas, filtré, et s'éteint (fin de la vidéo 4)
//  • Mixage « musique devant » : crêtes ≈ -6 dBFS, RMS ≈ -16 à -20 dBFS, silence à la fin.

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
const fin = { type: "recul", logoDebut: 48, logoDuree: 22, total: 150, ...(M.fin ?? {}) };
const debutFin = curseur;
const DUREE = (debutFin + (fin.type === "aucune" ? 0 : fin.total)) / fps;
const T_LOGO = fin.type === "aucune" ? null : (debutFin + fin.logoDebut) / fps;
const D_LOGO = fin.logoDuree / fps;
// Révélation : coupe vers le recul (vidéos 2-3) ou début du logo sur un gros plan (vidéos 1-4).
const T_REV = fin.type === "aucune" ? null : fin.type === "recul" ? debutFin / fps : T_LOGO;

const mus = { bpm: 94, tonique: "E", mode: "mineur", revelation: "arret", volume: 1, ...(M.musique ?? {}) };
const NOTES = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
const pc = NOTES[mus.tonique] ?? 4;
const TEMPS = 60 / mus.bpm;
const DC = TEMPS / 4; // double-croche
const ACCORD_DUREE = TEMPS * 8; // 2 mesures par accord

// Progressions originales (degrés, demi-tons relatifs à la tonique).
const PROGRESSIONS = {
  mineur: [
    [0, 3, 7, 14], // i (add9)
    [-4, 0, 3, 7], // VI maj7
    [-9, -5, -2, 3], // iv7 (renversé)
    [-2, 2, 5, 10], // VII
  ],
  majeur: [
    [0, 4, 7, 14],
    [-3, 0, 4, 7],
    [-7, -3, 0, 4],
    [-5, -1, 2, 7],
  ],
};
const progression = PROGRESSIONS[mus.mode === "majeur" ? "majeur" : "mineur"];
const accordA = (t) => progression[Math.floor(t / ACCORD_DUREE) % progression.length];
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Graine → aléatoire déterministe (même montage = même bande-son).
let etat = Number(args.graine ?? 11) >>> 0 || 11;
const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

// ───────────────────────────── Outils DSP ─────────────────────────────

const N = Math.ceil((DUREE + 0.05) * SR);
const tampon = () => [new Float32Array(N), new Float32Array(N)];
const lisse = (x) => x * x * (3 - 2 * x);
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const expInterp = (a, b, t) => a * Math.pow(b / a, borne(t));

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

/** Filtre d'état variable (TPT) : passe-bas / passe-bande, coupure modifiable à chaque échantillon. */
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

/** Réverbération type Freeverb (8 filtres en peigne + 4 passe-tout par canal). */
function reverb([L, R], { piece = 0.86, amorti = 0.3, humide = 1 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const passes = [556, 441, 341, 225];
  const sortie = tampon();
  [L, R].forEach((entree, canal) => {
    const ecart = canal * 23;
    const cb = combs.map((d) => ({ buf: new Float32Array(d + ecart), i: 0, filt: 0 }));
    const ap = passes.map((d) => ({ buf: new Float32Array(d + ecart), i: 0 }));
    const out = sortie[canal];
    for (let n = 0; n < N; n++) {
      const x = (entree[n] ?? 0) * 0.015;
      let s = 0;
      for (const c of cb) {
        const y = c.buf[c.i];
        c.filt = y * (1 - amorti) + c.filt * amorti;
        c.buf[c.i] = x + c.filt * piece;
        c.i = (c.i + 1) % c.buf.length;
        s += y;
      }
      for (const a of ap) {
        const b = a.buf[a.i];
        a.buf[a.i] = s + b * 0.5;
        a.i = (a.i + 1) % a.buf.length;
        s = b - s;
      }
      out[n] = s * humide;
    }
  });
  return sortie;
}

/** Écho ping-pong (gauche ↔ droite). */
function pingPong([L, R], retard, retour = 0.38, mixage = 0.32) {
  const d = Math.round(retard * SR);
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  const out = tampon();
  let i = 0;
  for (let n = 0; n < N; n++) {
    const yl = bl[i];
    const yr = br[i];
    bl[i] = L[n] + yr * retour;
    br[i] = R[n] * 0.3 + yl * retour;
    i = (i + 1) % d;
    out[0][n] = L[n] + yl * mixage;
    out[1][n] = R[n] + yr * mixage;
  }
  return out;
}

const ajoute = (dst, src, g = 1) => {
  for (let c = 0; c < 2; c++) for (let n = 0; n < N; n++) dst[c][n] += src[c][n] * g;
};

// Automation de la coupure : le son s'ouvre jusqu'à la révélation.
const T_OUVERT = T_REV ?? DUREE;
const ouverture = (t) => lisse(borne(t / T_OUVERT));
// Pompe (sidechain sans grosse caisse) : le volume se creuse sur chaque temps.
const pompe = (t, force) => 1 - force * Math.exp(-((t % TEMPS) / 0.11));

// ───────────────────────────── Musique ─────────────────────────────

const T_MUSIQUE = T_REV ?? DUREE; // la musique s'arrête à la révélation (ou à la fin)
const marge = 1.2; // on rend un peu au-delà pour l'arrêt de bande / la fermeture du filtre

function subBasse() {
  const out = tampon();
  let phase = 0;
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    if (t > T_MUSIQUE + marge) break;
    const a = accordA(t);
    // fondamentale de l'accord ramenée entre ~45 et ~90 Hz
    let rr = ((a[0] % 12) + 12) % 12;
    if (rr > 5) rr -= 12;
    const f = hz((pc <= 4 ? 36 : 24) + pc + rr);
    phase += f / SR;
    const tc = t % ACCORD_DUREE;
    const env = borne(t / 0.25) * borne(tc / 0.06) * borne((ACCORD_DUREE - tc) / 0.06);
    const s = (Math.sin(2 * Math.PI * phase) + 0.18 * Math.sin(4 * Math.PI * phase)) * env * pompe(t, 0.45) * 0.2;
    out[0][n] = s;
    out[1][n] = s;
  }
  return out;
}

function pad() {
  const out = tampon();
  const voix = [];
  for (let k = 0; k < 4; k++) for (const d of [-0.07, 0, 0.07]) voix.push({ k, d, phase: alea(), pan: d === 0 ? 0.5 : d < 0 ? 0.15 : 0.85 });
  const filtres = [new SVF(), new SVF()];
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    if (t > T_MUSIQUE + marge) break;
    const a = accordA(t);
    const tc = t % ACCORD_DUREE;
    const env = borne(t / 0.5) * (0.35 + 0.65 * lisse(borne(tc / 0.9))) * borne((ACCORD_DUREE - tc) / 0.12);
    let l = 0,
      r = 0;
    for (const v of voix) {
      const f = hz(48 + pc + a[v.k] + v.d);
      const dt = f / SR;
      v.phase += dt;
      if (v.phase >= 1) v.phase -= 1;
      const s = 2 * v.phase - 1 - polyblep(v.phase, dt);
      l += s * (1 - v.pan);
      r += s * v.pan;
    }
    const fc = expInterp(320, 2600, ouverture(t)) * (1 + 0.12 * Math.sin(2 * Math.PI * t * 0.15));
    const g = env * pompe(t, 0.28) * 0.07;
    out[0][n] = filtres[0].run(l, fc, 0.8) * g;
    out[1][n] = filtres[1].run(r, fc, 0.8) * g;
  }
  return out;
}

/** Une note « pluck » (scie + carré filtrés, attaque immédiate, décroissance courte). */
function pluck(out, t0, midi, vel, fcBase, pan, decroissance = 0.11) {
  const f = hz(midi);
  const dt = f / SR;
  const svf = new SVF();
  const n0 = Math.round(t0 * SR);
  const len = Math.round(decroissance * 7 * SR);
  let ph = alea();
  for (let i = 0; i < len && n0 + i < N; i++) {
    const tn = i / SR;
    ph += dt;
    if (ph >= 1) ph -= 1;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const sq = (ph < 0.5 ? 1 : -1) + polyblep(ph, dt) - polyblep((ph + 0.5) % 1, dt);
    const env = Math.min(1, tn / 0.002) * Math.exp(-tn / decroissance);
    const fc = fcBase * (1 + 3.5 * Math.exp(-tn / 0.04));
    const s = svf.run(0.6 * saw + 0.4 * sq, fc, 1.1) * env * vel;
    out[0][n0 + i] += s * (1 - pan);
    out[1][n0 + i] += s * pan;
  }
}

const MOTIF = [0, 2, 1, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2];

function arpege(debut, finT, gain = 1, fcFixe = null) {
  const out = tampon();
  const premier = Math.ceil(debut / DC);
  for (let i = premier; i * DC < finT; i++) {
    const t = i * DC;
    const a = accordA(t);
    const note = 60 + pc + a[MOTIF[i % MOTIF.length]] + (i % 32 >= 16 && MOTIF[i % 16] === 3 ? 12 : 0);
    const accent = i % 4 === 0 ? 1 : i % 2 === 0 ? 0.72 : 0.55;
    const entree = borne(t / 1.2) * (0.55 + 0.45 * ouverture(t));
    const fc = fcFixe ?? expInterp(700, 5200, ouverture(t));
    pluck(out, t, note, accent * entree * gain * 0.34, fc, 0.3 + 0.4 * ((i * 7) % 5) / 4);
  }
  return out;
}

function tics() {
  // tics très légers sur les croches à contretemps (transitoires larges bande des références)
  const out = tampon();
  const hp = [new SVF(), new SVF()];
  for (let i = 1; i * TEMPS * 0.5 < T_MUSIQUE; i += 2) {
    const t0 = i * TEMPS * 0.5;
    if (t0 < ACCORD_DUREE) continue; // entrent après la première séquence d'accord
    const n0 = Math.round(t0 * SR);
    for (let k = 0; k < SR * 0.05 && n0 + k < N; k++) {
      const env = Math.exp(-k / SR / 0.012);
      const x = (alea() * 2 - 1) * env * 0.03 * (0.5 + 0.5 * ouverture(t0));
      out[0][n0 + k] += hp[0].run(x, 7000, 0.7, "hp");
      out[1][n0 + k] += hp[1].run(x, 7500, 0.7, "hp");
    }
  }
  return out;
}

function air() {
  const out = tampon();
  const bp = [new SVF(), new SVF()];
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    if (t > T_MUSIQUE + marge) break;
    const g = 0.005 + 0.012 * ouverture(t);
    out[0][n] = bp[0].run(alea() * 2 - 1, 2900, 0.9, "bp") * g;
    out[1][n] = bp[1].run(alea() * 2 - 1, 3400, 0.9, "bp") * g;
  }
  return out;
}

// ───────────────────────────── Design sonore ─────────────────────────────

/** Glissando tonal ascendant (barres / courbe qui poussent). */
function montee(out, t0, duree) {
  const f0 = hz(52 + pc - 12 + 7); // quinte grave
  const f1 = f0 * 3;
  let ph1 = 0,
    ph2 = 0;
  const n0 = Math.round(t0 * SR);
  for (let i = 0; i < (duree + 0.4) * SR && n0 + i < N; i++) {
    const tn = i / SR;
    const p = borne(tn / duree);
    const f = expInterp(f0, f1, lisse(p)) * (1 + 0.003 * Math.sin(2 * Math.PI * 5.2 * tn));
    ph1 += f / SR;
    ph2 += (f * 2.003) / SR;
    const env = borne(tn / 0.25) * (tn < duree ? 1 : Math.exp(-(tn - duree) / 0.12)) * (0.5 + 0.5 * p);
    const s = (Math.sin(2 * Math.PI * ph1) + 0.25 * Math.sin(2 * Math.PI * ph2)) * env * 0.09;
    out[0][n0 + i] += s * 0.8;
    out[1][n0 + i] += s;
  }
}

/** Souffle de bruit qui gonfle et se coupe net (avant une coupe importante). */
function souffle(out, t0, duree) {
  const bp = [new SVF(), new SVF()];
  const n0 = Math.max(0, Math.round(t0 * SR));
  for (let i = 0; i < duree * SR && n0 + i < N; i++) {
    const p = i / (duree * SR);
    const fc = expInterp(350, 4500, p);
    const env = Math.pow(p, 2.2) * borne((1 - p) / 0.02);
    out[0][n0 + i] += bp[0].run(alea() * 2 - 1, fc, 1.4, "bp") * env * 0.22;
    out[1][n0 + i] += bp[1].run(alea() * 2 - 1, fc * 1.07, 1.4, "bp") * env * 0.22;
  }
}

/** Impact grave de la révélation : chute de hauteur + souffle sourd. */
function impact(out, t0) {
  const lp = [new SVF(), new SVF()];
  let ph = 0;
  const n0 = Math.round(t0 * SR);
  for (let i = 0; i < 2.6 * SR && n0 + i < N; i++) {
    const tn = i / SR;
    const f = expInterp(78, 36, borne(tn / 0.7));
    ph += f / SR;
    const corps = Math.sin(2 * Math.PI * ph) * Math.min(1, tn / 0.004) * Math.exp(-tn / 0.85) * 0.55;
    const bruit = (alea() * 2 - 1) * Math.exp(-tn / 0.35) * 0.35;
    out[0][n0 + i] += corps + lp[0].run(bruit, 900, 0.7);
    out[1][n0 + i] += corps + lp[1].run(bruit, 950, 0.7);
  }
}

/** Scintillement du logo : souffle aérien pendant le tracé + cloche douce à la fin. */
function scintillement(out, t0, duree) {
  const bp = [new SVF(), new SVF()];
  const n0 = Math.round(t0 * SR);
  for (let i = 0; i < (duree + 0.5) * SR && n0 + i < N; i++) {
    const tn = i / SR;
    const p = borne(tn / duree);
    const fc = expInterp(900, 3200, p);
    const env = lisse(p) * (tn < duree ? 1 : Math.exp(-(tn - duree) / 0.15));
    out[0][n0 + i] += bp[0].run(alea() * 2 - 1, fc, 2.2, "bp") * env * 0.16;
    out[1][n0 + i] += bp[1].run(alea() * 2 - 1, fc * 1.12, 2.2, "bp") * env * 0.16;
  }
  // cloche : accord de tonique très aigu, partiels légèrement inharmoniques
  const tb = t0 + duree * 0.92;
  const nb = Math.round(tb * SR);
  const partiels = [0, 7, 12, 14, 19].map((iv, j) => ({ f: hz(84 + pc + iv) * (1 + j * 0.0007), a: [1, 0.6, 0.5, 0.35, 0.25][j], ph: 0 }));
  for (let i = 0; i < 2.5 * SR && nb + i < N; i++) {
    const tn = i / SR;
    let s = 0;
    for (const p of partiels) {
      p.ph += p.f / SR;
      s += Math.sin(2 * Math.PI * p.ph) * p.a * Math.exp(-tn / (0.9 / (1 + p.a)));
    }
    s *= Math.min(1, tn / 0.006) * 0.035;
    out[0][nb + i] += s;
    out[1][nb + i] += s;
  }
}

// ───────────────────────────── Assemblage ─────────────────────────────

console.log(`Bande-son : ${DUREE.toFixed(2)} s, ${mus.bpm} BPM, ${mus.tonique} ${mus.mode}, révélation ${T_REV?.toFixed(2) ?? "—"} s, logo ${T_LOGO?.toFixed(2) ?? "—"} s`);

// 1. bus musique
const musique = tampon();
if (!SFX_SEULS) {
  ajoute(musique, subBasse(), 1);
  const padBus = pad();
  ajoute(musique, padBus, 1);
  const arp = pingPong(arpege(0, T_MUSIQUE + marge), TEMPS * 0.75);
  ajoute(musique, arp, 1);
  ajoute(musique, tics(), 1);
  ajoute(musique, air(), 1);
  const envoiMusique = tampon();
  ajoute(envoiMusique, padBus, 0.6);
  ajoute(envoiMusique, arp, 0.5);
  ajoute(musique, reverb(envoiMusique, { piece: 0.82 }), 0.55);
}

// 2. la musique s'arrête à la révélation
if (T_REV !== null) {
  const n0 = Math.round(T_REV * SR);
  if (mus.revelation === "filtre") {
    // fermeture du filtre + baisse (vidéo 2)
    const lp = [new SVF(), new SVF()];
    for (let n = n0; n < N; n++) {
      const tn = (n - n0) / SR;
      const fc = expInterp(4000, 180, borne(tn / 0.5));
      const g = Math.exp(-tn / 1.1);
      for (let c = 0; c < 2; c++) musique[c][n] = lp[c].run(musique[c][n], fc, 0.7) * g;
    }
  } else {
    // arrêt de bande : la lecture ralentit jusqu'à zéro en 0,5 s (vidéo 4)
    const source = [Float32Array.from(musique[0]), Float32Array.from(musique[1])];
    let lecture = n0;
    const D = 0.5 * SR;
    for (let n = n0; n < N; n++) {
      const k = n - n0;
      const vitesse = k < D ? Math.pow(1 - k / D, 1.6) : 0;
      lecture += vitesse;
      const i = Math.floor(lecture);
      const fr = lecture - i;
      const g = k < D ? 1 - Math.pow(k / D, 4) : 0;
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
    if (e.type === "souffle") souffle(sfx, t0, d);
    if (e.type === "impact") impact(sfx, t0);
  }
}
if (T_REV !== null) impact(sfx, T_REV);
if (T_LOGO !== null) scintillement(sfx, T_LOGO, D_LOGO);
// écho de l'arpège après la révélation, filtré, qui s'éteint
if (T_REV !== null && mus.echo !== false && !SFX_SEULS) {
  const debutEcho = T_REV + 0.6;
  const e = pingPong(arpege(debutEcho, Math.min(DUREE - 0.8, debutEcho + 3.2), 0.55, 1300), TEMPS * 0.75, 0.45, 0.4);
  for (let n = Math.round(debutEcho * SR); n < N; n++) {
    const g = Math.exp(-(n / SR - debutEcho) / 1.6);
    e[0][n] *= g;
    e[1][n] *= g;
  }
  ajoute(sfx, e, 1);
}
ajoute(sfx, reverb(sfx, { piece: 0.9, amorti: 0.25 }), 0.7);

// 4. mixage final : niveau réglé sur la partie musicale (RMS ≈ -18 dBFS comme les références),
//    puis limiteur doux qui garde les crêtes (impact) sous -3 dBFS.
const mix = tampon();
ajoute(mix, musique, 1);
ajoute(mix, sfx, 1);
const nMus = Math.round((T_REV ?? DUREE) * SR);
let somme = 0;
for (let n = 0; n < nMus; n++) somme += (mix[0][n] ** 2 + mix[1][n] ** 2) / 2;
let creteAvant = 0;
for (let c = 0; c < 2; c++) for (let n = 0; n < N; n++) creteAvant = Math.max(creteAvant, Math.abs(mix[c][n]));
const rmsAvant = Math.sqrt(somme / nMus) || 1;
const gain = SFX_SEULS ? (Math.pow(10, -4 / 20) / (creteAvant || 1)) * mus.volume : (Math.pow(10, -18 / 20) / rmsAvant) * mus.volume;
const SEUIL = 0.5;
const PLAFOND = Math.pow(10, -3 / 20);
const limite = (x) => {
  const a = Math.abs(x);
  return a <= SEUIL ? x : Math.sign(x) * (SEUIL + (PLAFOND - SEUIL) * Math.tanh((a - SEUIL) / (PLAFOND - SEUIL)));
};
const fondu = Math.round(0.35 * SR);
let crete = 0;
for (let c = 0; c < 2; c++)
  for (let n = 0; n < N; n++) {
    let s = limite(mix[c][n] * gain);
    if (n > N - fondu) s *= (N - n) / fondu;
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
