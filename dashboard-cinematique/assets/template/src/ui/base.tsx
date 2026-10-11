import React from "react";
import { couleurs, neon, police, rayon, type Neon } from "../style/tokens";
import { couleurAlpha, haloTexte } from "../cinema/Lumiere";

// Briques d'interface « SaaS sombre » : cartes très sombres, bord 1 px à peine visible,
// texte blanc pour les titres, gris pour le reste. Aucune couleur hors des accents néon.

export const Carte: React.FC<{
  x: number;
  y: number;
  l: number;
  h: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  /** Garde la 3D pour les enfants (obligatoire si la carte contient un <Faisceau/> ou une <Brume/>). */
  relief?: boolean;
}> = ({ x, y, l, h, children, style, relief }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: l,
      height: h,
      borderRadius: rayon.carte,
      background: `linear-gradient(180deg, ${couleurs.fondCarteHaut}, ${couleurs.fondCarte})`,
      border: `1px solid ${couleurs.bord}`,
      boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 20px 40px rgba(0,0,0,0.35)",
      transformStyle: relief ? "preserve-3d" : undefined,
      overflow: relief ? "visible" : "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Texte: React.FC<{
  children: React.ReactNode;
  taille?: number;
  graisse?: number;
  couleur?: string;
  style?: React.CSSProperties;
}> = ({ children, taille = police.corps, graisse = 500, couleur = couleurs.texte, style }) => (
  <div
    style={{
      fontFamily: police.famille,
      fontSize: taille,
      fontWeight: graisse,
      color: couleur,
      letterSpacing: taille >= 24 ? "-0.02em" : "-0.005em",
      lineHeight: 1.25,
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Badge coloré lumineux : « ↑ +31% », « Stripe Sync Delayed », « In Progress »… */
export const Pastille: React.FC<{
  children: React.ReactNode;
  accent: Neon;
  force?: number;
  taille?: number;
  icone?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, accent, force = 1, taille = police.petit, icone, style }) => {
  const c = neon[accent];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: `${taille * 0.22}px ${taille * 0.6}px`,
        borderRadius: rayon.pilule,
        background: couleurAlpha(c.couleur, 0.14),
        border: `1px solid ${couleurAlpha(c.couleur, 0.45 * force)}`,
        boxShadow: `0 0 ${10 * force}px ${couleurAlpha(c.halo, 0.45 * force)}, inset 0 0 6px ${couleurAlpha(c.couleur, 0.2 * force)}`,
        fontFamily: police.famille,
        fontSize: taille,
        fontWeight: 600,
        color: c.coeur,
        textShadow: haloTexte(accent, 0.5 * force),
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {icone}
      {children}
    </div>
  );
};

export const Avatar: React.FC<{ initiales: string; teinte: number; taille?: number; style?: React.CSSProperties }> = ({
  initiales,
  teinte,
  taille = 24,
  style,
}) => (
  <div
    style={{
      width: taille,
      height: taille,
      borderRadius: taille,
      background: `radial-gradient(circle at 35% 30%, hsl(${teinte} 70% 72%), hsl(${teinte} 55% 40%))`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: police.famille,
      fontSize: taille * 0.4,
      fontWeight: 600,
      color: "rgba(255,255,255,0.92)",
      flexShrink: 0,
      ...style,
    }}
  >
    {initiales}
  </div>
);

type NomIcone =
  | "accueil"
  | "graphique"
  | "utilisateurs"
  | "cloche"
  | "recherche"
  | "reglages"
  | "calques"
  | "alerte"
  | "valide"
  | "base"
  | "image"
  | "document"
  | "archive"
  | "eclat"
  | "plus"
  | "drapeau"
  | "dossier"
  | "personne"
  | "carte"
  | "tendance"
  | "dollar";

const TRACES: Record<NomIcone, React.ReactNode> = {
  accueil: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
  graphique: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-5M12 16V8M16 16v-3" />
    </>
  ),
  utilisateurs: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.3c1.6.7 2.6 2.3 3 4.7" />
    </>
  ),
  cloche: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  recherche: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.3-4.3" />
    </>
  ),
  reglages: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  calques: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  alerte: (
    <>
      <path d="M12 3.5L21.5 20h-19z" />
      <path d="M12 10v4.5M12 17.3v.2" />
    </>
  ),
  valide: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  base: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M20 16l-5-5-8.5 8.5" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  archive: (
    <>
      <rect x="3.5" y="4" width="17" height="5" rx="1.2" />
      <path d="M5 9v10h14V9M10 13h4" />
    </>
  ),
  eclat: <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  drapeau: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </>
  ),
  dossier: <path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4.5l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z" />,
  personne: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c1-3.6 3.8-5.6 7-5.6s6 2 7 5.6" />
    </>
  ),
  carte: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M9.5 9.5v10" />
    </>
  ),
  tendance: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 3v18" />
      <path d="M16.5 7.5c-.6-1.4-2.3-2.3-4.5-2.3-2.6 0-4.3 1.3-4.3 3.1 0 4.4 9 2.4 9 7 0 1.9-1.9 3.3-4.7 3.3-2.3 0-4.1-1-4.8-2.6" />
    </>
  ),
};

export const Icone: React.FC<{ nom: NomIcone; taille?: number; couleur?: string; epaisseur?: number; style?: React.CSSProperties }> = ({
  nom,
  taille = 16,
  couleur = couleurs.texteDoux,
  epaisseur = 1.8,
  style,
}) => (
  <svg
    width={taille}
    height={taille}
    viewBox="0 0 24 24"
    fill="none"
    stroke={couleur}
    strokeWidth={epaisseur}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {TRACES[nom]}
  </svg>
);

export type { NomIcone };
