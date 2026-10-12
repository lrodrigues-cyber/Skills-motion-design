import React from "react";
import { apparition, compter, ease, mix, prog } from "../lib/anim";
import { couleurs, neon, type Neon } from "../style/tokens";
import { couleurAlpha, hachures, halo, haloTexte, relief, remplissageNeon, Trainee } from "../cinema/Lumiere";
import { Carte, Icone, Pastille, Texte, type NomIcone } from "./base";
import { FINI } from "./structure";

// Chaque carte reçoit `f` : nombre d'images écoulées depuis le début de SON animation.
// Hors du plan qui la montre, f = FINI (état final, immobile).

type Boite = { x: number; y: number; l: number; h: number; f?: number };

const EnTeteCarte: React.FC<{ icone: NomIcone; titre: string; droite?: React.ReactNode; f: number }> = ({ icone, titre, droite, f }) => (
  <div style={{ position: "absolute", left: 22, right: 22, top: 18, display: "flex", alignItems: "center", gap: 8, ...apparition(f, 0) }}>
    <Icone nom={icone} taille={15} />
    <Texte couleur={couleurs.texteDoux} graisse={500}>
      {titre}
    </Texte>
    <div style={{ marginLeft: "auto" }}>{droite}</div>
  </div>
);

const fmt = (n: number, decimales = 0) => n.toLocaleString("en-US", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

// ───────────────────────────── KPI ─────────────────────────────

export const CarteKpi: React.FC<
  Boite & {
    icone: NomIcone;
    libelle: string;
    valeur: number;
    prefixe?: string;
    suffixe?: string;
    decimales?: number;
    delta: string;
    accent: Neon;
    trainee?: Neon;
  }
> = ({ x, y, l, h, f = FINI, icone, libelle, valeur, prefixe = "", suffixe = "", decimales = 0, delta, accent, trainee }) => (
  <>
    {trainee && <Trainee couleur={trainee} progression={prog(f, 14, 34)} x={x} y={y + h} largeur={l} />}
    <Carte x={x} y={y} l={l} h={h}>
      <EnTeteCarte icone={icone} titre={libelle} f={f} />
      <div style={{ position: "absolute", left: 22, top: 52, display: "flex", alignItems: "baseline", gap: 10 }}>
        <Texte taille={30} graisse={600} style={{ textShadow: relief(3), ...apparition(f, 6) }}>
          {prefixe}
          {fmt(compter(f, 6, 30, valeur * 0.6, valeur), decimales)}
          {suffixe}
        </Texte>
        <div style={apparition(f, 16)}>
          <Pastille accent={accent} icone={<Icone nom="tendance" taille={11} couleur={neon[accent].coeur} epaisseur={2.4} />}>
            {delta}
          </Pastille>
        </div>
      </div>
      <Texte taille={12} couleur={couleurs.texteFaible} style={{ position: "absolute", left: 22, top: 94, ...apparition(f, 20) }}>
        vs last month
      </Texte>
    </Carte>
  </>
);

// ───────────────────────────── Courbe (revenus) ─────────────────────────────

const REVENUS = [104, 109.5, 111, 117, 115.2, 124, 128.4];
const COMPARAISON = [103, 105.5, 108, 110, 112.5, 114.5, 117];
const JOURS = ["OCT 1", "OCT 4", "OCT 8", "OCT 12", "OCT 16", "OCT 20", "OCT 24"];

export const CarteCourbe: React.FC<Boite & { accent?: Neon }> = ({ x, y, l, h, f = FINI, accent = "bleu" }) => {
  const c = neon[accent];
  const g = 64,
    d = l - 28,
    haut = 112,
    bas = h - 42;
  const px = (i: number) => g + (i / (REVENUS.length - 1)) * (d - g);
  const py = (v: number) => mix(bas, haut, (v - 100) / 30);
  const trace = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const p = prog(f, 8, 30, ease.sortie);
  const xFin = mix(g, d, p);
  // position de la tête du tracé (pour son point lumineux)
  const seg = Math.min(REVENUS.length - 2, Math.floor(p * (REVENUS.length - 1)));
  const loc = p * (REVENUS.length - 1) - seg;
  const yTete = mix(py(REVENUS[seg]), py(REVENUS[seg + 1]), loc);
  const id = `courbe-${x}-${y}`;
  return (
    <Carte x={x} y={y} l={l} h={h}>
      <EnTeteCarte
        icone="tendance"
        titre="Monthly recurring revenue"
        f={f}
        droite={
          <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 9, background: couleurs.fondChamp, border: `1px solid ${couleurs.bord}` }}>
            {["7D", "30D", "90D"].map((t) => (
              <Texte
                key={t}
                taille={11}
                graisse={600}
                couleur={t === "30D" ? couleurs.texte : couleurs.texteFaible}
                style={{ padding: "3px 8px", borderRadius: 6, background: t === "30D" ? "rgba(255,255,255,0.08)" : "transparent" }}
              >
                {t}
              </Texte>
            ))}
          </div>
        }
      />
      <div style={{ position: "absolute", left: 22, top: 48, display: "flex", alignItems: "baseline", gap: 10, ...apparition(f, 4) }}>
        <Texte taille={28} graisse={600} style={{ textShadow: relief(3) }}>
          ${fmt(compter(f, 8, 30, 98, 128.42) * 1000)}
        </Texte>
        <Pastille accent="vert">+12.5%</Pastille>
      </div>
      <svg width={l} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <filter id={`${id}-halo`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <linearGradient id={`${id}-aire`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.couleur} stopOpacity="0.28" />
            <stop offset="1" stopColor={c.couleur} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <rect x={0} y={0} width={xFin + 2} height={h} />
          </clipPath>
        </defs>
        {[100, 110, 120, 130].map((v) => (
          <g key={v}>
            <line x1={g} x2={d} y1={py(v)} y2={py(v)} stroke={couleurs.grille} strokeDasharray="3 5" />
            <text x={g - 12} y={py(v) + 4} textAnchor="end" fill={couleurs.texteFaible} fontFamily="Inter" fontSize={11} fontWeight={500}>
              ${v}K
            </text>
          </g>
        ))}
        {JOURS.map((j, i) => (
          <text key={j} x={px(i)} y={h - 16} textAnchor="middle" fill={couleurs.texteFaible} fontFamily="Inter" fontSize={11} fontWeight={500}>
            {j}
          </text>
        ))}
        <path d={trace(COMPARAISON)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.6} strokeDasharray="5 6" opacity={prog(f, 4, 16)} />
        <g clipPath={`url(#${id}-clip)`}>
          <path d={`${trace(REVENUS)} L${d},${bas} L${g},${bas} Z`} fill={`url(#${id}-aire)`} />
          <path d={trace(REVENUS)} fill="none" stroke={c.halo} strokeWidth={9} filter={`url(#${id}-halo)`} opacity={0.9} />
          <path d={trace(REVENUS)} fill="none" stroke={c.couleur} strokeWidth={3.2} strokeLinejoin="round" />
          <path d={trace(REVENUS)} fill="none" stroke={c.coeur} strokeWidth={1.2} strokeLinejoin="round" opacity={0.8} />
        </g>
        {REVENUS.map((v, i) => {
          const visible = prog(f, 8 + (i / (REVENUS.length - 1)) * 30 * 0.55, 8);
          return (
            <g key={i} opacity={visible} transform={`translate(${px(i)},${py(v)}) scale(${0.4 + 0.6 * visible})`}>
              <circle r={9} fill={c.halo} opacity={0.35} filter={`url(#${id}-halo)`} />
              <circle r={5.5} fill={couleurs.fondCarte} stroke={c.couleur} strokeWidth={2.6} />
            </g>
          );
        })}
        {p > 0 && p < 1 && <circle cx={xFin} cy={yTete} r={6} fill={c.coeur} filter={`url(#${id}-halo)`} />}
      </svg>
    </Carte>
  );
};

// ───────────────────────────── Usage (alerte rouge) ─────────────────────────────

export const CarteUsage: React.FC<Boite> = ({ x, y, l, h, f = FINI }) => {
  const remplissage = prog(f, 12, 36);
  const largeurPiste = l - 48;
  const lum = prog(f, 14, 30);
  return (
    <Carte x={x} y={y} l={l} h={h}>
      <EnTeteCarte icone="calques" titre="Usage limits" f={f} droite={<Pastille accent="bleu" force={0.6}>API</Pastille>} />
      <div style={{ position: "absolute", left: 24, top: 62, display: "flex", alignItems: "center", gap: 8, ...apparition(f, 4) }}>
        <Icone nom="alerte" taille={18} couleur={neon.rouge.coeur} epaisseur={2.2} style={{ filter: `drop-shadow(0 0 2px ${neon.rouge.couleur}) drop-shadow(0 0 5px ${neon.rouge.halo})` }} />
        <Texte graisse={600} couleur={neon.rouge.coeur} style={{ textShadow: haloTexte("rouge", 0.6) }}>
          Action required
        </Texte>
      </div>
      <div style={{ position: "absolute", left: 24, top: 104, display: "flex", alignItems: "baseline", gap: 8 }}>
        <Texte taille={46} graisse={600} style={{ textShadow: relief(5), ...apparition(f, 8) }}>
          {fmt(Math.round(compter(f, 10, 38, 12000, 91000) / 10) * 10).replace(/,/g, " ")}
        </Texte>
        <Texte taille={30} graisse={500} couleur={couleurs.texteFaible} style={{ textShadow: relief(3, 0.45), ...apparition(f, 12) }}>
          / 100 000
        </Texte>
      </div>
      <div style={{ position: "absolute", left: 24, top: 186, width: largeurPiste, height: 12, borderRadius: 12, background: "#1b1b20" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 12,
            width: largeurPiste * 0.91 * remplissage,
            borderRadius: 12,
            background: `linear-gradient(90deg, ${neon.rouge.halo}, ${neon.rouge.couleur} 70%, ${neon.rouge.coeur})`,
            boxShadow: halo("rouge", lum),
          }}
        />
      </div>
      <Texte
        graisse={600}
        couleur={neon.rouge.coeur}
        style={{ position: "absolute", right: 24, top: 160, textShadow: haloTexte("rouge", 0.6), ...apparition(f, 30) }}
      >
        {Math.round(91 * remplissage)}% used
      </Texte>
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 22, display: "flex", alignItems: "center", ...apparition(f, 24) }}>
        <Texte taille={12} couleur={couleurs.texteFaible}>
          Resets in 4 days
        </Texte>
        <div style={{ marginLeft: "auto", padding: "7px 12px", borderRadius: 9, border: `1px solid ${couleurs.bordFort}`, background: "rgba(255,255,255,0.04)" }}>
          <Texte taille={12} graisse={600}>
            Upgrade plan
          </Texte>
        </div>
      </div>
    </Carte>
  );
};

// ───────────────────────────── Histogramme (barres verticales) ─────────────────────────────

const INSCRIPTIONS = [0.52, 0.36, 0.6, 0.46, 0.7, 0.63, 0.86, 0.77];
const TAUX = [0.62, 0.66, 0.7, 0.86, 0.6, 0.64, 0.44, 0.3];
const MOIS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG"];

export const CarteHistogramme: React.FC<Boite & { accent?: Neon; ligne?: Neon }> = ({ x, y, l, h, f = FINI, accent = "cyan", ligne = "rouge" }) => {
  const g = 30,
    bas = h - 44,
    haut = 112;
  const pas = (l - g * 2) / INSCRIPTIONS.length;
  const lb = pas * 0.58;
  const pl = prog(f, 14, 46, ease.derive);
  const px = (i: number) => g + pas * i + pas / 2;
  const py = (v: number) => mix(bas, haut, v);
  const trace = TAUX.map((v, i) => `${i ? "L" : "M"}${px(i)},${py(v)}`).join(" ");
  const id = `histo-${x}-${y}`;
  return (
    <Carte x={x} y={y} l={l} h={h}>
      <EnTeteCarte icone="graphique" titre="Weekly signups" f={f} droite={<Pastille accent={accent}>+18%</Pastille>} />
      <Texte taille={28} graisse={600} style={{ position: "absolute", left: 22, top: 48, textShadow: relief(3), ...apparition(f, 4) }}>
        {fmt(compter(f, 6, 40, 900, 2481))}
      </Texte>
      {INSCRIPTIONS.map((v, i) => {
        const p = prog(f, 10 + i * 4, 24);
        const hb = (bas - haut) * v * p;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px(i) - lb / 2,
              top: bas - hb,
              width: lb,
              height: hb,
              borderRadius: lb / 3,
              background: `linear-gradient(180deg, ${neon[accent].coeur}, ${neon[accent].couleur} 35%, ${neon[accent].halo})`,
              boxShadow: halo(accent, 0.9 * Math.min(1, p * 2)),
              opacity: p > 0 ? 1 : 0,
            }}
          />
        );
      })}
      <svg width={l} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <filter id={`${id}-halo`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <rect x={0} y={0} width={mix(g, l - g, pl)} height={h} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <path d={trace} fill="none" stroke={neon[ligne].halo} strokeWidth={5} filter={`url(#${id}-halo)`} />
          <path d={trace} fill="none" stroke={neon[ligne].couleur} strokeWidth={2} />
          {TAUX.map((v, i) => (
            <circle key={i} cx={px(i)} cy={py(v)} r={3.2} fill={couleurs.fondCarte} stroke={neon[ligne].couleur} strokeWidth={1.6} />
          ))}
        </g>
        {MOIS.map((m, i) => (
          <text key={m} x={px(i)} y={h - 20} textAnchor="middle" fill={couleurs.texteFaible} fontFamily="Inter" fontSize={10.5} fontWeight={500}>
            {m}
          </text>
        ))}
      </svg>
    </Carte>
  );
};

// ───────────────────────────── Barres divergentes (vert / rouge) ─────────────────────────────

const MOUVEMENTS: { nom: string; v: number; libelle: string }[] = [
  { nom: "New business", v: 0.92, libelle: "+$10.2K" },
  { nom: "Expansion", v: 0.5, libelle: "+$4.1K" },
  { nom: "Contraction", v: -0.34, libelle: "-$2.3K" },
  { nom: "Churn", v: -0.56, libelle: "-$3.9K" },
];

export const CarteDivergente: React.FC<Boite> = ({ x, y, l, h, f = FINI }) => {
  const axe = 300,
    demi = 140,
    top0 = 124,
    pasL = 56;
  return (
    <Carte x={x} y={y} l={l} h={h}>
      <EnTeteCarte icone="dollar" titre="Net MRR movement" f={f} droite={<Pastille accent="menthe">+$8,050</Pastille>} />
      <Texte taille={28} graisse={600} style={{ position: "absolute", left: 22, top: 48, textShadow: relief(3), ...apparition(f, 4) }}>
        +${fmt(compter(f, 6, 36, 2000, 8050))}
      </Texte>
      <div style={{ position: "absolute", left: axe, top: top0 - 14, width: 1, height: pasL * 4 + 8, background: couleurs.bordFort }} />
      {MOUVEMENTS.map((m, i) => {
        const p = prog(f, 8 + i * 5, 26);
        const positif = m.v > 0;
        const accent: Neon = positif ? "menthe" : "rouge";
        const w = Math.abs(m.v) * demi * p;
        const hw = demi * 0.14 * prog(f, 22 + i * 5, 16); // bout hachuré « projeté »
        const ty = top0 + i * pasL;
        return (
          <React.Fragment key={m.nom}>
            <Texte taille={12} couleur={couleurs.texteDoux} style={{ position: "absolute", left: 22, top: ty + 6, ...apparition(f, 4 + i * 3) }}>
              {m.nom}
            </Texte>
            <div style={{ position: "absolute", left: axe - demi, top: ty, width: demi * 2, height: 28, borderRadius: 14, background: "#141418", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)" }} />
            <div
              style={{
                position: "absolute",
                left: positif ? axe : axe - (w + hw),
                top: ty,
                width: w + hw,
                height: 28,
                borderRadius: 14,
                overflow: "hidden",
                boxSizing: "border-box",
                border: hw > 0.5 ? `1px solid ${couleurAlpha(neon[accent].couleur, 0.4)}` : "none",
                boxShadow: halo(accent, 0.9 * Math.min(1, p * 1.5)),
                opacity: p > 0 ? 1 : 0,
              }}
            >
              {/* bout hachuré « projeté » : seulement au-delà de la partie pleine */}
              <div style={{ position: "absolute", top: 0, bottom: 0, [positif ? "left" : "right"]: w, width: hw + 2, background: hachures(accent) }} />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  [positif ? "left" : "right"]: 0,
                  width: w,
                  background: `linear-gradient(${positif ? 90 : 270}deg, ${neon[accent].halo}, ${neon[accent].couleur} 55%, ${neon[accent].coeur})`,
                }}
              />
            </div>
            <Texte
              taille={12}
              graisse={600}
              couleur={neon[accent].coeur}
              style={{ position: "absolute", left: axe + demi + 14, top: ty + 6, textShadow: haloTexte(accent, 0.4), opacity: p }}
            >
              {m.libelle}
            </Texte>
          </React.Fragment>
        );
      })}
    </Carte>
  );
};

// ───────────────────────────── Alertes ─────────────────────────────

const ALERTES: { titre: string; detail: string; etat: Neon; icone: "point" | "triangle" | "valide"; montant?: string; quand: string }[] = [
  { titre: "TechFlow.io", detail: "Failed payment (Stripe)", etat: "rouge", icone: "point", montant: "$2,340", quand: "2h ago" },
  { titre: "GmbH Logistics", detail: "Usage drop > 48% (API)", etat: "ambre", icone: "triangle", quand: "5h ago" },
  { titre: "Northwind", detail: "Card expiring in 3 days", etat: "rouge", icone: "point", montant: "$890", quand: "1d ago" },
  { titre: "Acme Corp", detail: "Upgraded to Pro annual", etat: "vert", icone: "valide", montant: "$4,800", quand: "1d ago" },
];

export const CarteAlertes: React.FC<Boite> = ({ x, y, l, h, f = FINI }) => (
  <Carte x={x} y={y} l={l} h={h}>
    <EnTeteCarte icone="alerte" titre="Action required" f={f} droite={<Pastille accent="rouge">4</Pastille>} />
    {ALERTES.map((a, i) => {
      const ap = apparition(f, 6 + i * 6, 14);
      const c = neon[a.etat];
      return (
        <div
          key={a.titre}
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: 56 + i * 74,
            height: 64,
            borderRadius: 11,
            background: "rgba(255,255,255,0.025)",
            border: `1px solid ${couleurs.bord}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 14px",
            boxSizing: "border-box",
            ...ap,
          }}
        >
          {a.icone === "point" && <div style={{ width: 9, height: 9, borderRadius: 9, background: c.couleur, boxShadow: halo(a.etat, 0.8) }} />}
          {a.icone === "triangle" && <Icone nom="alerte" taille={15} couleur={c.couleur} epaisseur={2.4} style={{ filter: `drop-shadow(0 0 5px ${c.halo})` }} />}
          {a.icone === "valide" && <Icone nom="valide" taille={15} couleur={c.couleur} epaisseur={2.6} style={{ filter: `drop-shadow(0 0 5px ${c.halo})` }} />}
          <div>
            <Texte graisse={600}>{a.titre}</Texte>
            <Texte taille={12} couleur={couleurs.texteFaible}>
              {a.detail}
            </Texte>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {a.montant && (
              <Pastille accent={a.etat === "vert" ? "vert" : "rose"} taille={11}>
                {a.montant}
              </Pastille>
            )}
            <Texte taille={11} couleur={couleurs.texteFaible}>
              {a.quand}
            </Texte>
          </div>
        </div>
      );
    })}
  </Carte>
);

export { remplissageNeon };
