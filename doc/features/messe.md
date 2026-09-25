# Feature : Feuilles de messe

## Objectif
Composer le programme d'une célébration (chants par moment liturgique) et l'imprimer avec les paroles incluses.

## Modèle de données
- `mass_sheets` — titre, date, temps liturgique, notes
- `mass_sheet_songs` — association chant ↔ feuille, avec `position` et `moment` (temps liturgique)

## Endpoints
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/messe` | Liste des feuilles de la chorale |
| POST | `/api/messe` | Créer une feuille |
| GET | `/api/messe/{id}` | Détail + chants programmés |
| PATCH | `/api/messe/{id}` | Modifier (remplace les chants si `songs` fourni) |
| DELETE | `/api/messe/{id}` | Supprimer |

Voir aussi la spec interactive : `/api-docs`.

## Règles métier
Aucune restriction de rôle particulière au-delà de l'appartenance à la chorale (RLS).

## Fichiers clés
- `src/services/messe.ts` — CRUD
- `src/actions/messe.ts` — Server Actions (UI `/messe/nouveau`, `/messe/[id]/modifier`)
- `src/app/api/messe/**/route.ts` — routes REST (ce document)
- `src/app/(app)/messe/[id]/page.tsx` — impression via `window.print()`
