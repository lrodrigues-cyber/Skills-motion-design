# Recette son

Le son compte autant que l'image dans ce style. Une des références le dit : « Motion makes it feel alive. Sound makes it feel expensive. » Ce fichier explique ce que les références font, comment `scripts/bande-son.mjs` le reproduit, comment le régler et comment le vérifier.

## Les trois règles

1. **Le son colle au montage.** Chaque plan contient un nombre entier de mesures, et le premier temps tombe exactement sur la coupe. L'accord change sur la coupe, un souffle inversé y mène et un coup grave la marque. Les effets plan par plan démarrent à l'image près avec l'animation qu'ils accompagnent.
2. **Ça sonne comme une musique de film électronique.** Sub profond, basse pulsée filtrée, nappe sombre et large, arpège grave et doux, batterie électronique feutrée. **Jamais de son pincé, de clochette ou d'arpège clair** : ils sont entendus comme une harpe, un clavecin, une musique de jeu vidéo ou une musique pour enfants (c'est ce qui faisait « cheap » dans les premières versions, voir `analyse-references.md` § Écoute automatique).
3. **Les effets sont des effets de cinéma**, concentrés sur la révélation : grondement qui monte, whoosh, explosion sourde, battement. Aucun clic d'interface.

## Ce que le script produit

**Une seule source de vérité : `src/film/montage.json`.** Le script lit les plans, leurs effets (`son`) et la fin. Dès qu'on change le montage, on relance `node scripts/bande-son.mjs` (≈ 5 s). La musique est **originale** et synthétisée par le script (on ne copie pas la musique des références, on reproduit leur grammaire). Le résultat est déterministe : même montage + même `--graine` = même fichier.

### Grille

| Élément | Règle |
|---|---|
| Tempo | Calé sur les coupes : un plan de 3 s = 1 mesure à 80 BPM. `bpm` fixe seulement combien de mesures tiennent dans un plan ; le tempo réel s'ajuste à la durée de chaque plan |
| Harmonie | Pédale de tonique (sub + basse) et un accord par plan. Mineur : i add9 → VI maj7 → iv → VII → v sus (tension) → i à la révélation. Majeur : I → vi → IV → V → V sus → I |
| Niveau | Chaque plan est mesuré et calé sur une pente douce de 3 dB (1er plan → dernier). La tension vient de l'arrangement, pas du volume |

### Arrangement (style `pulse`, par défaut)

| Plan | Ce qui joue |
|---|---|
| 1 | Ping de sonar sur la 1re image, sub, nappe sombre (filtre fermé), arpège en croches très feutré |
| 2 | + grosse caisse sur les temps 1 et 3, basse pulsée en croches (filtre « échelle », elle pompe avec la caisse), arpège en doubles-croches |
| 3 | + grosse caisse sur les 4 temps, filtres qui s'ouvrent |
| 4 | + claquement réverbéré sur les temps 2 et 4, basse en doubles-croches, grondement qui commence à monter |
| 5 | + roulement de claquements qui accélère vers la révélation, le grondement s'amplifie et se coupe net sur la révélation |
| Révélation | Souffle inversé → **la musique s'arrête** → explosion sourde (sub 62 → 26 Hz + souffle grave) → whoosh rapide de gauche à droite → accord de résolution très filtré qui s'éteint → deux battements graves → silence |

À chaque coupe (plans 2 à 5) : souffle inversé sombre (0,6 s) qui se termine sur la coupe + coup grave discret, de plus en plus présents.

Style `nappe` : pas de batterie, la basse pulsée entre au 3e plan. Plus planant, toujours calé sur les coupes.

## Réglages (`montage.json` → `musique`)

| Clé | Valeurs | Effet |
|---|---|---|
| `tonique` | `C`…`B`, `F#`, `Bb`… | Tonalité (références : F, C, D♭/A♭, A, E) |
| `mode` | `mineur` (défaut) / `majeur` | Couleur. Mineur = toutes les références |
| `style` | `pulse` (défaut) / `nappe` | Avec batterie électronique, ou nappe planante sans batterie |
| `revelation` | `arret` (défaut) / `filtre` | La musique s'arrête net, ou son filtre se ferme en 0,35 s |
| `queue` | `true` / `false` | Accord de résolution filtré qui s'éteint après la révélation |
| `bpm` | 80 par défaut | Nombre de mesures par plan (160 → 2 mesures par plan de 3 s, plus dense) |
| `volume` | 0.5–1.2 | Gain final (RMS cible -16 dBFS × volume) |
| `reglages` | ex. `{ "basse": 1.3, "caisse": 1.2 }` | Dosage fin des couches (1 = réglage d'origine) : `sub`, `nappe`, `basse`, `arpege`, `caisse`, `claquement`, `reverb`, `sfx`, `accents`, `grondement`, `explosion`, `whoosh`, `ping`, `montee` (dB du 1er au dernier plan). Relancer `ecoute.py` après tout changement |

## Effets par plan (`plans[i].son`)

```json
"son": [
  { "type": "montee",     "a": 2,  "duree": 30 },
  { "type": "impulsions", "a": 2,  "ecart": 5, "nombre": 4 },
  { "type": "whoosh",     "a": 40, "duree": 18 },
  { "type": "souffle",    "a": -24, "duree": 24 },
  { "type": "impact",     "a": 0 },
  { "type": "ping",       "a": 10 }
]
```
`a` : départ en images, relatif au début du plan (négatif = avant la coupe). **Cale-le sur l'horloge de l'animation** : avec une horloge `-6` et une animation qui démarre à `f = 8`, l'animation démarre à l'image 2 du plan → `"a": 2`.

| Type | Son | Quand |
|---|---|---|
| `montee` | Accord de scies qui glisse d'une quinte vers le haut dans un filtre qui s'ouvre | Une **courbe se trace**, un compteur monte. `duree` = durée du tracé |
| `impulsions` | Une note de synthé grave par barre, en montant | Des **barres poussent** en cascade : `ecart` = images entre deux barres, `nombre` = nombre de barres (ancien nom accepté : `arpege`) |
| `whoosh` | Passage d'air de gauche à droite | Un élément **traverse** l'image ou la caméra bascule |
| `souffle` | Souffle inversé qui se termine à `a + duree` | Rarement utile : chaque coupe en a déjà un |
| `impact` | Coup grave | Un chiffre clé qui tombe. Une fois au plus |
| `ping` | Ping de sonar | Une alerte qui s'allume |

**Dosage** : 1 à 2 effets plan par plan sur tout le film, en plus de ce que le script place tout seul (ping d'ouverture, accents de coupe, révélation). Le film d'exemple n'en a que deux (`montee` sur la courbe, `impulsions` sur les barres).

## Vérifier le son

1. **À l'écoute** dans le brouillon : chaque coupe est marquée, la courbe « monte », les barres ont chacune leur note, la révélation est le moment le plus fort, puis silence.
2. **Avec l'oreille automatique** (facultatif, Python) :
   ```bash
   pip install tensorflow-cpu tf_keras soundfile scipy   # une fois (~600 Mo)
   python3 scripts/ecoute.py public/audio/bande-son.wav
   ```
   Le script compare l'empreinte de la piste à celle des 5 références et cherche les sons lus de travers. Il doit afficher **« Le son colle au style »** (similarité ≥ 0,80, aucune harpe, aucun « ding »). Repères : références entre elles 0,65–0,85, bande-son d'exemple 0,875, ancienne bande-son rejetée 0,69.

Après toute modification du script ou ajout d'un son, relance `ecoute.py` : c'est le garde-fou contre les sons « cheap ».

## Le client fournit sa musique

```bash
node scripts/bande-son.mjs --sfx-seuls --sortie public/audio/sfx.wav
```
On obtient le design sonore seul (ping, accents de coupe, effets des plans, grondement, explosion, whoosh, battements). Dans `DashboardFilm.tsx`, mets deux `<Html5Audio>` :
- la musique du client (volume ~0.8), coupée ou filtrée à la révélation comme dans les références ;
- `sfx.wav`.

## TikTok / Reels

Propose systématiquement une version « SFX seuls » en plus de la version complète : le créateur peut alors ajouter un son tendance dans l'application.
