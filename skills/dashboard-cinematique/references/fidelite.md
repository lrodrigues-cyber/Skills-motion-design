# Reproduire l'interface du client à l'identique

La vidéo doit montrer **l'interface du client telle qu'elle est** : un client qui reconnaît mal son propre tableau de bord rejette le film, quelle que soit la qualité de l'image. Le style cinématique vient de la caméra, de la mise au point, de la lumière d'ensemble et du mouvement, jamais d'une interface redessinée.

Cette fiche détaille la méthode de l'étape 3 de `SKILL.md`. Elle a été mise au point sur une interface claire (Audivo, 1920 × 948, Tailwind) reconstruite à 99,5 % de ressemblance.

## Ce qui est interdit

Chacun de ces écarts a été relevé sur un vrai test et a fait rejeter la vidéo :

| Écart | Exemple |
|---|---|
| Changer de thème | Interface claire passée en sombre « pour le style » |
| Recolorer | Cartes KPI bleu marine, bleu, bleu roi et cyan devenues gris anthracite à liseré néon |
| Remplacer un composant | Pastilles de score « 68/100 » remplacées par des barres de progression |
| Inventer des éléments | Fil d'Ariane, raccourci ⌘K, cloche, avatar ou badge « Pro » absents de la capture |
| Changer un bouton | Bouton bleu plein « Nouvel audit » devenu dégradé magenta à teinte tournante |
| Retirer des détails | Favicons des boutiques, icônes de menu, légende du graphique supprimés |
| Ajouter des halos | Lueurs néon sur une interface claire qui n'en a pas |

Les composants du gabarit (`ui/base.tsx`, `ui/structure.tsx`, `ui/cartes.tsx`, marque « Nova ») sont **un exemple** d'interface sombre. Pour un client, on écrit ses composants à lui. On ne garde du gabarit que la mécanique : horloges `f`, `prog()`, `apparition()`, `compter()`, `Plateau`, `Recul`.

## 1. Lire la capture

Range les captures dans `capture/` à la racine du projet. Elles ne partent pas dans la vidéo.

```bash
npm run capture -- infos capture/ecran.png
```

La commande donne :
- **la taille** de la capture et la taille du monde. Une capture Retina (≥ 2400 px de large) se reconstruit à la moitié : diviser toutes les mesures par 2 ;
- **le thème** (clair ou sombre) : le film le garde. Mets `"theme": "clair"` dans `montage.json` pour une interface claire ;
- **la palette exacte** : surfaces (fond, cartes, barres), couleurs vives (marque, blocs, badges, graphiques), textes.

Ensuite, pour chaque rangée de modules :

```bash
npm run capture -- profil capture/ecran.png y=170          # bords et couleurs le long d'une ligne
npm run capture -- profil capture/ecran.png x=450          # idem en colonne
npm run capture -- pipette capture/ecran.png 300,170 1000,170
npm run capture -- grille capture/ecran.png 240,690,420,258 --pas 20 --loupe 2
```

- `profil` donne les bords exacts des cartes (début et fin de chaque aplat) et leur couleur : c'est la mesure la plus fiable. Les segments « détails » sont du texte ou une icône.
- `pipette` lit une couleur ; elle signale la couleur à plat autour quand le point tombe sur un bord anticrénelé.
- `grille` produit une image quadrillée et agrandie, avec les coordonnées : on y lit les petits textes, la position des icônes et les lignes de base. Regarde-la avec l'outil de lecture d'image.

Relève aussi les **couleurs d'encre** du texte sur les traits épais (titres, chiffres), pas sur les textes fins : l'anticrénelage les éclaircit.

### Deviner l'échelle de l'application

Une capture prise avec un zoom navigateur ou un affichage Windows à 125 % n'a pas les tailles CSS habituelles. Compare une largeur connue : une barre latérale `w-64` (256 px) mesurée à 214 px indique un zoom de 5/6 (83,3 %). Dans ce cas, reconstruis l'interface dans ses unités CSS d'origine (tailles Tailwind) sous un conteneur `zoom: 5/6`, et convertis les positions mesurées avec `c(v) = v / zoom`. Les bordures d'1 px tombent alors exactement comme sur la capture.

## 2. Reconstruire

`src/ui/Dashboard.tsx` exporte toujours `MONDE`, `Bloc`, `CENTRES` et `Dashboard` : le reste du gabarit en dépend.

- **`MONDE` = la taille de la capture** (en px de capture). Les coordonnées du monde sont celles de la capture : une mesure se recopie telle quelle.
- **Une boîte par module**, en position absolue, aux bords relevés par `profil`. Coins, bordures et ombres comme l'original (une ombre se règle en comparant les `profil` sous et à côté d'une carte).
- **Le texte se pose sur sa ligne de base**, mesurée sur la capture. Avec Inter : `top = ligneDeBase − 0,9633 × taille` pour `line-height: 1.2`. Compare ensuite la largeur des textes à la capture (voir plus bas) et ajuste la taille par pas de 0,5 px.
- **Police** : Inter est fournie. Si l'application utilise une autre police (Geist, Roboto, Poppins, DM Sans…), charge-la localement avec `@remotion/fonts` (fichier `.woff2` dans `public/fonts`).
- **Chiffres** : pas de `tabular-nums` si l'application ne l'utilise pas (le « 1 » d'Inter change de forme).
- **Icônes** : la plupart des tableaux de bord Tailwind/shadcn utilisent Lucide, disponible dans le gabarit (`import { House } from "lucide-react"`). Mesure la taille de l'icône sur la capture et choisis la taille et l'épaisseur de trait qui donnent la même boîte. Une icône introuvable se dessine en SVG.
- **Images** (favicons, logos, avatars, photos) : découpe-les dans la capture et pose-les à la même place.

  ```bash
  npm run capture -- decoupe capture/ecran.png 268,788,22,22 --sortie public/images/favicon-1.png
  ```
  Ajoute `--transparent #ffffff` pour retirer un fond uni. Un logo vectoriel fourni par le client remplace la découpe.
- **Graphiques** : même type, mêmes données (lues sur les axes), mêmes couleurs, même opacité des aires (dégradés : relève l'opacité en haut et en bas avec `pipette`), même forme de courbe (Recharts trace en `monotoneX` : reprends l'algorithme de d3). Les séries se dessinent dans l'ordre de la légende : la dernière passe au-dessus.
- **Anneaux** : arcs SVG à bouts ronds, dessinés dans l'ordre (chaque bout rond recouvre le début du suivant, comme l'original).

## 3. Comparer, corriger, recommencer

```bash
npm run fidelite -- capture/ecran.png
```

Le script rend le monde à plat dans son état final (composition `MondeAPlat`), le compare à la capture et écrit dans `out/fidelite/` :
- `comparaison.png` : capture en haut, reconstruction en bas ;
- `ecarts.png` : la reconstruction grisée, les écarts en rouge, les zones à corriger numérotées ;
- `zones/zone-N.png` : chaque zone agrandie, capture puis reconstruction.

Il liste les zones, **les écarts de couleur d'abord** (avec la couleur attendue), puis les écarts de contenu (texte, forme, position, taille). Pour regarder une région précise :

```bash
npm run fidelite -- capture/ecran.png --rendu out/fidelite/rendu.png --zone 240,100,420,140
```

Le contrôle passe (✔) quand moins de 2,5 % de la surface diffère, que la similarité de structure (SSIM) atteint 0,90 et qu'aucun aplat n'a la mauvaise couleur. Vise mieux : la reconstruction d'Audivo atteint 99,5 % de ressemblance, SSIM 0,95.

### Mesurer la largeur des textes

Quand une zone de texte reste en écart, compare la boîte englobante du texte sur les deux images (`grille` sur la même région de `capture/…` et de `out/fidelite/rendu.png`). Si la reconstruction est plus large, la taille est trop grande : `nouvelle taille = taille × largeur capture / largeur rendu`. Un titre plus épais et plus serré sur la capture se corrige avec `font-weight` (700 → 750–800) et `letter-spacing` négatif.

### Ce qui peut rester

Une capture faite sous Windows lisse le texte avec ClearType (franges colorées) : le rendu ne sera jamais identique au pixel sur les lettres. Ces écarts de quelques pixels sur le contour des textes sont normaux. Tout le reste (aplats, positions, tailles, icônes, images, graphiques) doit correspondre.

## 4. Animer sans trahir

- Chaque animation **finit exactement sur l'état de la capture** : c'est ce que `MondeAPlat` vérifie (horloges à `FINI`).
- Animations qui respectent l'interface : compteurs qui montent jusqu'au vrai chiffre, courbes et aires qui se tracent, anneaux qui se remplissent, barres qui poussent, lignes de tableau en cascade, badges qui apparaissent, bouton enfoncé avec une onde qui s'efface.
- Interdit pendant un plan : une couleur, un texte ou un élément qui n'existe pas dans la capture et qui reste à l'écran.
- Pas de halo ni de néon sur une interface qui n'en a pas. Sur une interface claire, `"theme": "clair"` adoucit l'ombre de profondeur et le vignettage : le blanc reste blanc dans la zone nette.

## Exemple de résultat

Audivo, capture 1920 × 948, thème clair, application affichée à 83,3 % :

| Mesure | Valeur |
|---|---|
| Ressemblance | 99,5 % |
| SSIM | 0,951 |
| Surface en écart | 1,9 % (contours de texte ClearType) |
| Écarts de couleur | aucun |
| Passes de correction | 6 (tailles de texte, position du badge KPI, ombre des cartes, opacité des aires, glyphe ∞) |
