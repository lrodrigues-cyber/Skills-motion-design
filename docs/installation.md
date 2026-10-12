# Guide d'installation

[← Retour au README](../README.md) · [Utilisation](utilisation.md) · [Modèles de prompts](prompts.md) · [Dépannage](depannage.md)

Ce guide explique comment installer le skill **dashboard-cinematique** et vérifier qu'il fonctionne. Comptez 5 minutes, plus le temps d'installer Node.js et ffmpeg s'ils ne sont pas déjà sur votre machine.

## Sommaire

1. [Choisir son environnement](#1-choisir-son-environnement)
2. [Préparer la machine](#2-préparer-la-machine-claude-code)
3. [Méthode A : plugin Claude Code (recommandée)](#3-méthode-a--plugin-claude-code-recommandée)
4. [Méthode B : dossier de skills personnel](#4-méthode-b--dossier-de-skills-personnel)
5. [Méthode C : skill de projet, partagé avec une équipe](#5-méthode-c--skill-de-projet-partagé-avec-une-équipe)
6. [Méthode D : claude.ai](#6-méthode-d--claudeai)
7. [Vérifier l'installation](#7-vérifier-linstallation)
8. [Mettre à jour et désinstaller](#8-mettre-à-jour-et-désinstaller)

---

## 1. Choisir son environnement

Le skill fait travailler Claude sur votre machine : il crée un projet vidéo, installe [Remotion](https://www.remotion.dev), génère la musique et rend la vidéo avec un navigateur sans interface. Il lui faut donc un environnement qui exécute du code.

| Environnement | Installation | Rendu vidéo | Recommandation |
|---|---|---|---|
| **Claude Code** : terminal, application de bureau, extension VS Code ou JetBrains | Méthode A, B ou C | Sur votre machine, sans limite de durée | **Recommandé**. C'est l'environnement dans lequel le skill a été conçu et testé |
| **Claude Code sur le web** (sessions cloud) | Méthode C (skill dans le dépôt) ou D (skill synchronisé depuis claude.ai) | Dans le conteneur cloud | Fonctionne. Le rendu final occupe la session pendant 25 à 35 min |
| **claude.ai** (web, bureau, mobile) | Méthode D | Dans le bac à sable d'exécution de code | Possible, mais non garanti : l'accès réseau et la durée d'exécution du bac à sable peuvent bloquer l'installation de Remotion ou le rendu final |

> [!TIP]
> Si vous hésitez, choisissez Claude Code avec la méthode A : une seule commande, des mises à jour simples, et un rendu sans limite de temps.

## 2. Préparer la machine (Claude Code)

Le skill a besoin de **Node.js** (avec npm) et de **ffmpeg**. Vérifiez dans un terminal :

```bash
node -v      # doit afficher v18 ou plus (v20 ou v22 conseillé)
npm -v
ffmpeg -version
```

S'il en manque un, installez-le :

| Système | Node.js | ffmpeg |
|---|---|---|
| macOS ([Homebrew](https://brew.sh)) | `brew install node` | `brew install ffmpeg` |
| Windows (PowerShell) | `winget install OpenJS.NodeJS.LTS` | `winget install Gyan.FFmpeg` |
| Ubuntu / Debian | Paquet LTS depuis [nodejs.org](https://nodejs.org/fr/download) | `sudo apt install ffmpeg` |

Fermez puis rouvrez le terminal après l'installation pour que les commandes soient reconnues.

**Ce qui est téléchargé automatiquement**, au premier projet, et qui demande un accès à Internet :

- les paquets npm de Remotion et React (environ 530 Mo dans le dossier du projet, versions figées) ;
- **Chrome Headless Shell**, le navigateur sans interface qui dessine les images (environ 100 Mo, une fois par projet).

> [!NOTE]
> Sous Linux, Chrome Headless Shell a besoin de quelques bibliothèques système (`libnss3`, `libgbm1`, `libasound2`…). La liste à jour est sur la page [Linux dependencies](https://www.remotion.dev/docs/miscellaneous/linux-dependencies) de Remotion. macOS et Windows n'ont rien à ajouter.

**Configuration conseillée** : 8 cœurs et 16 Go de RAM. Avec 4 cœurs et 8 Go, tout fonctionne, mais le rendu final prend 25 à 35 min. Prévoyez 1,5 Go d'espace libre par projet vidéo.

## 3. Méthode A : plugin Claude Code (recommandée)

Le dépôt est aussi un catalogue de plugins Claude Code. Le plugin **motion-design** contient le skill **dashboard-cinematique**, ainsi que les futurs styles.

Dans une session Claude Code (Claude Code 2.1.275 ou plus récent) :

```text
/plugin install motion-design --marketplace lrodrigues-cyber/Skills-motion-design
```

Sur une version plus ancienne, ajoutez d'abord le catalogue, puis installez le plugin :

```text
/plugin marketplace add lrodrigues-cyber/Skills-motion-design
/plugin install motion-design@motion-design-skills
```

Les mêmes opérations existent en ligne de commande, hors session :

```bash
claude plugin marketplace add lrodrigues-cyber/Skills-motion-design
claude plugin install motion-design@motion-design-skills
```

Le skill s'appelle alors **`/motion-design:dashboard-cinematique`**.

> [!NOTE]
> Claude Code télécharge le catalogue avec `git`. Si vous n'avez pas de clé SSH GitHub, définissez la variable d'environnement `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1` avant de lancer Claude Code. Si le dépôt est privé, chaque personne doit y avoir accès avec ses propres identifiants GitHub.

## 4. Méthode B : dossier de skills personnel

Le skill est copié dans votre dossier personnel. Il est disponible dans tous vos projets, sur cette machine uniquement.

**macOS / Linux**

```bash
git clone https://github.com/lrodrigues-cyber/Skills-motion-design.git
mkdir -p ~/.claude/skills
cp -R Skills-motion-design/skills/dashboard-cinematique ~/.claude/skills/
```

**Windows (PowerShell)**

```powershell
git clone https://github.com/lrodrigues-cyber/Skills-motion-design.git
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null
Copy-Item -Recurse Skills-motion-design\skills\dashboard-cinematique "$env:USERPROFILE\.claude\skills\"
```

**Sans git** : téléchargez [`dist/dashboard-cinematique.zip`](../dist/dashboard-cinematique.zip) et décompressez-le dans `~/.claude/skills/` (sous Windows : `%USERPROFILE%\.claude\skills\`).

Contrôlez le résultat : le fichier doit se trouver exactement à `~/.claude/skills/dashboard-cinematique/SKILL.md`, et non dans un dossier imbriqué de plus (`dashboard-cinematique/dashboard-cinematique/SKILL.md`).

Le skill s'appelle **`/dashboard-cinematique`**. Claude Code détecte les nouveaux skills sans redémarrage. Seule exception : si le dossier `~/.claude/skills` n'existait pas au lancement de la session, tapez `/reload-skills`.

> [!IMPORTANT]
> Les skills du dossier personnel ne sont pas chargés dans les sessions cloud (Claude Code sur le web, routines) ni dans Cowork. Pour ces usages, prenez la méthode C ou D.

## 5. Méthode C : skill de projet, partagé avec une équipe

Le skill est rangé dans le dépôt d'un projet. Toute personne qui ouvre ce projet avec Claude Code l'obtient, y compris dans les sessions cloud.

```bash
cd mon-projet
mkdir -p .claude/skills
cp -R /chemin/vers/Skills-motion-design/skills/dashboard-cinematique .claude/skills/
git add .claude/skills/dashboard-cinematique
git commit -m "Ajoute le skill dashboard-cinematique"
```

Pour qu'une équipe reçoive le **plugin** automatiquement, une personne lance une fois cette commande dans le projet, puis commite le fichier `.claude/settings.json` qu'elle crée :

```bash
claude plugin marketplace add lrodrigues-cyber/Skills-motion-design --scope project
```

Les membres de l'équipe installent ensuite le plugin avec `/plugin install motion-design@motion-design-skills`.

## 6. Méthode D : claude.ai

Disponible sur les offres Free, Pro, Max, Team et Enterprise.

1. **Activez l'exécution de code** : **Settings › Capabilities**, option **Code execution and file creation**.
   Sur Team et Enterprise, c'est le propriétaire de l'organisation qui l'autorise, dans **Organization settings › Plugins & skills**, onglet **Policy**. Sur Enterprise, il doit aussi activer **Skills**.
2. **Téléchargez l'archive** [`dist/dashboard-cinematique.zip`](../dist/dashboard-cinematique.zip) depuis GitHub (icône de téléchargement **Download raw file**). Ne la décompressez pas.
3. **Importez-la** : **Customize › Skills**, bouton **+**, puis **Create skill › Upload a skill**, et choisissez `dashboard-cinematique.zip`.
4. **Activez le skill** dans la liste s'il n'est pas déjà actif.

Les libellés ci-dessus sont ceux de l'interface anglaise de claude.ai. L'interface française utilise leurs équivalents.

**Partager avec des collègues (Team et Enterprise)** : dans **Customize › Skills**, menu **…** à côté du skill, **Share**. Pour toute l'organisation, utilisez **Publish to org** (une validation par un administrateur peut être demandée).

Un skill activé sur claude.ai est aussi synchronisé dans les sessions cloud de Claude Code et dans Cowork.

> [!WARNING]
> Dans claude.ai, Claude travaille dans un bac à sable. Pour que le skill fonctionne, ce bac à sable doit pouvoir télécharger les paquets npm et Chrome Headless Shell, et le rendu final dure 25 à 35 min. Si l'installation ou le rendu échoue, demandez un rendu en qualité brouillon, ou passez à Claude Code.

## 7. Vérifier l'installation

**1. Le skill est-il visible ?** Dans Claude Code, tapez `/skills` : `dashboard-cinematique` doit apparaître dans la liste. Vous pouvez aussi taper `/` puis le début du nom pour le voir dans l'autocomplétion. Sur claude.ai, il apparaît dans **Customize › Skills**.

**2. Le skill fonctionne-t-il de bout en bout ?** Lancez le film d'exemple :

```text
Avec le skill dashboard-cinematique, crée le projet d'exemple dans le dossier
./essai-dashboard et rends le film de démonstration en qualité brouillon.
```

Résultat attendu en 5 à 15 minutes, selon la machine et la connexion : un fichier `essai-dashboard/out/…mp4` d'environ 19 s, avec le son. Si une étape échoue, le message d'erreur et la solution sont dans le [guide de dépannage](depannage.md).

## 8. Mettre à jour et désinstaller

| Méthode | Mettre à jour | Désinstaller |
|---|---|---|
| A. Plugin | `/plugin marketplace update motion-design-skills`, ou en ligne de commande `claude plugin update motion-design@motion-design-skills`. Pour les mises à jour automatiques : `/plugin` › **Marketplaces** › motion-design-skills › **Enable auto-update** | `/plugin uninstall motion-design@motion-design-skills` |
| B. Dossier personnel | `git pull` dans le clone, puis recopiez le dossier | Supprimez `~/.claude/skills/dashboard-cinematique` |
| C. Projet | Recopiez le dossier, puis commitez | Supprimez `.claude/skills/dashboard-cinematique`, puis commitez |
| D. claude.ai | Supprimez l'ancien skill, puis importez la nouvelle archive | **Customize › Skills**, menu **…** du skill, option de suppression |

Les nouveautés de chaque version sont listées dans le [journal des modifications](../CHANGELOG.md). Les projets vidéo déjà créés ne changent pas lors d'une mise à jour : ils contiennent leur propre copie du gabarit.

---

**Sources officielles** : [Utiliser les skills dans Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude) · [Skills dans Claude Code](https://code.claude.com/docs/en/skills) · [Créer un catalogue de plugins](https://code.claude.com/docs/en/plugin-marketplaces) · [Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
