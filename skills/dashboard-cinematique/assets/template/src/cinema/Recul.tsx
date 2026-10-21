import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, mix, prog } from "../lib/anim";

/**
 * Le recul final (vidéos 2 et 3) : coupe franche sur le tableau de bord ENTIER, à plat,
 * de face, centré sur fond noir, sur ≈ 88 % de la largeur de l’image (grand et lisible).
 * Il arrive déjà visible (jamais de noir à la coupe), reste fixe, puis s’éteint
 * (pendant que le logo se trace par-dessus, si `logo`).
 */
const M = 6; // marge transparente autour du monde (px du monde)

export const Recul: React.FC<{
  monde: { largeur: number; hauteur: number };
  part?: number; // largeur à l'écran / largeur de l'image
  sortie: { debut: number; duree: number };
  /**
   * Opacité à la coupe (elle monte à 1 en 12 images). 0,45 sur une interface sombre ; plus haut sur une
   * interface claire (~0,75), sinon le blanc à demi-opacité sur fond noir se lit comme une plongée au noir.
   */
  depart?: number;
  children: React.ReactNode;
}> = ({ monde, part = 0.88, sortie, depart = 0.45, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // grand et lisible : ~88 % de la largeur, sans dépasser 90 % de la hauteur
  const echelle = Math.min((width * part) / monde.largeur, (height * 0.9) / monde.hauteur);
  // pas de noir à la coupe : le recul arrive déjà à moitié visible et finit d'apparaître en 12 images
  const entree = mix(depart, 1, prog(frame, 0, 12, ease.sortie));
  // Pas de « respiration » (zoom lent) : Chrome fait alors avancer les bords et les filets par marches
  // d'un pixel, ce qui se voit comme des bandes qui clignotent. Le recul reste fixe, il vit par son
  // apparition et son extinction.
  const respiration = 1;
  const extinction = 1 - prog(frame, sortie.debut, sortie.duree, ease.doux);
  return (
    <AbsoluteFill style={{ opacity: entree * extinction, filter: `brightness(${mix(0.55, 1, entree)})` }}>
      {/* Le monde est dessiné à 2× (zoom CSS) puis réduit : texte et filets nets à cette petite taille. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: (monde.largeur + 2 * M) * 2,
          height: (monde.hauteur + 2 * M) * 2,
          transformOrigin: "0 0",
          transform: `translate3d(${width / 2}px, ${height / 2}px, 0) scale3d(${(echelle * respiration) / 2}, ${(echelle * respiration) / 2}, 1) translate3d(${-(monde.largeur + 2 * M)}px, ${-(monde.hauteur + 2 * M)}px, 0)`,
          willChange: "transform",
        }}
      >
        <div style={{ position: "absolute", left: 2 * M, top: 2 * M, width: monde.largeur * 2, height: monde.hauteur * 2, overflow: "hidden" }}>
          <div style={{ position: "relative", zoom: 2, width: monde.largeur, height: monde.hauteur }}>{children}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
