# Refonte Cantor — journal de suivi

> Document repère de la refonte (frontend d'abord), point par point.
> Pour chaque point : **Existant** → **Cible** → **Décision** → **Changements**.
> Règle : rien de ce qui existe n'est modifié sans accord explicite (approuver / garder / reporter).
> Les points reportés vont dans « À faire plus tard », les refus en une ligne dans « Gardé tel quel ».

---

## 1. Accueil (dashboard V1) — tous les rôles

**Statut :** intégré le 2026-11-18 pour choriste/chantre, étendu au chef le 2026-11-19 — à tester (compte choriste en attente de l'accès Supabase).

### Existant (avant)
- `dashboard/page.tsx` : le chef garde l'ancien accueil ; tout autre rôle (choriste, chantre) → `ChoristeDashboard`.
- `ChoristeDashboard.tsx` (commit `da63e03`) : prochaine messe, raccourcis feuille de messe / répétition, chant validé mis en avant, dernière notification, blocs « Présence & absence » et « Divertissement » marqués *Bientôt*. Thème crème/or « Partition ».

### Cible
- Maquette « Cantor — Accueil choriste » V1 (ordinateur + mobile) : salutation → bannière prochaine messe → 3 cartes (Annonces / Mes présences / Ma contribution, défilement horizontal sur mobile) → Catalogue de chants + Prochaine répétition → Vie chorale → Citation.
- Palette bleu nuit / jaune (`navy #14233F`, `sun #F2C14E`), polices Plus Jakarta Sans (titres) et Caveat (citation).

### Décisions
- ✅ Remplacer l'ancien `ChoristeDashboard` par la V1 (code du zip `cantor-dashboard-v1`).
- ✅ **Pas de données fictives (mock abandonné)** : on branche ce qui existe en base, les autres cartes affichent leur état vide.
- ✅ Garder les images fournies (générées), y compris le hero en 1536×345.
- ✅ Rester sur `lucide-react` pour les icônes.
- ✅ (2026-11-19) **Le chef a le même accueil** que les choristes. L'ancien accueil chef (tuiles de stats, chants récents, actions rapides, feuilles de messe, répétitions passées) est retiré ; ses raccourcis de création (Chant / Feuille / Répétition) sont repris dans l'en-tête, visibles du chef seul.

### Changements
| Fichier | Changement |
|---|---|
| `src/app/(app)/dashboard/page.tsx` | Tous les rôles → `AccueilDashboard` ; seul l'écran « pas encore de chorale » est conservé tel quel |
| `src/app/(app)/dashboard/AccueilDashboard.tsx` | Ex-`ChoristeDashboard.tsx`, renommé et remplacé : assemble les composants de `src/components/dashboard/` + raccourcis chef |
| `src/components/dashboard/*` | Nouveaux : `MassHero`, `AnnouncementsCard`, `AttendanceCard`, `ContributionCard`, `SongCatalogCard`, `RehearsalCard`, `ChoirLifeBanner`, `QuoteBanner`, `ui.tsx`, `format.ts` |
| `src/types/dashboard.ts` | Nouveau : types de toutes les sections |
| `src/services/dashboard.ts` | Nouveau : `getDashboardData()`, point d'entrée unique, branché sur Supabase |
| `src/services/songs.ts` | Ajout de `getLatestValidatedSongs()` |
| `src/app/globals.css` | Ajout de la palette (`@theme` : navy, sun, ink, line, canvas, ok, ko, info…) et des familles `font-display` / `font-script` |
| `src/app/layout.tsx` | Chargement des polices Plus Jakarta Sans et Caveat (`next/font`) |
| `public/images/dashboard/` | 5 images (hero, partition, choristes, église, bougie) |

**Données branchées :**

| Section | Source | Limites actuelles |
|---|---|---|
| Prochaine messe | `mass_sheets` (date ≥ aujourd'hui à Paris) | pas d'heure, de lieu ni d'heure de rendez-vous en base → non affichés |
| Catalogue | 4 derniers chants **validés** (`songs`) | catégorie = type liturgique, public = temps liturgique ; pas de durée en base |
| Prochaine répétition | `rehearsals` (date, heure, lieu) | pas d'heure de fin ni de note dédiée |
| Annonces, Présences, Contribution | — (tables inexistantes) | état vide |
| Vie chorale | texte + photos statiques | pas de rendez-vous (table `events` inexistante) |

À noter : la carte « Notifications » de l'ancien accueil disparaît ; les notifications restent accessibles par la cloche (barre du haut / latérale).

---

## À faire plus tard

- [ ] **Barre latérale par rôle** (maquette sombre : Au quotidien / Moi / La chorale / Gestion, vues choriste / chantre / chef) — reportée.
- [ ] **Migrations pour compléter l'accueil** : `mass_sheets` (heure, lieu, heure de rendez-vous), `rehearsals` (heure de fin), `songs` (durée).
- [ ] **Fonctionnalités à créer** (migration + RLS + service + page + branchement dans `getDashboardData()`) : Annonces → Présences (appel par le chantre) → Contributions → Vie chorale / événements.
- [ ] **Cohérence visuelle** : l'accueil est en bleu nuit/jaune, le reste de l'app en crème/or « Partition » — décider de la migration du reste de l'app.
- [ ] **Liens grisés « Bientôt disponible »** sur l'accueil (Toutes les annonces, Historique, Mes engagements, Découvrir…) — revoir l'UX (masquer plutôt que griser ?).
- [ ] **Images** : remplacer les images générées par de vraies photos de la chorale, en ≥ 1200 px.
- [ ] **Fonctions de service devenues inutilisées** avec le nouvel accueil — à supprimer : `getFeaturedSong`, `getRecentSongs`, `countSongs` (`services/songs.ts`), `getRecentRehearsals`, `countRehearsals` (`services/repetitions.ts`), `getRecentMassSheets`, `countMassSheets` (`services/messe.ts`).
- [ ] **Accueil chef** : rien n'y signale encore les chants en attente de validation (prévu via le badge « Validation des chants » de la barre latérale par rôle).
- [ ] **Message de connexion trop vague** (`login/page.tsx`) : « Email ou mot de passe incorrect » pour toutes les erreurs, y compris email non confirmé. Le correctif `email_not_confirmed` cité dans le contexte Claude.ai n'est pas dans la branche.
- [ ] **Onboarding accessible sans être connecté** : on peut saisir un code d'invitation « dans le vide » ; il redirige vers `/login` sans rien enregistrer ni prévenir.

### Points relevés lors du tour du projet (non encore discutés)
- Accueil chef : l'heure de la prochaine répétition est lue dans la colonne `date` (pas d'heure) au lieu de `time`.
- Lien « Validation » visible par tous dans la barre latérale, alors que la page est réservée au chef.
- Vérification du rôle faite de façons différentes selon les pages (`getAuthContext().role` vs requêtes directes).
- `SongProgramItem.tsx` : `useState` appelés après un `return null` (hooks conditionnels).
- Lint global non propre (~76 erreurs préexistantes), aucune suite de tests automatisés.

## Décisions en attente
- Outils d'aide au développement UI (vérification visuelle Playwright, plugin `frontend-design`, `doc/DESIGN.md`, Prettier + tri des classes Tailwind, Radix UI).
- Répartition du contexte : `CLAUDE.md` (règles partagées) / `CLAUDE.local.md` (personnel) / ce journal.

## Gardé tel quel
- Icônes : `lucide-react` (passage à react-icons écarté) — 2026-11-18
