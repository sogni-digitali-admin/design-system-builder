# design-system-builder

Un skill pour Claude Code qui fabrique un **design system complet** pour une marque.

Il produit une seule page interactive, `design.html`, et le fichier `design.md` que lisent les agents de code. La page contient :
- thèmes clair et sombre, couleurs vérifiées (contraste, daltonisme), typographie ;
- icônes animées et illustrations **Hairline** qui réagissent à la souris ;
- **splash et chargement en SVG animé**, composants avec tous leurs états ;
- un **bouton d'accessibilité** avec son panneau de préférences (taille du texte, contraste, daltonisme, mouvement, guide de lecture, lecture à voix haute), actif sur la page ;
- les écrans propres au produit : CRM, site web, e-commerce, réservation, SaaS, mobile/PWA, emails, assistant IA et agents ;
- autant de **thèmes** que la marque en a besoin (clair, sombre, et par exemple un mode « Mauritian » aux couleurs du drapeau), chacun vérifié ;
- les écrans de connexion, un système de notifications propre à la marque, la recherche classique et IA, la montre connectée, le programme de fidélité, les portails (client, partenaires, équipage, B2B), la signature e-mail et les modèles WhatsApp, et la gestion des photos et de leurs licences.

La page est **multilingue** (FR, IT, EN ou n'importe quelles langues) et se vérifie automatiquement dans un vrai navigateur.

## Ce qu'il faut sur la machine

- Python 3.10 ou plus récent ;
- Node.js 18 ou plus récent ;
- Microsoft Edge ou Google Chrome.

Tout le reste est inclus dans `vendor/` : Hairline, son moteur de figures et Playwright. Il n'y a rien à installer.

## Installation

```bash
git clone <url-du-dépôt> ~/.claude/skills/design-system-builder
```

Sous Windows, le dossier est `C:\Users\<vous>\.claude\skills\design-system-builder`. Redémarrez Claude Code ; le skill apparaît dans la liste des skills.

## Utilisation

Demandez simplement, par exemple :

- « Crée le design system de notre CRM, en français, italien et anglais. Voici le logo et la planche de couleurs. »
- « Ajoute une section Produits à notre design system. »
- « Fais-moi le design system du site de la boulangerie, avec les emails des formulaires. »

Claude suit les étapes du skill :
1. découverte (il demande d'abord les langues, lit toutes les images fournies et en tire les couleurs exactes) ;
2. **page de plan** : il propose, tu choisis, il construit à partir de ton export (voir ci-dessous) ;
3. projet de départ, couleurs, icônes ;
4. sections, build ;
5. traductions ;
6. vérifications ;
7. captures d'écran qu'il regarde avant de dire que c'est fini.

**Toujours planifier d'abord.** Avant le moindre fichier, Claude étudie la marque et le métier, puis écrit des propositions sur chaque sujet (langues, ton, style visuel, palettes claire et sombre, typographie, icônes libres adaptées au métier, illustrations, splash, écrans, assistant IA, accessibilité…). Il les rend dans **une seule page interactive** (`plan/plan.html`, autonome, hors ligne, utilisable dans un Artifact claude.ai) : tu choisis, tu modifies les teintes (les contrastes se recalculent), tu commentes, puis « Exporter mes réponses » produit `ds.plan.json` (téléchargement, copie, ou texte toujours visible). Tu redonnes ce fichier à Claude Code ; `scripts/apply_plan.py` crée ou met à jour le projet (`ds.config.json`, `notes/plan.md` avec chaque décision et sa raison, les questions ouvertes) et Claude construit à partir de là. Le splash et le chargeur animés ne se font qu'à partir d'un logo **SVG** : avec un logo en PNG ou JPG, il n'y a pas de splash, et le logo n'est jamais redessiné.

Pour un gros design system, il peut répartir les sections entre plusieurs agents.

## Les commandes, si vous voulez les lancer à la main

```bash
python scripts/image_facts.py logo.png brand-board.jpg   # couleurs mesurées, logo vectoriel ou non
python scripts/plan_page.py plan/proposals.json          # → plan/plan.html (la page de plan)
python scripts/apply_plan.py ../acme ds.plan.json --proposals plan/proposals.json
python scripts/new_project.py ../acme --name "Acme" --type crm --langs fr,it,en --source fr
python scripts/fetch_icons.py sets                       # les meilleures bibliothèques d'icônes, licences en direct
python scripts/fetch_icons.py get ../acme lucide house mail
python scripts/palette_check.py ../acme                  # contraste + daltonisme
python scripts/build.py ../acme                          # → ../acme/dist/design.html, design.md, splash/
node scripts/qa.mjs ../acme                              # erreurs, requêtes, mobile 390 px, traductions
node scripts/qa.mjs ../acme shots                        # captures de chaque section
```

## Contenu

| Dossier | Rôle |
|---|---|
| `SKILL.md` | les instructions que suit Claude |
| `references/` | la méthode détaillée par sujet, plus `modules/` (les écrans par type de produit) |
| `scripts/` | création de projet, build, couleurs, icônes, traductions, vérifications |
| `assets/` | gabarit de page, CSS de base, scripts de la page, sections de départ, modèles |
| `vendor/` | dépendances incluses (voir `THIRD_PARTY_NOTICES.md`) |
| `evals/` | cas de test du skill |

Les icônes ne sont pas incluses. Le skill aide à choisir la bonne bibliothèque (Lucide, Tabler, Phosphor, Hugeicons…) et ne télécharge que les icônes utilisées, avec leur licence notée dans `icons/SOURCES.md`.
