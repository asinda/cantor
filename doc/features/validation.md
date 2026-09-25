# Feature : Validation du répertoire

## Objectif
Permettre à un choriste de proposer un chant, et au chef de chœur de le valider ou le rejeter avant qu'il apparaisse comme officiel dans le répertoire.

## Modèle de données
Colonnes sur la table `songs` (pas de table dédiée) :
- `validation_status` : `brouillon` | `en_attente` | `validé` | `rejeté`
- `validated_by` (uuid, `auth.users`), `validated_at` (timestamptz)
- `rejection_note` (text, motif du rejet)

## Endpoints
| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| POST | `/api/chants/{id}/submit` | Membre de la chorale | `brouillon` → `en_attente` |
| POST | `/api/chants/{id}/validate` | Chef | `en_attente` → `validé` |
| POST | `/api/chants/{id}/reject` | Chef | `en_attente` → `rejeté` (body `{ note }`) |
| POST | `/api/chants/{id}/reset-to-draft` | Membre de la chorale | `rejeté` → `brouillon` |

Voir aussi la spec interactive : `/api-docs`.

## Règles métier
- Seul un utilisateur avec `role === "chef"` dans `choir_members` peut valider ou rejeter (vérifié côté serveur, indépendamment des policies RLS).
- Le rejet nécessite un motif (`note`) non vide.
- Valider/rejeter déclenche une notification à l'auteur du chant (`created_by`) — voir `doc/features/notifications.md`.
- Soumettre déclenche une notification à tous les membres `role === "chef"` de la chorale.

## Fichiers clés
- `src/services/validation.ts` — logique métier + déclenchement des notifications
- `src/actions/validation.ts` — Server Actions (utilisées par l'UI `/chants/validation`)
- `src/app/api/chants/[id]/{submit,validate,reject,reset-to-draft}/route.ts` — routes REST (ce document)
- `src/app/(app)/chants/[id]/SongValidationBar.tsx` — UI de la fiche chant
- `src/app/(app)/chants/validation/page.tsx` + `ValidationActions.tsx` — page dédiée chef
