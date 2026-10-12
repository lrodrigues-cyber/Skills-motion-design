# Contribuer

Merci de votre intérêt. Ce dépôt réunit des skills de motion design, **un skill par style de montage**. Vous pouvez signaler un problème, proposer une amélioration d'un style existant ou ajouter un nouveau style.

## Signaler un problème ou proposer une amélioration

Ouvrez une [issue](https://github.com/lrodrigues-cyber/Skills-motion-design/issues) avec le modèle « Signaler un problème ». Une capture de l'image concernée et son horodatage font gagner beaucoup de temps.

## Ajouter un nouveau style

Un style se définit à partir de vidéos de référence du même genre : même forme de montage, même type de produit.

1. **Analyser les références.** Décortiquez chaque vidéo, image et son : coupes, durée des plans, cadrages, mouvements de caméra, lumière, couleurs, typographie, musique, effets sonores. Gardez des mesures (temps des coupes, tempo, niveaux) plutôt que des impressions.
2. **Créer le dossier** `skills/<nom-du-style>/` sur le modèle de `dashboard-cinematique` :

   ```text
   skills/<nom-du-style>/
   ├── SKILL.md          la recette et la méthode de travail, lues par Claude
   ├── references/       l'analyse des vidéos de référence
   ├── scripts/          la création d'un projet
   └── assets/template/  un projet prêt à rendre, avec un film d'exemple
   ```

3. **Écrire `SKILL.md`.** Le champ `name` de l'en-tête est identique au nom du dossier (minuscules et tirets). La `description` (1 024 caractères au plus) dit ce que le skill produit et dans quelles situations Claude doit l'utiliser. Le corps donne la recette sous forme de règles mesurables, puis la méthode pas à pas, avec une liste de vérification.
4. **Tester de bout en bout.** Créez un projet neuf avec le script du skill, rendez le film d'exemple, puis vérifiez-le avec la planche-contact et le contrôle de fluidité. Faites aussi tester le skill par quelqu'un qui ne le connaît pas, à partir des modèles de prompts.
5. **Mettre à jour la documentation** : tableau des skills du `README.md`, `CHANGELOG.md` et, si besoin, les guides de `docs/`.

## Publier une nouvelle version

Les utilisateurs du plugin ne reçoivent une mise à jour que si son numéro de version change.

1. Mettez à jour le champ `metadata.version` dans le `SKILL.md` du skill modifié.
2. Augmentez `version` dans `.claude-plugin/marketplace.json`.
3. Reconstruisez les archives pour claude.ai : `./outils/empaqueter.sh`.
4. Vérifiez le catalogue : `claude plugin validate .`.
5. Décrivez les changements dans `CHANGELOG.md`, puis commitez.

## Conventions

- Documentation et messages de commit en français.
- Le texte d'un `SKILL.md` s'adresse à Claude : des consignes directes et vérifiables, avec la raison de chaque règle.
- Pas de fichier lourd dans `skills/` : ni `node_modules`, ni rendu vidéo, ni fichier audio généré. Les médias de démonstration vont dans `docs/media/`.
