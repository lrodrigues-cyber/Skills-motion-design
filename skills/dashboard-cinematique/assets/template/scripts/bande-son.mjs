#!/usr/bin/env node
// Bande-son du style « dashboard cinématique » : musique ORIGINALE de film électronique sombre
// + design sonore de cinéma, calés image par image sur src/film/montage.json. Aucune dépendance (Node ≥ 18).
//
//   node scripts/bande-son.mjs                       → public/audio/bande-son.wav
//   node scripts/bande-son.mjs --montage x.json --sortie y.wav --graine 7
//   node scripts/bande-son.mjs --sfx-seuls        → design sonore seul (le client fournit la musique)
//
// Principes (mesurés sur les 5 références, voir references/recette-son.md) :
//  • LE SON COLLE AU MONTAGE : chaque plan est une mesure (ou plusieurs) dont le premier temps tombe
//    exactement sur la coupe. L'accord change à chaque coupe, l'arrangement s'épaissit plan après plan.
//  • Palette « musique de film électronique » : sub profond, basse pulsée filtrée, nappe sombre large,
//    arpège grave et doux, batterie électronique feutrée. Jamais de son pincé ou de clochette
//    (YAMNet les entend comme harpe, clavecin, jeu vidéo ou musique pour enfants).
//  • Effets de cinéma : ping sonar à l'ouverture, souffle inversé + coup grave sur chaque coupe,
//    grondement qui monte jusqu'à la révélation, puis la musique s'arrête : explosion sourde, whoosh,
//    battements, traîne.
//  • Vérification : python3 scripts/ecoute.py public/audio/bande-son.wav (facultatif).

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

// Repérage des animations (scripts/reperage.mjs) : les effets se calent sur ce qui s'allume à l'image.
let REPERAGE = null;
{
  const f = path.join(racine, "src/film/reperage.json");
  if (fs.existsSync(f)) {
    const r = JSON.parse(fs.readFileSync(f, "utf8"));
    const { empreinteSources } = await import("./reperage.mjs");
    if (r.empreinte === empreinteSources()) REPERAGE = r;
    else
      console.warn(
        "⚠ repérage périmé (l'interface ou le montage ont changé depuis) : effets d'animation désactivés. Rends un brouillon, puis node scripts/reperage.mjs out/brouillon.mp4 et relance ce script.",
      );
  } else console.warn("⚠ pas de repérage (src/film/reperage.json) : rends un brouillon, puis node scripts/reperage.mjs out/brouillon.mp4 pour caler les effets sur les animations.");
}

const fps = M.fps;
let curseur = 0;
const plans = M.plans.map((p) => {
  const d = { ...p, debut: curseur };
  curseur += p.duree;
  return d;
});
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

const mus = { bpm: 80, tonique: "E", mode: "mineur", style: "pulse", revelation: "arret", queue: true, volume: 1, ...(M.musique ?? {}) };
// Dosage des couches, réglé à l'oreille et avec YAMNet contre les références. On peut l'ajuster dans
// montage.json (musique.reglages, ex. { "basse": 1.3 }) ou en ligne de commande (--reglages '{"arpege":0}') ;
// relancer ensuite scripts/ecoute.py.
const R = {
  sub: 1, nappe: 1, basse: 1, arpege: 0.7, caisse: 1.2, claquement: 1.2, charleston: 1, frappe: 1, animations: 1, compression: -16, limiteur: 0.85,
  arpOctave: -1, arpFiltre: 0.6, arpDecroissance: 0.3, arpResonance: 0.25, arpDensite: 1,
  montee: 3, reverb: 1, sfx: 0.85, accents: 1, grondement: 1, explosion: 1, whoosh: 1, ping: 1,
  ...(mus.reglages ?? {}),
  ...JSON.parse(args.reglages ?? "{}"),
};
const NOTES = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
const pc = NOTES[mus.tonique] ?? 4;
const MAJ = mus.mode === "majeur";
const PULSE = mus.style !== "nappe";
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Sections = les plans, puis la fin. Chaque plan contient un nombre ENTIER de mesures : le tempo
// demandé (bpm) fixe seulement combien de mesures tiennent dans un plan ; le tempo réel s'ajuste
// pour que chaque coupe tombe sur un premier temps (3 s → 1 mesure à 80 BPM).
const sections = plans.map((p, k) => {
  const t0 = p.debut / fps;
  const duree = p.duree / fps;
  const mesures = Math.max(1, Math.round(duree / (240 / mus.bpm)));
  const temps = duree / (mesures * 4);
  return { k, t0, t1: t0 + duree, duree, mesures, temps, dc: temps / 4 };
});
const NS = sections.length;
const sectionA = (t) => sections.find((s) => t >= s.t0 && t < s.t1) ?? (t < 0 ? sections[0] : sections[NS - 1]);
// Intensité de 0,35 (1er plan) à 1 (dernier plan) : tout l'arrangement en dépend.
const intensite = (k) => (NS <= 1 ? 1 : 0.35 + (0.65 * Math.min(k, NS - 1)) / (NS - 1));
const tempsMoyen = sections.reduce((a, s) => a + s.temps, 0) / NS;
const bpmReel = 60 / tempsMoyen;

// Grille harmonique : un accord par plan sur une pédale de tonique, résolution sur i à la révélation.
// Demi-tons au-dessus de la tonique. Mineur : i – VI – iv – VII – V(sus) ; majeur : I – vi – IV – V – V(sus).
const GRILLE = MAJ
  ? [
      { basse: 0, voix: [0, 7, 11, 14, 16] },
      { basse: -3, voix: [-3, 4, 9, 12, 16] },
      { basse: 5, voix: [0, 5, 9, 12, 17] },
      { basse: 7, voix: [2, 7, 11, 14, 19] },
      { basse: 7, voix: [2, 7, 12, 14, 19] },
    ]
  : [
      { basse: 0, voix: [0, 7, 14, 15, 19] }, // i add9
      { basse: -4, voix: [-4, 3, 7, 11, 15] }, // VI maj7
      { basse: 5, voix: [0, 5, 8, 12, 15] }, // iv
      { basse: -2, voix: [-2, 5, 10, 14, 17] }, // VII
      { basse: -5, voix: [-5, 2, 7, 12, 14] }, // v sus (tension avant la révélation)
    ];
const RESOLUTION = MAJ ? { basse: 0, voix: [0, 7, 12, 16, 19] } : { basse: 0, voix: [0, 7, 12, 15, 19] };
const accordDe = (k) => (k >= NS ? RESOLUTION : k === NS - 1 ? GRILLE[GRILLE.length - 1] : GRILLE[k % (GRILLE.length - 1)]);

let etat = Number(args.graine ?? 11) >>> 0 || 11;
const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
const bruit = () => alea() * 2 - 1;

// ───────────────────────────── Outils DSP ─────────────────────────────

const N = Math.ceil((DUREE + 0.05) * SR);
const tampon = () => [new Float32Array(N), new Float32Array(N)];
const lisse = (x) => x * x * (3 - 2 * x);
const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const expInterp = (a, b, t) => a * Math.pow(b / a, borne(t));
const fondu = (t, debut, duree) => (duree <= 0 ? (t >= debut ? 1 : 0) : lisse(borne((t - debut) / duree)));
const sat = (x, d = 1) => Math.tanh(d * x) / Math.tanh(d);

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
/** Dent de scie à bande limitée (pas de repliement : c'est ce qui rend un synthé « cheap »). */
const scie = (ph, dt) => 2 * ph - 1 - polyblep(ph, dt);
const carre = (ph, dt, l = 0.5) => (ph < l ? 1 : -1) + polyblep(ph, dt) - polyblep((ph + 1 - l) % 1, dt);

/** Filtre d'état variable (TPT) : passe-bas / passe-bande / passe-haut. */
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

/** Filtre « échelle » 24 dB/oct (type Moog, sans délai dans la boucle) : le son chaud des synthés analogiques. */
class Echelle {
  constructor() {
    this.s = [0, 0, 0, 0];
  }
  run(x, fc, res = 0.2) {
    const g = Math.tan((Math.PI * Math.min(fc, SR * 0.42)) / SR);
    const G = g / (1 + g);
    const k = 4 * res;
    const s = this.s;
    const S = (1 - G) * (G * G * G * s[0] + G * G * s[1] + G * s[2] + s[3]);
    const G4 = G * G * G * G;
    const y4 = (G4 * x + S) / (1 + k * G4);
    let u = Math.tanh(x - k * y4);
    for (let i = 0; i < 4; i++) {
      const v = (u - s[i]) * G;
      const y = v + s[i];
      s[i] = y + v;
      u = y;
    }
    return u;
  }
}

/** Réverbération « salle de cinéma » : réseau de 8 lignes à retard (FDN Hadamard), diffusion d'entrée, amorti. */
function salle([L, R], { rt60 = 3.2, coupure = 5200, predelai = 0.025, taille = 1 } = {}) {
  const longueurs = [1031, 1327, 1523, 1801, 2053, 2381, 2713, 3089].map((d) => Math.round(d * taille));
  const lignes = longueurs.map((d) => new Float32Array(d));
  const idx = new Int32Array(8);
  const gains = longueurs.map((d) => Math.pow(10, (-3 * d) / (rt60 * SR)));
  const filt = new Float64Array(8);
  const a = Math.exp((-2 * Math.PI * coupure) / SR);
  const pd = Math.round(predelai * SR);
  const diff = [142, 107, 379, 277].map((d) => ({ b: new Float32Array(d), i: 0 }));
  const diffuse = (x) => {
    for (const ap of diff) {
      const y = ap.b[ap.i];
      const w = x + y * 0.6;
      ap.b[ap.i] = w;
      if (++ap.i === ap.b.length) ap.i = 0;
      x = y - w * 0.6;
    }
    return x;
  };
  const out = tampon();
  const v = new Float64Array(8);
  for (let n = 0; n < N; n++) {
    const xl = n >= pd ? L[n - pd] : 0;
    const xr = n >= pd ? R[n - pd] : 0;
    const xm = diffuse((xl + xr) * 0.5);
    const xs = (xl - xr) * 0.5;
    for (let i = 0; i < 8; i++) v[i] = lignes[i][idx[i]];
    out[0][n] = (v[0] + v[2] + v[4] + v[6]) * 0.5;
    out[1][n] = (v[1] + v[3] + v[5] + v[7]) * 0.5;
    // Hadamard 8 (normalisé)
    for (let h = 1; h < 8; h *= 2)
      for (let i = 0; i < 8; i += h * 2)
        for (let j = i; j < i + h; j++) {
          const p = v[j];
          const q = v[j + h];
          v[j] = p + q;
          v[j + h] = p - q;
        }
    for (let i = 0; i < 8; i++) {
      const y = v[i] * 0.35355339 * gains[i];
      filt[i] = y * (1 - a) + filt[i] * a;
      lignes[i][idx[i]] = filt[i] + (i % 2 ? xm - xs : xm + xs) * 0.3;
      if (++idx[i] === longueurs[i]) idx[i] = 0;
    }
  }
  return out;
}

/** Écho ping-pong filtré (les répétitions s'assombrissent). */
function pingPong([L, R], retard, retour = 0.38, mixage = 0.32, coupure = 3200) {
  const d = Math.max(1, Math.round(retard * SR));
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  const f = [new SVF(), new SVF()];
  const out = tampon();
  let i = 0;
  for (let n = 0; n < N; n++) {
    const yl = bl[i];
    const yr = br[i];
    bl[i] = f[0].run((L[n] + R[n]) * 0.5 + yr * retour, coupure);
    br[i] = f[1].run(yl * retour, coupure);
    if (++i === d) i = 0;
    out[0][n] = L[n] + yl * mixage;
    out[1][n] = R[n] + yr * mixage;
  }
  return out;
}

/** Chorus stéréo : élargit et adoucit les nappes. */
function chorus([L, R], { base = 0.014, prof = 0.004, vitesse = 0.21, mixage = 0.7 } = {}) {
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
/** Écrit un échantillon mono panoramiqué (loi à puissance constante). */
const pose = (out, n, s, pan = 0.5) => {
  if (n < 0 || n >= N) return;
  out[0][n] += s * Math.cos(pan * Math.PI * 0.5) * 1.4142;
  out[1][n] += s * Math.sin(pan * Math.PI * 0.5) * 1.4142;
};

// ───────────────────────────── Grille rythmique ─────────────────────────────

const FIN_MUSIQUE = T_MUSIQUE; // tout s'arrête net à la révélation
// Grosse caisse : sur les 4 temps dès le 2e plan (la musique « tombe » sur la 1re coupe).
const coupsCaisse = [];
if (PULSE)
  for (const s of sections) {
    if (s.k < 1) continue;
    for (let b = 0; b < s.mesures * 4; b++) coupsCaisse.push({ t: s.t0 + b * s.temps, v: (b % 4 === 0 ? 1 : 0.85) * (0.75 + 0.25 * intensite(s.k)) });
  }
// Le reste de la musique « respire » avec la grosse caisse (compression en side-chain).
const creux = new Float32Array(N);
coupsCaisse.forEach((c, i) => {
  const n0 = Math.round(c.t * SR);
  const n1 = i + 1 < coupsCaisse.length ? Math.round(coupsCaisse[i + 1].t * SR) : N;
  for (let n = n0; n < n1 && n < N; n++) {
    const d = (n - n0) / SR;
    creux[n] = c.v * Math.exp(-d / 0.11) * Math.min(1, d / 0.004 + 0.3);
  }
});
const pompe = (t, force) => 1 - force * (creux[Math.min(N - 1, Math.max(0, Math.round(t * SR)))] ?? 0);
// Enveloppe d'arrêt : 1 jusqu'à la révélation, puis 0 (l'arrêt lui-même est traité au mixage).
const vivant = (t) => (t < FIN_MUSIQUE ? 1 : 0);

// ───────────────────────────── Instruments ─────────────────────────────

/** Sub : sinus sur la tonique (octave 1), un peu d'harmonique 2 pour exister sur téléphone, il pompe. */
function sub() {
  const out = tampon();
  const f = hz(28 + pc);
  let ph = 0;
  for (let n = 0; n < Math.min(N, (FIN_MUSIQUE + 0.6) * SR); n++) {
    const t = n / SR;
    ph += f / SR;
    const s = Math.sin(2 * Math.PI * ph) + 0.18 * Math.sin(4 * Math.PI * ph);
    const k = sectionA(t).k;
    const env = fondu(t, 0, 1.2) * (0.6 + 0.4 * intensite(k)) * pompe(t, 0.6) * vivant(t);
    out[0][n] += s * env * 0.16;
    out[1][n] += s * env * 0.16;
  }
  return out;
}

/** Basse pulsée (la « pulsation » des références) : scie + carré dans un filtre échelle, croches puis doubles-croches. */
function bassePulsee() {
  const out = tampon();
  for (const s of sections) {
    if (PULSE ? s.k < 1 : s.k < 2) continue;
    const pas = PULSE && s.k >= 2 ? s.dc : s.dc * 2; // doubles-croches dès le 3e plan
    const nb = Math.round(s.duree / pas);
    const racineB = 36 + pc; // pédale : la basse reste sur la tonique
    for (let i = 0; i < nb; i++) {
      const t0 = s.t0 + i * pas;
      if (t0 >= FIN_MUSIQUE) break;
      const surTemps = Math.abs((i * pas) % s.temps) < 1e-6;
      const vel = (surTemps ? 0.75 : 1) * (0.55 + 0.45 * intensite(s.k)); // contretemps plus forts : ça « roule »
      const octave = i % 8 === 7 ? 12 : 0;
      const f = hz(racineB + octave);
      const filtre = new Echelle();
      const n0 = Math.round(t0 * SR);
      const long = Math.round(Math.min(pas * 0.9, 0.3) * SR);
      let p1 = alea(),
        p2 = alea();
      for (let j = 0; j < long + 600; j++) {
        const tn = j / SR;
        p1 += (f * 1.003) / SR;
        p2 += (f * 0.997) / SR;
        if (p1 >= 1) p1 -= 1;
        if (p2 >= 1) p2 -= 1;
        const x = scie(p1, f / SR) * 0.6 + carre(p2, f / SR) * 0.4;
        const fc = 160 + (500 + 1300 * intensite(s.k)) * Math.exp(-tn / 0.07);
        const env = Math.min(1, tn / 0.003) * (j < long ? 1 : Math.max(0, 1 - (j - long) / 600)) * Math.exp(-tn / 0.35);
        // saturation : la basse « mord » (impact), sans devenir agressive
        const y = sat(filtre.run(x, fc, 0.4) * 2.2, 2) * env * vel * pompe(t0 + tn, 0.5) * 0.32;
        pose(out, n0 + j, y, 0.5);
      }
    }
  }
  return out;
}

/** Nappe sombre : 7 scies désaccordées par note dans un filtre échelle + couche « voix » (formants), accord qui change sur la coupe. */
function nappe() {
  const brut = tampon();
  const voixFormant = tampon();
  const bornes = [...sections.map((s) => s.t0), FIN_MUSIQUE];
  for (let k = 0; k < NS; k++) {
    const a0 = bornes[k];
    const a1 = bornes[k + 1];
    const acc = accordDe(k);
    const osc = [];
    for (const iv of acc.voix)
      for (let u = 0; u < 7; u++) osc.push({ f: hz(52 + pc + iv) * Math.pow(2, ((u - 3) * 6) / 1200), ph: alea(), pan: u / 6 });
    const form = acc.voix.slice(1, 4).map((iv) => ({ f: hz(64 + pc + iv), ph: alea() }));
    const xf = 0.06; // fondu enchaîné de 60 ms, centré sur la coupe
    const n0 = Math.max(0, Math.round((a0 - xf) * SR));
    const n1 = Math.min(N, Math.round((a1 + xf + (k === NS - 1 ? 0.6 : 0)) * SR));
    for (let n = n0; n < n1; n++) {
      const t = n / SR;
      const env = (k === 0 ? fondu(t, 0, 1.6) : fondu(t, a0 - xf, 2 * xf)) * (k === NS - 1 ? 1 : 1 - fondu(t, a1 - xf, 2 * xf));
      if (env <= 0) continue;
      let l = 0,
        r = 0;
      for (const o of osc) {
        const dt = o.f / SR;
        o.ph += dt;
        if (o.ph >= 1) o.ph -= 1;
        const s = scie(o.ph, dt);
        l += s * (1 - o.pan);
        r += s * o.pan;
      }
      brut[0][n] += l * env;
      brut[1][n] += r * env;
      let v = 0;
      for (const o of form) {
        const dt = o.f / SR;
        o.ph += dt;
        if (o.ph >= 1) o.ph -= 1;
        v += carre(o.ph, dt, 0.3);
      }
      voixFormant[0][n] += v * env;
      voixFormant[1][n] += v * env;
    }
  }
  const out = tampon();
  const f = [new Echelle(), new Echelle()];
  const fa = [new SVF(), new SVF(), new SVF(), new SVF()];
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    if (t > FIN_MUSIQUE + 0.7) break;
    const k = sectionA(t).k;
    // le filtre s'ouvre plan après plan, avec une respiration lente
    const fc = expInterp(420, 2600, (intensite(k) - 0.35) / 0.65 * 0.85 + 0.15 * borne((t - sections[k].t0) / sections[k].duree)) * (1 + 0.12 * Math.sin(2 * Math.PI * t * 0.13));
    const g = 0.03 * pompe(t, 0.35) * (0.75 + 0.25 * intensite(k));
    for (let c = 0; c < 2; c++) {
      const p = f[c].run(brut[c][n] * 0.25, fc, 0.15);
      // « ah » : deux formants sur une onde rectangulaire (texture de chœur synthétique, très en retrait)
      const x = voixFormant[c][n] * 0.2;
      const voyelle = fa[c].run(x, 700, 4, "bp") + fa[c + 2].run(x, 1150, 5, "bp") * 0.6;
      out[c][n] = p * g * 3.2 + voyelle * g * 0.9 * (0.4 + 0.6 * intensite(k));
    }
  }
  return chorus(out);
}

/** Arpège de synthé (scie + carré, filtre résonant à enveloppe) sur les notes de l'accord du plan. */
function arpege() {
  const out = tampon();
  const MOTIF = [0, 2, 1, 3, 2, 4, 3, 1, 0, 2, 1, 3, 4, 3, 2, 1];
  for (const s of sections) {
    const acc = accordDe(s.k).voix.slice(0, 4);
    const notes = [...acc, ...acc.map((x) => x + 12)];
    const densite = (s.k === 0 ? 2 : 1) * R.arpDensite; // croches au 1er plan, doubles-croches ensuite
    const nb = Math.round(s.duree / s.dc);
    for (let i = 0; i < nb; i += densite) {
      const t0 = s.t0 + i * s.dc;
      if (t0 >= FIN_MUSIQUE) break;
      const midi = 52 + 12 * R.arpOctave + pc + notes[MOTIF[i % MOTIF.length] % notes.length];
      const f = hz(midi);
      const vel = (i % 4 === 0 ? 1 : i % 2 === 0 ? 0.78 : 0.62) * (0.45 + 0.55 * intensite(s.k));
      const filtre = new Echelle();
      const n0 = Math.round(t0 * SR);
      const long = Math.round(0.42 * SR);
      let p1 = alea(),
        p2 = alea();
      const pan = 0.5 + 0.35 * Math.sin(i * 0.9 + s.k);
      const fBase = (380 + 1500 * Math.pow(intensite(s.k), 1.4)) * R.arpFiltre;
      for (let j = 0; j < long; j++) {
        const tn = j / SR;
        p1 += (f * 1.004) / SR;
        p2 += (f * 0.996) / SR;
        if (p1 >= 1) p1 -= 1;
        if (p2 >= 1) p2 -= 1;
        const x = scie(p1, f / SR) * 0.55 + carre(p2, f / SR, 0.42) * 0.45;
        const fc = fBase * (1 + 2.2 * Math.exp(-tn / 0.06));
        const env = Math.min(1, tn / 0.004) * Math.exp(-tn / R.arpDecroissance) * (1 - fondu(tn, 0.36, 0.06));
        pose(out, n0 + j, filtre.run(x, fc, R.arpResonance) * env * vel * pompe(t0 + tn, 0.3) * 0.16, pan);
      }
    }
  }
  return out;
}

// ── Batterie électronique (percutante, mais sombre) ──

function grosseCaisse(out, t0, v) {
  const n0 = Math.round(t0 * SR);
  const hp = new SVF();
  let ph = 0,
    phb = 0;
  for (let j = 0; j < 0.7 * SR; j++) {
    const tn = j / SR;
    ph += expInterp(170, 46, tn / 0.045) / SR;
    phb += 1600 / SR;
    const corps = Math.sin(2 * Math.PI * ph) * Math.exp(-tn / 0.3);
    // attaque : clic de batte + petit bruit, c'est ce qui donne le « punch » sur téléphone
    const clic = hp.run(bruit(), 2500, 0.7, "hp") * Math.exp(-tn / 0.003) * 0.35 + Math.sin(2 * Math.PI * phb) * Math.exp(-tn / 0.004) * 0.3;
    pose(out, n0 + j, sat((corps + clic) * 1.6, 2) * v * 0.62, 0.5);
  }
}
/** Frappe sur les temps 2 et 4 : claquement en trois salves + corps de caisse claire (180 Hz). */
function claquement(out, t0, v) {
  const n0 = Math.round(t0 * SR);
  const f = new SVF();
  const g = new SVF();
  let ph = 0;
  for (let j = 0; j < 0.45 * SR; j++) {
    const tn = j / SR;
    const salves = [0, 0.009, 0.019].reduce((a, d) => a + (tn >= d ? Math.exp(-(tn - d) / 0.006) : 0), 0);
    const env = salves * 0.6 + Math.exp(-tn / 0.13) * 0.55;
    ph += expInterp(210, 165, tn / 0.03) / SR;
    const corps = Math.sin(2 * Math.PI * ph) * Math.exp(-tn / 0.07) * 0.5;
    const grain = g.run(bruit(), 4200, 0.8, "bp") * Math.exp(-tn / 0.09) * 0.25;
    pose(out, n0 + j, (f.run(bruit(), 1400, 1.0, "bp") * env + corps + grain) * v * 0.42, 0.5);
  }
}
/** Charleston fermé, sombre (passe-bande à 7 kHz), sur les contretemps. */
function charleston(out, t0, v) {
  const n0 = Math.round(t0 * SR);
  const f = [new SVF(), new SVF()];
  for (let j = 0; j < 0.12 * SR; j++) {
    const tn = j / SR;
    const x = f[1].run(f[0].run(bruit(), 5000, 0.7, "hp"), 7000, 1.2, "bp");
    pose(out, n0 + j, x * Math.exp(-tn / 0.025) * v * 0.12, 0.62);
  }
}
function batterie() {
  const sec = tampon();
  const mouille = tampon(); // partie envoyée dans la réverbération
  if (!PULSE) return { sec, mouille };
  for (const c of coupsCaisse) if (c.t < FIN_MUSIQUE) grosseCaisse(sec, c.t, c.v * R.caisse);
  for (const s of sections) {
    const nb = Math.round(s.duree / s.dc);
    for (let i = 0; i < nb; i++) {
      const t = s.t0 + i * s.dc;
      if (t >= FIN_MUSIQUE) break;
      // frappe sur les temps 2 et 4 dès le 3e plan ; charleston sur les contretemps dès le 3e plan
      if (s.k >= 2 && i % 8 === 4) claquement(mouille, t, 0.85 * intensite(s.k) * R.claquement);
      if (s.k >= 2 && i % 4 === 2) charleston(sec, t, (0.6 + 0.4 * intensite(s.k)) * R.charleston);
    }
    // dernier plan : roulement qui accélère vers la révélation (tension de bande-annonce)
    if (s.k === NS - 1 && NS >= 3) {
      const debut = s.t0 + s.duree * 0.5;
      for (let t = debut, pas = s.dc; t < s.t1 - 0.01; t += pas, pas = Math.max(s.dc / 4, pas * 0.86)) {
        claquement(mouille, t, (0.25 + 0.55 * ((t - debut) / (s.t1 - debut))) * R.claquement);
      }
    }
  }
  return { sec, mouille };
}


// Niveau par plan : les références gardent un volume presque constant (≤ 3 dB d'écart du 1er au dernier plan).
// La tension vient de l'arrangement qui s'épaissit, pas du volume : on mesure chaque plan et on le cale
// sur une pente douce de R.montee dB (le 1er plan n'est jamais « trop bas » sur un téléphone).
function appliqueMontee(...bufs) {
  const [m] = bufs;
  const rmsPlan = sections.map((s) => {
    let e = 0;
    const a = Math.round(s.t0 * SR);
    const b = Math.min(N, Math.round(Math.min(s.t1, FIN_MUSIQUE) * SR));
    for (let n = a; n < b; n++) e += (m[0][n] ** 2 + m[1][n] ** 2) / 2;
    return Math.sqrt(e / Math.max(1, b - a)) || 1e-9;
  });
  const ref = rmsPlan[NS - 1];
  const gains = sections.map((s, k) => {
    const cible = -R.montee * (1 - (NS <= 1 ? 1 : k / (NS - 1)));
    return borne(Math.pow(10, cible / 20) / (rmsPlan[k] / ref), 0.5, 4);
  });
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    const s = sectionA(t);
    const prec = s.k > 0 ? gains[s.k - 1] : gains[0];
    const g = prec + (gains[s.k] - prec) * fondu(t, s.t0 - 0.03, 0.06);
    for (const buf of bufs) {
      buf[0][n] *= g;
      buf[1][n] *= g;
    }
  }
}

// ───────────────────────────── Design sonore ─────────────────────────────

/** Ping sonar d'ouverture (référence 3) : sinus grave qui glisse un peu vers le bas, attaque douce, sans résonance de cloche. */
function ping(out, t0, force = 1) {
  const n0 = Math.round(t0 * SR);
  const f = hz(64 + pc);
  let ph = 0;
  for (let j = 0; j < 1.4 * SR; j++) {
    const tn = j / SR;
    ph += (f * (1 - 0.06 * Math.min(1, tn / 0.9))) / SR;
    const s = Math.sin(2 * Math.PI * ph) * Math.min(1, tn / 0.02) * Math.exp(-tn / 0.32);
    pose(out, n0 + j, s * 0.12 * force, 0.5);
  }
}

/** Battement grave (fin de la référence 3) : deux pulsations de sub, comme un cœur. */
function battement(out, t0, force = 1) {
  for (const [d, v] of [
    [0, 1],
    [0.32, 0.7],
  ]) {
    const n0 = Math.round((t0 + d) * SR);
    let ph = 0;
    const lp = new SVF();
    for (let j = 0; j < 0.6 * SR && n0 + j < N; j++) {
      const tn = j / SR;
      ph += expInterp(70, 42, tn / 0.12) / SR;
      const y = Math.sin(2 * Math.PI * ph) * Math.min(1, tn / 0.006) * Math.exp(-tn / 0.16) + lp.run(bruit(), 200, 0.7) * Math.exp(-tn / 0.03) * 0.3;
      pose(out, n0 + j, sat(y * 1.4, 1.5) * v * force * 0.45, 0.5);
    }
  }
}

/** Souffle inversé : la réverbération d'un accord et d'un bruit, jouée à l'envers, qui se termine pile sur tFin. */
function souffleInverse(out, tFin, duree, force = 1, k = 0) {
  const acc = tampon();
  const notes = accordDe(k).voix.map((iv) => hz(64 + pc + iv));
  const lp = new SVF();
  for (let i = 0; i < 0.3 * SR; i++) {
    let s = 0;
    for (const f of notes) s += Math.sin((2 * Math.PI * f * i) / SR);
    const e = Math.exp(-i / SR / 0.07);
    const b = lp.run(bruit(), 1100, 0.7) * 1.4;
    acc[0][i] += (s * 0.1 + b) * e;
    acc[1][i] += (s * 0.1 + b) * e;
  }
  const r = salle(acc, { rt60: 2.4, coupure: 4000, predelai: 0 });
  const n1 = Math.round(tFin * SR);
  const nd = Math.round(duree * SR);
  for (let i = 0; i < nd; i++) {
    const n = n1 - nd + i;
    if (n < 0 || n >= N) continue;
    const src = nd - 1 - i;
    const env = Math.pow(i / nd, 1.6);
    out[0][n] += r[0][src] * env * 1.6 * force;
    out[1][n] += r[1][src] * env * 1.6 * force;
  }
}

/** Frappe de coupe (« braam » de bande-annonce) : accord grave de scies saturées dont le filtre s'ouvre puis se referme. */
function frappe(out, t0, k, force = 1) {
  const n0 = Math.round(t0 * SR);
  const acc = accordDe(k);
  const notes = [acc.basse, acc.basse + 7, acc.basse + 12, acc.voix[2]].map((iv) => hz(40 + pc + iv));
  const osc = notes.flatMap((f) => [-9, 0, 9].map((c) => ({ f: f * Math.pow(2, c / 1200), ph: alea() })));
  const lp = [new Echelle(), new Echelle()];
  for (let j = 0; j < 1.4 * SR && n0 + j < N; j++) {
    const tn = j / SR;
    let l = 0,
      r = 0;
    osc.forEach((o, i) => {
      o.ph += o.f / SR;
      if (o.ph >= 1) o.ph -= 1;
      const x = scie(o.ph, o.f / SR);
      if (i % 3 === 0) l += x;
      else if (i % 3 === 2) r += x;
      else {
        l += x * 0.7;
        r += x * 0.7;
      }
    });
    const fc = 220 + 1500 * Math.exp(-tn / 0.18) * Math.min(1, tn / 0.015);
    const env = Math.min(1, tn / 0.006) * Math.exp(-tn / 0.5);
    out[0][n0 + j] += sat(lp[0].run(l * 0.18, fc, 0.3) * 2, 1.6) * env * force * 0.32;
    out[1][n0 + j] += sat(lp[1].run(r * 0.18, fc, 0.3) * 2, 1.6) * env * force * 0.32;
  }
}

/** Coup grave sur une coupe : sinus qui tombe + souffle sourd (un « boum » de bande-annonce, discret). */
function coupGrave(out, t0, force = 1) {
  const n0 = Math.round(t0 * SR);
  const lp = [new SVF(), new SVF()];
  let ph = 0;
  for (let j = 0; j < 1.6 * SR; j++) {
    const tn = j / SR;
    ph += expInterp(78, 38, tn / 0.35) / SR;
    const corps = Math.sin(2 * Math.PI * ph) * Math.min(1, tn / 0.003) * Math.exp(-tn / 0.45);
    const b = bruit() * Math.exp(-tn / 0.08);
    out[0][n0 + j] += (sat(corps * 1.3, 1.5) * 0.35 + lp[0].run(b, 380, 0.8) * 0.5) * force;
    out[1][n0 + j] += (sat(corps * 1.3, 1.5) * 0.35 + lp[1].run(b, 420, 0.8) * 0.5) * force;
    if (n0 + j >= N - 1) break;
  }
}

/** Grondement qui monte (références 3 et 4) : bruit grave qui s'ouvre + scies qui glissent vers le haut, coupé net à tFin. */
function grondement(out, t0, tFin, force = 1) {
  const n0 = Math.round(t0 * SR);
  const n1 = Math.round(tFin * SR);
  const lp = [new SVF(), new SVF(), new Echelle(), new Echelle()];
  let brun = [0, 0];
  const voix = [-9, 0, 9].map((c) => ({ c, ph: alea() }));
  for (let n = n0; n < n1 && n < N; n++) {
    const p = (n - n0) / (n1 - n0);
    const tn = (n - n0) / SR;
    brun = brun.map((b) => (b + 0.02 * bruit()) * 0.998);
    const fc = expInterp(70, 1400, Math.pow(p, 1.3));
    let saw = 0;
    const f = expInterp(hz(28 + pc), hz(52 + pc), Math.pow(p, 1.6));
    for (const v of voix) {
      const fv = f * Math.pow(2, v.c / 1200);
      v.ph += fv / SR;
      if (v.ph >= 1) v.ph -= 1;
      saw += scie(v.ph, fv / SR);
    }
    const env = Math.pow(p, 1.8) * fondu(tn, 0, 0.3) * borne((1 - p) / 0.004);
    for (let c = 0; c < 2; c++) {
      const g = lp[c].run(brun[c] * 9, fc, 0.9) * 0.9;
      const s = lp[c + 2].run(saw / 3, fc * 1.4, 0.3) * 0.35;
      out[c][n] += (g + s) * env * force * 0.5;
    }
  }
}

/** Whoosh (un objet qui passe devant la caméra) : bruit dans des passe-bandes qui montent puis redescendent, de gauche à droite. */
function whoosh(out, t0, duree, force = 1, sens = 1) {
  const n0 = Math.round(t0 * SR);
  const bp = [new SVF(), new SVF(), new SVF()];
  for (let j = 0; j < duree * SR; j++) {
    const p = j / (duree * SR);
    // passage : montée rapide (60 %), redescente plus courte, comme un effet Doppler
    const q = p < 0.6 ? p / 0.6 : 1 - (p - 0.6) / 0.4;
    const cloche = Math.pow(Math.sin((Math.PI / 2) * q), 3) * (p < 0.6 ? 1 : 1 - 0.4 * (p - 0.6) / 0.4);
    const fc = 350 * Math.pow(10, q);
    const b = bruit();
    const x = bp[0].run(b, fc, 1.3, "bp") + bp[1].run(b, fc * 2.4, 2.2, "bp") * 0.45 + bp[2].run(b, 180, 0.7) * 0.2 * cloche;
    pose(out, n0 + j, x * cloche * force * 0.6, sens > 0 ? 0.1 + 0.8 * p : 0.9 - 0.8 * p);
  }
}

/** Explosion sourde de la révélation : chute de sub (60 → 26 Hz) + souffle grave qui se referme. */
function explosion(out, t0, force = 1) {
  const n0 = Math.round(t0 * SR);
  const lp = [new SVF(), new SVF()];
  let ph = 0;
  for (let j = 0; j < 4.5 * SR && n0 + j < N; j++) {
    const tn = j / SR;
    ph += expInterp(62, 26, tn / 1.4) / SR;
    const corps = sat(Math.sin(2 * Math.PI * ph) * 1.6, 1.8) * Math.min(1, tn / 0.004) * Math.exp(-tn / 1.25) * 0.55;
    const fc = expInterp(1300, 120, tn / 0.9);
    const b = bruit() * (Math.exp(-tn / 0.5) * 0.8 + Math.exp(-tn / 0.02) * 0.6);
    out[0][n0 + j] += (corps + lp[0].run(b, fc, 0.8) * 0.55) * force;
    out[1][n0 + j] += (corps + lp[1].run(b, fc * 1.07, 0.8) * 0.55) * force;
  }
}

/** Montée tonale (une courbe qui se trace) : accord de scies qui glisse d'une quinte vers le haut dans un filtre qui s'ouvre. */
function montee(out, t0, duree, k) {
  const n0 = Math.round(t0 * SR);
  const notes = accordDe(k).voix.slice(0, 3).map((iv) => hz(52 + pc + iv));
  const osc = notes.flatMap((f) => [-7, 7].map((c) => ({ f: f * Math.pow(2, c / 1200), ph: alea() })));
  const lp = [new Echelle(), new Echelle()];
  for (let j = 0; j < (duree + 0.5) * SR && n0 + j < N; j++) {
    const tn = j / SR;
    const p = borne(tn / duree);
    const glisse = Math.pow(2, (7 * lisse(p)) / 12);
    let l = 0,
      r = 0;
    osc.forEach((o, i) => {
      const f = o.f * glisse;
      o.ph += f / SR;
      if (o.ph >= 1) o.ph -= 1;
      const s = scie(o.ph, f / SR);
      if (i % 2) r += s;
      else l += s;
    });
    const fc = expInterp(300, 3200, p);
    const env = fondu(tn, 0, duree * 0.3) * (tn < duree ? 0.4 + 0.6 * p : Math.exp(-(tn - duree) / 0.12));
    out[0][n0 + j] += lp[0].run(l * 0.2, fc, 0.4) * env * 0.5;
    out[1][n0 + j] += lp[1].run(r * 0.2, fc, 0.4) * env * 0.5;
  }
}

/** Impulsions graves (des barres qui poussent) : une note de synthé grave par barre, en montant,
 *  au moment exact où chaque barre démarre (`ecart` images entre deux barres, `nombre` barres). */
function impulsions(out, t0, duree, k, ecart = null, nombre = 5) {
  const acc = accordDe(k).voix;
  const nb = nombre;
  for (let i = 0; i < nb; i++) {
    const t = t0 + (ecart !== null ? (i * ecart) / fps : (i * duree) / nb);
    const f = hz(40 + pc + acc[i % acc.length]);
    const filtre = new Echelle();
    const n0 = Math.round(t * SR);
    let ph = alea();
    for (let j = 0; j < 0.35 * SR; j++) {
      const tn = j / SR;
      ph += f / SR;
      if (ph >= 1) ph -= 1;
      const y = filtre.run(scie(ph, f / SR), 200 + 1400 * Math.exp(-tn / 0.05), 0.4) * Math.min(1, tn / 0.003) * Math.exp(-tn / 0.12);
      pose(out, n0 + j, y * (0.5 + 0.1 * i) * 0.4, 0.3 + 0.1 * i);
    }
  }
}

// ── Effets calés sur les animations repérées ──

/** Coup sourd (attaque d'un événement) : sinus qui tombe très vite. */
function coupSourd(out, t0, f0, f1, decroissance, g, pan = 0.5) {
  const n0 = Math.round(t0 * SR);
  let ph = 0;
  for (let j = 0; j < decroissance * 6 * SR; j++) {
    const tn = j / SR;
    ph += expInterp(f0, f1, tn / (decroissance * 0.6)) / SR;
    pose(out, n0 + j, sat(Math.sin(2 * Math.PI * ph) * Math.min(1, tn / 0.002) * Math.exp(-tn / decroissance) * 1.3, 1.4) * g, pan);
  }
}

/**
 * Un effet par événement repéré. L'attaque tombe sur l'image où la lumière commence à monter,
 * et l'enveloppe du son SUIT la courbe mesurée (vite au début, puis ralentit, comme l'ease-out).
 */
function sonAnimation(out, envoiOut, e, k, rang) {
  const plan = plans.find((p) => p.id === e.plan);
  if (!plan) return;
  const t0 = (plan.debut + e.image) / fps;
  const c = e.courbe;
  const m = Math.max(...c) || 1;
  const nbImg = c.length;
  const tail = e.taille === "grand" ? 0.45 : e.taille === "moyen" ? 0.22 : 0.08;
  // E(t) : lumière qui apparaît, normalisée (1 au pic), puis queue qui retombe
  const E = (tn) => {
    const x = tn * fps;
    if (x < 0) return 0;
    if (x >= nbImg - 1) return (c[nbImg - 1] / m) * Math.exp(-(tn - (nbImg - 1) / fps) / tail);
    const i = Math.floor(x);
    return (c[i] * (1 - (x - i)) + c[i + 1] * (x - i)) / m;
  };
  // progression cumulée 0 → 1 (pour la hauteur du souffle)
  const cumul = [0];
  for (let i = 0; i < nbImg; i++) cumul.push(cumul[i] + c[i]);
  const P = (tn) => borne(cumul[Math.min(nbImg, Math.max(0, Math.floor(tn * fps)))] / cumul[nbImg]);
  const acc = accordDe(k).voix;
  const pan = 0.5 + 0.25 * Math.sin(rang * 1.7 + k);
  const g = R.animations * (e.taille === "grand" ? 1.9 : e.taille === "moyen" ? 1.7 : 1.1);
  const n0 = Math.round(t0 * SR);
  const long = Math.round(((nbImg - 1) / fps + tail * 5) * SR);

  if (e.taille === "grand") {
    coupSourd(out, t0, 120, 48, 0.2, 0.42 * g, pan);
    const osc = acc.slice(0, 3).flatMap((iv) => [-7, 7].map((ct) => ({ f: hz(48 + pc + iv) * Math.pow(2, ct / 1200), ph: alea() })));
    const lp = new Echelle();
    const bp = new SVF();
    for (let j = 0; j < long && n0 + j < N; j++) {
      const tn = j / SR;
      const e1 = E(tn);
      let x = 0;
      for (const o of osc) {
        o.ph += o.f / SR;
        if (o.ph >= 1) o.ph -= 1;
        x += scie(o.ph, o.f / SR);
      }
      const ton = lp.run(x * 0.2, 250 + 3200 * e1, 0.3) * (0.25 + 0.75 * e1) * Math.min(1, tn / 0.004);
      const souffle = bp.run(bruit(), 700 * (1 + 4 * P(tn)), 1.4, "bp") * e1 * 0.5;
      const y = (ton * 0.55 + souffle) * g * 0.5;
      pose(out, n0 + j, y, pan);
      pose(envoiOut, n0 + j, y * 0.35, pan);
    }
  } else if (e.taille === "moyen") {
    coupSourd(out, t0, 150, 70, 0.08, 0.25 * g, pan);
    const note = 48 + pc + acc[rang % acc.length] + 12 * Math.floor(rang / acc.length);
    const f = hz(note);
    const lp = new Echelle();
    const bp = new SVF();
    let p1 = alea(),
      p2 = alea();
    for (let j = 0; j < long && n0 + j < N; j++) {
      const tn = j / SR;
      const e1 = E(tn);
      p1 += (f * 1.003) / SR;
      p2 += (f * 0.997) / SR;
      if (p1 >= 1) p1 -= 1;
      if (p2 >= 1) p2 -= 1;
      const x = scie(p1, f / SR) * 0.6 + carre(p2, f / SR) * 0.4;
      const ton = lp.run(x, 300 + 2600 * e1, 0.35) * (0.35 + 0.65 * e1) * Math.min(1, tn / 0.003) * Math.exp(-tn / (tail * 2.5));
      const swish = bp.run(bruit(), 2500, 1.2, "bp") * e1 * 0.25;
      const y = (ton * 0.4 + swish) * g * 0.6;
      pose(out, n0 + j, y, pan);
      pose(envoiOut, n0 + j, y * 0.3, pan);
    }
  } else {
    const hp = new SVF();
    const lp = new Echelle();
    const f = hz(72 + pc + acc[rang % acc.length]);
    let ph = alea();
    for (let j = 0; j < 0.25 * SR && n0 + j < N; j++) {
      const tn = j / SR;
      ph += f / SR;
      if (ph >= 1) ph -= 1;
      const tic = hp.run(bruit(), 2200, 0.7, "hp") * Math.exp(-tn / 0.012) * 0.5;
      const blip = lp.run(scie(ph, f / SR), 2200, 0.2) * Math.exp(-tn / 0.09) * 0.25;
      const y = (tic + blip) * g * 0.45;
      pose(out, n0 + j, y, pan);
      pose(envoiOut, n0 + j, y * 0.4, pan);
    }
  }
}

// ───────────────────────────── Assemblage ─────────────────────────────

console.log(
  `Bande-son : ${DUREE.toFixed(2)} s, ${bpmReel.toFixed(1)} BPM (calé sur les coupes), ${mus.tonique} ${mus.mode}, style ${mus.style}, révélation ${T_REV?.toFixed(2) ?? "—"} s`,
);

// 1. musique : l'arrangement s'enrichit plan après plan
const musique = tampon();
const envoi = tampon(); // vers la réverbération
if (!SFX_SEULS) {
  const nap = nappe();
  ajoute(musique, sub(), R.sub);
  ajoute(musique, nap, R.nappe);
  ajoute(envoi, nap, 0.55 * R.nappe);
  const bp = bassePulsee();
  ajoute(musique, bp, R.basse);
  ajoute(envoi, bp, 0.08 * R.basse);
  const arp = pingPong(arpege(), tempsMoyen * 0.75, 0.42, 0.34, 2600);
  ajoute(musique, arp, R.arpege);
  ajoute(envoi, arp, 0.45 * R.arpege);
  const bat = batterie();
  ajoute(musique, bat.sec, 1);
  ajoute(musique, bat.mouille, 0.8);
  ajoute(envoi, bat.mouille, 0.9);
  ajoute(envoi, bat.sec, 0.06);
  appliqueMontee(musique, envoi);
}

// 2. design sonore structurel : il suit le montage automatiquement
const sfx = tampon();
const envoiSfx = tampon();
ping(envoiSfx, 0.02, 0.25 * R.ping);
ping(sfx, 0.02, (SFX_SEULS ? 1.4 : 0.8) * R.ping);
for (const s of sections) {
  if (s.k === 0) continue;
  const f = 0.45 + 0.5 * intensite(s.k);
  souffleInverse(sfx, s.t0, Math.min(0.6, s.duree * 0.2), 0.35 * f * R.accents, s.k);
  coupGrave(sfx, s.t0, 0.7 * f * R.accents);
  if (!SFX_SEULS) {
    frappe(musique, s.t0, s.k, f * R.frappe);
    frappe(envoi, s.t0, s.k, 0.3 * f * R.frappe);
  }
}
if (T_REV !== null) {
  grondement(sfx, Math.max(0, (sections[Math.max(0, NS - 2)]?.t0 ?? 0) + 0.2), T_REV, R.grondement);
  souffleInverse(sfx, T_REV, 1.1, 1.1 * R.explosion, NS - 1);
  explosion(sfx, T_REV, R.explosion);
  // comme la référence 3 : whoosh rapide pendant le recul, puis deux battements graves
  whoosh(sfx, T_REV + 0.08, 0.7, 1.5 * R.whoosh, 1);
  if (DUREE - T_REV > 2.4) battement(sfx, T_REV + 1.9, 0.8 * R.explosion);
  // traîne : l'accord de résolution, très filtré, qui s'éteint (références 1 et 3)
  if (mus.queue !== false && !SFX_SEULS) {
    const q = tampon();
    const lp = [new Echelle(), new Echelle()];
    const voix = accordDe(NS).voix.flatMap((iv) => [-7, 7].map((c) => ({ f: hz(52 + pc + iv) * Math.pow(2, c / 1200), ph: alea() })));
    let phs = 0;
    for (let n = Math.round(T_REV * SR); n < N; n++) {
      const tn = n / SR - T_REV;
      let s = 0;
      voix.forEach((v) => {
        v.ph += v.f / SR;
        if (v.ph >= 1) v.ph -= 1;
        s += scie(v.ph, v.f / SR);
      });
      phs += hz(28 + pc) / SR;
      const env = fondu(tn, 0.25, 0.8) * Math.exp(-tn / 1.5);
      const fc = expInterp(900, 220, tn / 3);
      q[0][n] = lp[0].run(s * 0.12, fc, 0.2) * env * 0.5 + Math.sin(2 * Math.PI * phs) * env * 0.05;
      q[1][n] = lp[1].run(s * 0.12, fc, 0.2) * env * 0.5 + Math.sin(2 * Math.PI * phs) * env * 0.05;
    }
    const qc = chorus(q);
    ajoute(sfx, qc, 1);
    ajoute(envoiSfx, qc, 0.8);
  }
}
// effets calés sur les animations repérées à l'image ; la musique se creuse un instant sous chacun
// (comme au mixage d'un film) pour qu'on entende l'effet tomber pile sur l'image.
if (REPERAGE) {
  const creuxMusique = new Float32Array(N).fill(1);
  for (const p of plans) {
    const k = plans.indexOf(p);
    REPERAGE.evenements.filter((e) => e.plan === p.id).forEach((e, rang) => {
      sonAnimation(sfx, envoiSfx, e, k, rang);
      const prof = Math.pow(10, -(e.taille === "grand" ? 4.5 : e.taille === "moyen" ? 3 : 1.5) / 20);
      const t0 = (p.debut + e.image) / fps;
      const t1 = (p.debut + e.fin) / fps + 0.12;
      for (let n = Math.max(0, Math.round((t0 - 0.03) * SR)); n < Math.min(N, Math.round((t1 + 0.4) * SR)); n++) {
        const t = n / SR;
        const a = fondu(t, t0 - 0.03, 0.03) * (1 - fondu(t, t1, 0.4));
        creuxMusique[n] = Math.min(creuxMusique[n], 1 - (1 - prof) * a);
      }
    });
  }
  if (!SFX_SEULS)
    for (let n = 0; n < N; n++) {
      musique[0][n] *= creuxMusique[n];
      musique[1][n] *= creuxMusique[n];
    }
}
// effets demandés plan par plan dans le montage (en plus)
for (const p of plans) {
  const k = plans.indexOf(p);
  for (const e of p.son ?? []) {
    const t0 = (p.debut + (e.a ?? 0)) / fps;
    const d = (e.duree ?? 30) / fps;
    if (e.type === "montee") montee(sfx, t0, d, k);
    if (e.type === "arpege" || e.type === "impulsions") impulsions(sfx, t0, d, k, e.ecart ?? null, e.nombre ?? 5);
    if (e.type === "souffle") souffleInverse(sfx, t0 + d, d, 0.7, Math.min(k + 1, NS - 1));
    if (e.type === "whoosh") whoosh(sfx, t0, d, 0.6, k % 2 ? -1 : 1);
    if (e.type === "impact") coupGrave(sfx, t0, 0.9);
    if (e.type === "ping") {
      ping(sfx, t0, 0.8);
      ping(envoiSfx, t0, 0.25);
    }
  }
}
if (T_LOGO !== null) {
  whoosh(sfx, T_LOGO - 0.2, D_LOGO + 0.3, 0.6, -1);
  ping(envoiSfx, T_LOGO + D_LOGO * 0.92, 1);
}
ajoute(envoiSfx, sfx, 0.35);

// 3. réverbérations (une grande salle pour la musique, une plus longue pour les effets)
if (!SFX_SEULS) ajoute(musique, salle(envoi, { rt60: 2.8, coupure: 5200, predelai: 0.02 }), R.reverb);
ajoute(sfx, salle(envoiSfx, { rt60: 4.2, coupure: 4200, predelai: 0.03, taille: 1.3 }), 0.8);

// 4. la musique s'arrête à la révélation
if (T_REV !== null && !SFX_SEULS) {
  const n0 = Math.round(T_REV * SR);
  if (mus.revelation === "filtre") {
    const lp = [new SVF(), new SVF()];
    for (let n = n0; n < N; n++) {
      const tn = (n - n0) / SR;
      const fc = expInterp(3000, 140, borne(tn / 0.35));
      const g = Math.exp(-tn / 0.8);
      for (let c = 0; c < 2; c++) musique[c][n] = lp[c].run(musique[c][n], fc, 0.7) * g;
    }
  } else {
    // arrêt net : on garde seulement la queue de réverbération, filtrée, qui retombe vite
    const lp = [new SVF(), new SVF()];
    for (let n = n0; n < N; n++) {
      const tn = (n - n0) / SR;
      const g = Math.exp(-tn / 0.35) * 0.6;
      for (let c = 0; c < 2; c++) musique[c][n] = lp[c].run(musique[c][n], 900, 0.7) * g;
    }
  }
}

// 5. mastering : compression de bus, niveau (RMS -14,5 dBFS sur la partie musicale : ça doit « taper »),
//    aigus adoucis sans étouffer, limiteur (crêtes ≤ -1 dBFS).
// (diagnostic) PISTES=dossier : écrit aussi la musique et les effets séparément, avant mastering
if (process.env.PISTES) {
  const ecrit = (nom, buf, g) => {
    const b = Buffer.alloc(44 + N * 4);
    b.write("RIFF", 0); b.writeUInt32LE(36 + N * 4, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
    b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(N * 4, 40);
    for (let n = 0; n < N; n++) for (let c = 0; c < 2; c++) b.writeInt16LE(Math.round(borne(buf[c][n] * g, -1, 1) * 32767), 44 + n * 4 + c * 2);
    fs.writeFileSync(path.join(process.env.PISTES, nom), b);
  };
  ecrit("musique.wav", musique, 0.25);
  ecrit("effets.wav", sfx, 0.25 * R.sfx);
}
const mix = tampon();
ajoute(mix, musique, 1);
ajoute(mix, sfx, SFX_SEULS ? 1 : R.sfx);
const nMus = Math.round((T_REV ?? DUREE) * SR);
const rms = (x) => {
  let s = 0;
  for (let n = 0; n < nMus; n++) s += (x[0][n] ** 2 + x[1][n] ** 2) / 2;
  return Math.sqrt(s / nMus) || 1e-9;
};
const gainEntree = Math.pow(10, -14.5 / 20) / rms(mix);
// compresseur de bus (2:1 au-dessus de -16 dBFS, attaque 10 ms, relâche 150 ms) : colle les couches ensemble
{
  const seuil = Math.pow(10, R.compression / 20);
  const att = Math.exp(-1 / (0.025 * SR)); // attaque lente : les transitoires passent (punch)
  const rel = Math.exp(-1 / (0.15 * SR));
  let envC = 0;
  for (let n = 0; n < N; n++) {
    const l = mix[0][n] * gainEntree;
    const r = mix[1][n] * gainEntree;
    const niveau = Math.max(Math.abs(l), Math.abs(r));
    envC = niveau > envC ? att * envC + (1 - att) * niveau : rel * envC + (1 - rel) * niveau;
    const g = envC > seuil ? Math.pow(envC / seuil, 1 / 2 - 1) : 1;
    mix[0][n] = l * g;
    mix[1][n] = r * g;
  }
}
const gainSortie = (SFX_SEULS ? Math.pow(10, -18 / 20) : Math.pow(10, -14.5 / 20)) / rms(mix) * mus.volume;
const PLAFOND = Math.pow(10, -1 / 20);
const SEUIL = PLAFOND * R.limiteur;
const limite = (x) => {
  const a = Math.abs(x);
  return a <= SEUIL ? x : Math.sign(x) * (SEUIL + (PLAFOND - SEUIL) * Math.tanh((a - SEUIL) / (PLAFOND - SEUIL)));
};
const doux = [new SVF(), new SVF()];
const dc = [0, 0];
const fonduFin = Math.round(0.4 * SR);
let crete = 0;
for (let c = 0; c < 2; c++)
  for (let n = 0; n < N; n++) {
    let x = mix[c][n] * gainSortie;
    dc[c] = dc[c] * 0.9995 + x * 0.0005; // pas de composante continue
    x -= dc[c];
    let s = limite(doux[c].run(x, 12500, 0.6));
    if (n > N - fonduFin) s *= (N - n) / fonduFin;
    if (n < 64) s *= n / 64;
    mix[c][n] = s;
    crete = Math.max(crete, Math.abs(s));
  }
console.log(`Crête ${(20 * Math.log10(crete)).toFixed(1)} dBFS · RMS (partie musicale) ${(20 * Math.log10(rms(mix))).toFixed(1)} dBFS`);

// 6. écriture WAV 16 bits stéréo
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
