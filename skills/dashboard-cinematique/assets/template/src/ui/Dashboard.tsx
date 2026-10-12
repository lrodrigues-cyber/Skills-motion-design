import React from "react";
import { couleurs } from "../style/tokens";
import { BarreHaute, BarreLaterale, EnTete, FINI } from "./structure";
import { CarteAlertes, CarteCourbe, CarteDivergente, CarteHistogramme, CarteKpi, CarteUsage } from "./cartes";

/**
 * Le « monde » filmé : UN tableau de bord complet, à taille réelle (1600 × 1000 px).
 * Les plans rapprochés et le recul final filment ce même monde → continuité parfaite.
 *
 * `horloges` : pour chaque bloc, nombre d'images depuis le début de son animation.
 * Un bloc absent = déjà en place (état final).
 */
export const MONDE = { largeur: 1600, hauteur: 1000 } as const;

export type Bloc = "laterale" | "haute" | "entete" | "kpi1" | "kpi2" | "kpi3" | "kpi4" | "courbe" | "usage" | "histo" | "divergent" | "alertes";

/** Centre (coordonnées du monde) de chaque bloc : sert à viser la caméra. */
export const CENTRES: Record<Bloc, { x: number; y: number }> = {
  laterale: { x: 116, y: 200 },
  haute: { x: 1400, y: 32 },
  entete: { x: 420, y: 100 },
  kpi1: { x: 415, y: 196 },
  kpi2: { x: 749, y: 196 },
  kpi3: { x: 1083, y: 196 },
  kpi4: { x: 1417, y: 196 },
  courbe: { x: 652, y: 429 },
  usage: { x: 1320, y: 429 },
  histo: { x: 438, y: 791 },
  divergent: { x: 896, y: 791 },
  alertes: { x: 1374, y: 791 },
};

export const Dashboard: React.FC<{ horloges?: Partial<Record<Bloc, number>>; marque?: string }> = ({ horloges = {}, marque = "Nova" }) => {
  const h = (b: Bloc) => horloges[b] ?? FINI;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: MONDE.largeur,
        height: MONDE.hauteur,
        background: couleurs.fond,
        borderRadius: 18,
        border: `1px solid ${couleurs.bord}`,
        transformStyle: "preserve-3d",
      }}
    >
      <BarreLaterale f={h("laterale")} hauteur={MONDE.hauteur} marque={marque} />
      <BarreHaute f={h("haute")} largeur={MONDE.largeur} fil={["Home", "Revenue overview"]} bouton="New insight" />
      <EnTete f={h("entete")} x={256} y={82} />
      <CarteKpi x={256} y={136} l={318} h={120} f={h("kpi1")} icone="dollar" libelle="MRR" valeur={128.4} prefixe="$" suffixe="K" decimales={1} delta="+12.5%" accent="vert" trainee="cyan" />
      <CarteKpi x={590} y={136} l={318} h={120} f={h("kpi2")} icone="utilisateurs" libelle="Active accounts" valeur={1284} delta="+4.3%" accent="vert" />
      <CarteKpi x={924} y={136} l={318} h={120} f={h("kpi3")} icone="tendance" libelle="Net retention" valeur={98.2} suffixe="%" decimales={1} delta="-0.4%" accent="rouge" />
      <CarteKpi x={1258} y={136} l={318} h={120} f={h("kpi4")} icone="eclat" libelle="Expansion MRR" valeur={4120} prefixe="$" delta="+$850" accent="vert" />
      <CarteCourbe x={256} y={272} l={792} h={314} f={h("courbe")} />
      <CarteUsage x={1064} y={272} l={512} h={314} f={h("usage")} />
      <CarteHistogramme x={256} y={602} l={364} h={378} f={h("histo")} />
      <CarteDivergente x={636} y={602} l={520} h={378} f={h("divergent")} />
      <CarteAlertes x={1172} y={602} l={404} h={378} f={h("alertes")} />
    </div>
  );
};
