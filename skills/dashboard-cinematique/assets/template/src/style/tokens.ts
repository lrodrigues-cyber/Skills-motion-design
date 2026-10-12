// Tokens du style « dashboard cinématique ».
// Valeurs relevées sur les vidéos de référence (couleurs échantillonnées sur les images).

export const FPS = 30;

/** Un plan rapproché dure ~3 s dans toutes les références (88–92 images). */
export const PLAN = 90;

export const couleurs = {
  // Fond : presque noir, jamais #000 pur (sauf la toute fin).
  fond: "#070708",
  fondCarte: "#111114",
  fondCarteHaut: "#16161a",
  fondChamp: "#0c0c0f",
  bord: "rgba(255,255,255,0.07)",
  bordFort: "rgba(255,255,255,0.12)",
  texte: "rgba(255,255,255,0.92)",
  texteDoux: "rgba(255,255,255,0.55)",
  texteFaible: "rgba(255,255,255,0.32)",
  grille: "rgba(255,255,255,0.06)",
} as const;

/**
 * Accents néon : la seule couleur de l'image vient d'eux, et ils brillent toujours (glow).
 * Chaque accent = [cœur clair, couleur, halo].
 */
export const neon = {
  cyan: { coeur: "#b8ecff", couleur: "#38c6fb", halo: "#1d8fe8" },
  bleu: { coeur: "#a9bfff", couleur: "#3d6bff", halo: "#2447f5" },
  menthe: { coeur: "#d4fff1", couleur: "#5ef0c0", halo: "#14c98b" },
  vert: { coeur: "#bdfbd9", couleur: "#22e08f", halo: "#0aa860" },
  rouge: { coeur: "#ffc2cc", couleur: "#ff4f6d", halo: "#e0244a" },
  rose: { coeur: "#ffc6e8", couleur: "#ff4fd8", halo: "#d81fb4" },
  ambre: { coeur: "#fff1b0", couleur: "#ffd23f", halo: "#e8a317" },
  violet: { coeur: "#e0d0ff", couleur: "#9d7bff", halo: "#7246f0" },
  orange: { coeur: "#ffd9b8", couleur: "#ff8a3d", halo: "#f0600f" },
  blanc: { coeur: "#ffffff", couleur: "#f2f4ff", halo: "#9fb4ff" },
} as const;

export type Neon = keyof typeof neon;

export const police = {
  famille: "Inter",
  // Interface « produit » : petits corps, comme une vraie app. C'est la caméra qui grossit.
  corps: 13,
  petit: 11,
  titre: 15,
  chiffre: 30,
} as const;

export const rayon = { carte: 14, pilule: 999, champ: 10 } as const;
