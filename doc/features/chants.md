# Feature : Bibliothèque de chants

## Objectif
Répertoire central des chants de la chorale : paroles multilingues, guides vocaux par pupitre, liens YouTube, métadonnées musicales (tonalité, tempo, type/temps liturgique).

## Modèle de données
- `songs` — chant (titre, langues, type/temps liturgique, difficulté, tonalité, tempo, structure JSONB, statut d'apprentissage, statut de validation)
- `song_lyrics` — paroles par langue (`fr`/`ki`/`sw`/`en`) + phonétique
- `youtube_links` — versions vidéo (choral/karaoké/pupitre/instrumental)
- `voice_guides` — note de départ / instructions par pupitre

## Endpoints
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/chants` | Liste des chants de la chorale. Filtres optionnels : `?q=&type=&diff=&status=&validation_status=` |
| POST | `/api/chants` | Créer un chant, avec paroles/YouTube/guides voix en option |
| GET | `/api/chants/{id}` | Détail complet (chant + sous-ressources) |
| PATCH | `/api/chants/{id}` | Modifier (remplace les sous-ressources fournies) |
| DELETE | `/api/chants/{id}` | Supprimer |

Workflow de validation et notifications : voir `doc/features/validation.md` et `doc/features/notifications.md`.

Voir aussi la spec interactive : `/api-docs`.

## Règles métier
- Un chant appartient à une seule chorale (`choir_id`), isolé par RLS.
- Suppression : l'auteur (`created_by`), ou un membre `chef`/`chantre`.
- Import de paroles depuis fichier (.docx/.pdf/image) : voir `/api/transcribe`.

## Fichiers clés
- `src/services/songs.ts` — CRUD + `createFullSong`/`syncSongRelated` (logique partagée)
- `src/actions/songs.ts` — Server Actions (UI `/chants/nouveau`, `/chants/[id]/modifier`)
- `src/app/api/chants/**/route.ts` — routes REST (ce document)
- `src/app/(app)/chants/[id]/InlineLyricsEditor.tsx` — éditeur de paroles + import fichier
