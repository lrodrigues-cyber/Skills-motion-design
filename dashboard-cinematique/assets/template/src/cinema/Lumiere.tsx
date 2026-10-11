import React from "react";
import { random } from "remotion";
import { neon, type Neon } from "../style/tokens";

// Toute la lumière du style passe par ici. Effets relevés dans les références :
// (les tailles sont en px du MONDE : la caméra les grossit ×3 à ×5 → rester sobre)
// 1. halo (bloom) autour des éléments d'accent      → halo(), haloTexte()
// 2. liseré lumineux sous une carte (rétro-éclairage) → <Trainee/>
// 4. texte/icône émissif blanc                       → haloTexte("blanc")
// 5. bordure parcourue par une lumière dégradée      → <BordureLumineuse/>

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Halo (box-shadow) : cœur serré + halo large. `force` 0→1.5. */
export const halo = (n: Neon, force = 1) => {
  const c = neon[n];
  if (force <= 0) return "none";
  return [
    `0 0 ${1.5 * force}px ${alpha(c.coeur, 0.85 * Math.min(1, force))}`,
    `0 0 ${5 * force}px ${alpha(c.couleur, 0.75 * Math.min(1, force))}`,
    `0 0 ${13 * force}px ${alpha(c.halo, 0.5 * Math.min(1, force))}`,
    `0 0 ${28 * force}px ${alpha(c.halo, 0.22 * Math.min(1, force))}`,
  ].join(", ");
};

/** Halo de texte (text-shadow) : chiffres, badges, libellés émissifs. */
export const haloTexte = (n: Neon, force = 1) => {
  const c = neon[n];
  if (force <= 0) return "none";
  return [
    `0 0 ${2 * force}px ${alpha(c.couleur, 0.8)}`,
    `0 0 ${6 * force}px ${alpha(c.halo, 0.55)}`,
    `0 0 ${14 * force}px ${alpha(c.halo, 0.3)}`,
  ].join(", ");
};

/** Remplissage d'une barre lumineuse : cœur presque blanc, bords colorés. */
export const remplissageNeon = (n: Neon, sens: "horizontal" | "vertical" = "vertical") => {
  const c = neon[n];
  const angle = sens === "vertical" ? "90deg" : "180deg";
  return `linear-gradient(${angle}, ${c.couleur} 0%, ${c.coeur} 50%, ${c.couleur} 100%)`;
};

export const couleurAlpha = alpha;

/** Relief : épaisseur des gros chiffres (extrusion vers le bas du plan, comme « 100 000 » en vidéo 4). */
export const relief = (profondeur = 4, pas = 0.5) =>
  Array.from({ length: profondeur }, (_, i) => {
    const v = Math.round(150 - (i / Math.max(1, profondeur - 1)) * 105);
    return `0 ${((i + 1) * pas).toFixed(2)}px 0 rgb(${v},${v},${v + 4})`;
  }).join(", ");

/** Hachures du segment « projeté » au bout des barres (vidéo 3). */
export const hachures = (n: Neon) =>
  `repeating-linear-gradient(-55deg, ${alpha(neon[n].couleur, 0.45)} 0 1.3px, transparent 1.3px 5px), ${alpha(neon[n].couleur, 0.08)}`;

/**
 * Traînée : liseré de lumière qui file le long du bord BAS d'une carte (ouverture de la vidéo 1).
 * Elle se place DERRIÈRE la carte (à rendre avant elle) : la carte opaque cache la moitié haute,
 * on ne voit que la lumière qui déborde sous le bord, comme un rétro-éclairage.
 * `x`, `y` = coin bas-gauche de la carte ; `largeur` = largeur de la carte.
 */
export const Trainee: React.FC<{
  couleur: Neon;
  progression: number; // 0→1 : la lumière file de gauche à droite
  x: number;
  y: number;
  largeur: number;
  epaisseur?: number;
}> = ({ couleur, progression, x, y, largeur, epaisseur = 3 }) => {
  const c = neon[couleur];
  const w = largeur * progression;
  if (w <= 0) return null;
  const e = epaisseur;
  return (
    <div style={{ position: "absolute", left: x + 6, top: y - e * 4, width: largeur - 12, height: e * 8, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: e * 1.5,
          width: w,
          height: e * 5,
          borderRadius: e * 3,
          background: `linear-gradient(90deg, transparent, ${alpha(c.halo, 0.35)} 35%, ${alpha(c.couleur, 0.6)} 90%, transparent)`,
          filter: `blur(${e * 1.6}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: e * 3.6,
          width: w,
          height: e * 0.8,
          borderRadius: e,
          background: `linear-gradient(90deg, transparent, ${alpha(c.couleur, 0.8)} 45%, ${c.coeur} 95%, transparent)`,
          filter: `blur(${e * 0.35}px)`,
        }}
      />
    </div>
  );
};

/**
 * Bordure parcourue par une lumière dégradée (champ de recherche de la vidéo 5).
 * À placer en `position: absolute; inset: 0` dans un parent arrondi.
 */
export const BordureLumineuse: React.FC<{
  angle: number; // degrés, animer pour faire tourner la lumière
  rayon: number;
  intensite?: number;
  epaisseur?: number;
  couleurs?: string[];
}> = ({ angle, rayon, intensite = 1, epaisseur = 1.5, couleurs = [neon.bleu.couleur, neon.violet.couleur, neon.rouge.couleur] }) => {
  const degrade = `conic-gradient(from ${angle}deg, transparent 0deg, ${couleurs[0]} 60deg, ${couleurs[1]} 120deg, ${couleurs[2]} 170deg, transparent 230deg, transparent 360deg)`;
  const masque = {
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
  } as React.CSSProperties;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, borderRadius: rayon, padding: epaisseur, background: degrade, opacity: intensite, ...masque }} />
      <div
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: rayon + 2,
          padding: epaisseur + 3,
          background: degrade,
          opacity: intensite * 0.8,
          filter: "blur(6px)",
          ...masque,
        }}
      />
    </>
  );
};
