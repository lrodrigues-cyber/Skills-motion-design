# Guide d'utilisation

[← Retour au README](../README.md) · [Installation](installation.md) · [Modèles de prompts](prompts.md) · [Dépannage](depannage.md)

Ce guide explique comment obtenir une vidéo **dashboard cinématique** de qualité professionnelle : ce qu'il faut préparer, comment se déroule une commande, ce que vous pouvez régler et ce qu'il vaut mieux laisser au skill.

## Sommaire

1. [Comment fonctionne le skill](#1-comment-fonctionne-le-skill)
2. [Ce qu'il faut préparer](#2-ce-quil-faut-préparer)
3. [Le déroulé d'une commande](#3-le-déroulé-dune-commande)
4. [La structure du film](#4-la-structure-du-film)
5. [Ce que vous pouvez régler](#5-ce-que-vous-pouvez-régler)
6. [Ce qui fait le style (à ne pas changer)](#6-ce-qui-fait-le-style-à-ne-pas-changer)
7. [Bonnes pratiques](#7-bonnes-pratiques)
8. [Modifier le projet vous-même](#8-modifier-le-projet-vous-même-utilisateurs-techniques)

---

## 1. Comment fonctionne le skill

Le skill ne filme pas votre écran. Claude **reconstruit votre interface en code**, à partir de vos captures ou du code de votre application, puis la filme avec une caméra virtuelle. C'est ce qui permet un texte parfaitement net en très gros plan, des chiffres qui s'animent et une lumière qui ne bave pas.

Le skill apporte à Claude quatre choses :

| Élément | Rôle |
|---|---|
| **La recette du style** | Les règles relevées sur des vidéos de référence : cadrages testés, durée des plans, lumière, couleurs, rythme, son |
| **Un gabarit Remotion complet** | Interface d'exemple, caméra 3D, profondeur de champ, éclairage, fin, film d'exemple prêt à rendre |
| **Un générateur de bande-son** | Musique originale et effets sonores calculés à partir du montage, sans aucun fichier audio externe |
| **Des outils de fidélité** | Mesure de votre capture (couleurs exactes, bords, textes), puis comparaison automatique de la reconstruction avec l'original, zone par zone |
| **Des outils de contrôle** | Planche-contact des images, détection automatique des images ratées, des coupes saccadées et des plans figés |

## 2. Ce qu'il faut préparer

Plus le brief est précis, moins il faut de retouches. Avant d'écrire votre demande, rassemblez :

**Indispensable**

- [ ] **L'interface** : une capture d'écran nette de la page entière, en pleine résolution (PNG, sans recadrage ni redimensionnement). **La vidéo reprend exactement cette capture** : thème clair ou sombre, couleurs, modules, textes, icônes et logos. Si vous travaillez dans Claude Code sur le dépôt de l'application, le chemin vers les fichiers de la page suffit.
- [ ] **Les 5 moments à montrer**, un élément par moment. Exemples : la carte « Revenu mensuel », la courbe des inscriptions, l'alerte de quota, le graphique gains/pertes, le bouton « Créer un rapport ».
- [ ] **Les données à afficher** : les vrais chiffres et libellés, ou la mention « données d'exemple ». Claude n'invente jamais un chiffre présenté comme réel. Sans données, il utilise des valeurs d'exemple crédibles et le signale à la livraison.

**Facultatif**

- [ ] **Le logo**, seulement si vous voulez un logo à la fin (désactivé par défaut). Un SVG en trait continu donne le meilleur résultat, parce qu'il est tracé à l'écran par une comète lumineuse.
- [ ] **Votre musique**, si vous ne voulez pas de la musique générée. Le skill produit alors uniquement les effets sonores, calés sur votre morceau.
- [ ] **L'usage prévu** : site web, publicité, LinkedIn, salon, réseaux sociaux. Cela oriente la qualité de livraison et les versions proposées.

## 3. Le déroulé d'une commande

| Étape | Qui | Ce qui se passe | Durée indicative |
|---|---|---|---|
| 1. Brief | Vous | Vous envoyez votre demande ([modèles](prompts.md)) avec les captures | 5 min |
| 2. Questions | Claude | Au plus 2 ou 3 questions, seulement sur ce qu'il ne peut pas deviner (données, plans). Il ne vous demande pas de choix créatifs : la recette s'en charge | 1 min |
| 3. Création du projet | Claude | Copie du gabarit, installation de Remotion | 1 à 3 min |
| 4. Reconstruction de l'interface | Claude | Votre tableau de bord est recréé en code à l'identique, à la taille de la capture, puis comparé automatiquement à la capture jusqu'à correspondre (couleurs, positions, textes) | 10 à 25 min |
| 5. Montage | Claude | Choix des 5 plans, cadrages, rythme | 2 à 5 min |
| 6. Brouillon, son et contrôle | Claude | Rendu en demi-résolution, repérage automatique des animations à l'image, bande-son calée dessus, planche-contact, contrôle de la fluidité, corrections | 6 à 12 min |
| 7. Validation | Vous | Vous regardez le brouillon et demandez vos retouches ([prompts de retouche](prompts.md#7-retouches)) | Variable |
| 8. Rendu final | Claude | Rendu 1920×1080 en qualité maximale (4K en option) | 25 à 35 min sur 4 cœurs, moins sur une machine plus puissante |
| 9. Livraison | Claude | Le fichier MP4, la liste des plans et leurs temps, ce qui est fictif, et comment modifier | |

Les durées dépendent de la machine et de la complexité de l'interface. Deux ou trois allers-retours sur le brouillon sont normaux.

**Ce que vous recevez** :

- `out/film.mp4` : H.264, 1920×1080, 30 images/s, profil couleur BT.709, environ 20 s ;
- la liste des plans avec leurs temps de début et de fin ;
- la liste de ce qui est fictif (marque, données d'exemple) ;
- le dossier du projet, pour modifier et relancer le rendu plus tard ;
- sur demande : la version « effets sonores seuls », une version 4K, une version compressée pour l'e-mail.

## 4. La structure du film

Le film suit toujours la même architecture, relevée sur les vidéos de référence (colonne Son : profil sonore « dynamique », celui par défaut) :

| Temps | Plan | Ce qu'on voit | Son |
|---|---|---|---|
| 0 – 3 s | 1. Ouverture | En-tête et carte KPI, liseré lumineux sous la carte | Intro calme et filtrée, tics quand les chiffres défilent, montée vers le drop |
| 3 – 6 s | 2. Graphique | Une courbe qui se trace point par point | **Drop** sur la coupe (impact, cymbale, batterie, sub), « bloop » et tintement sur le tracé |
| 6 – 9 s | 3. Alerte | Un grand chiffre en rouge et sa barre lumineuse | Bloop sur la barre qui se remplit, train de tics sur le compteur |
| 9 – 12 s | 4. Deuxième graphique | Des barres qui poussent en cascade, couleurs opposées | Un bloop par barre, de plus en plus aigu, au moment où elle pousse |
| 12 – 15 s | 5. Action | La barre du haut et le bouton principal | Tintement de verre et bloop sur le bouton, roulement avant la coupe |
| 15 – 19 s | Révélation | Recul sur le tableau de bord entier, qui respire puis s'éteint | Swoosh, impact, longue cymbale ; l'accord final reste et s'éteint |

Chaque plan est une **coupe franche** : pas de fondu ni de passage par le noir. Le nouveau plan arrive déjà visible, légèrement flou, et devient net en 0,4 s. La caméra glisse en continu pendant tout le film.

La musique est **calée sur le montage** : chaque plan dure exactement une mesure, et chaque coupe tombe sur un temps fort, avec un changement d'accord et une frappe. Si la durée d'un plan change, le tempo s'ajuste tout seul.

Les effets sonores sont **calés sur les animations** : un script regarde le brouillon image par image, repère tout ce qui s'allume (courbe tracée, barre qui pousse, bouton qui apparaît) et la bande-son pose un effet sur chaque événement, à l'image près, avec la musique qui se creuse dessous pour qu'on l'entende.

## 5. Ce que vous pouvez régler

Tout se demande en français, dans la conversation. Claude modifie le projet, régénère la bande-son et relance le rendu.

**Image**

| Réglage | Valeurs possibles | Par défaut |
|---|---|---|
| Nombre de plans de coupe | Au choix (3 à 6 s chacun) | 5 |
| Durée de la vidéo | Au choix, de 10 s à 1 min environ | ≈ 20 s |
| Types de plans | Gros plan, travelling, rasant, plongée, zoom avant, éloigné, orbite | Alternés automatiquement |
| Contenu des plans | N'importe quel élément de votre interface, un par plan | KPI, courbe, alerte, barres, bouton |
| Ordre des plans | Libre | Du plus calme au plus spectaculaire |
| Couleurs de l'interface | Celles de votre capture, relevées au pixel (elles ne se changent que si vous le demandez) | Celles de la capture |
| Thème | Celui de votre capture : clair ou sombre | Celui de la capture |
| Langue de l'interface | Celle de votre produit | Celle des captures |
| Fin | Recul sur l'interface entière, gros plan sur la barre du haut, ou pas de fin | Recul |
| Logo de fin | Tracé à la comète (SVG en trait), ou révélé (logo plein ou image) | Pas de logo |
| Résolution | 1080p ou 4K | 1080p |

**Son**

| Réglage | Valeurs possibles | Par défaut |
|---|---|---|
| Profil sonore | `dynamique` (électro entraînante, drop, effets d'interface denses : tics, bloops, verre) ou `cinema` (musique de film sombre, effets de cinéma) | `dynamique` |
| Musique | Générée, ou la vôtre (le skill produit alors les effets sonores seuls) | Générée |
| Tonalité | Do, ré, mi, fa, sol, la, si, avec ou sans altération | Si bémol |
| Mode | Mineur (sombre, tendu) ou majeur (plus lumineux) | Mineur |
| Style (profil cinéma) | `pulse` (basse pulsée et batterie électronique feutrée) ou `nappe` (sans batterie, plus planant) | `pulse` |
| Révélation | Arrêt net, comme un arrêt de bande, ou filtre qui se ferme | Arrêt net |
| Effets sonores | Automatiques sur chaque animation repérée à l'image ; en plus, à la demande : whoosh, coup grave, ping | Ping d'ouverture, frappe sur chaque coupe, un effet par animation, révélation |
| Énergie | Plus ou moins de batterie, de basse, de frappes, d'effets | Percutante dès le 2e plan |
| Dosage des couches | Basse, batterie, nappe, arpège, réverbération, effets : plus ou moins présents | Réglé à l'oreille sur les références |
| Version « effets sonores seuls » | Pour TikTok et Reels, où l'on ajoute un son tendance | Proposée à la livraison |

## 6. Ce qui fait le style (à ne pas changer)

Ces règles ont été mesurées sur les vidéos de référence. Si vous les contournez, la vidéo perd son aspect haut de gamme. Claude vous le signalera si une demande va à leur encontre.

- **Un élément par plan.** Deux graphiques dans le même plan, et plus personne ne sait où regarder.
- **Des plans de 3 s.** Plus long, le rythme retombe. Plus court, on n'a pas le temps de lire.
- **Une caméra qui ne s'arrête jamais.** Chaque coupe se fait en mouvement : c'est ce qui rend le montage fluide.
- **Jamais de passage par le noir entre deux plans.** Un fondu au noir toutes les 3 s donne une impression de clignotement.
- **Votre interface telle qu'elle est.** Mêmes couleurs, mêmes modules, mêmes textes : le style vient de la caméra, de la mise au point et du mouvement, jamais d'une interface redessinée.
- **Pas de lumière ajoutée.** Pas de faisceaux ni de rayons ; des halos seulement sur une interface sombre dont les accents brillent déjà.
- **Un son calé sur l'image.** Chaque coupe tombe sur un temps fort et chaque animation a son effet, à l'image près. Pas de sons de jeu vidéo ni de harpe.

## 7. Bonnes pratiques

| À faire | À éviter |
|---|---|
| Choisir 5 moments forts, chacun lisible en 3 s | Vouloir tout montrer : une vidéo de 20 s n'est pas une démo complète |
| Donner les vrais chiffres, arrondis et lisibles (« 128,4 k€ ») | Des tableaux de 30 lignes : seules 4 à 6 lignes sont lisibles en gros plan |
| Fournir des captures en pleine résolution | Des captures floues ou recadrées, dont Claude ne peut pas lire les libellés |
| Valider le brouillon avant le rendu final | Lancer directement le rendu final : 30 min perdues à chaque retouche |
| Grouper vos retouches dans un seul message numéroté | Envoyer les retouches une par une, avec un rendu à chaque fois |
| Laisser Claude choisir les angles, les couleurs et les effets | Imposer des valeurs de caméra : les cadrages du skill sont déjà testés |
| Demander la version « effets sonores seuls » pour les réseaux sociaux | Publier sur TikTok une musique qui couvrira le son tendance |

## 8. Modifier le projet vous-même (utilisateurs techniques)

Le projet livré est un projet [Remotion](https://www.remotion.dev) standard. Depuis son dossier :

| Commande | Effet |
|---|---|
| `npm run studio` | Ouvre Remotion Studio dans le navigateur : lecture image par image, sans rendu |
| `npm run brouillon` | Rend un brouillon muet en demi-résolution (`out/brouillon.mp4`, ~6 min) |
| `npm run reperage` | Repère les animations du brouillon (`src/film/reperage.json`). À refaire après tout changement d'interface ou de montage |
| `npm run son` | Régénère la bande-son (musique + effets calés sur le repérage) |
| `npm run sonorise` | Pose la bande-son sur le brouillon (`out/brouillon-son.mp4`) pour l'écouter sans refaire le rendu |
| `npm run render` | Rend le film final dans `out/dashboard-film.mp4` |
| `node scripts/planche.mjs out/film.mp4` | Crée une planche-contact (`out/planche.png`) pour vérifier le film d'un coup d'œil |
| `npm run capture -- infos capture/ecran.png` | Lit la capture : taille, thème, palette exacte (aussi `profil`, `pipette`, `grille`, `decoupe`) |
| `npm run fidelite -- capture/ecran.png` | Compare l'interface reconstruite à la capture : zones en écart, couleurs attendues, images agrandies dans `out/fidelite/` |
| `node scripts/controle.mjs out/film.mp4` | Contrôle la fluidité : images ratées, plongées au noir, plans figés |
| `npm run ecoute` | Contrôle le son avec une oreille automatique : ressemblance aux références, sons lus de travers. Facultatif : demande Python et `pip install tensorflow-cpu tf_keras soundfile scipy` |

Les fichiers à connaître :

| Fichier | Contenu |
|---|---|
| `src/film/montage.json` | Le montage : liste des plans, cadrages, effets sonores, fin, réglages de la musique |
| `capture/` | Vos captures d'écran, la référence de la reconstruction |
| `src/ui/Dashboard.tsx` | L'interface reconstruite, à la taille de la capture |
| `src/style/tokens.ts` | Les couleurs de l'interface d'exemple (fond, cartes, accents néon) |
| `public/audio/bande-son.wav` | La bande-son générée |

Un rendu rapide pour vérifier une modification :

```bash
npx remotion render DashboardFilm out/brouillon.mp4 --scale=0.5 --crf=20 --x264-preset=veryfast
```

Pour une image précise : `npx remotion still DashboardFilm out/image.png --frame=245`.
