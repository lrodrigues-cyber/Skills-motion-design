---
name: dashboard-cinematique
description: Crée des vidéos de motion design « dashboard cinématique » (MP4, Remotion). Une interface SaaS sombre est filmée en très gros plan sur un plan 3D incliné, avec une profondeur de champ très courte, des accents néon qui brillent (halos, rayons de lumière, traînées), des plans de 3 s en coupe franche, un recul final sur l'UI entière et un logo tracé avec une comète bleue. La musique électronique sombre est originale et le design sonore est calé à l'image (glissandos, souffle, arrêt de bande, impact, scintillement du logo). Utilise ce skill dès que l'utilisateur veut animer un dashboard, une app web, un back-office, un écran SaaS ou des graphiques/KPI en vidéo, même s'il dit seulement « vidéo de mon dashboard », « animer mon interface », « pub pour mon SaaS », « vidéo produit sombre/cinématique », « UI animation », « dashboard motion », « comme ces vidéos TikTok de dashboard », ou partage des vidéos de référence de ce genre.
---

# Dashboard cinématique

Ce style montre une interface produit **comme un objet filmé** et non comme une capture d'écran. Le tableau de bord sombre est posé à plat en 3D et la caméra glisse dessus en macro. La mise au point est très courte. Seuls les accents de couleur s'allument, comme des néons. Le son monte en tension jusqu'à la révélation du logo.

Il a été construit à partir de l'analyse image et son, plan par plan, de 5 vidéos de référence (`references/analyse-references.md`). Le gabarit `assets/template` le reproduit. Le film d'exemple compte 5 plans, un recul, le logo et une bande-son générée.

Parle à l'utilisateur dans sa langue. Le texte de l'interface suit la langue du produit du client.

## La recette (à respecter : c'est ce qui fait le style)

| | Règle | Pourquoi |
|---|---|---|
| **Format** | 16:9, 1920×1080, 30 i/s, **~20 s** (19,5–21,5 s) | Durée et cadre de toutes les références |
| **Structure** | **5 plans rapprochés de 90 images** (≈ 3 s) en coupe franche, puis la fin (~5 s) | Coupes relevées à 2,9 / 5,8 / 8,8 / 11,7 / 14,6 s, etc. |
| **Un plan = un composant** | Une courbe, *ou* une carte KPI, *ou* une liste, *ou* un bouton. Jamais deux idées | Le spectateur lit une seule chose à la fois |
| **Caméra** | UI posée en 3D : inclinaison 45–56°, rotation -17 à -33°, zoom 3,2–5. **Dérive lente continue** (la cible glisse de 70–140 px du monde, zoom +5 %) | L'interface devient un objet. Le mouvement ne s'arrête jamais |
| **Angle** | Change à chaque plan (inclinaison/rotation différentes) | Évite la monotonie sans transition |
| **Mise au point** | Chaque plan s'ouvre **flou et sombre** et devient net en ~15 images | C'est la seule « transition » du style |
| **Profondeur de champ** | Bande nette horizontale au centre ; haut et bas très flous (12 px en 1080p) | Signature macro / objectif ouvert |
| **Lumière** | Accents néon avec halo ; **rayons** qui montent du plan sur l'élément clé ; **traînée** lumineuse ; texte émissif ; bordure lumineuse ; bouton à teinte tournante | C'est la seule source de couleur |
| **Couleurs** | Fond `#070708`, cartes `#111114`→`#16161a`, bords blanc 7 %, texte blanc 92 / 55 / 32 %. Accents : cyan, bleu électrique, menthe, vert, rouge-rose, magenta, ambre, violet | Tout est désaturé sauf ce qui brille |
| **UI** | Vraie interface à **taille réelle** (texte 11–15 px, chiffres 28–46 px), contenu réaliste. C'est la caméra qui grossit | Les tailles d'app réelle donnent l'authenticité |
| **Animation** | Ease-out marqué ; barres qui poussent en cascade (4–6 images d'écart), courbes tracées point par point, compteurs, lignes en cascade (fondu + flou + glissement) | Arrive vite, se pose longtemps |
| **Rythme interne** | 0–15 mise au point · 8–12 1er élément · croissances 24–40 images · tout est en place vers l'image 60 · 30 dernières images = dérive calme | Relevé sur les 5 vidéos |
| **Fin** | `recul` (UI entière à plat, 50–64 % de la largeur) **ou** `barre` (gros plan ⌘K/cloche/bouton) ; puis le **logo se trace** en blanc avec une comète bleue (22 images) ; l'UI s'éteint ; logo seul ~2 s sur noir | V2, V3 = recul ; V1, V4 = barre |
| **Son** | Nappe électronique sombre originale (mineur, ~94 BPM, sub + pad + arpège en doubles-croches qui pompe), **filtre qui s'ouvre** jusqu'à la révélation, 2–4 effets calés à l'image, la musique **s'arrête** à la révélation, impact, scintillement du logo, écho, silence final | Voir `references/recette-son.md` |

## Workflow

### 1. Brief : ce qu'il faut obtenir du client

Pose au plus 2–3 questions, et seulement sur ce que tu ne peux pas inventer :
- **Les écrans réels** du produit (captures, lien, repo) et les **5 moments** à montrer : quel graphique, quel chiffre, quelle alerte, quel bouton.
- **Les vraies données** : libellés, montants, noms. On n'invente jamais un chiffre présenté comme réel. Sans données, utilise des données d'exemple crédibles et dis-le clairement à la livraison.
- **Le logo** : de préférence un SVG en **trait continu** (pour le tracé à la comète). Un logo plein ou une image passe par `LogoMasque`.
- Le choix entre **musique générée** (par défaut) et musique du client.

Les choix créatifs (angles, couleurs d'accent, effets, fin) sont à toi : ne les demande pas.

Si l'utilisateur fournit des **vidéos de référence**, analyse-les d'abord avec la même méthode : planches à 1, 4 et 15 i/s, coupes avec `ffmpeg select=gt(scene,0.04)`, spectrogramme du son. Adapte ensuite la recette.

### 2. Créer le projet

```bash
node <dossier-du-skill>/scripts/nouveau-projet.mjs <dossier-projet>
```
Le script copie le gabarit, installe les dépendances (Remotion 4.0.529, React 19, versions figées) et génère la bande-son d'exemple. Si un Chrome/Chromium est déjà installé, ajoute `REMOTION_BROWSER=<chemin>` devant les commandes Remotion pour éviter le téléchargement.

Le film d'exemple est complet : rends-le une première fois pour voir le style (`npx remotion render DashboardFilm out/exemple.mp4`).

### 3. Reconstruire l'interface du client (le « monde »)

`src/ui/Dashboard.tsx` est **un seul tableau de bord complet de 1600×1000 px**. Les plans rapprochés et le recul filment ce même monde, ce qui assure la continuité.

- Remplace le contenu par l'interface du client : mise en page, libellés, chiffres, couleurs d'accent de sa marque (dans `style/tokens.ts` → `neon`).
- Garde la grammaire visuelle : cartes très sombres, bord 1 px, texte blanc ou gris, **une seule couleur par élément d'accent, toujours avec son halo**.
- Chaque bloc reçoit une horloge `f` (images depuis le début de *son* animation). `FINI` correspond à l'état final. Toute animation se calcule à partir de `f`, avec `prog()`, `apparition()` et `compter()` (`src/lib/anim.ts`).
- Mets à jour `CENTRES` : c'est le point visé par la caméra pour chaque bloc.
- Marque fictive « Nova » et données d'exemple : **à remplacer**.

Briques disponibles :

| Fichier | Contenu |
|---|---|
| `ui/base.tsx` | `Carte` (`relief` obligatoire si elle contient des rayons), `Texte`, `Pastille` (badge néon), `Avatar`, `Icone` (21 icônes au trait) |
| `ui/structure.tsx` | `BarreLaterale`, `BarreHaute` (fil d'Ariane, ⌘K, cloche, avatar, `BoutonDegrade` à teinte tournante), `EnTete` (titre + badge ambre + phrase avec % vert) |
| `ui/cartes.tsx` | `CarteKpi` (+ `trainee`), `CarteCourbe` (courbe lumineuse tracée + comparaison en pointillés + nœuds), `CarteUsage` (alerte rouge, compteur, barre + **rayons**), `CarteHistogramme` (barres cyan + courbe rouge), `CarteDivergente` (barres menthe/rouge depuis l'axe + rayons), `CarteAlertes` (liste à points lumineux) |
| `cinema/Lumiere.tsx` | `halo()`, `haloTexte()`, `<Rayons/>` (debout sur le plan, en vraie 3D), `<Trainee/>`, `<BordureLumineuse/>` |
| `cinema/Plateau.tsx` | La caméra : plan incliné, dérive, mise au point d'ouverture, profondeur de champ |
| `cinema/Recul.tsx` | Fin « recul » |
| `cinema/Logo.tsx` | `LogoTrace` (trait + comète), `LogoMasque` (logo plein ou image) |
| `cinema/Etalonnage.tsx` | Vignettage + grain |

Pour un composant qui n'existe pas encore (kanban, classement, interrupteur « Done », champ de recherche…), construis-le sur le même modèle : position absolue dans le monde, horloge `f`, accents néon + halo. Les références en montrent plusieurs (`analyse-references.md` § 2).

### 4. Écrire le montage : `src/film/montage.json`

Un plan :
```json
{
  "id": "courbe-revenus",
  "duree": 90,
  "horloges": { "courbe": 0 },
  "camera": {
    "cible": { "de": { "x": 600, "y": 478 }, "a": { "x": 720, "y": 452 } },
    "zoom": { "de": 4.2, "a": 4.45 },
    "inclinaison": { "de": 48, "a": 48 },
    "rotation": { "de": -19, "a": -21 },
    "nettete": { "demiLargeur": 7, "fondu": 20 }
  },
  "son": [{ "type": "montee", "a": 8, "duree": 40 }]
}
```
- `horloges` : les blocs qui s'animent dans ce plan (valeur = décalage en images).
- `cible` : coordonnées du **monde** (px). Pars de `CENTRES` et décale vers le début de l'action, pour que la caméra glisse dans le sens de lecture.

Cadrages qui fonctionnent (testés) :

| Type de plan | zoom | inclinaison | rotation | netteté |
|---|---|---|---|---|
| En-tête + KPI (ouverture) | 3,9 → 4,15 | 54 → 52 | -27 → -25 | défaut |
| Courbe | 4,2 → 4,45 | 48 | -19 → -21 | défaut |
| Grand chiffre + barre de progression | 3,2 → 3,4 | 56 → 55 | -33 → -31 | défaut |
| Barres / liste (plusieurs lignes) | 3,7 → 3,9 | 47 → 46 | -17 → -19 | `demiLargeur` 15, `fondu` 24 |
| Barre du haut / bouton | 4,8 → 5,1 | 46 → 45 | -17 → -19 | défaut |

Ordre conseillé des 5 plans : une ouverture calme (en-tête, KPI, traînée lumineuse), un graphique qui pousse, un chiffre d'alerte rouge avec ses rayons, un deuxième graphique (couleurs opposées), puis la barre du haut avec le bouton. Alterne les couleurs d'accent d'un plan à l'autre (cyan → bleu → rouge → menthe/rouge → magenta).

Fin (`fin`) : `type` vaut `recul`, `barre` (+ `camera`) ou `aucune`. Valeurs par défaut testées : `part` 0,56 (recul), `logoDebut` 48, `logoDuree` 22, `extinctionDebut` 72, `extinctionDuree` 30, `total` 150, `logoTaille` 150. Remplace `MARQUE_TRACE` (`ui/Marque.tsx`) par le tracé du logo client.

### 5. Le son

```bash
node scripts/bande-son.mjs            # après CHAQUE modification de montage.json
```
Lis `references/recette-son.md` pour placer les effets (`montee` pendant les graphiques qui poussent, `souffle` avant une coupe forte) et régler la musique (`bpm`, `tonique`, `mode`, `revelation`). Garde peu d'effets : les références n'ont aucun clic d'interface. Musique du client : `--sfx-seuls`.

### 6. Vérifier (ne pas sauter)

```bash
npx tsc --noEmit
REMOTION_CONCURRENCY=4 npx remotion render DashboardFilm out/brouillon.mp4 --scale=0.5 --crf=20 --x264-preset=veryfast
node scripts/planche.mjs out/brouillon.mp4 --pas 0.5
node scripts/planche.mjs out/brouillon.mp4 --ref <reference.mp4> --pas 0.75    # si une référence existe
```
Lis la planche et vérifie :
- [ ] Chaque plan montre **un seul** composant, qui remplit l'image et reste lisible dans la bande nette
- [ ] Chaque plan s'ouvre flou et sombre, puis devient net ; la caméra bouge du début à la fin
- [ ] Les accents brillent (halo visible), les rayons montent du plan sur l'élément clé, rien d'autre n'est coloré
- [ ] Les animations sont finies vers l'image 60 du plan ; rien n'apparaît d'un coup
- [ ] Le recul montre l'UI entière, propre et cohérente (mêmes chiffres que dans les gros plans)
- [ ] Le logo se trace au centre avec la comète bleue, puis reste seul et net ~2 s
- [ ] Son : les effets tombent sur l'image (glissando = croissance, souffle → coupe), la musique s'arrête à la révélation, silence à la fin

Pour une image précise : `npx remotion still DashboardFilm out/img.png --frame=245`. Corrige, puis relance. Deux ou trois passes sont normales.

### 7. Rendu final et livraison

```bash
npx remotion render DashboardFilm out/film.mp4     # 1920×1080, H.264 CRF 16, BT.709 (remotion.config.ts)
```
Compte ~20–25 min sur 4 cœurs pour 20 s (les flous coûtent cher ; le brouillon à `--scale=0.5` prend ~4 min). Livre :
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
6. Les rayons ont besoin de la 3D jusqu'au plan : pas d'`overflow: hidden`, d'`opacity < 1` ni de `filter` sur leurs parents (`Carte relief`, `transformStyle: "preserve-3d"`).
7. Versions `remotion` / `@remotion/*` strictement identiques.
8. Remotion est gratuit pour les particuliers et les entreprises de 3 personnes ou moins. Au-delà, une licence est nécessaire (remotion.pro).

## Fichiers de référence

| Fichier | Quand le lire |
|---|---|
| `references/analyse-references.md` | Pour comprendre un détail du style : chaque vidéo de référence, plan par plan, image et son |
| `references/recette-son.md` | À chaque vidéo : placer les effets, régler la musique, utiliser la musique du client |
| `assets/template/src/film/montage.json` | Exemple complet de montage |
