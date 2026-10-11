import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";
import { ease, prog } from "../lib/anim";
import { neon } from "../style/tokens";

/**
 * Révélation du logo (fin de toutes les références) : le logo est TRACÉ d'un seul geste,
 * en blanc, avec une tête de comète bleue lumineuse au bout du trait (≈ 0,6–0,75 s),
 * puis la lueur bleue s'éteint et le logo reste blanc, net, au centre, sur fond noir.
 * Il est à l'écran (pas sur le plan incliné), au centre exact de l'image.
 */
export const LogoTrace: React.FC<{
  trace: string; // chemin SVG du logo (trait continu)
  vue?: string; // viewBox
  epaisseur: number; // épaisseur du trait dans le viewBox
  taille: number; // taille à l'écran en px
  debut: number; // image de début du tracé
  duree?: number; // images (20–24 dans les références)
  lueur?: keyof typeof neon;
}> = ({ trace, vue = "0 0 100 100", epaisseur, taille, debut, duree = 22, lueur = "bleu" }) => {
  const frame = useCurrentFrame();
  const L = getLength(trace);
  const p = prog(frame, debut, duree, ease.sortie);
  const extinction = 1 - prog(frame, debut + duree - 4, 12, ease.doux);
  if (frame < debut) return null;
  const longueur = L * p;
  const queue = L * 0.22;
  const tete = getPointAtLength(trace, Math.max(0.01, Math.min(L - 0.01, longueur))) ?? { x: 0, y: 0 };
  const c = neon[lueur];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <svg width={taille} height={taille} viewBox={vue} style={{ overflow: "visible" }}>
        <defs>
          <filter id="logo-flou" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={epaisseur * 0.45} />
          </filter>
          <radialGradient id="logo-tete">
            <stop offset="0" stopColor={c.coeur} stopOpacity="1" />
            <stop offset="0.35" stopColor={c.couleur} stopOpacity="0.85" />
            <stop offset="1" stopColor={c.halo} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* trait blanc déjà tracé */}
        <path
          d={trace}
          fill="none"
          stroke="#fff"
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${longueur} ${L + 1}`}
        />
        {/* queue bleue lumineuse qui suit la tête */}
        <g opacity={extinction}>
          <path
            d={trace}
            fill="none"
            stroke={c.couleur}
            strokeWidth={epaisseur * 1.3}
            strokeLinecap="round"
            strokeDasharray={`${Math.min(queue, longueur)} ${L * 2}`}
            strokeDashoffset={-Math.max(0, longueur - queue)}
            filter="url(#logo-flou)"
          />
          <path
            d={trace}
            fill="none"
            stroke={c.coeur}
            strokeWidth={epaisseur * 0.9}
            strokeLinecap="round"
            strokeDasharray={`${Math.min(queue * 0.5, longueur)} ${L * 2}`}
            strokeDashoffset={-Math.max(0, longueur - queue * 0.5)}
            opacity={0.85}
          />
          <circle cx={tete.x} cy={tete.y} r={epaisseur * 1.5} fill="url(#logo-tete)" />
          <circle cx={tete.x} cy={tete.y} r={epaisseur * 0.32} fill="#fff" opacity={p < 1 ? 1 : 0} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Variante pour un logo fourni en image (PNG/SVG plein, non traçable) : le logo se révèle
 * par un balayage circulaire avec un bord bleu lumineux, puis la lueur s'éteint.
 */
export const LogoMasque: React.FC<{ src: string; largeur: number; debut: number; duree?: number; lueur?: keyof typeof neon }> = ({
  src,
  largeur,
  debut,
  duree = 22,
  lueur = "bleu",
}) => {
  const frame = useCurrentFrame();
  if (frame < debut) return null;
  const p = prog(frame, debut, duree, ease.sortie);
  const extinction = 1 - prog(frame, debut + duree - 4, 12, ease.doux);
  const angle = p * 360;
  const masque = `conic-gradient(from -90deg, #000 ${angle}deg, transparent ${angle + 0.5}deg)`;
  const c = neon[lueur];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: largeur }}>
        <Img src={src} style={{ width: largeur, display: "block", WebkitMaskImage: masque, maskImage: masque }} />
        <Img
          src={src}
          style={{
            position: "absolute",
            inset: 0,
            width: largeur,
            opacity: extinction,
            filter: `brightness(0) saturate(100%) drop-shadow(0 0 0 ${c.couleur}) drop-shadow(0 0 ${largeur * 0.06}px ${c.couleur}) blur(${largeur * 0.02}px)`,
            WebkitMaskImage: masque,
            maskImage: masque,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
