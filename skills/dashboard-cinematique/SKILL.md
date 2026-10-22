---
name: dashboard-cinematique
description: "Crée des vidéos motion design « dashboard cinématique » (MP4, Remotion) : l'interface du client, reproduite à l'identique d'après sa capture (couleurs, modules, textes, icônes ; thème clair ou sombre), filmée en très gros plan sur un plan 3D incliné, profondeur de champ courte, texte net, plans de 3 s en coupe franche fluide, recul final sur l'UI entière, musique électro originale avec « drop » et effets sonores calés sur chaque animation. Utilise ce skill dès que l'utilisateur veut animer un dashboard, une app web, un back-office, un écran SaaS ou des graphiques/KPI en vidéo, même s'il dit seulement « vidéo de mon dashboard », « animer mon interface », « pub pour mon SaaS », « vidéo produit sombre/cinématique », « UI animation », « dashboard motion », « comme ces vidéos TikTok de dashboard », ou partage des vidéos de référence de ce genre."
compatibility: "Exécution de code avec Node.js 18+ et npm, accès réseau pour installer Remotion et Chrome Headless Shell, ffmpeg pour les contrôles. Conçu et testé avec Claude Code."
metadata:
  version: "1.6.0"
  depot: "https://github.com/lrodrigues-cyber/Skills-motion-design"
---

# Dashboard cinématique

Ce style montre une interface produit **comme un objet filmé** et non comme une capture d'écran. Le tableau de bord du client, reconstruit à l'identique, est posé à plat en 3D et la caméra glisse dessus en macro. La mise au point est très courte. Les éléments s'animent jusqu'à leur état réel. Le son monte en tension jusqu'à la révélation finale (le recul sur l'interface entière).

Il a été construit à partir de l'analyse image et son, plan par plan, de 5 vidéos de référence (`references/analyse-references.md`). Le gabarit `assets/template` le reproduit. Le film d'exemple compte 5 plans, un recul (sans logo) et une bande-son générée.

Parle à l'utilisateur dans sa langue. Le texte de l'interface suit la langue du produit du client.

## Règle n° 1 : l'interface du client, à l'identique

Quand l'utilisateur fournit une capture, **le monde filmé est sa capture** : même thème (clair ou sombre), mêmes couleurs au pixel près, mêmes modules à la même place, mêmes textes, chiffres, icônes, logos et favicons. Rien d'ajouté (fil d'Ariane, ⌘K, cloche, avatar, badge), rien d'enlevé, rien de recoloré, aucun composant remplacé par un autre « plus cinématique ».

- Le style vient **uniquement** de la caméra, de la profondeur de champ, de la lumière d'ensemble (ombre de profondeur, vignettage), du montage et du mouvement des éléments vers leur état réel.
- Halos et néons **seulement si l'original brille** (interface sombre à accents lumineux). Sur une interface claire : aucun halo, les ombres de l'original.
- Les composants du gabarit (marque « Nova », `ui/base.tsx`, `ui/structure.tsx`, `ui/cartes.tsx`) sont un **exemple** d'interface sombre : ne les réutilise jamais pour un client. Écris ses composants à lui.
- **Contrôle obligatoire** avant le premier brouillon : `npm run fidelite -- capture/<ecran>.png` doit répondre ✔ (méthode complète : `references/fidelite.md`).

Sans capture ni code (« invente un dashboard »), la palette sombre du gabarit s'applique.

## La recette (à respecter : c'est ce qui fait le style)

| | Règle | Pourquoi |
|---|---|---|
| **Format** | 16:9, 1920×1080, 30 i/s, **durée au choix du client** (≈ 20 s par défaut, 10 à 60 s) | Durée et cadre des références : 20 s |
| **Structure** | **Le client choisit le nombre de plans de coupe et/ou la durée** (`scripts/decoupage.mjs`). Par défaut : 5 plans de 3 s + fin ≈ 20 s. Plans de **3 à 6 s, multiples de 1,5 s** (une mesure à 160 BPM : chaque coupe tombe sur un temps fort), en coupe franche, puis la fin (~4 s) | Coupes relevées à 2,9 / 5,8 / 8,8 / 11,7 / 14,6 s dans les références ; au-delà de 6 s un plan s'essouffle |
| **Plans de coupe variés** | 7 cadrages (`cinema/cadrages.ts`) : `macro`, `travelling`, `rasant`, `plongee`, `zoom-avant`, `eloigne`, `orbite`. Jamais deux fois le même d'affilée ; un module qui revient change d'angle | Un film long ne tient que si chaque coupe apporte un nouveau point de vue |
| **Un plan = un composant** | Une courbe, *ou* une carte KPI, *ou* une liste, *ou* un bouton. Jamais deux idées | Le spectateur lit une seule chose à la fois |
| **Caméra** | UI posée en 3D : inclinaison 45–56°, rotation -17 à -33°, zoom 3,2–5. **Dérive lente à vitesse constante** (la cible glisse de 70–140 px du monde, zoom +5 %), sans accélérer ni freiner | L'interface devient un objet. Le mouvement ne s'arrête jamais : chaque coupe se fait **en mouvement** |
| **Angle** | Change à chaque plan (inclinaison/rotation différentes) | Évite la monotonie sans transition |
| **Transition** | Coupe franche. Le nouveau plan arrive **déjà visible** (≈ 60 % de luminosité, flou) et devient net en ~12 images. **Jamais de passage par le noir** | Une plongée au noir à chaque coupe = clignotement saccadé toutes les 3 s |
| **Profondeur de champ** | Bande nette horizontale au centre, flou **progressif** (3 niveaux : net → léger → fort, 11 px max en 1080p) et le lointain/premier plan qui **tombent dans l'ombre** | Signature macro. Un flou brutal ou lumineux fait « tache » : le flou ne doit jamais attirer l'œil plus que le sujet |
| **Lumière** | Lumière d'ensemble : ombre de profondeur (le lointain et le premier plan s'assombrissent) et vignettage, adoucis sur une interface claire (`"theme": "clair"`). **Interface sombre à accents lumineux** : halo sobre, liseré sous une carte, texte émissif, comme dans les références. **Interface claire** : aucun halo, les ombres de l'original. **Jamais de faisceaux ni de rayons** | La lumière ne doit pas changer l'interface du client : elle la met en valeur |
| **Matière** | Texte toujours net. Chiffres en relief, bout hachuré : seulement s'ils existent dans l'interface filmée (film d'exemple) | Vu en gros plan dans les références (V3, V4) |
| **Échelle des effets** | Flous d'apparition, halos, ombres et traînées sont réglés en px du **monde** : la caméra les grossit ×3 à ×5. Rester très sobre (flou d'apparition ≤ 1,5 px, halo ≤ 30 px) | Sinon : taches floues et halos géants en gros plan |
| **Couleurs** | **Celles de la capture du client, relevées à la pipette** (`npm run capture`). Seulement sans capture : palette d'exemple sombre (fond `#070708`, cartes `#111114`→`#16161a`, accents néon) | Le client doit reconnaître son produit au premier coup d'œil |
| **UI** | L'interface du client **reconstruite en code à l'identique**, à la taille de sa capture (le monde = la capture, en px). C'est la caméra qui grossit | Les tailles d'app réelle donnent l'authenticité ; le code garde le texte net en gros plan |
| **Animation** | Ease-out marqué ; barres qui poussent en cascade (4–6 images d'écart), courbes tracées point par point, compteurs, lignes en cascade (fondu + flou + glissement) | Arrive vite, se pose longtemps |
| **Rythme interne** | Il se passe quelque chose **dès la coupe** : les animations du plan sont pré-lancées (horloges négatives, ex. `-6`), le sujet est déjà là · croissances 24–40 images · tout est en place vers l'image 60 · 30 dernières images = dérive calme | Un plan qui commence vide (0,3–0,6 s sans rien) casse la dynamique |
| **Fin** | **Pas de logo par défaut** (choix de l'utilisateur). `recul` : l'UI entière à plat, **grande** (≈ 88 % de la largeur, `part`), **fixe** ~2,5 s puis s'éteint ; ou `barre` (gros plan sur la barre du haut ou le bouton, qui s'éteint) ; ou `aucune`. Le logo tracé à la comète bleue (V1–V4) reste disponible avec `"logo": true`, seulement si on le demande | V2, V3 = recul ; V1, V4 = barre ; V5 = aucune |
| **Son** | **Deux profils** (`musique.profil`). **`dynamique` (par défaut, choix de l'utilisateur)** : électro lumineuse et entraînante à 160 BPM, intro filtrée puis **« drop » sur la 1re coupe** (montée, impact, cymbale), accords pincés syncopés, nappe qui respire avec la grosse caisse, et **effets d'interface organiques très denses** (4–5 par seconde) : tics quand un chiffre défile ou un texte arrive, « bloop » de goutte d'eau quand une barre pousse, tintement de verre, whoosh + impact sur chaque coupe. Modèle : vidéo de référence A (promo produit Framer). **`cinema`** : musique de film électronique sombre et effets de cinéma (5 références d'origine). Dans les deux cas, **chaque animation visible a son effet, calé à l'image** : `reperage.mjs` lit le brouillon (bouffées de lumière + activité fine des compteurs et textes) et la bande-son pose les effets dessus, musique creusée dessous | Écouté et mesuré (YAMNet) : voir `references/recette-son.md` |

## Workflow

### 1. Brief : ce qu'il faut obtenir du client

Pose au plus 2–3 questions, et seulement sur ce que tu ne peux pas inventer :
- **Les écrans réels** du produit : une capture nette de la page entière (PNG, sans redimensionnement), ou le code de l'application. C'est cette capture qui sera reproduite à l'identique.
- Le **nombre de plans de coupe** et/ou la **durée** de la vidéo (par défaut 5 plans, ≈ 20 s), et les **moments** à montrer : quel graphique, quel chiffre, quelle alerte, quel bouton. Sans réponse, choisis les modules les plus forts de la capture.
- **Les vraies données** : libellés, montants, noms. On n'invente jamais un chiffre présenté comme réel. Sans données, utilise des données d'exemple crédibles et dis-le clairement à la livraison.
- **Le logo** : seulement si l'utilisateur veut un logo de fin (désactivé par défaut). De préférence un SVG en **trait continu** (tracé à la comète) ; un logo plein ou une image passe par `LogoMasque`.
- Le choix entre **musique générée** (par défaut) et musique du client.

Les choix de réalisation (plans, angles, animations, fin) sont à toi : ne les demande pas. Les couleurs et le contenu de l'interface ne sont pas des choix : ce sont ceux du client.

Si l'utilisateur fournit des **vidéos de référence**, analyse-les d'abord avec la même méthode : planches à 1, 4 et 15 i/s, coupes avec `ffmpeg select=gt(scene,0.04)`, spectrogramme du son. Adapte ensuite la recette.

### 2. Créer le projet

```bash
node <dossier-du-skill>/scripts/nouveau-projet.mjs <dossier-projet>
```
Le script copie le gabarit, installe les dépendances (Remotion 4.0.529, React 19, versions figées) et génère la bande-son d'exemple. Si un Chrome/Chromium est déjà installé, ajoute `REMOTION_BROWSER=<chemin>` devant les commandes Remotion pour éviter le téléchargement.

Le film d'exemple (interface « Nova », sombre) est complet. Il ne sert qu'à découvrir le style ou vérifier l'installation (`npx remotion render DashboardFilm out/exemple.mp4`) : avec la capture d'un client, passe directement à l'étape 3.

### 3. Reconstruire l'interface du client à l'identique (le « monde »)

Le monde est **un seul tableau de bord complet**, dans `src/ui/Dashboard.tsx`. Les plans rapprochés et le recul filment ce même monde, ce qui assure la continuité. Méthode détaillée, pièges et exemple chiffré : `references/fidelite.md`.

1. **Mesurer la capture** (rangée dans `capture/`) avant d'écrire une ligne :
   ```bash
   npm run capture -- infos capture/ecran.png            # taille du monde, thème, palette exacte
   npm run capture -- profil capture/ecran.png y=170     # bords et couleurs de chaque rangée de cartes
   npm run capture -- grille capture/ecran.png 240,690,420,258 --pas 20 --loupe 2   # lire textes, icônes, lignes de base
   npm run capture -- decoupe capture/ecran.png 268,788,22,22 --sortie public/images/favicon-1.png   # logos, favicons, photos
   ```
2. **Écrire le monde** : `MONDE` = taille de la capture (÷ 2 si Retina), coordonnées du monde = pixels de la capture. Chaque module à ses bords mesurés, avec ses couleurs relevées, sa police, ses icônes (Lucide est installé : `lucide-react`), ses images découpées, ses graphiques avec les mêmes données et la même forme. Garde les exports `MONDE`, `Bloc`, `CENTRES`, `Dashboard`.
3. **Contrôler** : `npm run fidelite -- capture/ecran.png` rend le monde à plat (composition `MondeAPlat`) et le compare à la capture : zones en écart numérotées, couleurs attendues, images agrandies dans `out/fidelite/`. Corrige (les couleurs d'abord) et relance **jusqu'au ✔**. Seuls les contours de texte peuvent différer (lissage ClearType des captures Windows).
4. **Animer** : chaque bloc reçoit une horloge `f` (images depuis le début de *son* animation) ; `FINI` = état final = la capture. Toute animation se calcule à partir de `f`, avec `prog()`, `apparition()` et `compter()` (`src/lib/anim.ts`), et **finit exactement sur l'état de la capture** : compteurs, courbes qui se tracent, anneaux, barres, lignes en cascade, bouton enfoncé.
5. **Viser** : mets à jour `CENTRES` (point visé par la caméra pour chaque bloc) et, pour une interface claire, `"theme": "clair"` dans `montage.json` (ombre de profondeur et vignettage adoucis, repérage du son adapté).

Briques du gabarit (film d'exemple « Nova », interface sombre) : **la mécanique se réutilise, pas l'apparence.**

| Fichier | Contenu |
|---|---|
| `ui/base.tsx`, `ui/structure.tsx`, `ui/cartes.tsx` | Composants de l'interface d'exemple (cartes KPI néon, courbes lumineuses, barres hachurées…) : à remplacer par ceux du client |
| `cinema/Lumiere.tsx` | `halo()`, `haloTexte()`, `<Trainee/>`, `<BordureLumineuse/>`, `relief()`, `hachures()` : seulement pour une interface qui brille déjà |
| `cinema/Plateau.tsx` | La caméra : plan incliné, dérive, mise au point d'ouverture, profondeur de champ progressive + ombre de profondeur (`ombre`), **sur-échantillonnage** (le monde est dessiné ×zoom puis réduit : texte net) |
| `cinema/Recul.tsx` | Fin « recul » |
| `cinema/Logo.tsx` | `LogoTrace` (trait + comète), `LogoMasque` (logo plein ou image) — seulement si `fin.logo` |
| `cinema/Etalonnage.tsx` | Vignettage + grain |
| `scripts/capture.mjs`, `scripts/fidelite.mjs` | Mesure de la capture, contrôle de fidélité |

### 4. Écrire le montage : `src/film/montage.json`

**Découpage** (nombre de plans, durée, cadrages) : génère-le, ne l'écris pas à la main.
```bash
node scripts/decoupage.mjs --duree 40 --blocs kpi1,courbe,donut,tableau,kpi3,stats,bouton
node scripts/decoupage.mjs --plans 12 --blocs kpi1,courbe,donut,tableau,bouton        # 12 plans de 3 s
node scripts/decoupage.mjs --duree 30 --plans 6 --blocs … --cadrages macro,travelling,plongee
```
Il calcule la durée de chaque plan (multiple de 1,5 s, entre 3 et 6 s), alterne les cadrages, fait revenir les modules sous un autre angle s'il y a plus de plans que de modules, et dit la durée réelle obtenue. Chaque plan s'écrit alors `{ "cible": "courbe", "cadrage": "travelling", "horloges": { "courbe": -8 } }` ; une `camera` complète (ci-dessous) reste possible pour un réglage fin.

| Cadrage | Mouvement | Idéal pour |
|---|---|---|
| `macro` | Gros plan incliné, dérive lente | Ouverture, chiffre clé |
| `travelling` | Glissement latéral franc | Liste, tableau, graphique large, rangée de cartes (pas un élément collé au bord de l'interface) |
| `rasant` | Angle très rasant, très près | Anneau, gros chiffre, barres (relief) |
| `plongee` | Presque vu du dessus, avance doucement | Tableau, carte entière à lire |
| `zoom-avant` | Part du contexte, finit sur l'élément | Révéler un détail |
| `eloigne` | Part du détail, découvre l'élément entier | Avant la fin |
| `orbite` | L'interface tourne sous la caméra | Carte compacte, anneau, statistiques |

**Vidéo longue (plus de ~25 s)** : rends brouillon et film par morceaux, sinon le navigateur sature la mémoire et le rendu est tué : `node scripts/rendu-long.mjs brouillon` puis, après repérage et son, `node scripts/rendu-long.mjs final` (→ `out/film.mp4`, son compris). Si un passage rend très lentement (plus de 0,5 s par image en brouillon sur carte graphique, 5 s en rendu logiciel), c'est un cadrage trop lourd : constaté avec `rasant` sur un anneau qui s'anime ; donne un autre cadrage à ce plan.

Regarde une image au milieu de chaque plan (`npx remotion still DashboardFilmMuet out/p.png --frame=<début+50> --scale=0.4`) : si un cadrage montre surtout du vide (bord de l'interface) ou une zone sans contenu, change son cadrage ou ajuste `CENTRES`.

**Caméra à la main** (facultatif) :

Un plan :
```json
{
  "id": "courbe-revenus",
  "duree": 90,
  "horloges": { "courbe": -6 },
  "camera": {
    "cible": { "de": { "x": 600, "y": 478 }, "a": { "x": 720, "y": 452 } },
    "zoom": { "de": 4.2, "a": 4.45 },
    "inclinaison": { "de": 48, "a": 48 },
    "rotation": { "de": -19, "a": -21 },
    "nettete": { "demiLargeur": 7, "fondu": 20 }
  },
  "son": []
}
```
- `horloges` : les blocs qui s'animent dans ce plan (valeur = décalage en images). Mets une valeur **négative** (-6 ; -12 pour la barre du haut) pour que l'animation soit déjà lancée à la coupe : jamais de début de plan vide.
- `cible` : coordonnées du **monde** (px). Pars de `CENTRES` et décale vers le début de l'action, pour que la caméra glisse dans le sens de lecture.

Cadrages qui fonctionnent (testés) :

| Type de plan | zoom | inclinaison | rotation | netteté |
|---|---|---|---|---|
| En-tête + KPI (ouverture) | 3,9 → 4,15 | 54 → 52 | -27 → -25 | défaut |
| Courbe | 4,2 → 4,45 | 48 | -19 → -21 | défaut |
| Grand chiffre + barre de progression | 3,2 → 3,4 | 56 → 55 | -33 → -31 | défaut |
| Barres / liste (plusieurs lignes) | 3,7 → 3,9 | 47 → 46 | -17 → -19 | `demiLargeur` 15, `fondu` 24 |
| Barre du haut / bouton | 4,8 → 5,1 | 46 → 45 | -17 → -19 | défaut |

Ordre conseillé, avec les modules du client : une ouverture calme (en-tête, chiffre clé), un graphique qui se trace, un chiffre fort ou une alerte, un deuxième graphique ou un tableau, puis le bouton d'action ; un film plus long intercale les autres modules et fait revenir les plus forts sous un autre cadrage. Varie les couleurs d'un plan à l'autre en choisissant des modules différents, jamais en recolorant.

Fin (`fin`) : `type` vaut `recul`, `barre` (+ `camera` et `horloges`) ou `aucune` ; `logo` vaut `false` par défaut. Valeurs testées sans logo : `part` 0,88, `extinctionDebut` 78, `extinctionDuree` 36, `total` 120. Avec logo (`"logo": true`) : `logoDebut` 48, `logoDuree` 22, `extinctionDebut` 72, `extinctionDuree` 30, `total` 150, `logoTaille` 150, et remplace `MARQUE_TRACE` (`ui/Marque.tsx`) par le tracé du logo client.

### 5. Le son : il se cale sur l'image du brouillon

Les effets sonores ne se placent **pas à la main** : ils se calent sur ce qui s'anime réellement à l'écran. Après chaque brouillon :

```bash
npm run brouillon     # rendu muet en demi-résolution (< 1 min sur carte graphique, ~6 min sans)
npm run reperage      # lit out/brouillon.mp4 : chaque bouffée de lumière = un événement → src/film/reperage.json
npm run son           # musique calée sur les coupes + un effet par événement, qui suit la courbe de l'animation
npm run sonorise      # pose la bande-son sur le brouillon → out/brouillon-son.mp4 (à écouter)
```
`reperage.mjs` liste les événements par plan (ex. « courbe-revenus image 3→8 (grand) »). Vérifie que chaque animation importante y figure. `bande-son.mjs` **refuse un repérage périmé** (interface ou montage changés depuis) et le dit : refais alors brouillon + repérage. Les effets `son` du montage restent possibles, **en plus** (whoosh d'un élément qui traverse, ping…). Lis `references/recette-son.md` (profils `dynamique` / `cinema`, réglages `tonique`, `mode`, dosage `reglages`). Si l'utilisateur fournit des vidéos dont il aime le son, analyse-les d'abord (même méthode : spectrogramme, YAMNet fenêtre par fenêtre, tempo, densité d'effets) et choisis ou ajuste le profil en conséquence. Ne remplace jamais un son par un son pincé, une cloche ou un arpège clair. Musique du client : `--sfx-seuls`.

### 6. Vérifier (ne pas sauter)

```bash
npx tsc --noEmit
npm run fidelite -- capture/ecran.png      # doit dire ✔ (étape 3)
npm run brouillon && npm run reperage && npm run son && npm run sonorise   # voir étape 5
node scripts/planche.mjs out/brouillon.mp4 --pas 0.5
node scripts/planche.mjs out/brouillon.mp4 --ref <reference.mp4> --pas 0.75    # si une référence existe
node scripts/controle.mjs out/brouillon.mp4     # fluidité : images ratées, plongées au noir, arrêts (doit dire « aucun problème »)
python3 scripts/ecoute.py public/audio/bande-son.wav   # si Python + TensorFlow sont là : doit dire « Le son colle au style »
```
Lis la planche et vérifie :
- [ ] **L'interface est celle du client** : `fidelite` dit ✔, et dans chaque plan les couleurs, textes, icônes et images sont ceux de la capture (rien d'ajouté, rien de recoloré)
- [ ] Chaque plan montre **un seul** composant, qui remplit l'image et reste lisible dans la bande nette
- [ ] Transitions fluides : `controle.mjs` ne signale rien ; chaque plan arrive visible et flou puis devient net, sans noir ; la caméra bouge du début à la fin ; il se passe quelque chose dès la coupe
- [ ] Interface sombre : les accents brillent (halo sobre). Interface claire : aucun halo ajouté. Jamais de faisceau ni de rayon
- [ ] Aucun flou qui « fait tache » : le lointain et le premier plan sont sombres et doux, aucun élément flou lumineux (badge, texte, glow) n'attire l'œil hors de la zone nette, aucun flou géant pendant les apparitions
- [ ] Aucune anomalie graphique : rien ne passe par-dessus un texte, rien ne dépasse d'une carte, pas de double contour ni de motif qui transparaît (vérifier aussi le recul à 100 %)
- [ ] Le texte est net en gros plan (zoom sur une image fixe à 100 % : aucun escalier ni pixel visible)
- [ ] Les animations sont finies vers l'image 60 du plan ; rien n'apparaît d'un coup
- [ ] Le recul montre l'UI entière, identique à la capture (mêmes chiffres que dans les gros plans)
- [ ] Fin : le recul respire puis s'éteint proprement (et, seulement si `logo: true`, le logo se trace au centre)
- [ ] Son : `bande-son.mjs` ne signale ni repérage absent ni repérage périmé ; chaque animation visible a son effet pile à l'image (barres = une note chacune, bouton = un coup) ; chaque coupe est marquée (changement d'accord + frappe) ; la musique tape dès le 2e plan ; la révélation est le moment le plus fort (explosion sourde, whoosh), puis silence. Rien de pincé ni de « ding » (`ecoute.py` le vérifie)

Pour une image précise : `npx remotion still DashboardFilm out/img.png --frame=245`. Corrige, puis relance. Deux ou trois passes sont normales.

### 7. Rendu final et livraison

```bash
npm run son                                        # doit tourner SANS avertissement de repérage
npx remotion render DashboardFilm out/film.mp4     # 1920×1080, H.264 CRF 16, BT.709 (remotion.config.ts)
```
**Le rendu passe par la carte graphique** (`remotion.config.ts` : `angle` sous Windows et macOS, 4 rendus en parallèle) : ~1 à 2 min pour 20 s en 1080p (mesuré : 570 images en 78 s contre 646 s en rendu logiciel, images identiques à l'œil), brouillon < 1 min. Sous Linux, ou si le GPU donne une image anormale (tuiles noires, rendu figé), rends en logiciel : `REMOTION_GL=swangle` devant la commande (~25–35 min pour 20 s sur 4 cœurs, l'ancien comportement) ; sur une machine Linux avec carte graphique, `REMOTION_GL=angle-egl`. `npx remotion gpu` montre si l'accélération est active. Pour une qualité maximale (4K), ajoute `--scale=2` (≈ 4× plus long). Livre :
- le fichier ;
- la liste des plans avec leurs temps ;
- ce qui est fictif (marque, données) ;
- comment modifier (`montage.json`, `Dashboard.tsx`, `npx remotion studio`) ;
- en proposition : une version SFX seuls pour TikTok/Reels, et d'autres accents ou une autre fin.

## Règles Remotion (sinon le rendu casse)

1. Tout mouvement dérive de `useCurrentFrame()` (ou de l'horloge `f`). Interdits : transitions/animations CSS, `setTimeout`, Framer Motion.
2. Pas de `Math.random()` : utilise `random("graine")` de `remotion`.
3. `interpolate` toujours borné (`prog`, `kf` le font).
4. Médias via `staticFile()`, `<Img>`, `<Html5Audio>`. La police Inter est servie localement (`public/fonts`).
5. `Plateau` rend le monde **deux fois** (copie floue + copie nette) : garde le son hors du monde.
6. Ne jamais grossir l'UI avec `transform: scale` seul sur un plan 3D : Chrome dessine le plan à sa taille puis l'agrandit (texte pixelisé). `Plateau` sur-échantillonne déjà (CSS `zoom`).
7. Versions `remotion` / `@remotion/*` strictement identiques.
8. Remotion est gratuit pour les particuliers et les entreprises de 3 personnes ou moins. Au-delà, une licence est nécessaire (remotion.pro).

## Fichiers de référence

| Fichier | Quand le lire |
|---|---|
| `references/fidelite.md` | **À chaque vidéo faite d'après une capture** : mesurer, reconstruire à l'identique, contrôler, animer sans trahir |
| `references/analyse-references.md` | Pour comprendre un détail du style : chaque vidéo de référence, plan par plan, image et son |
| `references/recette-son.md` | À chaque vidéo : placer les effets, régler la musique, utiliser la musique du client |
| `assets/template/src/film/montage.json` | Exemple complet de montage |
