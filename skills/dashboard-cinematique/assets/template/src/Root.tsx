import React from "react";
import { Composition } from "remotion";
import { DashboardFilm, DUREE_TOTALE } from "./film/DashboardFilm";
import { chargerPolice } from "./lib/police";
import { Dashboard, MONDE } from "./ui/Dashboard";
import montage from "./film/montage.json";

chargerPolice();

export const Racine: React.FC = () => (
  <>
    <Composition
      id="DashboardFilm"
      component={DashboardFilm}
      durationInFrames={DUREE_TOTALE}
      fps={montage.fps}
      width={montage.largeur}
      height={montage.hauteur}
      defaultProps={{ avecSon: true }}
    />
    {/* Même film sans bande-son (pour tester l'image avant d'avoir généré le son). */}
    <Composition
      id="DashboardFilmMuet"
      component={DashboardFilm}
      durationInFrames={DUREE_TOTALE}
      fps={montage.fps}
      width={montage.largeur}
      height={montage.hauteur}
      defaultProps={{ avecSon: false }}
    />
    {/* Le monde à plat, état final, à sa taille réelle : à comparer à la capture du client
        (scripts/fidelite.mjs). Doit être identique à la capture avant tout brouillon. */}
    <Composition
      id="MondeAPlat"
      component={MondeAPlat}
      durationInFrames={1}
      fps={montage.fps}
      width={MONDE.largeur}
      height={MONDE.hauteur}
    />
  </>
);

const MondeAPlat: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <Dashboard marque={montage.marque} />
  </div>
);
