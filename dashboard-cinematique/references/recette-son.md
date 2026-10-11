# Recette son

Le son compte autant que l'image dans ce style. Une des références le dit : « Motion makes it feel alive. Sound makes it feel expensive. » Ce fichier explique comment `scripts/bande-son.mjs` reproduit la grammaire relevée (voir `analyse-references.md` § 3) et comment la régler.

## Principe

- **Une seule source de vérité** : `src/film/montage.json`. Le script lit la durée des plans, leurs effets (`son`), le type de fin et le moment du logo. Il calcule tout en secondes à partir des images. Dès qu'on change le montage, on relance `node scripts/bande-son.mjs`.
- La musique est **originale**, synthétisée par le script. On ne copie pas la musique des références : elle appartient à ses auteurs. On reproduit leur style (tempo, mode, couches, évolution, effets, mixage).
- Le résultat est déterministe : même montage + même `--graine` = même fichier.

## Réglages (`montage.json` → `musique`)

| Clé | Valeurs | Effet |
|---|---|---|
| `bpm` | 82–100 (94 par défaut) | Tempo. Doubles-croches de l'arpège = 60/bpm/4 s |
| `tonique` | `C`…`B`, `F#`, `Bb`… | Tonalité (références : F, C, Ab, E) |
| `mode` | `mineur` (défaut) / `majeur` | Couleur. Mineur = la plupart des références |
| `revelation` | `arret` (défaut) / `filtre` | Comment la musique s'arrête : arrêt de bande (V4) ou filtre qui se ferme (V2) |
| `echo` | `true` (défaut) / `false` | L'arpège continue tout bas après la révélation (fin de V4) |
| `volume` | 0.5–1.2 | Gain final (RMS cible -18 dBFS × volume) |

## Effets par plan (`plans[i].son`)

```json
"son": [
  { "type": "montee",  "a": 8,   "duree": 40 },
  { "type": "souffle", "a": -24, "duree": 24 },
  { "type": "impact",  "a": 0 }
]
```
- `a` : départ en images, relatif au début du plan (négatif = avant la coupe).
- **montee** : glissando qui monte d'une quinte grave à une octave + quinte au-dessus. On le met pendant qu'un graphique **pousse** (barres, courbe, compteur). On le cale sur l'animation : départ à la 1re barre, fin à la dernière.
- **souffle** : bruit qui gonfle et se coupe net à la fin. On le met **juste avant** la coupe vers un plan important (`a: -24, duree: 24` → se termine pile sur la coupe).
- **impact** : boum grave + souffle sourd. Il est ajouté automatiquement à la révélation ; à mettre ailleurs une fois au plus.

Ajoutés automatiquement selon `fin` :
- **révélation** (début du recul, ou début du logo pour la fin `barre`) : la musique s'arrête (`arret`/`filtre`) + impact + réverbération longue.
- **logo** : souffle aérien pendant le tracé + cloche aiguë douce à la fin du tracé.
- **écho** : arpège filtré qui s'éteint en ~3 s.
- Fin `aucune` : pas de révélation, la musique va jusqu'au bout avec un fondu de 0,35 s.

## Dosage (ce qui fait « cher »)

- **2 à 4 effets en tout** sur les plans rapprochés (en général 2 glissandos + 1 souffle), plus la révélation et le logo. Pas d'effet à chaque apparition : les références n'ont **aucun clic d'interface**.
- La musique **s'éclaircit** jusqu'à la révélation (le filtre s'ouvre : coupure du pad de 320 Hz à 2,6 kHz, de l'arpège de 700 Hz à 5,2 kHz). C'est ce qui crée la montée en tension sans rien ajouter.
- La révélation est le **moment le plus fort** (comme V3) ; ensuite tout redescend vers le silence. On garde 1 à 2 s de quasi-silence sous le logo final.
- Mixage : RMS ≈ -18 dBFS sur la partie musicale, crêtes ≤ -3 dBFS (limiteur doux).

## Le client fournit sa musique

```bash
node scripts/bande-son.mjs --sfx-seuls --sortie public/audio/sfx.wav
```
Ensuite, dans `DashboardFilm.tsx`, on met deux `<Html5Audio>` : la musique du client (volume ~0.8, `endAt` à la révélation + fondu) et `sfx.wav`. La musique doit être coupée ou filtrée à la révélation, comme dans les références.

## TikTok / Reels

Une version « SFX seuls » permet au créateur d'ajouter un son tendance dans l'application. On la propose systématiquement en plus de la version complète.
