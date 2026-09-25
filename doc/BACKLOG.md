# Backlog — tâches restantes

> Liste des points identifiés mais non traités, issus du chantier API REST + Swagger (`doc/plans/2026-09-22-api-rest-swagger-plan.md`) et de la dette technique déjà documentée dans `doc/ARCHITECTURE.md` §14. Chaque tâche indique son origine, pourquoi elle compte, et un ordre de grandeur d'effort.

## À vérifier en priorité (bloque la confiance dans le dernier chantier)

- [ ] **Clic réel sur `/chants/nouveau`** (créer un chant avec paroles) pour confirmer l'absence de régression après l'extraction `syncRelated` → `syncSongRelated` (`src/services/songs.ts`, `src/actions/songs.ts`). Vérifié deux fois par diff ligne à ligne, jamais par un vrai clic. *Effort : 5 min, nécessite d'être connecté.*
- [ ] **Passage sur `/api-docs` connecté**, en testant en particulier le champ de recherche et la visionneuse JSON de réponse — `swagger-ui-react` embarque des dépendances (`react-debounce-input`, `react-inspector`, `react-redux`) au peer-dependency plafonné à React 18, alors que l'app tourne en React 19.2.4 (`npm ls swagger-ui-react react` → `ELSPROBLEMS`). Le build passe (le composant ne s'exécute jamais côté serveur), mais personne n'a confirmé le rendu réel. *Effort : 10 min.*

## Sécurité / robustesse — pistes identifiées, non retenues comme bloquantes

- [ ] **Auditer plus largement le modèle "RLS seule, pas de vérification d'appartenance applicative"**, repéré à plusieurs reprises (validation, notifications, messe, répétitions) par un scanner de sécurité automatique. Non exploitable en l'état (RLS bloque tout accès cross-tenant), et c'est l'architecture délibérée de tout le projet — mais un audit formel ferait le tour complet plutôt que du cas par cas. *Effort : ~1h de relecture, aucun changement de code garanti nécessaire.*
- [ ] **`chants/[id]/route.ts` (PATCH)** garde encore sa propre copie du delete-puis-insert pour `song_lyrics`/`youtube_links`/`voice_guides`, en `any` non typé (3 erreurs eslint), au lieu d'appeler `syncSongRelated` maintenant partagé dans `src/services/songs.ts`. La logique existe donc à trois endroits au lieu d'un. *Effort : 20 min, prochaine fois que ce fichier est touché.*
- [ ] **`req.json()` non protégé** dans plusieurs routes PATCH (`messe/[id]`, `repetitions/[id]`, `chants/[id]`, `reject`) : un corps JSON malformé remonte une exception non gérée → 500 générique au lieu d'un 400 propre. Comportement hérité, pas une régression. *Effort : 15 min pour les 4 routes (`.json().catch(() => ({}))`, déjà le pattern utilisé dans `notifications/[id]`).*
- [ ] **Codes de statut trompeurs sur id inexistant/étranger** : `DELETE` sur `messe/[id]` et `repetitions/[id]` renvoie `200 {success:true}` même si 0 ligne supprimée (bloqué par RLS, silencieux) ; `PATCH` sur un id inexistant renvoie `500` générique au lieu de `404`. *Effort : ~30 min, vérifier le count de lignes affectées avant de répondre.*
- [ ] **Doublon d'appel `getChoirByUser()`** dans `validate`/`reject` (`src/app/api/chants/[id]/{validate,reject}/route.ts`) — probablement déjà résolu en interne par `getAuthContextForApi()`. Forme exacte prescrite par le plan, impact négligeable, mais vaut la peine d'être simplifié si ces routes sont retouchées. *Effort : 15 min.*
- [ ] **Ajouter un script de smoke-test minimal** (curl ou fetch) pour le cycle `submit → validate → reject → reset-to-draft` contre une chorale jetable — recommandation du relecteur final, filet de sécurité peu coûteux vu l'absence de suite de tests automatisée. *Effort : ~1h.*

## Documentation

- [ ] **`doc/ARCHITECTURE.md` §9** (tableau des Route Handlers) est resté au format d'avant le chantier — ne liste ni les routes de validation, ni notifications, ni le détail messe/répétitions, ni `/api-docs`. Explicitement laissé hors scope de la Tâche 8 du plan (une seule ligne ajoutée). *Effort : 30 min, recopier le tableau de `doc/API-DESIGN.md` §3.*
- [ ] Commit + push de `doc/ONBOARDING-PRESENTATION.md` (créé, pas encore versionné).

## Dette technique existante (antérieure à ce chantier, `doc/ARCHITECTURE.md` §14)

- [ ] **Aucune suite de tests automatisée** (`jest`/`vitest`/`playwright` absents de `package.json`).
- [ ] **Service worker no-op** : `public/sw.js` se désinstalle lui-même (`self.registration.unregister()`) — PWA installable mais pas d'usage hors-ligne malgré le nom.
- [ ] **Panneau IA partiellement statique** : les boutons « Transposer » et « Analyser » dans `AIPanel.tsx` n'ont pas de gestionnaire d'événement.
- [ ] **Pas de Supabase Storage** : `score_url`/`audio_url`/`logo_url` sont de simples champs texte, aucun flux d'upload vers un bucket.
- [ ] **Table `subscriptions` orpheline** en base (modèle d'abonnement retiré du code applicatif en 2026-09-20, table jamais supprimée par migration).
- [ ] **`YOUTUBE_API_KEY`** réservée dans `.env.example` mais non utilisée par le code (l'oEmbed ne nécessite pas de clé) — variable morte à nettoyer ou à documenter comme réservée pour un usage futur.

## Produit / à clarifier

- [ ] **Rôle `chantre`** : existe dans `choir_members.role` et a les mêmes droits de suppression de chant que `chef` (policy RLS `songs_delete`), mais aucun traitement différencié dans l'UI actuelle. À clarifier si un usage spécifique est prévu, sinon envisager de le retirer pour simplifier.
- [ ] **Appartenance à plusieurs chorales** : rien n'empêche en base qu'un utilisateur rejoigne une seconde chorale (`choir_members` n'a qu'une contrainte `UNIQUE(choir_id, user_id)`, pas `UNIQUE(user_id)`). `getChoirByUser()` échoue proprement dans ce cas (`.single()` sur 2 lignes), donc pas de faille — mais l'UX pour un tel utilisateur n'a jamais été pensée. À décider : bloquer l'appartenance multiple à l'onboarding, ou la supporter explicitement (sélecteur de chorale active).
- [ ] **Gestion fine des membres** (retrait, changement de rôle) n'est pas exposée en REST — actuellement pilotée uniquement depuis `/parametres` via `src/services/choirs.ts`. À ajouter si un besoin de la piloter hors de l'UI se confirme (documenté comme non-exposition volontaire dans `doc/features/chorale.md`).
