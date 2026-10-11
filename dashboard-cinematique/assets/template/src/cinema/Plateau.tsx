import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, mix, prog } from "../lib/anim";
import { PLAN } from "../style/tokens";

/**
 * LE plan du style : l'interface est posée sur un plan incliné en 3D (comme une feuille
 * sur un bureau) et filmée en très gros plan, avec une profondeur de champ très courte.
 *
 * - `cible` : point de l'interface (coordonnées du monde, en px) qui reste au centre de l'image.
 *   La caméra dérive lentement de `cible.de` vers `cible.a` pendant tout le plan.
 * - `zoom` : grossissement (≈ 2.4–4 pour un gros plan, l'UI est dessinée à taille réelle).
 * - `inclinaison` (rotateX) : 40–60°. `rotation` (rotateZ) : -15 à -35°.
 * - `nettete` : bande nette horizontale à l'écran (le plan s'éloigne vers le haut,
 *   donc le haut et le bas de l'image sont flous).
 * - `entree` : nombre d'images de la « mise au point » d'ouverture (flou + sombre → net).
 */
export type Pose = { x: number; y: number };

export type PlateauProps = {
  monde: { largeur: number; hauteur: number };
  cible: { de: Pose; a: Pose };
  zoom?: { de: number; a: number };
  inclinaison?: { de: number; a: number };
  rotation?: { de: number; a: number };
  focale?: number;
  nettete?: { centre?: number; demiLargeur?: number; fondu?: number; flou?: number; angle?: number };
  entree?: number;
  /** Durée du plan en images (la dérive caméra s'étale sur toute cette durée). */
  duree?: number;
  /** Rendu du monde ; appelé deux fois (copie floue + copie nette). */
  children: React.ReactNode;
};

export const Plateau: React.FC<PlateauProps> = ({
  monde,
  cible,
  zoom = { de: 3, a: 3.15 },
  inclinaison = { de: 50, a: 50 },
  rotation = { de: -24, a: -24 },
  focale = 1500,
  nettete = {},
  entree = 15,
  duree = PLAN,
  children,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = prog(frame, 0, duree, ease.derive);

  const cx = mix(cible.de.x, cible.a.x, t);
  const cy = mix(cible.de.y, cible.a.y, t);
  const z = mix(zoom.de, zoom.a, t);
  const rx = mix(inclinaison.de, inclinaison.a, t);
  const rz = mix(rotation.de, rotation.a, t);

  const { centre = 50, demiLargeur = 7, fondu = 20, flou = 12, angle = 180 } = nettete;

  // Mise au point d'ouverture : chaque plan commence flou et sombre puis se révèle.
  const pEntree = prog(frame, 0, entree, ease.sortie);
  const flouEntree = (1 - pEntree) * 14;
  const lumiere = mix(0.18, 1, prog(frame, 0, entree * 1.4, ease.sortie));

  const monde3D = (
    <AbsoluteFill style={{ perspective: focale, perspectiveOrigin: "50% 50%" }}>
      <div
        style={{
          position: "absolute",
          left: width / 2 - cx,
          top: height / 2 - cy,
          width: monde.largeur,
          height: monde.hauteur,
          transformOrigin: `${cx}px ${cy}px`,
          transform: `rotateX(${rx}deg) rotateZ(${rz}deg) scale(${z})`,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );

  const masque = `linear-gradient(${angle}deg, transparent ${centre - demiLargeur - fondu}%, #000 ${centre - demiLargeur}%, #000 ${centre + demiLargeur}%, transparent ${centre + demiLargeur + fondu}%)`;

  return (
    <AbsoluteFill style={{ filter: `brightness(${lumiere})` }}>
      {/* copie floue : tout ce qui est hors de la bande de netteté */}
      <AbsoluteFill style={{ filter: `blur(${flou + flouEntree * 0.5}px)` }}>{monde3D}</AbsoluteFill>
      {/* copie nette, masquée sur la bande de netteté */}
      <AbsoluteFill
        style={{
          WebkitMaskImage: masque,
          maskImage: masque,
          filter: flouEntree > 0.05 ? `blur(${flouEntree}px)` : undefined,
        }}
      >
        {monde3D}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
