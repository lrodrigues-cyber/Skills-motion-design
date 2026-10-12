import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Plateau, type PlateauProps } from "../cinema/Plateau";
import { Recul } from "../cinema/Recul";
import { LogoTrace } from "../cinema/Logo";
import { Etalonnage } from "../cinema/Etalonnage";
import { Dashboard, MONDE, type Bloc } from "../ui/Dashboard";
import { MARQUE_EPAISSEUR, MARQUE_TRACE, MARQUE_VUE } from "../ui/Marque";
import { couleurs } from "../style/tokens";
import { ease, prog } from "../lib/anim";
import montage from "./montage.json";

type Plan = {
  id: string;
  duree: number;
  horloges: Partial<Record<Bloc, number>>;
  camera: Pick<PlateauProps, "cible" | "zoom" | "inclinaison" | "rotation" | "nettete">;
};

/**
 * Trois fins relevées dans les références :
 *  - "recul"  : coupe sur le tableau de bord entier, à plat, qui respire puis s'éteint (vidéos 2, 3)
 *  - "barre"  : gros plan sur la barre du haut, qui s'éteint (vidéos 1, 4)
 *  - "aucune" : la vidéo s'arrête sur le dernier plan (vidéo 5, montage de plans)
 * `logo: true` ajoute le logo tracé (comète bleue) par-dessus la fin, comme dans les références.
 */
type Fin = {
  type: "recul" | "barre" | "aucune";
  /** Logo tracé à la fin. Désactivé par défaut (préférence : pas de logo de fin). */
  logo?: boolean;
  part?: number;
  logoDebut: number;
  logoDuree: number;
  extinctionDebut: number;
  extinctionDuree: number;
  total: number;
  logoTaille: number;
  camera?: Plan["camera"];
};

const PLANS = montage.plans as unknown as Plan[];
const FIN = montage.fin as unknown as Fin;

/** Début de chaque plan (en images) : les plans s'enchaînent en coupe franche. */
export const DEBUTS = PLANS.reduce<number[]>((acc, p, i) => [...acc, i === 0 ? 0 : acc[i - 1] + PLANS[i - 1].duree], []);
export const DEBUT_FIN = DEBUTS[DEBUTS.length - 1] + PLANS[PLANS.length - 1].duree;
export const DUREE_TOTALE = DEBUT_FIN + (FIN.type === "aucune" ? 0 : FIN.total);

export const DashboardFilm: React.FC<{ avecSon?: boolean }> = ({ avecSon = true }) => (
  <AbsoluteFill style={{ background: couleurs.fond }}>
    {PLANS.map((plan, i) => (
      <Sequence key={plan.id} from={DEBUTS[i]} durationInFrames={plan.duree} name={plan.id}>
        <Horloge plan={plan} />
      </Sequence>
    ))}

    {FIN.type !== "aucune" && (
      <Sequence from={DEBUT_FIN} durationInFrames={FIN.total} name={`fin (${FIN.type})${FIN.logo ? " + logo" : ""}`}>
        <AbsoluteFill style={{ background: "#050506" }}>
          {FIN.type === "recul" ? (
            <Recul monde={MONDE} part={FIN.part} sortie={{ debut: FIN.extinctionDebut, duree: FIN.extinctionDuree }}>
              <Dashboard marque={montage.marque} />
            </Recul>
          ) : (
            <FinBarre />
          )}
          {FIN.logo && (
            <LogoTrace
              trace={MARQUE_TRACE}
              vue={MARQUE_VUE}
              epaisseur={MARQUE_EPAISSEUR}
              taille={FIN.logoTaille}
              debut={FIN.logoDebut}
              duree={FIN.logoDuree}
            />
          )}
        </AbsoluteFill>
      </Sequence>
    )}

    <Etalonnage />
    {avecSon && <Html5Audio src={staticFile("audio/bande-son.wav")} />}
  </AbsoluteFill>
);

/** Fin « barre » : gros plan sur la barre du haut, qui s'éteint pendant que le logo se trace. */
const FinBarre: React.FC = () => {
  const frame = useCurrentFrame();
  const extinction = 1 - prog(frame, FIN.extinctionDebut, FIN.extinctionDuree, ease.doux);
  return (
    <AbsoluteFill style={{ opacity: extinction }}>
      <Plateau monde={MONDE} duree={FIN.total} {...(FIN.camera ?? PLANS[PLANS.length - 1].camera)}>
        <Dashboard horloges={{ haute: frame }} marque={montage.marque} />
      </Plateau>
    </AbsoluteFill>
  );
};

/** Un plan rapproché : le monde entier, filmé par le Plateau ; seuls les blocs du plan s'animent. */
const Horloge: React.FC<{ plan: Plan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const h: Partial<Record<Bloc, number>> = {};
  for (const [bloc, decalage] of Object.entries(plan.horloges)) h[bloc as Bloc] = frame - (decalage ?? 0);
  return (
    <Plateau monde={MONDE} duree={plan.duree} {...plan.camera}>
      <Dashboard horloges={h} marque={montage.marque} />
    </Plateau>
  );
};
