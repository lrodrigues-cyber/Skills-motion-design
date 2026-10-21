import type { PlateauProps, Pose } from "./Plateau";

/**
 * Les types de plans de coupe. Chaque cadrage calcule la caméra autour d'un point visé (en général
 * le centre d'un bloc, CENTRES dans ui/Dashboard.tsx) : on écrit dans le montage
 *   { "cible": "courbe", "cadrage": "travelling" }
 * au lieu d'une caméra complète. Une "camera" écrite à la main reste prioritaire.
 *
 * Tous gardent les règles du style : interface posée en 3D, mouvement continu à vitesse constante,
 * mise au point courte. Ce qui change : l'angle, le sens et l'ampleur du mouvement.
 */
export type Cadrage = "macro" | "travelling" | "plongee" | "rasant" | "zoom-avant" | "eloigne" | "orbite";

export const CADRAGES: Cadrage[] = ["macro", "travelling", "plongee", "rasant", "zoom-avant", "eloigne", "orbite"];

type Camera = Pick<PlateauProps, "cible" | "zoom" | "inclinaison" | "rotation" | "nettete">;

const de = (c: Pose, dx: number, dy: number): Pose => ({ x: c.x + dx, y: c.y + dy });

/** `n` : numéro du plan, pour varier l'angle d'un plan à l'autre quand le même cadrage revient. */
export const cadrer = (type: Cadrage, c: Pose, n = 0): Camera => {
  const s = n % 2 ? -1 : 1; // alterne le sens de la dérive
  const r = [0, 4, -3, 6, -5][n % 5]; // et un peu la rotation
  switch (type) {
    // Gros plan incliné, dérive lente : le plan signature du style.
    case "macro":
      return {
        cible: { de: de(c, -60 * s, 14), a: de(c, 60 * s, -8) },
        zoom: { de: 3.9, a: 4.15 },
        inclinaison: { de: 53, a: 51 },
        rotation: { de: -25 + r, a: -23 + r },
      };
    // Glissement latéral franc le long de l'élément (liste, rangée de cartes, graphique large).
    case "travelling":
      return {
        cible: { de: de(c, -190 * s, 12), a: de(c, 190 * s, -12) },
        zoom: { de: 3.4, a: 3.45 },
        inclinaison: { de: 47, a: 47 },
        rotation: { de: -13 + r / 2, a: -15 + r / 2 },
        nettete: { demiLargeur: 12, fondu: 24 },
      };
    // Vue presque du dessus qui avance doucement : on lit tout l'élément, profondeur de champ large.
    case "plongee":
      return {
        cible: { de: de(c, -25 * s, 14), a: de(c, 25 * s, -6) },
        zoom: { de: 2.6, a: 2.9 },
        inclinaison: { de: 20, a: 15 },
        rotation: { de: -7 + r / 2, a: -4 + r / 2 },
        nettete: { demiLargeur: 26, fondu: 30, flou: 7 },
      };
    // Angle rasant, très près : relief des chiffres et des barres, mise au point très courte.
    case "rasant":
      return {
        cible: { de: de(c, -80 * s, 6), a: de(c, 80 * s, -4) },
        // zoom ≤ 4 : au-delà, le sur-échantillonnage passe à ×5 et ce plan très incliné sature la mémoire du rendu
        zoom: { de: 3.8, a: 4.0 },
        inclinaison: { de: 62, a: 60 },
        rotation: { de: -9 + r / 2, a: -11 + r / 2 },
        nettete: { demiLargeur: 6, fondu: 18 },
      };
    // Poussée vers l'élément : on part de son contexte et on finit dessus.
    case "zoom-avant":
      return {
        cible: { de: de(c, -40 * s, 40), a: c },
        zoom: { de: 2.5, a: 3.8 },
        inclinaison: { de: 42, a: 47 },
        rotation: { de: -18 + r, a: -21 + r },
        nettete: { demiLargeur: 12, fondu: 24 },
      };
    // Retrait : on part du détail et on découvre l'élément entier (bon avant la fin).
    case "eloigne":
      return {
        cible: { de: c, a: de(c, 30 * s, -30) },
        zoom: { de: 4.4, a: 3.0 },
        inclinaison: { de: 50, a: 45 },
        rotation: { de: -22 + r, a: -19 + r },
        nettete: { demiLargeur: 12, fondu: 24 },
      };
    // Rotation autour de l'élément : l'interface tourne lentement sous la caméra.
    case "orbite":
      return {
        cible: { de: de(c, -20 * s, 8), a: de(c, 20 * s, -8) },
        zoom: { de: 3.6, a: 3.75 },
        inclinaison: { de: 52, a: 50 },
        rotation: { de: s > 0 ? -36 : -10, a: s > 0 ? -16 : -30 },
      };
  }
};
