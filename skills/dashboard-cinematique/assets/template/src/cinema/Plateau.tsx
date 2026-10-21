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
  /**
   * Sur-échantillonnage : le monde est DESSINÉ `surEchantillonnage` fois plus grand (CSS zoom)
   * puis réduit d'autant par la caméra. Sans ça, Chrome rastérise le plan 3D à taille réelle
   * puis l'agrandit (×3 à ×5) : texte pixelisé. Par défaut = zoom caméra max (arrondi au-dessus).
   */
  surEchantillonnage?: number;
  /**
   * Intensité de l'ombre de profondeur (le lointain et le premier plan qui tombent dans l'ombre) :
   * 1 pour une interface sombre, ~0,5 pour une interface claire (sinon le blanc vire au gris sale).
   */
  ombre?: number;
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
  entree = 12,
  duree = PLAN,
  surEchantillonnage,
  ombre: intensiteOmbre = 1,
  children,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // Dérive à VITESSE CONSTANTE : la caméra est déjà en mouvement à la coupe et l'est encore
  // à la coupe suivante (une dérive qui accélère puis freine donne des coupes « figées », saccadées).
  const t = prog(frame, 0, duree, ease.lineaire);

  const cx = mix(cible.de.x, cible.a.x, t);
  const cy = mix(cible.de.y, cible.a.y, t);
  const z = mix(zoom.de, zoom.a, t);
  const rx = mix(inclinaison.de, inclinaison.a, t);
  const rz = mix(rotation.de, rotation.a, t);
  const Z = surEchantillonnage ?? Math.min(6, Math.max(1, Math.ceil(Math.max(zoom.de, zoom.a))));

  const { centre = 50, demiLargeur = 8, fondu = 22, flou = 11, angle = 180 } = nettete;

  // Mise au point d'ouverture : le plan arrive DÉJÀ VISIBLE, flou et un peu sombre, et devient
  // net en ~12 images (vidéos de référence). Jamais de passage par le noir : ça clignote à chaque coupe.
  const pEntree = prog(frame, 0, entree, ease.sortie);
  const flouEntree = (1 - pEntree) * 9;
  const lumiere = mix(0.62, 1, pEntree);

  // Le monde rendu à une résolution donnée (sur-échantillonnage). Les couches floues n'ont pas
  // besoin de la pleine résolution : les dessiner petit allège énormément le rendu et évite les
  // tuiles non dessinées (rectangles noirs) quand la mémoire du navigateur sature.
  const monde3D = (r: number) => (
    <AbsoluteFill style={{ perspective: focale, perspectiveOrigin: "50% 50%" }}>
      {/* Toute la position de la caméra passe par la transformation (précision sub-pixel). Avec left/top,
          Chrome arrondit au pixel : l'image « saute » d'un pixel toutes les 3 images (tremblement). */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: monde.largeur * r,
          height: monde.hauteur * r,
          transformOrigin: "0 0",
          transform: `translate3d(${width / 2}px, ${height / 2}px, 0) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${z / r}) translate3d(${-cx * r}px, ${-cy * r}px, 0)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div style={{ position: "relative", zoom: r, width: monde.largeur, height: monde.hauteur, transformStyle: "preserve-3d" }}>
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );

  // Profondeur de champ PROGRESSIVE (3 niveaux, comme un vrai objectif) : la netteté décroît
  // doucement avec la distance au plan de mise au point. Deux niveaux seulement donnent un
  // « double » visible (net + flou superposés) : c'est ce qui faisait les flous artificiels.
  const bande = (demi: number, f: number) =>
    `linear-gradient(${angle}deg, transparent ${centre - demi - f}%, #000 ${centre - demi}%, #000 ${centre + demi}%, transparent ${centre + demi + f}%)`;
  const masqueNet = bande(demiLargeur, fondu * 0.55);
  const masqueMoyen = bande(demiLargeur + fondu * 0.45, fondu * 0.9);
  // Le lointain (haut) et le premier plan (bas) tombent dans l'ombre : la lumière est posée sur
  // la zone nette, le flou ne doit jamais être plus visible que le sujet.
  const o = (a: number) => `rgba(0,0,0,${(a * intensiteOmbre).toFixed(3)})`;
  const ombre = `linear-gradient(${angle}deg, ${o(0.82)} 0%, ${o(0.45)} ${Math.max(0, centre - demiLargeur - fondu)}%, rgba(0,0,0,0) ${centre - demiLargeur}%, rgba(0,0,0,0) ${centre + demiLargeur}%, ${o(0.3)} ${Math.min(100, centre + demiLargeur + fondu)}%, ${o(0.6)} 100%)`;

  return (
    <AbsoluteFill style={{ filter: `brightness(${lumiere})` }}>
      {/* très flou : tout ce qui est loin du plan de mise au point */}
      <AbsoluteFill style={{ filter: `blur(${flou + flouEntree * 0.5}px)` }}>{monde3D(1)}</AbsoluteFill>
      {/* légèrement flou : la transition */}
      <AbsoluteFill style={{ WebkitMaskImage: masqueMoyen, maskImage: masqueMoyen, filter: `blur(${flou * 0.35 + flouEntree * 0.6}px)` }}>{monde3D(Math.min(2, Z))}</AbsoluteFill>
      {/* net : la bande de mise au point */}
      <AbsoluteFill style={{ WebkitMaskImage: masqueNet, maskImage: masqueNet, filter: flouEntree > 0.05 ? `blur(${flouEntree}px)` : undefined }}>
        {monde3D(Z)}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: ombre, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
