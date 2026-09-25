# Présentation d'onboarding — script détaillé

> Compagnon du deck [`Cantor Dev Onboarding`](https://claude.ai/artifact/H5q5JaCFDkSwbXnC5D8RbS) (16 diapositives). Ce document reprend chaque diapositive avec le texte à dire *et* le détail technique derrière — utile pour préparer l'oral, mais aussi comme référence écrite pour quelqu'un qui n'aurait pas assisté à la présentation.
>
> Sources : `doc/ARCHITECTURE.md`, `doc/API-DESIGN.md`, `doc/plans/2026-09-22-api-rest-swagger-plan.md`, `doc/features/*.md`, `supabase/schema.sql`.

---

## Titre — Cantor

**À dire :** « Aujourd'hui je vous fais un tour de Cantor — comment le projet est construit, et surtout la nouvelle couche REST + Swagger qu'on vient d'ajouter pour qu'on puisse travailler dessus à plusieurs sans se marcher sur les pieds. »

**Contexte pour vous :** cette présentation a deux objectifs distincts. D'abord donner une vue d'ensemble du projet à quelqu'un qui n'a jamais ouvert le repo. Ensuite, en détail, expliquer un chantier précis — l'ajout d'une couche REST documentée par-dessus les Server Actions existantes — parce que c'est l'endroit le plus récent et le plus structurant du code pour qui va contribuer.

---

## 01 — Le projet en un coup d'œil

**À dire :** « Cantor, c'est une PWA de gestion chorale. Bibliothèque de chants multilingue, feuilles de messe, répétitions, et un système de validation où le chef de chœur valide ou rejette ce que les choristes proposent. Deux rôles dans une même chorale : chef et choriste. Et point important pour la suite : c'est multi-tenant — chaque chorale est isolée, tout est scopé par un `choir_id`. On y revient en détail dans deux minutes. Côté stack : Next.js 16, React 19, TypeScript, Supabase pour la base et l'auth. »

**En détail :**

- **Domaine fonctionnel.** Cantor gère cinq grands domaines : la bibliothèque de chants (paroles multilingues fr/ki/sw/en, guides voix par pupitre, liens YouTube), les feuilles de messe (composition d'une célébration), les répétitions (planification + suivi de maîtrise), la validation du répertoire (workflow d'approbation), et les notifications in-app qui accompagnent ce dernier.
- **Rôles.** Deux rôles cohabitent dans `choir_members.role` : `chef` (administre la chorale, valide/rejette les chants, gère les membres) et `choriste` (consulte, propose, s'exerce). Un troisième rôle, `chantre`, existe dans le schéma avec les mêmes droits de suppression que `chef`, mais n'a pas de traitement différencié dans l'UI actuelle — à clarifier si un usage spécifique est prévu un jour.
- **Multi-tenant dès la conception.** Ce n'est pas une app privée pour une seule chorale : c'est un produit générique, où chaque chorale (`choirs`) est un tenant isolé. Toute donnée métier porte un `choir_id`, et l'isolation est appliquée à la fois côté RLS Postgres (diapo 03) et côté vérification applicative (diapo 04 et 12).
- **Stack précise :** Next.js **16.2.6** (App Router, Turbopack), TypeScript 5, React 19, Tailwind CSS v4, `lucide-react` pour les icônes (pas de librairie UI tierce), `date-fns` pour les dates. Backend applicatif entièrement dans Next.js : Server Components, Server Actions (`"use server"`), Route Handlers (`src/app/api/*`). Auth et données via Supabase (Postgres + Supabase Auth), accès par `@supabase/ssr` / `@supabase/supabase-js`.
- **Un détail qui surprend souvent un nouvel arrivant :** ce Next.js 16 renomme le middleware historique en **`src/proxy.ts`** — pas de `middleware.ts`. C'est signalé explicitement dans `AGENTS.md` à la racine du repo, parce que ce framework a des conventions différentes de ce qu'on connaît généralement (vérifié dans `node_modules/next/dist/docs/` au moment d'écrire l'architecture).

---

## 02 — Architecture en couches

**À dire :** « Voici comment une requête traverse l'app. Elle arrive sur `proxy.ts`, notre garde d'authentification, qui tourne sur *chaque* requête. Ensuite deux chemins possibles : soit une Server Action — pour l'UI —, soit un Route Handler — pour l'API REST dont je vais parler après. Mais regardez : les deux convergent vers `services/*.ts`. C'est le point clé de tout ce chantier — pas de logique dupliquée. Et tout en bas, Postgres, protégé par RLS — j'y reviens en détail dans un instant. »

**En détail :**

- **La convention de couches, précisément :** `actions/` (Server Actions, écriture, appelées depuis les Server/Client Components) → `services/` (requêtes Supabase pures, réutilisées à la fois par les pages en lecture et par les actions/routes en écriture) → Supabase. Les pages du groupe `(app)` sont des Server Components qui appellent directement `services/*` en lecture ; les mutations passent systématiquement par `actions/*` ou par les Route Handlers `api/*`.
- **`proxy.ts` en détail** (`src/proxy.ts`) : exécuté sur chaque requête sauf les assets statiques (`matcher` exclut `_next/static`, `_next/image` et les fichiers avec extension image/police). Il instancie un client Supabase SSR, lit la session via `getSession()` — **lecture du cookie local, pas d'appel réseau**, donc rapide — et calcule `isPublic` à partir du `pathname` (liste blanche : `/login`, `/register`, `/onboarding`, `/auth`, `/_next`, `/api/`, `/sw.js`, `/manifest.json`, `/favicon.svg`). Si l'utilisateur n'est pas connecté et que la route n'est pas publique, redirection `/login`. Si connecté et sur `/`, redirection `/dashboard` (il n'y a pas de landing page).
- **Pourquoi deux points d'entrée (Server Actions et Route Handlers) plutôt qu'un seul ?** Les Server Actions sont invisibles depuis l'extérieur de Next.js — impossible de les appeler depuis curl, Postman ou un futur client mobile. Les Route Handlers exposent la même logique en HTTP standard. Le chantier récent (diapos 05 à 13) a consisté à combler les endroits où seul le premier chemin existait.
- **Aucune clé `service_role` côté serveur.** C'est un principe de sécurité fondamental du projet : la sécurité repose entièrement sur les policies RLS + le contexte utilisateur (le token JWT de la session), jamais sur un contournement applicatif avec des droits élevés. Concrètement, `src/lib/supabase/server.ts` construit toujours le client avec `NEXT_PUBLIC_SUPABASE_ANON_KEY`, jamais avec la clé service — donc même une route REST mal écrite ne peut pas accidentellement bypasser RLS en changeant de client.

---

## 03 — Modèle de données multi-tenant

**À dire :** « Cinq tables principales, et toutes héritent d'un `choir_id` : les membres, les chants, les répétitions, les feuilles de messe, les notifications. Mais la vérification d'appartenance, elle, ne se fait qu'à un seul endroit : la table `choir_members`. Chaque policy RLS fait la même sous-requête — est-ce que cet utilisateur est membre de cette chorale. C'est le cœur de l'isolation multi-tenant. »

**En détail :**

- **Table pivot :** `choirs` (`id`, `name`, `invite_code` auto-généré, `owner_id`). Une chorale se crée depuis `/onboarding` (l'utilisateur devient `chef`) ou se rejoint via le code d'invitation (l'utilisateur devient `choriste`).
- **`choir_members`** est la table dont dépendent *toutes* les autres policies RLS du projet. Sa contrainte réelle est `UNIQUE(choir_id, user_id)` — **pas** `UNIQUE(user_id)` seul. Autrement dit, rien n'empêche en base qu'un utilisateur appartienne à deux chorales à la fois (le flux `/onboarding` "rejoindre" n'a pas de garde-fou contre l'appartenance multiple). C'est un point qu'on a dû creuser pendant le chantier REST (voir diapo 12) : `getChoirByUser()` utilise `.limit(1).single()`, donc si un utilisateur a deux memberships, la requête échoue proprement (Postgrest refuse de renvoyer une ligne unique) plutôt que de retourner arbitrairement l'un des deux — un comportement "fail closed" hérité du code existant, pas quelque chose ajouté pour l'occasion.
- **Colonnes notables réellement présentes :**
  - `songs.validation_status` : `brouillon` | `en_attente` | `validé` | `rejeté` (voir diapo 11).
  - `songs.status` : progression d'apprentissage, `nouveau` | `en_cours` | `appris`.
  - `rehearsal_songs.mastery` : 0–100, colonne présente en base mais **non pilotée par l'UI actuelle**, qui utilise plutôt `songs.status` via le composant `MasteryButton`.
  - `notifications.type` : `song_submitted` | `song_validated` | `song_rejected`.
- **La policy RLS exacte** (répétée, avec de légères variations, sur `songs`, `rehearsals`, `mass_sheets`, `notifications`) :
  ```sql
  choir_id IN (SELECT choir_id FROM choir_members WHERE user_id = auth.uid())
  ```
  Sur `notifications`, la policy est asymétrique : n'importe quel membre de la chorale du destinataire peut *insérer* une notification pour lui (pour permettre à un service applicatif de notifier autrui), mais seul le destinataire peut la lire ou la marquer comme lue (`user_id = auth.uid()`).
- **Pourquoi ça compte pour quelqu'un qui code une nouvelle feature :** si vous ajoutez une table liée à une chorale, la policy RLS "standard" du projet est cette même sous-requête. Ne pas la dupliquer différemment sans raison — la cohérence de ce point unique de vérification est ce qui rend l'audit de sécurité du projet faisable.

---

## 04 — Flux d'authentification

**À dire :** « Ce que fait `proxy.ts` concrètement : il lit la session — juste le cookie, pas d'appel réseau — et prend une décision. Pas de session ? Redirection login. Session mais pas de chorale ? Onboarding. Sinon, ça passe. Mais — et c'est important — ce n'est pas la seule barrière. Chaque page et chaque route revérifie l'utilisateur elle-même. Next.js le recommande officiellement : le proxy ne doit jamais être votre seul rempart d'autorisation. »

**En détail :**

- **Deux fonctions de revalidation, deux contextes :**
  - `getAuthContext()` (`src/lib/auth.ts`) — utilisée dans les **pages** (Server Components). Si pas d'utilisateur, elle redirige elle-même vers `/login`.
  - `getAuthContextForApi()` — utilisée dans les **Route Handlers**. Si pas d'utilisateur, elle renvoie `null` et la route répond `401 { error: "Non autorisé" }` elle-même.
- **Pourquoi cette duplication de vérification (proxy *et* fonction) n'est pas de la redondance inutile :** c'est la recommandation officielle de Next.js elle-même — *"Proxy should not be used as a full session management or authorization solution"*. Le proxy est une optimisation de routage (éviter de rendre une page entière juste pour rediriger), pas une garantie de sécurité en soi. La vraie barrière est la revérification par requête, doublée de RLS au niveau base.
- **Deux correctifs de sécurité réels déjà appliqués dans l'historique du projet**, pour montrer que cette vigilance n'est pas théorique :
  1. Garde d'authentification manquante sur `/api/transcribe` — corrigée (`getAuthContextForApi` appelé en tout début de `POST`).
  2. *Open redirect* sur `/auth/callback` — le paramètre `next` est validé (`startsWith("/")`, rejette `//`, `/\` et la présence de `@`) avant d'être utilisé comme cible de redirection, pour empêcher qu'un lien malveillant redirige vers un site externe après connexion.
- **Le troisième correctif, plus récent, découvert pendant le chantier REST** (repris en détail diapo 12) : `proxy.ts` utilisait `pathname.startsWith("/api")` sans slash final dans sa liste blanche, ce qui incluait accidentellement `/api-docs`. Corrigé en `"/api/"`.

---

## 05 — Pourquoi une couche REST + Swagger

**À dire :** « Jusqu'ici, toute la logique passait par des Server Actions Next.js. Très bien pour l'UI, mais invisible de l'extérieur — impossible de tester avec curl ou Postman, pas de contrat lisible sans ouvrir le code. On a attaqué ça sur trois fronts : une doc dédiée par feature, du REST là où il en manquait, et une spec Swagger interne pour naviguer et tester. »

**En détail :**

- **Le problème concret, avant ce chantier :** certaines features (validation du répertoire, notifications) n'avaient **aucune** route REST — seulement des Server Actions. Impossible de scripter un test, de brancher un futur client externe, ou même simplement de vérifier le comportement d'un endpoint sans relire le code TypeScript de l'action.
- **Ce que ce chantier n'est *pas* :** une API publique pour des tiers. C'est un usage strictement interne, à des fins de maintenance et de test — la spec `doc/API-DESIGN.md` le précise explicitement dès sa première ligne. Ça exclut par exemple de vouloir un système de clés API séparé, du rate-limiting public, ou une gestion de versions d'API — tout ça serait du sur-engineering pour ce besoin.
- **Le hors-scope explicite :** interroger la base brute (hors règles métier) est déjà couvert par l'API PostgREST auto-générée de Supabase, avec sa propre spec OpenAPI native — mentionné dans la doc plutôt que dupliqué.
- **Comment le chantier a été mené, concrètement :** un plan d'implémentation écrit d'abord (`doc/plans/2026-09-22-api-rest-swagger-plan.md`, 8 tâches), exécuté tâche par tâche avec une revue de code après chaque tâche, puis une revue finale de branche complète avant fusion. C'est cette méthode — pas seulement le résultat — qui vaut la peine d'être reprise pour un chantier similaire (diapo 13 et 15).

---

## 06 — Principe additif

**À dire :** « Règle absolue de ce chantier : on ne duplique rien. Les pages continuent d'appeler les Server Actions comme avant, Swagger UI appelle les nouvelles routes REST — mais les deux tapent exactement la même fonction dans `services/*.ts`. Zéro comportement changé côté UI, un seul endroit où vit la logique métier. Et l'authentification réutilise le même cookie de session — pas de clé API séparée, c'est un usage strictement interne. »

**En détail :**

- **La contrainte globale du plan, mot pour mot :** *"Aucune Server Action existante n'est modifiée dans son comportement observable côté UI"* — sauf une exception délibérée et documentée (voir plus bas).
- **L'unique exception, et pourquoi elle est sûre :** dans `src/actions/songs.ts`, une fonction privée `syncRelated` (dupliquée à deux endroits, appelée par `createSongAction` et `updateSongAction`) a été extraite vers `src/services/songs.ts` sous le nom `syncSongRelated`, exportée, pour que la nouvelle route `POST /api/chants` puisse l'appeler aussi. Le changement a été vérifié ligne à ligne, deux fois indépendamment (par l'implémenteur puis par le relecteur), en diffant le fichier avant/après : le **seul** changement fonctionnel est le remplacement de `syncRelated(supabase, ...)` par `syncSongRelated(...)` aux deux points d'appel — mêmes arguments restants, même ordre, même comportement.
- **Authentification réutilisée telle quelle :** les routes REST s'appuient sur le même cookie de session Supabase que l'UI (pas de clé API séparée à gérer, pas de flux OAuth machine-to-machine à construire). Ça simplifie énormément l'implémentation, au prix d'un choix explicite : ces routes ne sont testables qu'en étant connecté dans le même navigateur — ce n'est pas un défaut, c'est le design pour un usage interne.

---

## 07 — Cycle de vie d'une requête REST

**À dire :** « Et voilà le squelette qu'on retrouve sur les 26 opérations qu'on a documentées : on vérifie l'utilisateur, 401 sinon ; parfois le rôle, 403 sinon ; on appelle le service ; et on renvoie soit les données, soit une 500 si ça casse côté base. C'est mécanique — une fois qu'on l'a compris, ajouter une route devient trivial. »

**En détail :**

- **Le vrai code, pas une simplification pédagogique** — voici par exemple la route de validation d'un chant (`src/app/api/chants/[id]/validate/route.ts`) :
  ```ts
  export async function POST(_req: Request, { params }: Params) {
    const auth = await getAuthContextForApi();
    if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const membership = await getChoirByUser(auth.userId);
    if (!membership || membership.role !== "chef") {
      return NextResponse.json({ error: "Réservé au chef de chœur" }, { status: 403 });
    }

    const { id } = await params;
    const { data, error } = await validateSong(id, auth.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ song: data });
  }
  ```
- **Toutes les routes n'ont pas le diamant "rôle" :** `submit` et `reset-to-draft` (n'importe quel membre de la chorale peut les déclencher) n'ont que la vérification d'authentification ; `validate` et `reject` (chef uniquement) ajoutent le contrôle de rôle. Le squelette s'adapte, l'ordre — auth d'abord, rôle ensuite si nécessaire, service en dernier — ne change jamais.
- **Pourquoi ce n'est *pas* redondant avec RLS :** le contrôle `role === "chef"` est une règle *métier* (qui a le droit de valider), pas une règle de *tenant* (qui appartient à quelle chorale). RLS gère la seconde, le code applicatif gère la première — les deux sont nécessaires et ne se remplacent pas.
- **Un détail découvert en le documentant précisément :** le check de rôle refait un appel `getChoirByUser()` alors que `getAuthContextForApi()` a probablement déjà résolu l'appartenance en interne. C'est un doublon d'appel base identifié pendant la revue — accepté tel quel parce que c'est la forme exacte prescrite par le plan, et que l'impact réel est négligeable (une requête de plus, pas un problème de correction).

---

## 08 — Une doc par feature

**À dire :** « Chaque feature a maintenant son fichier markdown, toujours la même structure : objectif, modèle de données, endpoints, règles métier, fichiers clés. Six docs déjà écrites. Ça évite de dupliquer les détails d'endpoint partout — chaque doc renvoie vers Swagger pour ça. »

**En détail :**

- **La structure imposée, et pourquoi elle est imposée :** avoir un gabarit fixe (`Objectif` / `Modèle de données` / `Endpoints` / `Règles métier` / `Fichiers clés`) rend les six docs interchangeables dans la façon de les lire — on sait toujours où chercher une information, sans devoir apprendre la convention de chaque auteur.
- **Ce qu'une doc de feature contient *vraiment*, exemple avec `validation.md` :** elle documente les transitions d'état autorisées, qui peut déclencher quoi (`submit` : membre de la chorale ; `validate`/`reject` : chef uniquement ; `reset-to-draft` : membre de la chorale), et pointe vers `src/services/validation.ts` comme fichier clé — pas vers les routes REST elles-mêmes, qui ne sont qu'un point d'entrée parmi d'autres vers ce service.
- **Ce qu'elle ne contient délibérément pas :** le détail complet des schémas de requête/réponse (types, formats). Ça vit uniquement dans `src/openapi/spec.json`, pour éviter que la doc texte et la spec machine divergent avec le temps — un seul endroit source de vérité pour le contrat HTTP exact.

---

## 09 — La spec OpenAPI et Swagger UI

**À dire :** « Concrètement, tout ça est décrit dans un fichier `spec.json`, servi par une page interne, `/api-docs`. 26 opérations, 16 chemins REST documentés. Et le fameux bouton "Try it out" marche tel quel, sans rien configurer — comme on est connecté dans le même navigateur, le cookie de session suit automatiquement. »

**En détail :**

- **Choix technique :** `src/openapi/spec.json` est un JSON statique (OpenAPI 3.0.3), importé directement dans la page React (`import spec from "@/openapi/spec.json"` — Next.js le supporte nativement, pas besoin de loader YAML). La page `src/app/api-docs/page.tsx` est un composant client (`"use client"`) qui charge `swagger-ui-react` en import dynamique avec `ssr: false`, parce que cette librairie a besoin de `window` et ne peut pas être rendue côté serveur.
- **Le schéma d'authentification documenté :** `components.securitySchemes.cookieAuth`, type `apiKey` en cookie — décrit pour que la spec soit honnête sur le mécanisme réel, même si Swagger UI ne peut pas manipuler ce cookie directement (il faut être connecté au préalable via `/login` dans le même navigateur).
- **Composants réutilisés entre endpoints :** `Song`, `Rehearsal`, `MassSheet`, `Notification`, `Choir`, plus un schéma `Error { error: string }` commun — c'est effectivement le format réel de toutes les erreurs de l'API, donc la spec ne ment pas sur ce point.
- **La page est protégée comme n'importe quelle autre page de l'app** (diapo 12 raconte comment ça n'a pas toujours été vrai) : elle n'est pas dans la liste blanche du proxy, donc non connecté = redirection `/login`. Pas de restriction par rôle au-delà de ça — c'est de la documentation, pas une action sensible.

---

## 10 — Tour des routes

**À dire :** « Un petit état des lieux. Chants et chorale existaient déjà, on les a juste enrichis ou documentés. Validation, notifications, le détail des répétitions et des feuilles de messe — ça, c'est entièrement nouveau, ajouté pendant ce chantier. »

**En détail :** le détail complet, avec méthodes et chemins exacts, est dans la diapositive elle-même (tableau) et dans `doc/API-DESIGN.md` §3. Deux points à souligner à l'oral :
- **`POST /api/chants` a changé de forme, pas de contrat minimal :** avant, il ne créait que la ligne `songs` de base. Il accepte maintenant aussi `lyrics[]`, `youtube_links[]`, `voice_guides[]` dans le même payload (`createFullSong`), tout en restant rétro-compatible — ces champs par défaut à `[]` si absents, donc un appel qui n'envoyait que les champs de base fonctionne toujours à l'identique.
- **`GET /api/chants` accepte maintenant des filtres** (`?q=&type=&diff=&status=&validation_status=`), qui existaient déjà côté service (`listSongsFiltered`) mais n'étaient pas branchés côté REST.

---

## 11 — Le workflow de validation, en détail

**À dire :** « Un exemple concret pour illustrer tout ça : le cycle de vie d'un chant. Brouillon, un choriste le soumet, ça notifie tous les chefs. Le chef valide ou rejette — avec une note obligatoire en cas de rejet — et ça notifie l'auteur. Un chant rejeté peut repasser en brouillon pour être corrigé, et le cycle recommence. »

**En détail :**

- **Les quatre états et leurs colonnes exactes** sur `songs` : `validation_status` (`brouillon`/`en_attente`/`validé`/`rejeté`), `validated_by` (uuid), `validated_at` (timestamptz), `rejection_note` (text).
- **Qui déclenche quoi, précisément** (fichier `src/services/validation.ts`) :
  - `submitForValidation(songId)` : `brouillon → en_attente`. N'importe quel membre de la chorale. Notifie **tous** les membres avec `role = 'chef'` de la chorale (requête `choir_members` filtrée par `choir_id` et `role`).
  - `validateSong(songId, validatedBy)` : `en_attente → validé`. Chef uniquement (vérifié côté route, pas seulement RLS — diapo 07). Notifie `created_by` (l'auteur du chant), sauf si l'auteur est le chef lui-même (`created_by !== validatedBy`).
  - `rejectSong(songId, validatedBy, note)` : `en_attente → rejeté`. Chef uniquement, **note obligatoire** — la route renvoie `400` si `note` est absente, vide, ou uniquement des espaces.
  - `resetToDraft(songId)` : `rejeté → brouillon`. N'importe quel membre — permet à l'auteur (ou à un autre choriste) de corriger et de resoumettre.
- **Le mécanisme de notification** (`src/services/notifications.ts`) : chaque transition insère une ligne dans `notifications`, avec `type` parmi `song_submitted`/`song_validated`/`song_rejected`. Pas de temps réel — la cloche (`NotificationBell.tsx`) fait un poll toutes les 60 secondes, pas de Supabase Realtime.
- **Pourquoi c'est un bon exemple pour illustrer tout le chantier :** ce workflow existait déjà entièrement en Server Actions ; les quatre nouvelles routes REST (`submit`/`validate`/`reject`/`reset-to-draft`) n'ont ajouté aucune règle métier — elles appellent exactement ces mêmes quatre fonctions de service, avec les mêmes contrôles d'autorisation. C'est le principe additif de la diapo 06, incarné.

---

## 12 — Sécurité : RLS en pratique

**À dire :** « Pour rendre ça concret : deux utilisateurs de deux chorales différentes tapent exactement la même route, `GET /api/chants`. Même code, mais chacun ne voit que les lignes de sa propre chorale — c'est Postgres qui filtre, pas notre code applicatif. Et une anecdote utile : en construisant cette couche, on a trouvé un vrai bug — `proxy.ts` laissait passer `/api-docs` sans connexion à cause d'un `/` manquant dans un `startsWith`. Corrigé, mais ça montre bien qu'une garde qui a l'air correcte à la lecture mérite un vrai test avec curl. »

**En détail — l'anecdote complète, parce qu'elle est instructive :**

1. **Le bug exact :** `src/proxy.ts` définissait `isPublic` avec `pathname.startsWith("/api")` — sans slash final. `"/api-docs".startsWith("/api")` vaut `true`. Résultat : la page Swagger, censée être protégée "comme n'importe quelle autre page" (c'était même écrit dans la spec de conception avant l'implémentation), était en réalité servie en clair, `200`, contenu complet, à un utilisateur non connecté.
2. **Comment ça a été trouvé :** pas par relecture de code — la relecture semblait correcte. Trouvé en testant réellement avec `curl` la page après l'avoir créée, dans un environnement de travail isolé (un *git worktree* dédié à ce chantier). Le premier test a renvoyé une erreur 500 au lieu du 200 attendu ou du 307 espéré — parce que le worktree n'avait pas encore les variables d'environnement Supabase copiées (fichier `.env.local`, ignoré par git donc jamais copié automatiquement dans un nouveau worktree). Une fois l'environnement corrigé, le vrai comportement est apparu : `200`, page servie, sans authentification.
3. **Le correctif :** une seule ligne, `"/api"` → `"/api/"`. Revérifié : `/api-docs` redirige maintenant vers `/login` sans session ; `/api/chants` (une vraie route REST) reste joignable et répond `401` géré par elle-même — donc le correctif ne casse pas les routes qui doivent rester accessibles au niveau du proxy (elles gèrent leur propre authentification).
4. **Une seconde vigilance du même chantier**, plus subtile : les routes `PATCH` de `messe/{id}` et `repetitions/{id}` passaient le corps de la requête client (moins un champ tableau connu) directement dans un `.update()` Postgrest, sans liste blanche de champs. Un client pourrait donc en théorie envoyer un `choir_id` dans le corps. RLS bloque déjà tout déplacement vers une chorale dont l'appelant n'est pas membre (la policy `USING` sert aussi de `WITH CHECK` implicite en l'absence de `WITH CHECK` explicite) — mais un utilisateur membre de deux chorales aurait pu, en théorie, déplacer une ressource entre ses deux propres chorales. Corrigé en excluant explicitement `choir_id` du corps avant l'appel au service, en défense en profondeur, même si RLS empêchait déjà tout impact sur une chorale tierce.
5. **Le principe qui ressort des deux cas :** la vérification côté application (rôle, forme du payload) et la vérification côté base (RLS) sont complémentaires, pas redondantes. Aucune des deux ne dispense de l'autre — et la seule façon fiable de vérifier qu'une garde fait ce qu'elle est censée faire, c'est de l'attaquer réellement (curl, requête sans cookie, tentative de changer un champ qu'on ne devrait pas pouvoir changer), pas seulement de relire le code.

---

## 13 — Ajouter une route REST

**À dire :** « Et donc si demain vous devez ajouter une route : réutilisez une fonction de service existante, jamais de logique dupliquée. Le squelette auth-puis-service qu'on a vu tout à l'heure. Documentez dans la spec OpenAPI. Mettez à jour la doc de la feature. Et un commit par étape. »

**En détail, la checklist complète pour ajouter une route :**

1. **Vérifier qu'une fonction de service existe déjà** pour l'opération voulue dans `src/services/<feature>.ts`. Si non, l'écrire là — jamais directement dans le Route Handler, pour qu'une future Server Action puisse la réutiliser aussi.
2. **Écrire le Route Handler** (`src/app/api/<feature>/[id]?/route.ts`) : `getAuthContextForApi()` en premier, contrôle de rôle si l'opération l'exige (via `getChoirByUser()`), appel du service, réponse JSON avec le code de statut approprié (`200`/`201` succès, `400` payload invalide, `401` non connecté, `403` rôle insuffisant, `404` introuvable, `500` erreur base).
3. **Vérifier** : `npx tsc --noEmit`, `npx eslint <fichiers touchés>`. Pas de suite de tests automatisée dans ce repo — c'est une limitation connue, pas un oubli (voir diapo 14) — donc la vérification manuelle (curl, ou Swagger UI une fois connecté) tient lieu de tests pour ce chantier.
4. **Documenter dans `src/openapi/spec.json`** : ajouter le chemin sous `paths`, réutiliser les schémas de `components.schemas` existants quand c'est pertinent plutôt que d'en inventer de nouveaux.
5. **Mettre à jour `doc/features/<feature>.md`** : ajouter la ligne dans le tableau des endpoints, et documenter toute nouvelle règle métier si l'opération en introduit.
6. **Un commit par étape logique** — c'est la convention suivie sur les 8 tâches de ce chantier, chacune terminée par son propre commit, ce qui rend l'historique git directement lisible comme documentation du "comment on a construit ça".

---

## 14 — Ce qu'il reste à savoir

**À dire :** « Quelques points de vigilance : pas de suite de tests automatisée, donc vérification manuelle. Deux checks encore à faire à la main — un vrai clic sur la création de chant, et un passage sur Swagger connecté. Quelques erreurs eslint préexistantes, sans rapport avec ce chantier. Et le service worker ne fait rien — l'app est installable mais pas utilisable hors-ligne. »

**En détail :**

- **Absence de suite de tests automatisée** : ni `jest`, ni `vitest`, ni `playwright` dans `package.json`. C'est documenté comme limitation connue depuis longtemps dans `doc/ARCHITECTURE.md` §14, pas quelque chose introduit par ce chantier. Toute vérification passe par `tsc`/`eslint`/`build` plus des tests manuels via `curl` ou Swagger UI.
- **Les deux vérifications humaines encore dues, précisément :**
  1. Un vrai clic sur `/chants/nouveau` (création d'un chant avec paroles) pour confirmer l'absence de régression après l'extraction `syncRelated → syncSongRelated` (diapo 06). Vérifié deux fois indépendamment par diff ligne à ligne, mais un clic réel reste plus sûr — et cette app parle à un vrai projet Supabase de production, donc fabriquer une session de test n'a délibérément pas été tenté par les agents ayant construit ce chantier.
  2. Un passage sur `/api-docs`, connecté, en testant en particulier le champ de recherche et la visionneuse JSON de réponse — parce que `swagger-ui-react` embarque des dépendances (`react-debounce-input`, `react-inspector`, `react-redux`) qui déclarent des plages de peer-dependency plafonnées à React 18, alors que l'app tourne en React 19.2.4 (`npm ls` remonte un `ELSPROBLEMS`). Le build passe uniquement parce que le composant est chargé en dynamique côté client (`ssr:false`) et ne s'exécute donc jamais pendant le build — mais personne n'a encore confirmé visuellement que ces deux widgets précis fonctionnent correctement en React 19.
- **eslint non propre** : `npx eslint src` remonte 76 erreurs/9 avertissements, mais concentrés dans 21 fichiers **non touchés** par ce chantier (vérifié par recoupement avec la liste des fichiers modifiés). Ne pas confondre avec une régression introduite récemment.
- **Service worker no-op** : `public/sw.js` se désinstalle lui-même immédiatement après activation (`self.registration.unregister()`). L'app est installable comme PWA (manifest valide, icônes, raccourcis) mais n'offre aucune fonctionnalité hors-ligne malgré le nom.

---

## 15 — Où trouver quoi

**À dire :** « Pour la suite : l'architecture complète est dans `doc/ARCHITECTURE.md`, la conception de cette couche dans `doc/API-DESIGN.md`, et si vous voulez un exemple concret de comment on mène un chantier comme celui-ci, le plan d'implémentation tâche par tâche est dans `doc/plans`. Et bienvenue dans le code — des questions ? »

**Repères complets, pour référence après la présentation :**

| Fichier / URL | Contenu |
|---|---|
| `doc/ARCHITECTURE.md` | Vue d'ensemble technique complète : stack, structure, modèle de données, sécurité, flux d'auth et de validation, inventaire fonctionnel, dette technique, déploiement. |
| `doc/API-DESIGN.md` | Spec de conception de la couche REST + Swagger — objectifs, principe additif, inventaire par feature, choix d'architecture. |
| `doc/plans/2026-09-22-api-rest-swagger-plan.md` | Le plan d'implémentation détaillé, tâche par tâche, avec le code exact écrit à chaque étape — un exemple concret et reproductible de méthode. |
| `doc/features/*.md` | Une doc par feature (chants, validation, notifications, répétitions, messe, chorale), structure identique partout. |
| `/api-docs` | Swagger UI interactif, une fois connecté dans le navigateur. |
| `supabase/schema.sql` + `supabase/migrations/*.sql` | Modèle de données complet et policies RLS — la source de vérité pour toute question d'isolation ou de permission. |
| `src/openapi/spec.json` | La spec OpenAPI brute, si vous préférez la lire directement plutôt que via Swagger UI. |
