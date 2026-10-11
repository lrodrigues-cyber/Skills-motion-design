# Analyse des 5 vidéos de référence

Ce sont 5 vidéos de 16:9 (1024×576, 30 i/s), 19,6 à 21,5 s, publiées par un même studio pour montrer des tableaux de bord SaaS animés. Légendes d'origine :

| # | Légende | Durée | Fin |
|---|---|---|---|
| V1 | « Designed and animated this dashboard to feel less like a product UI a… » | 20,1 s | gros plan barre du haut → logo |
| V2 | « Your dashboard has a story. We make it impossible to miss » | 19,6 s | recul sur l'UI entière → logo |
| V3 | « Adding a cinematic touch to this dashboard, details matter » | 20,0 s | recul sur l'UI entière → logo |
| V4 | « Motion makes it feel alive. Sound makes it feel expensive. Details ma… » | 21,5 s | gros plan barre du haut → logo |
| V5 | « A good dashboard design doesn't show you everything. It helps you not… » | 20,7 s | aucune (montage de plans) |

Méthode : planches-contacts à 1, 4 et 15 i/s, détection des coupes (`ffmpeg select=gt(scene,…)`), échantillonnage des couleurs sur les images, spectrogrammes et analyse audio (tempo, tonalité, attaques, centroïde spectral, RMS) avec librosa.

---

## 1. Image : ce qui est commun aux 5 vidéos

### Structure
- **5 plans rapprochés de ~3 s** en coupe franche, puis la fin. Coupes relevées :
  V1 3,00 / 6,03 / 9,03 / 12,07 · V2 3,30 / 6,10 / 9,20 / 12,67 · V3 3,03 / 6,07 / 9,10 / 12,13 / 15,17 · V4 2,90 / 5,83 / 8,77 / 11,70 / 14,63 · V5 4,30 / 8,73 / 10,53 / 13,20 / 17,97.
  → plans de **88 à 92 images**. Seule V5 varie (1,8 à 4,8 s).
- **Un plan = UN composant** de l'interface : une courbe, une carte KPI, une liste, un bouton, une barre de progression. On ne voit jamais deux idées à la fois.
- **Aucune transition** : la coupe est franche, mais chaque plan commence **flou et sombre** puis se met au point en ~0,4–0,5 s (12–15 images). C'est ça qui sert de transition.

### Caméra
- L'UI est un **plan posé en 3D** : forte inclinaison (rotateX ≈ 45–60°), rotation dans le plan (rotateZ ≈ -15 à -35°). Les lignes de l'interface partent en diagonale vers le haut à droite et fuient vers le haut.
- **Très gros plan** : le composant remplit l'image. Un chiffre clé fait 8–12 % de la hauteur de l'image.
- **Dérive lente et continue** pendant tout le plan (translation le long du plan de quelques % de l'image + léger avancement). Jamais d'arrêt, jamais d'à-coup.
- Chaque plan a un **angle différent** (inclinaison/rotation changent d'un plan à l'autre).

### Profondeur de champ
- **Très courte** : une bande nette horizontale au milieu de l'image ; le haut (loin) et le bas (près) sont très flous (6–8 px à 1024 px de large ≈ 12–15 px en 1080p).
- Sur les plans « liste » ou « barres », la bande nette est plus large pour garder les lignes lisibles.

### Lumière (signature du style)
1. **Halo (bloom)** sur tous les éléments d'accent : barres, courbes, badges, points d'état. Cœur presque blanc, couleur saturée, halo large.
2. **Rayons volumétriques** qui montent perpendiculairement au plan : au-dessus de la barre rouge « 91 % used » (V4), du bouton « Done » (V5), des barres vertes (V3, V5), de l'icône d'alerte (V4).
3. **Traînée lumineuse** bleue qui file sous une carte (ouverture de V1).
4. **Texte/icône émissif** blanc (« My rituals » qui s'allume, V5).
5. **Bordure parcourue de lumière** dégradée bleu → violet → rouge (champ de recherche, V5).
6. **Bouton dont la teinte tourne** (magenta → orange → vert → cyan → bleu → violet, V1, ~2 s).

### Couleurs (échantillonnées)
- Fond : `#060606`–`#0c0c0c` ; cartes `#111114`–`#18181e` ; bords à peine visibles (blanc 6–8 %).
- Texte : blanc ~92 % (titres, chiffres), gris ~55 % et ~32 % (secondaire).
- Accents néon : cyan `#38c6fb`, bleu électrique `#3d6bff`, menthe `#5ef0c0`, vert `#22e08f`, rouge-rose `#ff4f6d`, magenta `#ff4fd8`, ambre `#ffd23f`, violet `#9d7bff`, orange.
- Tout le reste est désaturé : la couleur ne vient que des accents qui brillent.

### Typo et UI
- Sans-serif type Inter/SF, petites tailles d'app réelle (11–15 px pour le texte, 28–46 px pour les chiffres) : c'est la caméra qui grossit.
- Contenu réaliste : vrais libellés, vrais montants, noms de clients, e-mails, horodatages.

### Animation des éléments
- Courbe ease-out marquée : tout arrive vite et se pose longuement.
- Barres qui poussent une par une (décalage ~0,12–0,15 s), courbes qui se tracent point par point, compteurs qui montent, barres de progression qui se remplissent, lignes de liste qui apparaissent en cascade (fondu + flou + léger glissement), icônes qui tombent en place.

### Fin
- **Recul** (V2, V3) : coupe franche sur le tableau de bord **entier, à plat, de face**, sur ≈ 50–64 % de la largeur (mesuré : V3 50 %, V2 64 %), centré sur noir. Il « respire » (grossit à peine). ~1,5–2 s plus tard, le **logo se trace** au centre par-dessus (≈ 0,6–0,75 s), puis l'UI s'éteint (~1 s) et le logo reste seul ~2–3 s.
- **Barre du haut** (V1, V4) : gros plan sur ⌘K / cloche / avatar / bouton ; les éléments apparaissent un par un ; le logo se trace par-dessus ; l'UI s'éteint ; logo seul ~3 s.
- **Logo** : un seul trait épais, blanc, avec une **tête de comète bleue** lumineuse au bout ; la lueur s'éteint ~0,3 s après la fin du tracé. Le logo est à l'écran (pas sur le plan incliné), au centre exact.

---

## 2. Image : vidéo par vidéo

### V1 — « less like a product UI » (20,1 s)
| Temps | Plan | Ce qui bouge |
|---|---|---|
| 0,00–3,00 | Barre latérale + fil d'Ariane « Home / Opportunity Backlog », cartes KPI « Opportunities 12 ↑+31% », « Interviews 48 » | Sort du noir (0–0,6 s), textes en cascade, **traînée bleue** sous la carte (0,75–1,5 s) |
| 3,00–6,03 | Histogramme cyan + courbe rouge | Barres qui poussent une par une (3,4–5,3 s), courbe rouge tracée en même temps |
| 6,03–9,03 | « Active Hypotheses » : cartes + barre de progression | Barre qui se remplit à 42 % + compteur, lueur bleue en haut |
| 9,03–12,07 | Kanban « Now / Next », pastilles « In Progress » (violet), « Planned » (orange) | Cartes en cascade (9,25 / 9,5 / 9,75 / 10,0 s), plan très sombre |
| 12,07–16,2 | Barre du haut : ⌘K, cloche, bouton « + New insight » | ⌘K, cloche puis bouton apparaissent ; **teinte du bouton qui tourne** (13,0–15,0 s) |
| 15,75–16,5 | Logo tracé par-dessus, l'UI s'éteint | Comète bleue |
| 16,5–20,1 | Logo seul | — |

### V2 — « Your dashboard has a story » (19,6 s)
| Temps | Plan | Ce qui bouge |
|---|---|---|
| 0–3,3 | En-tête « Dashboard / Sales Pipeline », « Current Pipeline » ; très sombre, presque monochrome | Icônes qui **descendent et se posent** (0–1,25 s, puis 1,5–2,5 s) |
| 3,3–6,1 | KPI « $4.2m », « Active Deals 84 », badge vert « +4.3% » | Cartes flottantes à une autre profondeur (parallaxe) |
| 6,1–9,2 | Pipeline kanban : « $45K », « $250K », « $148K », avatars | Très flou, dérive latérale |
| 9,2–12,67 | « Lead scoring leaderboard » : avatars, noms, e-mails, scores verts 92 / 91 / 84 | Lignes qui glissent en cascade |
| 12,67–16,5 | **Recul** : UI entière à plat (~42 % de la largeur) | Logo tracé à 14,9–15,6 s ; UI éteinte 16,5–17,5 s |
| 17,5–19,6 | Logo seul | — |

### V3 — « cinematic touch » (20,0 s)
| Temps | Plan | Ce qui bouge |
|---|---|---|
| 0–3,03 | Courbe bleue lumineuse + courbe de comparaison en pointillés, ronds creux | Tracé rapide point par point (0–0,75 s) |
| 3,03–6,07 | « Revenue overview » + badge ambre « ⚠ Stripe Sync Delayed » + « MRR is up 12.5% » (vert) | Textes qui sortent du flou (3,0–3,5 s), badge qui brille |
| 6,07–9,1 | Grille de KPI : « 98.2% » (badge rouge), « Expansion MRR $4,120 +$850 » | Apparitions en cascade, profondeur de champ très marquée |
| 9,1–12,13 | Barres divergentes : vert menthe à droite, rouge-rose à gauche | Barres qui poussent depuis l'axe (9,0–10,3 s), « fumée » menthe au-dessus |
| 12,13–15,17 | Liste « Action Required » : point rouge « TechFlow.io Failed payment », triangle ambre « GmbH Logistics », badge magenta « $2,340 » | Lignes en cascade, points lumineux |
| 15,17–17,0 | **Recul** : UI entière qui sort du noir (15,25–15,75 s) et grossit à peine | — |
| 17,0–17,75 | Logo tracé | UI éteinte 18,0–18,5 s |
| 18,5–20,0 | Logo seul | — |

### V4 — « Sound makes it feel expensive » (21,5 s)
| Temps | Plan | Ce qui bouge |
|---|---|---|
| 0–2,9 | Onglets « Overview » (actif) / « Billing », angle très fort (rotateZ ≈ -35°) | Sort du noir et du flou (0–0,75 s) |
| 2,9–5,83 | « Usage Insights » + onglets + carte « Seats used 18 / 25 », point vert « Good » | Compteur, barre de progression |
| 5,83–8,77 | « Action required » + « / 100 000 » + barre rouge « 91% used » | **Rayons rouges** au-dessus de la barre et de l'icône d'alerte |
| 8,77–11,70 | Deux courbes en pointillés (bleu-violet, violet) avec nœuds lumineux | Tracé progressif |
| 11,70–14,63 | Stockage : Database / Images & Media / Documents / Backups, icônes colorées lumineuses (bleu, vert, orange, rose) | Dérive |
| 14,63–17,0 | Barre du haut : ⌘K (14,8 s), cloche à point rouge (15,5 s), avatar (16,0 s), « Upgrade plan » (16,75 s) | Apparitions une par une |
| 17,25–18,0 | Logo tracé près de la cloche (au centre de l'image) | UI éteinte 18,5–18,75 s |
| 18,75–21,5 | Logo seul | — |

### V5 — « doesn't show you everything » (20,7 s, montage)
| Temps | Plan | Ce qui bouge |
|---|---|---|
| 0–4,3 | Champ « Search notes, ask the assistant… », puce « All sources » | **Bordure lumineuse** dégradée qui parcourt le champ (2,25–3,0 s) |
| 4,3–8,73 | « Explore » + « My rituals » | Six petits ronds qui arrivent un par un pour former l'icône (4,75–5,75 s), puis texte et icône qui **s'allument en blanc** (7,0–8,5 s) |
| 8,73–10,53 | « Copilot Analysis » : « Runway Alert » (rouge), « Expansion Opportunity » (vert), « 96.4% » | — |
| 10,53–13,2 | Stockage (repris de V4) | — |
| 13,2–17,97 | Interrupteur « Done » : contour vert qui s'élargit (13,4–14,6 s), coche qui apparaît avec **rayons verts**, « Done » tapé lettre par lettre (15,5–16,5 s) | — |
| 17,97–20,7 | Barres divergentes (reprises de V3) | Coupe sèche à la fin, sans logo |

---

## 3. Son : ce qui est commun

Chaque vidéo a **sa propre musique**, mais toutes suivent la même grammaire :

- **Nappe électronique sombre** en mode mineur (V1 fa mineur, V2 ut mineur, V3 la♭ majeur / fa mineur, V4 mi), tempo ressenti 82–100 BPM.
- Couches : **sub-basse tenue** (45–90 Hz, très présente), **accords de pad** (100 Hz–1 kHz), **pulsation rythmique** : doubles-croches « pluck » (V4, une attaque toutes les 0,16 s = 94 BPM) ou trémolo/pompe sur les nappes (V2, V3), parfois des grosses caisses douces à hauteur descendante (V5, ~96 BPM).
- **Le son s'éclaircit pendant toute la vidéo** (filtre qui s'ouvre) : centroïde spectral V1 600 → 1 700 Hz, coupure à 95 % 2,7 → 5,9 kHz ; V4 et V3 idem, jusqu'à la révélation.
- **Pas de clics d'interface** : le design sonore est musical et rare, calé sur 3–4 moments.
- Niveau : RMS -15 à -22 dBFS, crêtes -6 à -9 dBFS. Le son démarre dès la 1re image et finit en silence.

### Effets calés sur l'image
| Effet | Où | Description |
|---|---|---|
| **Glissando montant** | V1 3,3–5,6 s (barres qui poussent) ; V3 6,3–6,9 s (compteurs) ; V4 0,2–1,0 s (ouverture) | Note tenue qui glisse vers l'aigu (~150 → 500 Hz) pendant qu'un graphique pousse |
| **Souffle qui gonfle** | V3 12,3–13,0 s (entrée de la liste d'alertes) | Bruit large bande qui monte et se coupe |
| **Arrêt de la musique à la révélation** | V4 17,4–17,9 s : **arrêt de bande** (la hauteur chute) · V2 12,67 s : **filtre qui se ferme** (les aigus disparaissent d'un coup) · V1 15,75 s : la musique tonale s'arrête, reste un grondement | La musique s'interrompt au moment du recul ou du logo |
| **Impact grave** | V3 15,2 s (coupe sur le recul, moment le plus fort de la vidéo) ; V1 15,75 s | Boum grave + queue de réverbération (2–3 s) |
| **Scintillement du logo** | V2 15,1–15,4 s | Souffle aérien qui monte (jusqu'à ~2 kHz) pendant le tracé |
| **Écho final** | V4 18–21,5 s | L'arpège continue tout bas, filtré, et s'éteint |

### Son : vidéo par vidéo
- **V1** : pad tenu fa mineur + sub ; glissando 3,3–5,6 s pendant les barres ; changements d'accord ~toutes les 2 s ; à 15,75 s (logo), la musique tonale cesse → grondement grave bruité qui décroît jusqu'à 19 s ; fondu au silence.
- **V2** : très sombre (centroïde 200–460 Hz), nappe dense pulsée ; à 12,67 s (recul), filtre fermé d'un coup et baisse de niveau ; 15,1–15,4 s souffle du logo ; silence à 18,5 s.
- **V3** : drone grave pulsé (pompe en doubles-croches), stabs ; 6,3–6,9 s glissando ; 9,1 s une couche plus claire entre ; 12,3 s souffle ; 15,2 s **impact** (le plus fort de la vidéo, -16 dB RMS) avec accord grave tenu ; 17 s queue bruitée jusqu'à 20 s.
- **V4** : arpège pluck en doubles-croches à 94 BPM + sub ; le filtre s'ouvre jusqu'à 17,25 s (aigus jusqu'à 8–16 kHz) ; 17,4 s **arrêt de bande** + boum ; puis l'arpège revient tout bas et filtré jusqu'à la fin.
- **V5** : boucle lo-fi : grosse caisse douce à hauteur descendante (~0,62 s), basse et accords tenus ; niveau qui respire ; pas de révélation (montage).
