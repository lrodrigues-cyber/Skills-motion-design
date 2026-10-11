import React from "react";
import { apparition, prog } from "../lib/anim";
import { couleurs, neon, police, rayon } from "../style/tokens";
import { couleurAlpha, halo } from "../cinema/Lumiere";
import { Avatar, Icone, Pastille, Texte, type NomIcone } from "./base";
import { Marque } from "./Marque";

/** Valeur d'horloge « animation terminée » pour les éléments hors du plan en cours. */
export const FINI = 100000;

// ───────────────────────────── Barre latérale ─────────────────────────────

const NAV: { nom: string; icone: NomIcone; actif?: boolean }[] = [
  { nom: "Dashboard", icone: "accueil", actif: true },
  { nom: "Revenue", icone: "tendance" },
  { nom: "Customers", icone: "utilisateurs" },
  { nom: "Usage", icone: "calques" },
  { nom: "Billing", icone: "carte" },
  { nom: "Reports", icone: "graphique" },
];

export const BarreLaterale: React.FC<{ f?: number; hauteur: number; marque: string }> = ({ f = FINI, hauteur, marque }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: 232,
      height: hauteur,
      background: "#0a0a0c",
      borderRight: `1px solid ${couleurs.bord}`,
      padding: "20px 14px",
      boxSizing: "border-box",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px", ...apparition(f, 0) }}>
      <Marque taille={22} />
      <Texte taille={15} graisse={600}>
        {marque}
      </Texte>
      <Pastille accent="bleu" taille={9} force={0.6} style={{ marginLeft: "auto" }}>
        Pro
      </Pastille>
    </div>
    <Texte taille={10} graisse={600} couleur={couleurs.texteFaible} style={{ padding: "0 10px 8px", letterSpacing: "0.08em" }}>
      WORKSPACE
    </Texte>
    {NAV.map((item, i) => (
      <div
        key={item.nom}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px",
          marginBottom: 2,
          borderRadius: 9,
          background: item.actif ? "rgba(255,255,255,0.06)" : "transparent",
          border: item.actif ? `1px solid ${couleurs.bord}` : "1px solid transparent",
          ...apparition(f, 4 + i * 3),
        }}
      >
        <Icone nom={item.icone} taille={15} couleur={item.actif ? couleurs.texte : couleurs.texteDoux} />
        <Texte taille={13} graisse={item.actif ? 600 : 500} couleur={item.actif ? couleurs.texte : couleurs.texteDoux}>
          {item.nom}
        </Texte>
      </div>
    ))}
    <div style={{ position: "absolute", left: 14, right: 14, bottom: 20, display: "flex", alignItems: "center", gap: 10, padding: 10 }}>
      <Avatar initiales="EM" teinte={210} taille={26} />
      <div>
        <Texte taille={12} graisse={600}>
          Emma Martin
        </Texte>
        <Texte taille={11} couleur={couleurs.texteFaible}>
          emma@nova.app
        </Texte>
      </div>
    </div>
  </div>
);

// ───────────────────────────── Barre du haut ─────────────────────────────

/**
 * Bouton à dégradé dont la teinte tourne (vidéo 1 : magenta → orange → vert → cyan → bleu).
 * `f` = images depuis l'apparition du bouton.
 */
export const BoutonDegrade: React.FC<{ f: number; libelle: string }> = ({ f, libelle }) => {
  const p = prog(f, 0, 10);
  const teinte = 300 + prog(f, 8, 70) * 330; // 300° (magenta) → 630° (= 270°, violet-bleu)
  const a = `hsl(${teinte % 360} 95% 60%)`;
  const b = `hsl(${(teinte + 35) % 360} 95% 62%)`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 10,
        background: `linear-gradient(90deg, ${a}, ${b})`,
        boxShadow: `0 0 4px ${a}, 0 0 18px hsl(${teinte % 360} 95% 55% / 0.7), 0 0 40px hsl(${teinte % 360} 95% 50% / 0.4)`,
        opacity: p,
        transform: `scale(${0.92 + 0.08 * p})`,
      }}
    >
      <Icone nom="plus" taille={13} couleur="#fff" epaisseur={2.4} />
      <Texte taille={13} graisse={600} couleur="#fff" style={{ textShadow: "0 0 6px rgba(255,255,255,0.6)" }}>
        {libelle}
      </Texte>
    </div>
  );
};

export const BarreHaute: React.FC<{ f?: number; largeur: number; fil: string[]; bouton: string }> = ({ f = FINI, largeur, fil, bouton }) => (
  <div
    style={{
      position: "absolute",
      left: 232,
      top: 0,
      width: largeur - 232,
      height: 64,
      borderBottom: `1px solid ${couleurs.bord}`,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      boxSizing: "border-box",
      gap: 10,
    }}
  >
    <Icone nom="accueil" taille={14} />
    {fil.map((morceau, i) => (
      <React.Fragment key={morceau}>
        {i > 0 && <Texte couleur={couleurs.texteFaible}>/</Texte>}
        <Texte taille={13} graisse={i === fil.length - 1 ? 600 : 500} couleur={i === fil.length - 1 ? couleurs.texte : couleurs.texteDoux}>
          {morceau}
        </Texte>
      </React.Fragment>
    ))}
    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: 220,
          padding: "8px 10px",
          borderRadius: rayon.champ,
          background: couleurs.fondChamp,
          border: `1px solid ${couleurs.bord}`,
          ...apparition(f, 0),
        }}
      >
        <Icone nom="recherche" taille={14} />
        <Texte couleur={couleurs.texteFaible}>Search anything…</Texte>
        <div
          style={{
            marginLeft: "auto",
            padding: "2px 6px",
            borderRadius: 6,
            border: `1px solid ${couleurs.bordFort}`,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <Texte taille={11} graisse={600} couleur={couleurs.texteDoux}>
            ⌘K
          </Texte>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          width: 36,
          height: 36,
          borderRadius: 10,
          border: `1px solid ${couleurs.bord}`,
          background: couleurs.fondCarteHaut,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...apparition(f, 12),
        }}
      >
        <Icone nom="cloche" taille={16} couleur={couleurs.texte} />
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 9,
            width: 7,
            height: 7,
            borderRadius: 7,
            background: neon.rouge.couleur,
            boxShadow: halo("rouge", 0.5),
          }}
        />
      </div>
      <div style={apparition(f, 20)}>
        <Avatar initiales="EM" teinte={210} taille={34} />
      </div>
      <div style={{ marginLeft: 4 }}>
        <BoutonDegrade f={f - 26} libelle={bouton} />
      </div>
    </div>
  </div>
);

// ───────────────────────────── En-tête de page ─────────────────────────────

export const EnTete: React.FC<{ f?: number; x: number; y: number }> = ({ f = FINI, x, y }) => (
  <div style={{ position: "absolute", left: x, top: y }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, ...apparition(f, 6) }}>
      <Texte taille={22} graisse={600}>
        Revenue overview
      </Texte>
      <div style={apparition(f, 14)}>
        <Pastille accent="ambre" taille={12} force={1.1} icone={<Icone nom="alerte" taille={12} couleur={neon.ambre.coeur} epaisseur={2.2} />}>
          Stripe sync delayed
        </Pastille>
      </div>
    </div>
    <div style={{ display: "flex", gap: 5, marginTop: 6, ...apparition(f, 20) }}>
      <Texte couleur={couleurs.texteFaible}>Updated 4m ago • MRR is up</Texte>
      <Texte graisse={600} couleur={neon.vert.couleur} style={{ textShadow: `0 0 8px ${couleurAlpha(neon.vert.halo, 0.7)}` }}>
        12.5%
      </Texte>
      <Texte couleur={couleurs.texteFaible}>over the last 30 days.</Texte>
    </div>
  </div>
);

export { police };
