# Feature : Répétitions

## Objectif
Planifier les répétitions de la chorale et suivre la progression d'apprentissage des chants travaillés.

## Modèle de données
- `rehearsals` — date, heure, lieu, notes
- `rehearsal_songs` — association chant ↔ répétition, `order_index`, `mastery` (0–100, colonne présente en base — non pilotée par l'UI actuelle, qui utilise plutôt `songs.status` via `MasteryButton`)

## Endpoints
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/repetitions` | Liste des répétitions de la chorale |
| POST | `/api/repetitions` | Créer une répétition |
| GET | `/api/repetitions/{id}` | Détail + chants programmés |
| PATCH | `/api/repetitions/{id}` | Modifier (remplace les chants si `song_ids` fourni) |
| DELETE | `/api/repetitions/{id}` | Supprimer |

Voir aussi la spec interactive : `/api-docs`.

## Règles métier
Aucune restriction de rôle particulière au-delà de l'appartenance à la chorale (RLS). Le statut d'apprentissage d'un chant (`nouveau`/`en_cours`/`appris`) est modifié via `PATCH /api/chants/{id}` (`{ "status": "..." }"`), pas via cette feature.

## Fichiers clés
- `src/services/repetitions.ts` — CRUD
- `src/actions/repetitions.ts` — Server Actions (UI `/repetitions/nouveau`, `/repetitions/[id]/modifier`)
- `src/app/api/repetitions/**/route.ts` — routes REST (ce document)
- `src/app/(app)/repetitions/[id]/MasteryButton.tsx` — cycle le statut d'un chant
