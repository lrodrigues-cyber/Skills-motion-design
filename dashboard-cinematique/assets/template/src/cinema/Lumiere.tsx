import React from "react";
import { random } from "remotion";
import { neon, type Neon } from "../style/tokens";

// Toute la lumière du style passe par ici. Cinq effets relevés dans les références :
// 1. halo (bloom) autour des éléments d'accent      → halo(), haloTexte()
// 2. rayons volumétriques qui montent du plan        → <Rayons/>
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
 * Rayons volumétriques : un voile de lumière qui se dresse perpendiculairement au plan
 * (vu dans les références au-dessus de la barre rouge « 91% used », du bouton « Done »,
 * des barres vertes). Le parent doit garder `transformStyle: "preserve-3d"`.
 */
export const Rayons: React.FC<{
  couleur: Neon;
  largeur: number;
  hauteur?: number;
  intensite?: number; // 0→1, animable
  graine?: string;
  style?: React.CSSProperties;
}> = ({ couleur, largeur, hauteur = 110, intensite = 1, graine = "rayons", style }) => {
  const c = neon[couleur];
  const n = Math.max(3, Math.round(largeur / 8));
  const fondu = "linear-gradient(to top, #000 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.35) 65%, transparent 100%)";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: "100%",
        width: largeur,
        height: hauteur,
        transformOrigin: "50% 100%",
        transform: "rotateX(-90deg)",
        pointerEvents: "none",
        opacity: intensite,
        WebkitMaskImage: fondu,
        maskImage: fondu,
        ...style,
      }}
    >
      {largeur > 40 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "70%",
            background: `linear-gradient(to top, ${alpha(c.couleur, 0.4)}, ${alpha(c.halo, 0.12)} 55%, transparent)`,
            filter: "blur(5px)",
          }}
        />
      )}
      {Array.from({ length: n }).map((_, i) => {
        const x = ((i + 0.5) / n) * largeur + (random(`${graine}-x-${i}`) - 0.5) * 6;
        const w = 1.5 + random(`${graine}-w-${i}`) * 5;
        const h = 0.4 + random(`${graine}-h-${i}`) * 0.6;
        const a = 0.45 + random(`${graine}-a-${i}`) * 0.55;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - w / 2,
              bottom: 0,
              width: w,
              height: `${h * 100}%`,
              background: `linear-gradient(to top, ${alpha(c.coeur, a)}, ${alpha(c.couleur, a * 0.6)} 35%, ${alpha(c.halo, a * 0.25)} 70%, transparent)`,
              filter: "blur(1.6px)",
            }}
          />
        );
      })}
    </div>
  );
};

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
