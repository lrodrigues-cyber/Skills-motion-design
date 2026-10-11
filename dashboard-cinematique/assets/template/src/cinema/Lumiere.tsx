import React from "react";
import { random } from "remotion";
import { neon, type Neon } from "../style/tokens";

// Toute la lumière du style passe par ici. Cinq effets relevés dans les références :
// 1. halo (bloom) autour des éléments d'accent      → halo(), haloTexte()
// 2. lumière qui monte du plan (volumétrique douce)  → <Faisceau/> (point/icône), <Brume/> (barre)
// 3. traînée lumineuse qui file le long d'une carte  → <Trainee/>
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
    `0 0 ${2 * force}px ${alpha(c.coeur, 0.9 * Math.min(1, force))}`,
    `0 0 ${8 * force}px ${alpha(c.couleur, 0.85 * Math.min(1, force))}`,
    `0 0 ${22 * force}px ${alpha(c.halo, 0.6 * Math.min(1, force))}`,
    `0 0 ${48 * force}px ${alpha(c.halo, 0.35 * Math.min(1, force))}`,
  ].join(", ");
};

/** Halo de texte (text-shadow) : chiffres, badges, libellés émissifs. */
export const haloTexte = (n: Neon, force = 1) => {
  const c = neon[n];
  if (force <= 0) return "none";
  return [
    `0 0 ${3 * force}px ${alpha(c.couleur, 0.9)}`,
    `0 0 ${10 * force}px ${alpha(c.halo, 0.7)}`,
    `0 0 ${24 * force}px ${alpha(c.halo, 0.45)}`,
  ].join(", ");
};

/** Remplissage d'une barre lumineuse : cœur presque blanc, bords colorés. */
export const remplissageNeon = (n: Neon, sens: "horizontal" | "vertical" = "vertical") => {
  const c = neon[n];
  const angle = sens === "vertical" ? "90deg" : "180deg";
  return `linear-gradient(${angle}, ${c.couleur} 0%, ${c.coeur} 50%, ${c.couleur} 100%)`;
};

export const couleurAlpha = alpha;

/**
 * Faisceau : cône de lumière DOUX qui monte perpendiculairement au plan, comme la lumière
 * qui sort de l'icône d'alerte (vidéo 4) ou du bouton « Done » (vidéo 5).
 * Aucune rayure, aucun bord : un cœur étroit + un halo large, très flous, qui s'effacent
 * vers le haut et sur les côtés. Le parent doit garder `transformStyle: "preserve-3d"`.
 */
export const Faisceau: React.FC<{
  couleur: Neon;
  largeur: number; // largeur de la source (px du monde)
  hauteur?: number;
  intensite?: number; // 0→1, animable
  style?: React.CSSProperties;
}> = ({ couleur, largeur, hauteur = 60, intensite = 1, style }) => {
  const c = neon[couleur];
  const l = largeur * 2.2;
  return (
    <div
      style={{
        position: "absolute",
        left: largeur / 2 - l / 2,
        bottom: "40%",
        width: l,
        height: hauteur,
        transformOrigin: "50% 100%",
        transform: "rotateX(-90deg)",
        pointerEvents: "none",
        opacity: intensite,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 48% 100% at 50% 100%, ${alpha(c.couleur, 0.5)}, ${alpha(c.halo, 0.18)} 45%, transparent 78%)`,
          filter: `blur(${Math.max(2, largeur * 0.25)}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "36%",
          right: "36%",
          bottom: 0,
          height: "80%",
          borderRadius: "50% 50% 0 0",
          background: `linear-gradient(to top, ${alpha(c.coeur, 0.75)}, ${alpha(c.couleur, 0.35)} 30%, ${alpha(c.couleur, 0.1)} 65%, transparent)`,
          filter: `blur(${Math.max(1.5, largeur * 0.12)}px)`,
        }}
      />
    </div>
  );
};

/**
 * Brume : voile de lumière qui monte doucement au-dessus d'une barre lumineuse
 * (barre rouge « 91% used », barres vertes). Dégradé continu, plus fort du côté brillant,
 * fondu sur les bords : ça doit ressembler à la lueur d'un néon dans l'air, pas à des traits.
 */
export const Brume: React.FC<{
  couleur: Neon;
  largeur: number;
  hauteur?: number;
  intensite?: number;
  /** côté le plus lumineux (bout de la barre) */
  cote?: "gauche" | "droite";
  style?: React.CSSProperties;
}> = ({ couleur, largeur, hauteur = 34, intensite = 1, cote = "droite", style }) => {
  const c = neon[couleur];
  const fonduH = `linear-gradient(90deg, transparent, #000 ${cote === "droite" ? 35 : 8}%, #000 ${cote === "droite" ? 92 : 65}%, transparent)`;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: "45%",
        width: largeur,
        height: hauteur,
        transformOrigin: "50% 100%",
        transform: "rotateX(-90deg)",
        pointerEvents: "none",
        opacity: intensite,
        WebkitMaskImage: fonduH,
        maskImage: fonduH,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "100%",
          background: `linear-gradient(to top, ${alpha(c.couleur, 0.42)}, ${alpha(c.halo, 0.16)} 35%, ${alpha(c.halo, 0.05)} 70%, transparent)`,
          filter: "blur(5px)",
        }}
      />
    </div>
  );
};

/** Relief : épaisseur des gros chiffres (extrusion vers le bas du plan, comme « 100 000 » en vidéo 4). */
export const relief = (profondeur = 4, pas = 0.5) =>
  Array.from({ length: profondeur }, (_, i) => {
    const v = Math.round(150 - (i / Math.max(1, profondeur - 1)) * 105);
    return `0 ${((i + 1) * pas).toFixed(2)}px 0 rgb(${v},${v},${v + 4})`;
  }).join(", ");

/** Hachures du segment « projeté » au bout des barres (vidéo 3). */
export const hachures = (n: Neon) =>
  `repeating-linear-gradient(-55deg, ${alpha(neon[n].couleur, 0.55)} 0 1.6px, transparent 1.6px 5px)`;

/**
 * Traînée lumineuse : un trait de lumière flou qui s'étire le long d'un bord
 * (ouverture de la vidéo 1 : la lumière bleue qui file sous la carte KPI).
 */
export const Trainee: React.FC<{
  couleur: Neon;
  progression: number; // 0→1
  largeur: number;
  epaisseur?: number;
  style?: React.CSSProperties;
}> = ({ couleur, progression, largeur, epaisseur = 10, style }) => {
  const c = neon[couleur];
  const w = largeur * progression;
  return (
    <div style={{ position: "absolute", width: largeur, height: epaisseur * 6, pointerEvents: "none", ...style }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: epaisseur * 2.5,
          width: w,
          height: epaisseur,
          borderRadius: epaisseur,
          background: `linear-gradient(90deg, transparent, ${alpha(c.halo, 0.6)} 20%, ${c.couleur} 60%, ${c.coeur} 92%, transparent)`,
          filter: `blur(${epaisseur * 0.9}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: epaisseur * 1.2,
          width: w,
          height: epaisseur * 3.5,
          borderRadius: epaisseur * 3,
          background: `linear-gradient(90deg, transparent, ${alpha(c.halo, 0.35)} 40%, ${alpha(c.couleur, 0.55)} 85%, transparent)`,
          filter: `blur(${epaisseur * 2.2}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: epaisseur * 2.9,
          width: w,
          height: epaisseur * 0.25,
          borderRadius: epaisseur,
          background: `linear-gradient(90deg, transparent, ${alpha(c.couleur, 0.7)} 40%, ${c.coeur} 95%, transparent)`,
          filter: "blur(1px)",
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
