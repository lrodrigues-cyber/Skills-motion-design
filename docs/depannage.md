# Dépannage et questions fréquentes

[← Retour au README](../README.md) · [Installation](installation.md) · [Utilisation](utilisation.md) · [Modèles de prompts](prompts.md)

Chaque problème est suivi de sa cause la plus fréquente et de la solution. Dans la plupart des cas, il suffit de copier la phrase proposée à Claude : il diagnostique et corrige lui-même.

## Sommaire

- [Installation](#installation)
- [Création du projet](#création-du-projet)
- [Rendu](#rendu)
- [Image](#image)
- [Son](#son)
- [Livraison](#livraison)
- [Droits et licences](#droits-et-licences)
- [Signaler un problème](#signaler-un-problème)

---

## Installation

<details>
<summary><b>Le skill n'apparaît pas dans <code>/skills</code></b></summary>

- **Méthode B ou C** : le fichier doit se trouver exactement à `~/.claude/skills/dashboard-cinematique/SKILL.md` (ou `.claude/skills/dashboard-cinematique/SKILL.md` dans le projet). Un dossier imbriqué de trop, comme `dashboard-cinematique/dashboard-cinematique/`, empêche la détection.
- Si le dossier `skills` n'existait pas au lancement de la session, tapez `/reload-skills`.
- **Méthode A** : vérifiez que le plugin est installé et activé avec `claude plugin list`. Il doit afficher `motion-design@motion-design-skills` et `enabled`.
- **Session cloud ou Cowork** : les skills du dossier personnel n'y sont pas chargés. Utilisez la méthode C ou D du [guide d'installation](installation.md).

</details>

<details>
<summary><b>Claude ne se sert pas du skill</b></summary>

Commencez votre demande par « Avec le skill dashboard-cinematique », ou, dans Claude Code, par la commande `/motion-design:dashboard-cinematique` (plugin) ou `/dashboard-cinematique` (dossier personnel ou projet). Sur claude.ai, vérifiez que le skill est activé dans **Customize › Skills**.

</details>

<details>
<summary><b><code>/plugin marketplace add</code> échoue (authentification, <code>Permission denied (publickey)</code>)</b></summary>

Claude Code télécharge le catalogue avec `git`, sans pouvoir vous demander de mot de passe.

- Sans clé SSH GitHub : définissez `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` dans votre environnement, puis relancez Claude Code.
- Si le dépôt est privé : vous devez y avoir accès, avec des identifiants enregistrés. Le plus simple : `gh auth login`, puis `gh auth setup-git`.

</details>

<details>
<summary><b>claude.ai refuse l'archive</b></summary>

- Importez [`dist/dashboard-cinematique.zip`](../dist/dashboard-cinematique.zip) tel quel, sans le décompresser ni le recompresser. L'archive doit contenir un dossier `dashboard-cinematique/` avec `SKILL.md` à sa racine.
- L'exécution de code doit être activée : **Settings › Capabilities › Code execution and file creation**.
- Sur Team ou Enterprise, les skills doivent être autorisés par le propriétaire de l'organisation (**Organization settings › Plugins & skills**).

</details>

## Création du projet

<details>
<summary><b><code>npm install</code> échoue</b></summary>

- Vérifiez la version de Node.js avec `node -v`. Il faut v18 ou plus, et v20 ou v22 est conseillé.
- Vérifiez l'accès à Internet et, en entreprise, le proxy npm (`npm config get proxy`).
- Relancez l'installation dans le dossier du projet : `npm install`.

À dire à Claude : *« L'installation a échoué : lis le message d'erreur, corrige et relance. »*

</details>

<details>
<summary><b>Chrome Headless Shell ne se télécharge pas, ou le navigateur ne démarre pas</b></summary>

- Lancez le téléchargement à la main dans le dossier du projet : `npx remotion browser ensure`.
- Si un Chrome ou Chromium est déjà installé, indiquez son chemin avec la variable `REMOTION_BROWSER` : le projet l'utilise à la place, sans téléchargement.
- Sous Linux, installez les bibliothèques système listées sur la page [Linux dependencies](https://www.remotion.dev/docs/miscellaneous/linux-dependencies) de Remotion.

</details>

## Rendu

<details>
<summary><b>Le rendu final est très long</b></summary>

C'est normal : 25 à 35 min sur 4 cœurs pour 20 s. Chaque image combine trois niveaux de flou et un sur-échantillonnage qui garde le texte net en très gros plan.

- Travaillez sur des **brouillons** en demi-résolution (5 à 10 min), et ne lancez le rendu final qu'une fois tout validé.
- Fermez les applications lourdes pendant le rendu.
- Le projet rend 2 images en parallèle par défaut. Sur une machine à 8 cœurs et 16 Go de RAM ou plus, demandez : *« Lance le rendu avec REMOTION_CONCURRENCY=4. »*

</details>

<details>
<summary><b>Le rendu plante (mémoire), ou des rectangles noirs apparaissent sur certaines images</b></summary>

Le navigateur manque de mémoire graphique. Demandez : *« Relance le rendu avec REMOTION_CONCURRENCY=1, puis passe le contrôle de fluidité. »*

Le script `scripts/controle.mjs` détecte automatiquement ces images ratées.

</details>

<details>
<summary><b>Sur claude.ai, le rendu s'interrompt</b></summary>

Le bac à sable de claude.ai limite la durée d'exécution. Demandez un rendu en qualité brouillon, ou passez à Claude Code pour le rendu final : il tourne sur votre machine, sans limite de temps.

</details>

## Image

<details>
<summary><b>Le texte est flou ou pixelisé en gros plan</b></summary>

- Vérifiez que vous regardez le rendu final et non un brouillon : les brouillons sont rendus en demi-résolution.
- Le gabarit dessine l'interface à plus haute résolution, puis la réduit (sur-échantillonnage). Ce réglage ne doit pas être retiré, et le zoom de la caméra doit rester entre 3 et 5.

À dire à Claude : *« Le texte du plan [N] n'est pas net : vérifie le sur-échantillonnage et le zoom de ce plan. »*

</details>

<details>
<summary><b>Une transition saccade ou passe par le noir</b></summary>

À dire à Claude : *« Passe le contrôle de fluidité sur le dernier rendu et corrige ce qu'il signale. »*

Le contrôle détecte les plongées au noir aux coupes, les images ratées et les plans figés. Un plan qui « commence vide » se corrige en lançant ses animations avant la coupe.

</details>

<details>
<summary><b>Un flou ou un halo lumineux attire l'œil hors du sujet</b></summary>

À dire à Claude : *« Au plan [N], vers [X] s, l'élément [description] est flou et lumineux et attire l'œil : assombris-le ou sors-le du cadre. »* Une capture d'écran du problème jointe au message aide beaucoup.

</details>

<details>
<summary><b>Les chiffres du recul final ne correspondent pas aux gros plans</b></summary>

Les gros plans et le recul filment la même interface, donc ils doivent toujours afficher les mêmes valeurs. Si ce n'est pas le cas, une donnée a été modifiée à un seul endroit. À dire à Claude : *« Les chiffres du recul diffèrent de ceux du plan [N] : aligne-les sur [valeur]. »*

</details>

<details>
<summary><b>Peut-on faire une vidéo verticale (9:16) ?</b></summary>

La version 1.0 est conçue et testée en 16:9 (1920×1080), le format de toutes les vidéos de référence. Un format vertical demande de recadrer chaque plan : vous pouvez le demander, mais ce format n'est pas encore couvert par la recette.

</details>

## Son

<details>
<summary><b>La musique ou les effets sont décalés par rapport à l'image</b></summary>

La bande-son est calculée à partir du montage. Si le montage a changé, il faut la régénérer avant le rendu : `npm run son` dans le dossier du projet. À dire à Claude : *« Régénère la bande-son, puis relance le rendu. »*

</details>

<details>
<summary><b>La vidéo n'a pas de son</b></summary>

Le fichier `public/audio/bande-son.wav` est généré à la création du projet, puis à chaque `npm run son`. S'il manque (projet copié sans lui, génération interrompue), lancez `npm run son` dans le dossier du projet, puis relancez le rendu.

</details>

<details>
<summary><b>La musique ne me plaît pas</b></summary>

Tout est réglable en une phrase : tempo, tonalité, mode majeur ou mineur, style `pulse` ou `nappe`, type de révélation, effets sonores, volume. Les formulations sont dans les [prompts de retouche](prompts.md#7-retouches). Vous pouvez aussi fournir votre propre musique ([modèle 6](prompts.md#6-avec-votre-propre-musique)).

</details>

## Livraison

<details>
<summary><b>Le fichier est trop lourd pour l'e-mail ou une messagerie</b></summary>

Le rendu final est encodé en très haute qualité (environ 17 Mbit/s, soit 40 Mo pour 20 s). Pour une copie plus légère, sans perte visible :

```bash
ffmpeg -i out/film.mp4 -c:v libx264 -preset slow -crf 23 -maxrate 8M -bufsize 16M \
  -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/film-web.mp4
```

Ou demandez à Claude : *« Fais une copie compressée sous 20 Mo. »*

</details>

<details>
<summary><b>Quel format pour LinkedIn, YouTube, un site web ?</b></summary>

Le MP4 livré (H.264, 1080p, 30 images/s, son AAC) est accepté tel quel par LinkedIn, YouTube, X, Vimeo et les lecteurs web. Pour une intégration sur un site, utilisez la copie compressée ci-dessus : elle démarre plus vite.

</details>

## Droits et licences

<details>
<summary><b>Puis-je utiliser la vidéo à des fins commerciales ?</b></summary>

- **La musique et les effets sonores** sont générés par le script du skill. Ils ne contiennent aucun échantillon ni aucune boucle tierce.
- **La police Inter** est sous licence SIL Open Font License 1.1, qui autorise l'usage commercial.
- **Remotion**, le moteur de rendu, est gratuit pour les particuliers et les entreprises de 3 personnes au plus. Au-delà, l'entreprise qui rend les vidéos a besoin d'une [licence Remotion](https://www.remotion.dev/license).
- **Vos données et votre marque** restent les vôtres. La marque « Nova » et les données du film d'exemple sont fictives.

</details>

## Signaler un problème

Ouvrez une [issue sur GitHub](https://github.com/lrodrigues-cyber/Skills-motion-design/issues) en indiquant :

1. la version du skill (champ `version` en tête de `SKILL.md`) ;
2. l'environnement : Claude Code (terminal, bureau, web) ou claude.ai, et le système d'exploitation ;
3. le message d'erreur complet, ou le moment de la vidéo concerné (en secondes) ;
4. si possible, le résultat de `node scripts/controle.mjs out/film.mp4` et une capture de l'image concernée.
