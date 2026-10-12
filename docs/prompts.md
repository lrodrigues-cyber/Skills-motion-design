# Modèles de prompts

[← Retour au README](../README.md) · [Installation](installation.md) · [Utilisation](utilisation.md) · [Dépannage](depannage.md)

Des demandes prêtes à copier pour chaque situation. Remplacez le texte **[entre crochets]**, supprimez les lignes inutiles et joignez vos captures d'écran au même message.

## Sommaire

1. [Le brief complet (recommandé)](#1-le-brief-complet-recommandé)
2. [Le brief express](#2-le-brief-express)
3. [À partir du code de l'application](#3-à-partir-du-code-de-lapplication)
4. [Découvrir le style avec le film d'exemple](#4-découvrir-le-style-avec-le-film-dexemple)
5. [Avec des vidéos de référence](#5-avec-des-vidéos-de-référence)
6. [Avec votre propre musique](#6-avec-votre-propre-musique)
7. [Retouches](#7-retouches)
8. [Livraison et déclinaisons](#8-livraison-et-déclinaisons)
9. [Écrire un bon prompt](#9-écrire-un-bon-prompt)

### Appeler le skill

Commencez votre message par **« Avec le skill dashboard-cinematique »** : la formule fonctionne partout. Claude reconnaît aussi le skill tout seul quand vous parlez de « vidéo de mon dashboard » ou d'« animer mon interface ».

Dans Claude Code, vous pouvez à la place mettre la commande du skill en première ligne :

| Installation | Commande |
|---|---|
| Plugin (méthode A) | `/motion-design:dashboard-cinematique` |
| Dossier personnel ou projet (méthodes B et C) | `/dashboard-cinematique` |

---

## 1. Le brief complet (recommandé)

Le plus fiable : tout ce dont Claude a besoin, en un seul message. Il ne posera presque aucune question.

```text
Avec le skill dashboard-cinematique, crée une vidéo motion design de mon produit.

PRODUIT
- Nom : [Nom du produit]
- En une phrase : [Ce que fait le produit, et pour qui]
- Langue de l'interface : [français / anglais]

INTERFACE
- Source : [captures jointes / code du dépôt : chemin vers la page / URL publique]
- Couleurs d'accent : [ex. violet #7C3AED et cyan #22D3EE, ou « libre »]

LES 5 PLANS (un seul élément par plan, dans cet ordre)
1. [Ouverture : ex. l'en-tête et la carte « Revenu mensuel : 128 400 € »]
2. [Graphique qui se trace : ex. la courbe des inscriptions sur 12 mois]
3. [Chiffre fort ou alerte : ex. « Quota API : 92 % » en rouge]
4. [Deuxième graphique : ex. les barres gains/pertes par canal]
5. [Action : ex. le bouton « Créer un rapport » dans la barre du haut]

DONNÉES
- [Collez les vrais chiffres et libellés, ou écrivez « données d'exemple crédibles »]

FIN
- [Recul sur l'interface entière (par défaut) / gros plan sur la barre du haut / pas de fin]
- Logo : [non (par défaut) / oui, SVG joint]

SON
- Musique : [générée par le skill (par défaut) / ma musique jointe, avec les effets sonores seuls]
- Ambiance : [sombre et tendue (par défaut) / plus lumineuse / plus planante]

LIVRAISON
- Usage : [site web / publicité / LinkedIn / salon]
- Qualité : [1080p (par défaut) / 4K]

Montre-moi d'abord un brouillon et la planche-contact avant le rendu final.
```

## 2. Le brief express

Quand vous voulez un premier résultat sans tout préparer. Claude choisit les plans lui-même.

```text
Avec le skill dashboard-cinematique, fais une vidéo de mon dashboard à partir
des captures jointes. Choisis toi-même les 5 plans les plus forts, garde mes vrais
chiffres et pas de logo à la fin. Montre-moi un brouillon avant le rendu final.
```

## 3. À partir du code de l'application

Dans Claude Code, ouvert sur le dépôt de votre application. Claude reprend la mise en page, les libellés et les couleurs exactes.

```text
Avec le skill dashboard-cinematique, crée une vidéo de l'application de ce dépôt.

- Lis d'abord [src/pages/Dashboard.tsx et les composants de graphiques] pour reprendre
  la mise en page, les libellés et les couleurs exactes.
- Ne modifie pas le code de l'application : crée le projet vidéo dans [./video-dashboard].
- Plans : [1. carte KPI du revenu, 2. courbe d'activité, 3. alerte de quota,
  4. graphique par canal, 5. bouton « Exporter »].
- Données : [utilise les données de tests/fixtures/dashboard.json / données d'exemple].

Montre-moi un brouillon avant le rendu final.
```

## 4. Découvrir le style avec le film d'exemple

Pour voir le style avant de préparer votre brief, ou pour vérifier une installation.

```text
Avec le skill dashboard-cinematique, crée le projet d'exemple dans [./essai-dashboard]
et rends le film de démonstration en qualité brouillon.
```

## 5. Avec des vidéos de référence

Pour rapprocher le résultat d'une vidéo que vous aimez, à condition qu'elle reste proche du style (interface sombre filmée en gros plan).

```text
Avec le skill dashboard-cinematique, voici [2] vidéos de référence du rendu que je veux.
Analyse-les (cadrages, durée des plans, lumière, musique, effets sonores) et dis-moi
ce qui diffère de la recette du skill. Ensuite, applique ces différences à la vidéo
de mon dashboard (captures jointes). Brouillon d'abord.
```

## 6. Avec votre propre musique

Le skill génère alors uniquement les effets sonores, placés sur les animations, et coupe votre musique au moment de la révélation, comme dans les vidéos de référence.

```text
Avec le skill dashboard-cinematique, utilise ma musique (fichier joint) à la place
de la musique générée. Garde les effets sonores du skill calés sur l'image et coupe
la musique au moment du recul final. [Le temps fort de ma musique est à 0:12 :
fais-le tomber sur la révélation.]
```

## 7. Retouches

Après le brouillon, regroupez vos retouches dans **un seul message numéroté**. Claude les applique toutes, puis rend un nouveau brouillon.

```text
Retouches sur le brouillon :
1. [Le plan 2 est trop serré : on ne voit pas le début de la courbe.]
2. [Remplace le plan 3 par la liste des dernières transactions.]
3. [Musique plus planante, un peu plus lente.]
Rends un nouveau brouillon.
```

Formulations qui fonctionnent bien :

**Contenu et image**

| Objectif | Exemple de demande |
|---|---|
| Changer un plan | « Remplace le plan 3 par la carte des clients actifs. » |
| Changer l'ordre | « Inverse les plans 2 et 4. » |
| Recadrer | « Le plan 2 est trop serré : recule un peu la caméra pour garder toute la courbe dans la zone nette. » |
| Corriger une donnée | « Le revenu mensuel est de 142 900 €, pas 128 400 €. Corrige-le aussi dans le recul. » |
| Couleurs de marque | « Utilise nos couleurs : violet #7C3AED en accent principal, cyan #22D3EE en secondaire. » |
| Langue | « Passe tous les libellés de l'interface en anglais. » |
| Fin | « Termine par un gros plan sur la barre du haut au lieu du recul. » |
| Logo | « Ajoute notre logo à la fin (SVG joint), tracé à la comète. » |

**Son**

| Objectif | Exemple de demande |
|---|---|
| Ambiance plus planante | « Passe la musique en style nappe, sans batterie. » |
| Ambiance plus lumineuse | « Passe la musique en mode majeur, tonalité de la. » |
| Plus d'énergie | « Rends la basse et la grosse caisse plus présentes, et vérifie avec l'écoute automatique. » |
| Son sur une animation | « Au plan 3, ajoute un whoosh quand la carte traverse l'image. » |
| Moins d'effets | « Garde seulement les accents de coupe et la révélation. » |
| Révélation plus douce | « À la révélation, ferme le filtre au lieu de couper net. » |
| Volume | « La musique est un peu forte : baisse le volume général de 20 %. » |
| Contrôle | « Passe l'écoute automatique sur la bande-son et corrige ce qu'elle signale. » |

## 8. Livraison et déclinaisons

| Besoin | Exemple de demande |
|---|---|
| Rendu final | « Le brouillon est validé : lance le rendu final en 1080p. » |
| 4K | « Rends aussi une version 4K. » |
| Réseaux sociaux | « Fais une version sans musique, avec les effets sonores seuls, pour TikTok et Reels. » |
| Fichier léger | « Fais une copie compressée sous 20 Mo pour l'envoyer par e-mail. » |
| Récapitulatif | « Donne-moi la liste des plans avec leurs temps, et ce qui est fictif dans la vidéo. » |
| Variante | « Fais une deuxième version avec un accent orange et une fin sans recul. » |

## 9. Écrire un bon prompt

1. **Un élément par plan.** « La courbe des revenus », pas « la courbe et les KPI ».
2. **De vrais chiffres, arrondis.** « 128,4 k€ » se lit en 3 s, « 128 417,36 € » non.
3. **Laissez les choix de caméra et de lumière au skill.** Les cadrages sont testés. Décrivez ce que vous voulez montrer, pas comment le filmer.
4. **Demandez toujours un brouillon d'abord.** Le rendu final prend 25 à 35 min : il se lance une fois tout validé.
5. **Regroupez les retouches** dans un message numéroté plutôt qu'une par une.
6. **Joignez les fichiers dans le même message** que la demande : captures, logo, musique.
