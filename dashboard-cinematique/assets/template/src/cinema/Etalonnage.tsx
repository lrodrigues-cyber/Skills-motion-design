import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Étalonnage commun à tous les plans : vignettage sombre (les bords tombent dans le noir)
 * + grain très léger qui bouge à chaque image (évite l'aspect « numérique » trop propre
 * et le banding dans les dégradés sombres).
 */
export const Etalonnage: React.FC<{ vignette?: number; grain?: number }> = ({ vignette = 0.7, grain = 0.06 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 45%, rgba(0,0,0,${vignette * 0.6}) 80%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      {grain > 0 && (
        <AbsoluteFill style={{ opacity: grain, mixBlendMode: "screen" }}>
          <svg width="100%" height="100%">
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 97} stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
