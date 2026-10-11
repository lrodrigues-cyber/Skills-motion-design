import { Easing, interpolate } from "remotion";

/** Courbes relevées sur les références : tout arrive vite puis se pose longuement (ease-out marqué). */
export const ease = {
  /** Apparitions, croissances de barres, tracés de courbes. */
  sortie: Easing.bezier(0.16, 1, 0.3, 1),
  /** Mouvements de caméra continus (dérive) : presque linéaires, sans à-coup. */
  derive: Easing.bezier(0.33, 0, 0.67, 1),
  /** Transitions symétriques (fondus, recul). */
  doux: Easing.bezier(0.65, 0, 0.35, 1),
  lineaire: (t: number) => t,
};

/** Progression 0→1 entre `debut` et `debut + duree` (en images), bornée. */
export const prog = (frame: number, debut: number, duree: number, courbe = ease.sortie) =>
  interpolate(frame, [debut, debut + Math.max(1, duree)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: courbe,
  });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Interpolation multi-clés bornée : kf(f, [0, 30, 60], [0, 1, 0.5]). */
export const kf = (frame: number, cles: number[], valeurs: number[], courbe = ease.doux) =>
  interpolate(frame, cles, valeurs, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: courbe,
  });

/**
 * Apparition « de l'obscurité » d'un élément : opacité + léger flou + léger glissement.
 * Valeurs en px du monde : la caméra les grossit ×3 à ×5, d'où un flou de départ très faible.
 */
export const apparition = (frame: number, debut: number, duree = 12) => {
  const p = prog(frame, debut, duree);
  return {
    opacity: p,
    filter: p < 0.98 ? `blur(${(1 - p) * 1.2}px)` : undefined,
    transform: `translateY(${(1 - p) * 4}px)`,
  } as const;
};

/** Compteur : valeur affichée pendant une montée de `de` à `a`. */
export const compter = (frame: number, debut: number, duree: number, de: number, a: number) =>
  mix(de, a, prog(frame, debut, duree));
