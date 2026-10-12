# Recette son

Le son compte autant que l'image dans ce style. Une des références le dit : « Motion makes it feel alive. Sound makes it feel expensive. » Ce fichier explique ce que les références font, comment `scripts/bande-son.mjs` le reproduit, comment le régler et comment le vérifier.

## Les trois règles

1. **Le son colle à l'image.** Chaque plan contient un nombre entier de mesures, et le premier temps tombe exactement sur la coupe : l'accord change, un souffle inversé y mène, une frappe la marque. **Chaque animation visible a son effet**, posé automatiquement à l'image près sur ce qui s'allume réellement à l'écran (`reperage.mjs`), avec une enveloppe qui suit la courbe de l'animation.
2. **Ça sonne comme une musique de film électronique.** Sub profond, basse pulsée filtrée, nappe sombre et large, arpège grave et doux, batterie électronique feutrée. **Jamais de son pincé, de clochette ou d'arpège clair** : ils sont entendus comme une harpe, un clavecin, une musique de jeu vidéo ou une musique pour enfants (c'est ce qui faisait « cheap » dans les premières versions, voir `analyse-references.md` § Écoute automatique).
3. **Les effets sont des effets de cinéma**, concentrés sur la révélation : grondement qui monte, whoosh, explosion sourde, battement. Aucun clic d'interface.

## Ce que le script produit

**Une seule source de vérité : `src/film/montage.json`.** Le script lit les plans, leurs effets (`son`) et la fin. Dès qu'on change le montage, on relance `node scripts/bande-son.mjs` (≈ 5 s). La musique est **originale** et synthétisée par le script (on ne copie pas la musique des références, on reproduit leur grammaire). Le résultat est déterministe : même montage + même `--graine` = même fichier.

### Grille

| Élément | Règle |
|---|---|
| Tempo | Calé sur les coupes : un plan de 3 s = 1 mesure à 80 BPM. `bpm` fixe seulement combien de mesures tiennent dans un plan ; le tempo réel s'ajuste à la durée de chaque plan |
| Harmonie | Pédale de tonique (sub + basse) et un accord par plan. Mineur : i add9 → VI maj7 → iv → VII → v sus (tension) → i à la révélation. Majeur : I → vi → IV → V → V sus → I |
| Niveau | Chaque plan est mesuré et calé sur une pente douce de 3 dB (1er plan → dernier). La tension vient de l'arrangement, pas du volume. Mastering à -14,5 dBFS RMS (ça doit « taper » sur téléphone), crêtes ≤ -1 dBFS |

### Arrangement (style `pulse`, par défaut)

| Plan | Ce qui joue |
|---|---|
| 1 | Ping de sonar sur la 1re image, sub, nappe sombre (filtre fermé), arpège en croches très feutré |
| 2 | La musique « tombe » sur la coupe : grosse caisse percutante sur les 4 temps, basse pulsée saturée en croches (filtre « échelle », elle pompe avec la caisse), arpège en doubles-croches |
| 3 | + frappe (claquement + caisse claire) sur les temps 2 et 4, charleston sombre sur les contretemps, basse en doubles-croches |
| 4 | + grondement qui commence à monter |
| 5 | + roulement qui accélère vers la révélation, le grondement s'amplifie et se coupe net sur la révélation |
| Révélation | Souffle inversé → **la musique s'arrête** → explosion sourde (sub 62 → 26 Hz + souffle grave) → whoosh rapide de gauche à droite → accord de résolution très filtré qui s'éteint → deux battements graves → silence |

À chaque coupe (plans 2 à 5) : souffle inversé sombre (0,6 s) qui se termine sur la coupe, coup grave et **frappe « braam »** (accord grave de scies saturées dont le filtre s'ouvre puis se referme), de plus en plus présents.

Style `nappe` : pas de batterie, la basse pulsée entre au 3e plan. Plus planant, toujours calé sur les coupes.

### Effets calés sur les animations (automatique)

```bash
npm run brouillon   # rendu muet en demi-résolution
npm run reperage    # → src/film/reperage.json
npm run son
npm run sonorise    # → out/brouillon-son.mp4
```

`reperage.mjs` mesure, image par image, la lumière qui **apparaît** (accents néon qui s'allument, barres qui poussent, courbe qui se trace, texte qui arrive). Chaque bouffée nette et durable devient un événement : image de départ, pic, fin, force et courbe. Les fluctuations (dérive de la caméra, bouton dont la teinte tourne) sont écartées ; au plus 4 événements par plan, au moins 8 % du plus fort du film. Les 3 premières images d'un plan (la coupe et la mise au point) ne comptent pas : la coupe a déjà son accent.

`bande-son.mjs` pose un effet par événement, **attaque sur l'image de départ**, enveloppe qui suit la courbe mesurée (très vite au début, puis ralentit comme l'ease-out) :

| Taille | Son | Exemples du film d'exemple |
|---|---|---|
| grand (≥ 50 % du plus fort) | Coup sourd + accord de scies dont le filtre s'ouvre avec la lumière + souffle qui monte | Courbe tracée, barre rouge qui se remplit, dernière barre, bouton |
| moyen (≥ 25 %) | Note de synthé (plus haute à chaque événement du plan) + petit coup + souffle | Les barres en cascade |
| petit | Tic filtré + note brève | Liseré lumineux, avatar |

Sous chaque effet, la musique se creuse brièvement (-4,5 / -3 / -1,5 dB) : on entend l'effet tomber pile sur l'image. Mesuré sur le film d'exemple : chaque attaque tombe entre 12 et 32 ms après le début de l'animation (moins d'une image), les grands effets ressortent de 4 à 8 dB au-dessus de la musique.

Le repérage porte une **empreinte de l'interface et du montage** (hors son). Si l'un des deux change, `bande-son.mjs` ignore le repérage et le signale : refais brouillon + repérage.

## Réglages (`montage.json` → `musique`)

| Clé | Valeurs | Effet |
|---|---|---|
| `tonique` | `C`…`B`, `F#`, `Bb`… | Tonalité (références : F, C, D♭/A♭, A, E) |
| `mode` | `mineur` (défaut) / `majeur` | Couleur. Mineur = toutes les références |
| `style` | `pulse` (défaut) / `nappe` | Avec batterie électronique, ou nappe planante sans batterie |
| `revelation` | `arret` (défaut) / `filtre` | La musique s'arrête net, ou son filtre se ferme en 0,35 s |
| `queue` | `true` / `false` | Accord de résolution filtré qui s'éteint après la révélation |
| `bpm` | 80 par défaut | Nombre de mesures par plan (160 → 2 mesures par plan de 3 s, plus dense) |
| `volume` | 0.5–1.2 | Gain final (RMS cible -14,5 dBFS × volume) |
| `reglages` | ex. `{ "animations": 0.7, "caisse": 1.4 }` | Dosage fin des couches (valeurs par défaut réglées à l'oreille) : `sub`, `nappe`, `basse`, `arpege`, `caisse`, `claquement`, `charleston`, `frappe` (coupes), `animations` (effets repérés), `reverb`, `sfx`, `accents`, `grondement`, `explosion`, `whoosh`, `ping`, `montee` (dB du 1er au dernier plan). Relancer `ecoute.py` après tout changement |

## Effets ajoutés à la main (`plans[i].son`, facultatif)

Le repérage couvre les animations. N'ajoute un effet à la main que pour ce qu'il ne voit pas : un élément qui **traverse** l'image, une alerte qu'on veut souligner, une **musique du client** sans repérage.

```json
"son": [
  { "type": "whoosh",     "a": 40, "duree": 18 },
  { "type": "montee",     "a": 2,  "duree": 30 },
  { "type": "impulsions", "a": 2,  "ecart": 5, "nombre": 4 },
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

**Dosage** : 0 à 2 effets à la main sur tout le film. Le film d'exemple n'en a aucun : tout vient du repérage et des coupes.

## Vérifier le son

1. **À l'écoute** dans `out/brouillon-son.mp4` : chaque coupe est marquée, chaque animation a son effet pile à l'image (les barres ont chacune leur note, le bouton son coup), la musique tape dès le 2e plan, la révélation est le moment le plus fort, puis silence. `bande-son.mjs` ne doit afficher aucun avertissement de repérage.
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
