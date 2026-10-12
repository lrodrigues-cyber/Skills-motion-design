# Recette son

Le son compte autant que l'image dans ce style. Une des références le dit : « Motion makes it feel alive. Sound makes it feel expensive. » Ce fichier explique ce qu'on a mesuré sur les 5 références, comment `scripts/bande-son.mjs` le reproduit, et comment le régler.

## Ce que les mesures ont montré

Les mesures portent sur la partie musicale, avant la révélation.

| Mesure | Références (V1–V5) | Ce que ça veut dire |
|---|---|---|
| Harmonie (accord détecté chaque seconde) | V1 fa mineur presque tout du long ; V2 do mineur ; V3 ré♭/fa mineur ; V4 la tout du long ; V5 fa/ré mineur puis ré | **Un seul accord** (bourdon). Les couleurs changent par-dessus, jamais de grille de 4 accords |
| Spectre (octaves, dB relatifs) | 31 Hz : -5 à -17 · 63 Hz : -2 à -11 · 125 Hz : -3 à -12 · 1 kHz : -13 à -31 · 8 kHz : -35 à -58 · 16 kHz : -53 à -82 | **Sub très profond**, médiums chauds, **aucun aigu brillant** |
| Stéréo | côtés/centre -4 à -16 dB, corrélation G/D 0,47–0,95 (médiane ~0,75) | Large, sauf V4 presque mono |
| Attaques (percussif / harmonique) | -10,8 à -14,5 dB | Pulsation présente mais douce |
| Rythme des attaques | V4 toutes les 0,163 s (doubles-croches à 92 BPM) ; V2 0,232 s ; V5 ~0,35–0,5 s (grosse caisse douce) ; V1 rares | Motif répétitif rapide ou nappe qui respire |
| Aux coupes | Pas d'attaque ni de saut de niveau systématique | **Aucun bruit de transition** sur les coupes |
| Niveau | RMS -15 à -25 dBFS, crête/RMS 9–16 dB | Musique devant, sans écrasement |
| Révélation | V3 : +4 dB au recul (moment le plus fort) puis chute ; V4 : arrêt de bande ; V2 : filtre fermé d'un coup | La musique s'arrête net au moment clé |

Notre bande-son d'exemple, mesurée de la même façon :
- spectre 31 Hz -4 · 63 Hz -6 · 125 Hz -11 · 1 kHz -16 · 8 kHz -42 · 16 kHz -62 ;
- corrélation G/D 0,86 ;
- attaques -8,7 dB ;
- RMS -18 dBFS, crête -4 dBFS.

Toutes ces valeurs sont dans la fourchette des références.

## Comment c'est construit

**Une seule source de vérité : `src/film/montage.json`.** Le script lit les plans, leurs effets (`son`) et la fin, puis calcule tout en secondes. Dès qu'on change le montage, on relance `node scripts/bande-son.mjs` (≈ 2 s).

La musique est **originale** et synthétisée par le script. On ne copie pas la musique des références, qui appartient à ses auteurs : on reproduit leur grammaire. Le résultat est déterministe : même montage + même `--graine` = même fichier.

### L'arrangement monte plan après plan (style `pulse`)

| Moment | Ce qui entre |
|---|---|
| Plan 1 | Sub sur la tonique (octave 1, 33–62 Hz, légèrement saturé pour les téléphones) + nappe large (5 scies désaccordées par note, filtrée, chorus) + motif en doubles-croches discret |
| Plan 2 | Le motif devient présent ; grosse caisse douce sur les temps (elle « pompe » la nappe et le sub) |
| Plan 4 | Scintillement : le motif une octave plus haut, une note sur deux, avec écho ping-pong |
| Tout du long | Le filtre s'ouvre (nappe 420 Hz → 2,3 kHz, motif 650 Hz → 4,2 kHz) ; la couleur d'accord alterne toutes les 2 mesures (i add9 ↔ VI maj7) au-dessus du bourdon |
| Révélation | Souffle inversé (réverbération d'un accord jouée à l'envers, 0,9 s) → la musique **s'arrête** (arrêt de bande ou filtre) → impact grave (62 → 31 Hz) → traîne de nappe filtrée qui s'éteint → silence |

Style `nappe` (V1, V2) : pas de grosse caisse. La nappe respire en croches dès le plan 2, et le motif entre au plan 3, deux fois moins dense.

## Réglages (`montage.json` → `musique`)

| Clé | Valeurs | Effet |
|---|---|---|
| `bpm` | 82–100 (92 par défaut) | Tempo. Doubles-croches = 60/bpm/4 s |
| `tonique` | `C`…`B`, `F#`, `Bb`… | Tonalité (références : F, C, D♭/A♭, A, E) |
| `mode` | `mineur` (défaut) / `majeur` | Couleur. Mineur = toutes les références |
| `style` | `pulse` (défaut, V4/V5) / `nappe` (V1/V2) | Motif rapide + grosse caisse douce, ou nappe qui respire |
| `revelation` | `arret` (défaut) / `filtre` | Arrêt de bande (V4) ou filtre qui se ferme (V2) |
| `queue` | `true` / `false` | Traîne de nappe filtrée après la révélation (V1, V3) |
| `volume` | 0.5–1.2 | Gain final (RMS cible -18 dBFS × volume) |

## Effets par plan (`plans[i].son`)

```json
"son": [
  { "type": "montee",  "a": 8,   "duree": 40 },
  { "type": "arpege",  "a": 8,   "duree": 28 },
  { "type": "souffle", "a": -24, "duree": 24 },
  { "type": "impact",  "a": 0 }
]
```
- `a` : départ en images, relatif au début du plan (négatif = avant la coupe).
- **montee** : trois voix qui glissent ensemble sur une octave + quinte, avec un souffle discret (V1 3,3–5,6 s, V3 6,3–6,9 s). À mettre pendant qu'une **courbe se trace** ou qu'un compteur monte.
- **arpege** : une note par double-croche qui monte la gamme pentatonique, du grave vers l'aigu et de gauche à droite. À mettre pendant que des **barres poussent** une par une, avec `duree` = durée de la croissance.
- **souffle** : bruit qui gonfle et se coupe net à la fin. À mettre **juste avant** la coupe vers un plan important (`a: -24, duree: 24` → il se termine pile sur la coupe ; V3 12,3 s).
- **impact** : boum grave. Il est ajouté automatiquement à la révélation ; on peut en mettre un ailleurs, une fois au plus.

Effets ajoutés automatiquement : souffle inversé + arrêt de la musique + impact + traîne à la révélation, et scintillement seulement si `fin.logo` vaut `true`.

## Dosage (ce qui fait « cher »)

- **2 à 3 effets** sur les plans rapprochés (par exemple une `montee`, un `arpege` et un `souffle`), plus la révélation. Ni clic d'interface ni bruit aux coupes : ce sont les couches musicales qui marquent le passage d'un plan à l'autre.
- La tension vient de l'**arrangement qui s'épaissit** et du **filtre qui s'ouvre**, pas de l'empilement d'effets.
- La révélation est le moment le plus fort, puis tout redescend. On garde ~2 s de traîne et un vrai silence à la fin.
- Garde le son **sombre** : le mastering coupe doucement au-dessus de 8,5 kHz. N'ajoute pas de cymbales ni de souffle aigu.

## Le client fournit sa musique

```bash
node scripts/bande-son.mjs --sfx-seuls --sortie public/audio/sfx.wav
```
Ensuite, dans `DashboardFilm.tsx`, mets deux `<Html5Audio>` :
- la musique du client (volume ~0.8), coupée ou filtrée à la révélation comme dans les références ;
- `sfx.wav`.

## TikTok / Reels

Propose systématiquement une version « SFX seuls » en plus de la version complète : le créateur peut alors ajouter un son tendance dans l'application.
