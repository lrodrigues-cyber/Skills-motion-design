import React from "react";
import { Composition } from "remotion";
import { DashboardFilm, DUREE_TOTALE } from "./film/DashboardFilm";
import { chargerPolice } from "./lib/police";
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
  </>
);
