# Feature : Chorale & membres

## Objectif
Gérer les informations de la chorale (nom, ville, logo), le code d'invitation, et la liste des membres avec leur rôle/pupitre.

## Modèle de données
- `choirs` — nom, description, ville, logo, `invite_code` (généré aléatoirement), `owner_id`
- `choir_members` — association utilisateur ↔ chorale, `role` (`chef`/`chantre`/`choriste`), `voice` (pupitre)

## Endpoints
| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/api/choir` | Membre | Infos chorale + rôle de l'utilisateur + liste des membres |
| PATCH | `/api/choir` | Chef (pour la régénération du code et la modification des infos) | Modifier nom/ville/description, ou régénérer le code d'invitation (`{ "action": "regenerate_invite" }`) |

Gestion fine des membres (retrait, changement de rôle) : actuellement seulement via `src/services/choirs.ts`, appelée directement depuis la page `/parametres` — **pas exposée en REST** pour l'instant (à ajouter si un besoin de le piloter hors de l'UI se confirme).

Voir aussi la spec interactive : `/api-docs`.

## Règles métier
- Créer une chorale : n'importe quel utilisateur connecté (devient `chef`, via `/onboarding`).
- Rejoindre une chorale existante : via `invite_code` (devient `choriste`).
- Modifier les infos de la chorale ou régénérer le code : chef uniquement.

## Fichiers clés
- `src/services/choirs.ts` — CRUD chorale + membres
- `src/app/api/choir/route.ts` — routes REST
- `src/app/(app)/parametres/page.tsx` — UI
- `src/app/onboarding/page.tsx` — création / adhésion
