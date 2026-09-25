# Feature : Notifications in-app

## Objectif
Notifier un membre de la chorale des événements de validation qui le concernent, sans qu'il ait à vérifier manuellement.

## Modèle de données
Table `notifications` (migration `003_notifications.sql`) :
- `id`, `choir_id`, `user_id` (destinataire), `song_id` (nullable)
- `type` : `song_submitted` | `song_validated` | `song_rejected`
- `message` (texte affiché), `read` (bool), `created_at`

RLS : lecture/écriture (marquage lu) restreinte au destinataire (`user_id = auth.uid()`) ; insertion autorisée pour tout membre de la même chorale que le destinataire.

## Endpoints
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/notifications` | 10 dernières notifications + `unreadCount` |
| PATCH | `/api/notifications/{id}` | Marquer une notification lue (`{ read: true }`) |
| POST | `/api/notifications/mark-all-read` | Tout marquer comme lu |

Voir aussi la spec interactive : `/api-docs`.

## Règles métier
- Une notification est créée automatiquement par `src/services/validation.ts` à chaque transition de statut de validation (voir `doc/features/validation.md`) — pas de création manuelle exposée en API.
- Poll côté UI toutes les 60s (`NotificationBell.tsx`), pas de temps réel (pas de Supabase Realtime).

## Fichiers clés
- `src/services/notifications.ts` — CRUD
- `src/actions/notifications.ts` — Server Actions (utilisées par `NotificationBell.tsx`)
- `src/app/api/notifications/**/route.ts` — routes REST (ce document)
- `src/components/layout/NotificationBell.tsx` — UI (Sidebar + TopBar)
- `supabase/migrations/003_notifications.sql` — schéma + RLS
