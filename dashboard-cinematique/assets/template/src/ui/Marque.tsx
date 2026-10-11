import React from "react";

/**
 * Marque d'exemple (fictive) : un trait unique en arche, dessinable d'un seul geste.
 * À REMPLACER par le logo du client. Pour le tracé animé de fin (LogoTrace), le logo doit
 * idéalement être un trait (stroke) continu ; sinon utiliser LogoTrace en mode « masque ».
 */
export const MARQUE_TRACE = "M 24 84 L 24 50 A 26 26 0 0 1 76 50 L 76 84";
export const MARQUE_VUE = "0 0 100 100";
export const MARQUE_EPAISSEUR = 17;

export const Marque: React.FC<{ taille?: number; couleur?: string }> = ({ taille = 24, couleur = "#fff" }) => (
  <svg width={taille} height={taille} viewBox={MARQUE_VUE}>
    <path d={MARQUE_TRACE} fill="none" stroke={couleur} strokeWidth={MARQUE_EPAISSEUR} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
