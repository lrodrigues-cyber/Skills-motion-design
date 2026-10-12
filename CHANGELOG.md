# Journal des modifications

Toutes les évolutions notables des skills de ce dépôt. Les versions suivent le [versionnage sémantique](https://semver.org/lang/fr/) : un changement de la recette qui modifie le rendu des vidéos existantes augmente la version mineure, une correction augmente la version de correctif.

## dashboard-cinematique 1.1.0 (12 octobre 2026)

Bande-son entièrement refaite. La version 1.0 respectait les mesures des références (spectre, niveaux, accords) mais sonnait « cheap » : un modèle d'écoute (YAMNet) l'entendait comme une harpe, un clavecin, une musique de jeu vidéo, et la révélation comme un « ding » de musique pour enfants.

**Son**
- Nouveau moteur audio : oscillateurs sans repliement, filtre « échelle » de synthé analogique, réverbération de salle (réseau de 8 lignes), compression de bus.
- La musique est calée sur le montage : chaque plan est une mesure dont le premier temps tombe sur la coupe, l'accord change sur la coupe (pédale de tonique, i – VI – iv – VII – v sus → i).
- Palette de musique de film électronique : sub, basse pulsée filtrée, nappe sombre avec texture de chœur, arpège grave et doux, grosse caisse et claquements feutrés. Plus aucun son pincé ni clochette.
- Effets de cinéma placés automatiquement : ping de sonar à l'ouverture, souffle inversé et coup grave sur chaque coupe, grondement qui monte jusqu'à la révélation, explosion sourde, whoosh, battements.
- Effets plan par plan calés sur l'animation : `montee` (courbe), `impulsions` (une note par barre, `ecart` et `nombre`), `whoosh`, `impact`, `ping`.
- Volume presque constant d'un plan à l'autre (+3 dB du premier au dernier), comme les références : le premier plan n'est plus trop faible.
- Dosage des couches réglable dans `montage.json` (`musique.reglages`).

**Outils**
- `scripts/ecoute.py` (facultatif, Python) : compare la bande-son aux références avec YAMNet et signale les sons lus de travers. Nouvelle bande-son 0,875 de similarité, ancienne 0,69, références entre elles 0,65–0,85.

**Compatibilité** : les montages 1.0 restent valides. `arpege` est lu comme `impulsions`, et `bpm` fixe désormais le nombre de mesures par plan (le tempo réel suit les coupes).

## dashboard-cinematique 1.0.0 (12 octobre 2026)

Première version publique.

**Image**
- Interface filmée en macro sur un plan 3D incliné : 5 cadrages testés (KPI, courbe, chiffre d'alerte, barres, barre du haut).
- Texte net à tous les zooms grâce au sur-échantillonnage du plan 3D.
- Profondeur de champ progressive sur 3 niveaux, avec le lointain et le premier plan qui tombent dans l'ombre.
- Lumière limitée aux accents néon, avec un halo sobre réglé à l'échelle du gros plan. Aucun faisceau ni rayon ajouté.
- Transitions en coupe franche sans passage par le noir, caméra en mouvement continu, animations lancées avant la coupe.
- Fin « recul » sur l'interface entière, sans logo par défaut. Fins « barre » et « aucune » disponibles, ainsi qu'un logo optionnel (tracé à la comète ou révélé).

**Son**
- Musique originale générée sans dépendance : un accord tenu, basse profonde, nappe large, motif en doubles-croches, arrangement qui monte plan après plan.
- Effets sonores musicaux calés à l'image (montée, arpège, souffle, impact) et révélation finale : souffle inversé, arrêt de la musique, impact, traîne.
- Mode « effets sonores seuls » pour utiliser la musique du client ou un son tendance sur les réseaux sociaux.

**Outils**
- Création d'un projet en une commande (`scripts/nouveau-projet.mjs`).
- Planche-contact (`planche.mjs`) et contrôle automatique de la fluidité (`controle.mjs`) : images ratées, plongées au noir, plans figés.
- Garde-fous sur le montage dans le générateur de son.

**Distribution**
- Catalogue de plugins Claude Code (`motion-design@motion-design-skills`).
- Archive prête à importer dans claude.ai (`dist/dashboard-cinematique.zip`).
- Guides d'installation, d'utilisation et de dépannage, modèles de prompts.
