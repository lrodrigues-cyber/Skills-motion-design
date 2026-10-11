import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, mix, prog } from "../lib/anim";

/**
 * Le recul final (vidéos 2 et 3) : coupe franche sur le tableau de bord ENTIER, à plat,
 * de face, centré sur fond noir, sur ≈ 50–64 % de la largeur de l’image.
 * Il arrive déjà à moitié visible (jamais de noir à la coupe), grossit à peine (respiration), puis s’éteint
 * pendant que le logo se trace par-dessus.
 */
export const Recul: React.FC<{
  monde: { largeur: number; hauteur: number };
  part?: number; // largeur à l'écran / largeur de l'image
  sortie: { debut: number; duree: number };
  children: React.ReactNode;
}> = ({ monde, part = 0.56, sortie, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const echelle = (width * part) / monde.largeur;
  // pas de noir à la coupe : le recul arrive déjà à moitié visible et finit d'apparaître en 12 images
  const entree = mix(0.45, 1, prog(frame, 0, 12, ease.sortie));
  const respiration = mix(0.985, 1.03, prog(frame, 0, sortie.debut + sortie.duree, ease.derive));
  const extinction = 1 - prog(frame, sortie.debut, sortie.duree, ease.doux);
  return (
    <AbsoluteFill style={{ opacity: entree * extinction }}>
      <div
        style={{
          position: "absolute",
          left: width / 2 - monde.largeur / 2,
          top: height / 2 - monde.hauteur / 2,
          width: monde.largeur,
          height: monde.hauteur,
          transform: `scale(${echelle * respiration})`,
          transformOrigin: "50% 50%",
          filter: `brightness(${mix(0.55, 1, entree)})`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
