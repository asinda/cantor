# API REST par feature + Swagger interne — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à chaque feature de Cantor une route REST testable en HTTP (là où il n'en existe pas), documentée dans une spec OpenAPI 3.0 servie par une page Swagger UI interne (`/api-docs`), plus un fichier de doc par feature dans `doc/features/`.

**Architecture:** Additif — les Server Actions existantes ne changent pas de comportement. Les nouvelles routes REST appellent les mêmes fonctions `services/*.ts` déjà utilisées par les Server Actions (pas de logique dupliquée). Auth réutilisée telle quelle (cookie de session Supabase, `getAuthContextForApi` / vérification de rôle).

**Tech Stack:** Next.js 16 App Router (Route Handlers), TypeScript, Supabase (`@supabase/ssr`), `swagger-ui-react` (nouvelle dépendance) pour l'UI, OpenAPI 3.0.3 en JSON statique.

**Spec:** `doc/API-DESIGN.md`

## Global Constraints

- Aucune Server Action existante n'est modifiée dans son comportement observable côté UI (sauf refactor interne décrit en Tâche 5, sans changement de comportement).
- Toute nouvelle route vérifie l'utilisateur via `getAuthContextForApi()` (fichier `src/lib/auth.ts`) — jamais de contournement RLS.
- Pas de suite de tests automatisée dans ce repo (limitation connue) — vérification par `npx tsc --noEmit`, `npx eslint <fichiers>`, et des appels `curl` manuels contre le serveur de dev, comme documenté dans `doc/API-DESIGN.md` §7.
- Chaque tâche se termine par un commit séparé.
- Le serveur de dev tourne sur un port à confirmer avec l'utilisateur avant de lancer les `curl` de vérification (a varié entre 3000/3001/3005 dans cette session) — remplacer `<PORT>` dans les commandes ci-dessous par le port réellement actif.

---

## Task 1: Infrastructure OpenAPI + Swagger UI

**Files:**
- Create: `src/openapi/spec.json`
- Create: `src/app/api-docs/page.tsx`
- Modify: `package.json` (ajout dépendance)

**Interfaces:**
- Produces: `src/openapi/spec.json` — objet OpenAPI avec clés `openapi`, `info`, `components.securitySchemes.cookieAuth`, `components.schemas.Error`, `paths` (vide, rempli par les tâches suivantes). Toutes les tâches suivantes éditent ce fichier.

- [ ] **Step 1: Installer `swagger-ui-react`**

```bash
npm install swagger-ui-react
npm install -D @types/swagger-ui-react
```

- [ ] **Step 2: Créer le squelette de la spec OpenAPI**

Créer `src/openapi/spec.json` :

```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Cantor — API interne",
    "version": "1.0.0",
    "description": "API REST interne de Cantor. Usage : documentation et maintenance, pas un accès public tiers. Authentification par cookie de session Supabase — connectez-vous via /login dans le même navigateur avant d'utiliser \"Try it out\"."
  },
  "servers": [{ "url": "/", "description": "Origine courante" }],
  "security": [{ "cookieAuth": [] }],
  "components": {
    "securitySchemes": {
      "cookieAuth": {
        "type": "apiKey",
        "in": "cookie",
        "name": "sb-access-token",
        "description": "Cookie httpOnly géré par Supabase Auth. Non manipulable depuis Swagger UI directement : connectez-vous via /login dans un autre onglet du même navigateur, le cookie suit automatiquement (requêtes same-origin)."
      }
    },
    "schemas": {
      "Error": {
        "type": "object",
        "properties": { "error": { "type": "string" } },
        "required": ["error"]
      }
    }
  },
  "paths": {}
}
```

- [ ] **Step 3: Créer la page Swagger UI**

Créer `src/app/api-docs/page.tsx` :

```tsx
"use client";
import dynamic from "next/dynamic";
import spec from "@/openapi/spec.json";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}
```

Note : `dynamic(..., { ssr: false })` est nécessaire car `swagger-ui-react` accède à `window` — le composant ne peut pas être rendu côté serveur. La route `/api-docs` n'est pas dans la liste blanche de `src/proxy.ts` : elle est donc déjà protégée par la garde d'authentification globale (redirection `/login` si non connecté), sans rien à ajouter.

- [ ] **Step 4: Vérifier que ça compile et que la page se charge**

```bash
npx tsc --noEmit
npx eslint src/app/api-docs/page.tsx
```

Puis, serveur de dev démarré et connecté dans le navigateur :
```
http://localhost:<PORT>/api-docs
```
Attendu : la page Swagger UI s'affiche, avec le titre "Cantor — API interne" et zéro endpoint listé (paths vide) — c'est normal, ils arrivent aux tâches suivantes.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/openapi/spec.json src/app/api-docs/page.tsx
git commit -m "feat: infrastructure OpenAPI + page Swagger UI interne (/api-docs)"
```

---

## Task 2: Documenter les endpoints REST déjà existants

**Files:**
- Modify: `src/openapi/spec.json`

**Interfaces:**
- Consumes: squelette de spec produit en Task 1 (clé `paths: {}`, `components.schemas.Error`).
- Produces: `components.schemas` enrichi de `Song`, `Rehearsal`, `MassSheet`, `Choir` ; `paths` enrichi des 7 endpoints déjà en prod.

- [ ] **Step 1: Ajouter les schémas de données partagés**

Dans `src/openapi/spec.json`, sous `components.schemas`, ajouter à côté de `Error` :

```json
"Song": {
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "title": { "type": "string" },
    "composer": { "type": "string", "nullable": true },
    "languages": { "type": "array", "items": { "type": "string" } },
    "liturgical_type": { "type": "string", "nullable": true },
    "liturgical_season": { "type": "string", "nullable": true },
    "difficulty": { "type": "string", "nullable": true },
    "key_signature": { "type": "string", "nullable": true },
    "tempo_bpm": { "type": "integer", "nullable": true },
    "status": { "type": "string", "enum": ["nouveau", "en_cours", "appris"] },
    "validation_status": { "type": "string", "enum": ["brouillon", "en_attente", "validé", "rejeté"] }
  }
},
"Rehearsal": {
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "date": { "type": "string", "format": "date" },
    "time": { "type": "string", "nullable": true },
    "location": { "type": "string", "nullable": true },
    "notes": { "type": "string", "nullable": true }
  }
},
"MassSheet": {
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "title": { "type": "string" },
    "date": { "type": "string", "format": "date", "nullable": true },
    "liturgical_season": { "type": "string", "nullable": true },
    "notes": { "type": "string", "nullable": true }
  }
},
"Choir": {
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "city": { "type": "string", "nullable": true },
    "invite_code": { "type": "string", "nullable": true }
  }
}
```

- [ ] **Step 2: Ajouter les 7 endpoints existants dans `paths`**

Remplacer `"paths": {}` par (contenu complet — un objet par route) :

```json
"paths": {
  "/api/chants": {
    "get": {
      "tags": ["Chants"],
      "summary": "Lister les chants de la chorale",
      "responses": {
        "200": { "description": "OK", "content": { "application/json": {
          "schema": { "type": "object", "properties": { "songs": { "type": "array", "items": { "$ref": "#/components/schemas/Song" } } } }
        } } },
        "401": { "description": "Non connecté", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
      }
    },
    "post": {
      "tags": ["Chants"],
      "summary": "Créer un chant (champs de base uniquement)",
      "requestBody": { "required": true, "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Song" } } } },
      "responses": {
        "201": { "description": "Créé", "content": { "application/json": { "schema": { "type": "object", "properties": { "song": { "$ref": "#/components/schemas/Song" } } } } } },
        "400": { "description": "Aucune chorale", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
        "401": { "description": "Non connecté", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
      }
    }
  },
  "/api/chants/{id}": {
    "get": {
      "tags": ["Chants"],
      "summary": "Détail d'un chant (paroles, liens YouTube, guides voix inclus)",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
      "responses": {
        "200": { "description": "OK" },
        "404": { "description": "Introuvable", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
      }
    },
    "patch": {
      "tags": ["Chants"],
      "summary": "Modifier un chant (champs de base + paroles/YouTube/guides voix en bloc)",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
      "responses": { "200": { "description": "OK" } }
    },
    "delete": {
      "tags": ["Chants"],
      "summary": "Supprimer un chant",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
      "responses": { "200": { "description": "OK" } }
    }
  },
  "/api/repetitions": {
    "get": {
      "tags": ["Répétitions"],
      "summary": "Lister les répétitions de la chorale",
      "responses": { "200": { "description": "OK", "content": { "application/json": { "schema": { "type": "object", "properties": { "rehearsals": { "type": "array", "items": { "$ref": "#/components/schemas/Rehearsal" } } } } } } } }
    },
    "post": {
      "tags": ["Répétitions"],
      "summary": "Créer une répétition",
      "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": {
        "date": { "type": "string", "format": "date" },
        "notes": { "type": "string" },
        "song_ids": { "type": "array", "items": { "type": "string", "format": "uuid" } }
      }, "required": ["date"] } } } },
      "responses": { "201": { "description": "Créé" } }
    }
  },
  "/api/messe": {
    "get": {
      "tags": ["Feuilles de messe"],
      "summary": "Lister les feuilles de messe de la chorale",
      "responses": { "200": { "description": "OK", "content": { "application/json": { "schema": { "type": "object", "properties": { "sheets": { "type": "array", "items": { "$ref": "#/components/schemas/MassSheet" } } } } } } } }
    },
    "post": {
      "tags": ["Feuilles de messe"],
      "summary": "Créer une feuille de messe",
      "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": {
        "title": { "type": "string" },
        "date": { "type": "string", "format": "date" },
        "liturgical_season": { "type": "string" },
        "notes": { "type": "string" },
        "songs": { "type": "array", "items": { "type": "object", "properties": { "song_id": { "type": "string" }, "position": { "type": "integer" } } } }
      }, "required": ["title"] } } } },
      "responses": { "201": { "description": "Créé" } }
    }
  },
  "/api/choir": {
    "get": {
      "tags": ["Chorale"],
      "summary": "Infos de la chorale de l'utilisateur connecté, son rôle, et la liste des membres",
      "responses": { "200": { "description": "OK", "content": { "application/json": { "schema": { "type": "object", "properties": {
        "choir": { "$ref": "#/components/schemas/Choir" }, "role": { "type": "string" }, "members": { "type": "array" }
      } } } } } }
    },
    "patch": {
      "tags": ["Chorale"],
      "summary": "Modifier les infos de la chorale, ou régénérer le code d'invitation (chef uniquement)",
      "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": {
        "action": { "type": "string", "enum": ["regenerate_invite"], "description": "Omettre pour une mise à jour classique des champs" },
        "name": { "type": "string" }, "city": { "type": "string" }, "description": { "type": "string" }
      } } } } },
      "responses": {
        "200": { "description": "OK" },
        "403": { "description": "Réservé au chef de chœur", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
      }
    }
  },
  "/api/youtube": {
    "get": {
      "tags": ["YouTube"],
      "summary": "Résoudre une URL YouTube en métadonnées (titre, chaîne, miniature) via oEmbed",
      "parameters": [{ "name": "url", "in": "query", "required": true, "schema": { "type": "string" } }],
      "responses": {
        "200": { "description": "OK" },
        "400": { "description": "Paramètre manquant", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
        "404": { "description": "URL invalide ou inaccessible", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
      }
    }
  },
  "/api/transcribe": {
    "post": {
      "tags": ["Transcription"],
      "summary": "Extraire et structurer des paroles depuis un fichier (.docx, .pdf, image) via OCR/Claude",
      "requestBody": { "required": true, "content": { "multipart/form-data": { "schema": { "type": "object", "properties": { "file": { "type": "string", "format": "binary" } } } } } },
      "responses": {
        "200": { "description": "OK — { lyrics, liturgical_type?, language?, source }" },
        "401": { "description": "Non connecté", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
        "415": { "description": "Format non supporté", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
      }
    }
  }
}
```

- [ ] **Step 3: Vérifier**

```bash
npx tsc --noEmit
node -e "JSON.parse(require('fs').readFileSync('src/openapi/spec.json','utf8')); console.log('JSON valide')"
```

Recharger `http://localhost:<PORT>/api-docs` : les 7 groupes (Chants, Répétitions, Feuilles de messe, Chorale, YouTube, Transcription) doivent apparaître avec leurs endpoints.

- [ ] **Step 4: Commit**

```bash
git add src/openapi/spec.json
git commit -m "docs: documente les 7 endpoints REST existants dans la spec OpenAPI"
```

---

## Task 3: Routes REST — Validation du répertoire

**Files:**
- Create: `src/app/api/chants/[id]/submit/route.ts`
- Create: `src/app/api/chants/[id]/validate/route.ts`
- Create: `src/app/api/chants/[id]/reject/route.ts`
- Create: `src/app/api/chants/[id]/reset-to-draft/route.ts`
- Create: `doc/features/validation.md`
- Modify: `src/openapi/spec.json`

**Interfaces:**
- Consumes: `src/services/validation.ts` — `submitForValidation(songId: string)`, `validateSong(songId: string, validatedBy: string)`, `rejectSong(songId: string, validatedBy: string, note: string)`, `resetToDraft(songId: string)` (déjà existantes, inchangées). `getChoirByUser(userId: string)` depuis `src/services/choirs.ts` pour vérifier `role === "chef"`.
- Produces: 4 nouvelles routes REST, chacune miroir exact des Server Actions `validateSongAction`/`rejectSongAction`/`submitSongForValidationAction`/`resetSongToDraftAction` de `src/actions/validation.ts` (mêmes règles d'autorisation).

- [ ] **Step 1: Créer la route de soumission**

Créer `src/app/api/chants/[id]/submit/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { submitForValidation } from "@/services/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await submitForValidation(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data });
}
```

- [ ] **Step 2: Créer la route de validation (chef uniquement)**

Créer `src/app/api/chants/[id]/validate/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { getChoirByUser } from "@/services/choirs";
import { validateSong } from "@/services/validation";

type Params = { params: Promise<{ id: string }> };

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

- [ ] **Step 3: Créer la route de rejet (chef uniquement)**

Créer `src/app/api/chants/[id]/reject/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { getChoirByUser } from "@/services/choirs";
import { rejectSong } from "@/services/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(auth.userId);
  if (!membership || membership.role !== "chef") {
    return NextResponse.json({ error: "Réservé au chef de chœur" }, { status: 403 });
  }

  const { note } = await req.json();
  if (typeof note !== "string" || !note.trim()) {
    return NextResponse.json({ error: "Le motif de rejet (note) est requis" }, { status: 400 });
  }

  const { id } = await params;
  const { data, error } = await rejectSong(id, auth.userId, note);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data });
}
```

- [ ] **Step 4: Créer la route de retour en brouillon**

Créer `src/app/api/chants/[id]/reset-to-draft/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { resetToDraft } from "@/services/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await resetToDraft(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data });
}
```

- [ ] **Step 5: Vérifier la compilation et le lint**

```bash
npx tsc --noEmit
npx eslint src/app/api/chants/[id]/submit/route.ts src/app/api/chants/[id]/validate/route.ts src/app/api/chants/[id]/reject/route.ts src/app/api/chants/[id]/reset-to-draft/route.ts
```

- [ ] **Step 6: Vérification manuelle (curl)**

Serveur de dev démarré. Remplacer `<SONG_ID>` par l'id d'un chant existant de votre chorale (visible dans l'URL de sa fiche `/chants/<id>`), et se connecter au préalable dans le navigateur pour que les cookies de session soient valides — pour tester en ligne de commande, il faut copier le cookie de session depuis les devtools du navigateur (`Cookie: sb-...`) et l'ajouter à `curl` avec `-H`. Le plus simple reste de tester depuis `/api-docs` (Swagger UI, même navigateur donc même session) :

1. Sur `/api-docs`, dérouler `POST /api/chants/{id}/submit`, "Try it out", renseigner un id de chant en `brouillon`, Execute → attendu `200` avec `song.validation_status: "en_attente"`.
2. `POST /api/chants/{id}/validate` avec un compte **chef** → attendu `200`, `validation_status: "validé"`. Avec un compte **choriste** → attendu `403`.
3. `POST /api/chants/{id}/reject` avec `{ "note": "Test" }` → attendu `200`, `validation_status: "rejeté"`.
4. `POST /api/chants/{id}/reset-to-draft` → attendu `200`, `validation_status: "brouillon"`.

- [ ] **Step 7: Ajouter ces 4 routes à la spec OpenAPI**

Dans `src/openapi/spec.json`, ajouter sous `paths` (à côté de `/api/chants/{id}`) :

```json
"/api/chants/{id}/submit": {
  "post": {
    "tags": ["Validation"],
    "summary": "Soumettre un chant à validation (brouillon → en_attente)",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "responses": { "200": { "description": "OK" }, "401": { "description": "Non connecté" } }
  }
},
"/api/chants/{id}/validate": {
  "post": {
    "tags": ["Validation"],
    "summary": "Valider un chant — chef de chœur uniquement (en_attente → validé)",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "responses": { "200": { "description": "OK" }, "403": { "description": "Réservé au chef de chœur" } }
  }
},
"/api/chants/{id}/reject": {
  "post": {
    "tags": ["Validation"],
    "summary": "Rejeter un chant avec un motif — chef de chœur uniquement",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": { "note": { "type": "string" } }, "required": ["note"] } } } },
    "responses": { "200": { "description": "OK" }, "400": { "description": "Motif manquant" }, "403": { "description": "Réservé au chef de chœur" } }
  }
},
"/api/chants/{id}/reset-to-draft": {
  "post": {
    "tags": ["Validation"],
    "summary": "Repasser un chant rejeté en brouillon pour le corriger",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "responses": { "200": { "description": "OK" } }
  }
}
```

- [ ] **Step 8: Écrire la doc de la feature**

Créer `doc/features/validation.md` :

```markdown
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
```

- [ ] **Step 9: Vérifier le JSON et commiter**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/openapi/spec.json','utf8')); console.log('JSON valide')"
npx tsc --noEmit
git add src/app/api/chants src/openapi/spec.json doc/features/validation.md
git commit -m "feat: routes REST validation du répertoire + doc feature + spec OpenAPI"
```

---

## Task 4: Routes REST — Notifications

**Files:**
- Create: `src/app/api/notifications/route.ts`
- Create: `src/app/api/notifications/[id]/route.ts`
- Create: `src/app/api/notifications/mark-all-read/route.ts`
- Create: `doc/features/notifications.md`
- Modify: `src/openapi/spec.json`

**Interfaces:**
- Consumes: `src/services/notifications.ts` — `listNotifications(userId, limit=10)`, `countUnreadNotifications(userId)`, `markNotificationRead(id)`, `markAllNotificationsRead(userId)` (existantes, inchangées).
- Produces: 3 routes REST reflétant `getMyNotificationsAction`/`markNotificationReadAction`/`markAllNotificationsReadAction` de `src/actions/notifications.ts`.

- [ ] **Step 1: Route de listing**

Créer `src/app/api/notifications/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { listNotifications, countUnreadNotifications } from "@/services/notifications";

export async function GET() {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [{ data: notifications, error: listError }, { count, error: countError }] = await Promise.all([
    listNotifications(auth.userId),
    countUnreadNotifications(auth.userId),
  ]);
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  return NextResponse.json({ notifications: notifications ?? [], unreadCount: count ?? 0 });
}
```

- [ ] **Step 2: Route de marquage individuel**

Créer `src/app/api/notifications/[id]/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { markNotificationRead } from "@/services/notifications";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.read !== true) {
    return NextResponse.json({ error: "Seul { read: true } est supporté" }, { status: 400 });
  }

  const { id } = await params;
  const { error } = await markNotificationRead(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Route "tout marquer comme lu"**

Créer `src/app/api/notifications/mark-all-read/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { markAllNotificationsRead } from "@/services/notifications";

export async function POST() {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { error } = await markAllNotificationsRead(auth.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Vérifier compilation et lint**

```bash
npx tsc --noEmit
npx eslint src/app/api/notifications/route.ts src/app/api/notifications/[id]/route.ts src/app/api/notifications/mark-all-read/route.ts
```

- [ ] **Step 5: Vérification manuelle via Swagger UI**

Sur `/api-docs`, connecté :
1. `GET /api/notifications` → attendu `200`, `{ notifications: [...], unreadCount: <n> }`.
2. `PATCH /api/notifications/{id}` avec `{ "read": true }` sur l'id d'une notification non lue → `200`, puis `GET` de nouveau pour vérifier `unreadCount` a diminué de 1.
3. `POST /api/notifications/mark-all-read` → `200`, puis `GET` pour vérifier `unreadCount: 0`.

- [ ] **Step 6: Ajouter à la spec OpenAPI**

Ajouter le schéma `Notification` sous `components.schemas` :

```json
"Notification": {
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "song_id": { "type": "string", "format": "uuid", "nullable": true },
    "type": { "type": "string", "enum": ["song_submitted", "song_validated", "song_rejected"] },
    "message": { "type": "string" },
    "read": { "type": "boolean" },
    "created_at": { "type": "string", "format": "date-time" }
  }
}
```

Ajouter sous `paths` :

```json
"/api/notifications": {
  "get": {
    "tags": ["Notifications"],
    "summary": "Lister mes notifications récentes + nombre non lues",
    "responses": { "200": { "description": "OK", "content": { "application/json": { "schema": { "type": "object", "properties": {
      "notifications": { "type": "array", "items": { "$ref": "#/components/schemas/Notification" } },
      "unreadCount": { "type": "integer" }
    } } } } } }
  }
},
"/api/notifications/{id}": {
  "patch": {
    "tags": ["Notifications"],
    "summary": "Marquer une notification comme lue",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "requestBody": { "required": true, "content": { "application/json": { "schema": { "type": "object", "properties": { "read": { "type": "boolean", "enum": [true] } }, "required": ["read"] } } } },
    "responses": { "200": { "description": "OK" }, "400": { "description": "Seul { read: true } est supporté" } }
  }
},
"/api/notifications/mark-all-read": {
  "post": {
    "tags": ["Notifications"],
    "summary": "Marquer toutes mes notifications comme lues",
    "responses": { "200": { "description": "OK" } }
  }
}
```

- [ ] **Step 7: Écrire la doc de la feature**

Créer `doc/features/notifications.md` :

```markdown
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
```

- [ ] **Step 8: Vérifier le JSON et commiter**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/openapi/spec.json','utf8')); console.log('JSON valide')"
npx tsc --noEmit
git add src/app/api/notifications src/openapi/spec.json doc/features/notifications.md
git commit -m "feat: routes REST notifications + doc feature + spec OpenAPI"
```

---

## Task 5: Enrichir la création de chant + doc feature Chants

**Files:**
- Modify: `src/services/songs.ts`
- Modify: `src/actions/songs.ts`
- Modify: `src/app/api/chants/route.ts`
- Create: `doc/features/chants.md`
- Modify: `src/openapi/spec.json`

**Interfaces:**
- Produces: `syncSongRelated(songId, lyrics, youtubeLinks, voiceGuides)` et `createFullSong(choirId, userId, payload)` exportées depuis `src/services/songs.ts`, réutilisées par `src/actions/songs.ts` (remplace le helper privé `syncRelated`) et par `POST /api/chants`. `listSongsFiltered` étendue avec un filtre `validation_status`.

- [ ] **Step 0: Corriger `listSongsFiltered` pour accepter le filtre `validation_status`**

Dans `src/services/songs.ts`, remplacer la signature et le corps de `listSongsFiltered` :

```ts
export async function listSongsFiltered(
  choirId: string,
  filters: { q?: string; type?: string; diff?: string; status?: string; validation_status?: string }
) {
  const supabase = await createClient();
  let query = supabase
    .from("songs")
    .select("id,title,liturgical_type,status,difficulty,key_signature,composer,languages,tempo_bpm,validation_status")
    .eq("choir_id", choirId)
    .order("title");

  if (filters.q)                query = query.ilike("title", `%${filters.q}%`);
  if (filters.type)              query = query.eq("liturgical_type", filters.type);
  if (filters.diff)               query = query.eq("difficulty", filters.diff);
  if (filters.status)             query = query.eq("status", filters.status);
  if (filters.validation_status)  query = query.eq("validation_status", filters.validation_status);

  return query;
}
```

(Le seul changement : le type de `filters` gagne `validation_status?: string`, la clause `.eq` correspondante, et `validation_status` est ajouté au `select` pour que le champ soit visible dans la réponse.)

- [ ] **Step 1: Déplacer la logique de synchronisation dans `services/songs.ts`**

Dans `src/services/songs.ts`, ajouter à la fin du fichier :

```ts
export type LyricsInput = { language: string; lyrics: string; phonetic?: string | null };
export type YoutubeLinkInput = {
  url: string; video_id: string; title: string; channel: string;
  thumbnail?: string; version_type: string; is_primary: boolean;
};
export type VoiceGuideInput = {
  voice_part: string; starting_note?: string | null;
  entry_seconds?: number | null; instructions?: string | null;
};

export async function syncSongRelated(
  songId: string,
  lyrics: LyricsInput[],
  youtubeLinks: YoutubeLinkInput[],
  voiceGuides: VoiceGuideInput[]
) {
  const supabase = await createClient();

  await supabase.from("song_lyrics").delete().eq("song_id", songId);
  if (lyrics.length > 0) {
    await supabase.from("song_lyrics").insert(lyrics.map((l) => ({ ...l, song_id: songId })));
  }

  await supabase.from("youtube_links").delete().eq("song_id", songId);
  if (youtubeLinks.length > 0) {
    await supabase.from("youtube_links").insert(youtubeLinks.map((l) => ({ ...l, song_id: songId })));
  }

  await supabase.from("voice_guides").delete().eq("song_id", songId);
  if (voiceGuides.length > 0) {
    await supabase.from("voice_guides").insert(voiceGuides.map((g) => ({ ...g, song_id: songId })));
  }
}

export type FullSongPayload = {
  title: string;
  composer?: string | null;
  liturgical_type?: string | null;
  liturgical_season?: string | null;
  key_signature?: string | null;
  tempo_bpm?: number | null;
  difficulty?: string | null;
  status: string;
  notes?: string | null;
  languages: string[];
  lyrics: LyricsInput[];
  youtube_links: YoutubeLinkInput[];
  voice_guides: VoiceGuideInput[];
};

export async function createFullSong(choirId: string, userId: string, payload: FullSongPayload) {
  const { lyrics, youtube_links, voice_guides, ...songData } = payload;

  const result = await createSong(choirId, userId, songData);
  if (result.error || !result.data) return result;

  await syncSongRelated(result.data.id, lyrics, youtube_links, voice_guides);
  return result;
}
```

- [ ] **Step 2: Faire pointer `actions/songs.ts` sur la fonction partagée**

Dans `src/actions/songs.ts`, remplacer les imports et la fonction `syncRelated` :

Remplacer :
```ts
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deleteSong } from "@/services/songs";
import { redirect } from "next/navigation";
```
Par :
```ts
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deleteSong, syncSongRelated } from "@/services/songs";
import { redirect } from "next/navigation";
```

Remplacer les deux appels `await syncRelated(supabase, song.id, lyrics, youtube_links, voice_guides);` et `await syncRelated(supabase, id, lyrics, youtube_links, voice_guides);` par `await syncSongRelated(song.id, lyrics, youtube_links, voice_guides);` et `await syncSongRelated(id, lyrics, youtube_links, voice_guides);` respectivement (suppression du premier argument `supabase`, plus nécessaire).

Supprimer entièrement la fonction `syncRelated` (lignes 89–116 du fichier original) — elle est remplacée par `syncSongRelated` dans `services/songs.ts`.

- [ ] **Step 3: Étendre `POST /api/chants`**

Remplacer le contenu de `src/app/api/chants/route.ts` par :

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listSongs, listSongsFiltered, createFullSong } from "@/services/songs";
import { getChoirByUser } from "@/services/choirs";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  const choirId = membership?.choir_id;
  if (!choirId) return NextResponse.json({ songs: [] });

  const sp = req.nextUrl.searchParams;
  const hasFilters = sp.has("q") || sp.has("type") || sp.has("diff") || sp.has("status") || sp.has("validation_status");

  const { data, error } = hasFilters
    ? await listSongsFiltered(choirId, {
        q: sp.get("q") ?? undefined,
        type: sp.get("type") ?? undefined,
        diff: sp.get("diff") ?? undefined,
        status: sp.get("status") ?? undefined,
        validation_status: sp.get("validation_status") ?? undefined,
      })
    : await listSongs(choirId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ songs: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  const choirId = membership?.choir_id;
  if (!choirId) return NextResponse.json({ error: "Aucune chorale" }, { status: 400 });

  const body = await req.json();
  const { data, error } = await createFullSong(choirId, user.id, {
    lyrics: [], youtube_links: [], voice_guides: [],
    ...body,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data }, { status: 201 });
}
```

Note : `lyrics`/`youtube_links`/`voice_guides` par défaut à `[]` pour rester compatible avec un appel qui n'envoie que les champs de base (comportement identique à avant pour ce cas).

- [ ] **Step 4: Vérifier compilation et lint**

```bash
npx tsc --noEmit
npx eslint src/services/songs.ts src/actions/songs.ts src/app/api/chants/route.ts
```

- [ ] **Step 5: Vérification manuelle**

1. Depuis l'UI existante (`/chants/nouveau`), créer un chant avec des paroles → vérifier que ça fonctionne toujours à l'identique (non-régression du chemin Server Action).
2. Sur `/api-docs`, `POST /api/chants` avec un body incluant `lyrics: [{ "language": "fr", "lyrics": "Test" }]` → `201`, puis `GET /api/chants/{id}` (route existante) pour vérifier que `lyrics` contient bien l'entrée.
3. `GET /api/chants?status=appris` → `200`, uniquement des chants avec `status: "appris"`. `GET /api/chants` (sans paramètre) → toujours la liste complète, comme avant.

- [ ] **Step 6: Mettre à jour la spec OpenAPI**

Dans `src/openapi/spec.json`, ajouter `parameters` au `get` de `/api/chants` (avant `responses`) :

```json
"parameters": [
  { "name": "q", "in": "query", "schema": { "type": "string" }, "description": "Recherche par titre" },
  { "name": "type", "in": "query", "schema": { "type": "string" }, "description": "Filtre par type liturgique" },
  { "name": "diff", "in": "query", "schema": { "type": "string" }, "description": "Filtre par difficulté" },
  { "name": "status", "in": "query", "schema": { "type": "string" }, "description": "Filtre par statut d'apprentissage" },
  { "name": "validation_status", "in": "query", "schema": { "type": "string" }, "description": "Filtre par statut de validation" }
]
```

Puis remplacer le `requestBody` du `post` de `/api/chants` (actuellement `{ "$ref": "#/components/schemas/Song" }`) par :

```json
"requestBody": {
  "required": true,
  "content": {
    "application/json": {
      "schema": {
        "allOf": [
          { "$ref": "#/components/schemas/Song" },
          { "type": "object", "properties": {
            "lyrics": { "type": "array", "items": { "type": "object", "properties": { "language": { "type": "string" }, "lyrics": { "type": "string" }, "phonetic": { "type": "string", "nullable": true } } } },
            "youtube_links": { "type": "array", "items": { "type": "object" } },
            "voice_guides": { "type": "array", "items": { "type": "object" } }
          } }
        ]
      }
    }
  }
}
```

- [ ] **Step 7: Écrire la doc de la feature**

Créer `doc/features/chants.md` :

```markdown
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
```

- [ ] **Step 8: Vérifier le JSON et commiter**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/openapi/spec.json','utf8')); console.log('JSON valide')"
npx tsc --noEmit
git add src/services/songs.ts src/actions/songs.ts src/app/api/chants/route.ts src/openapi/spec.json doc/features/chants.md
git commit -m "feat: POST /api/chants accepte paroles/YouTube/guides voix + doc feature chants"
```

---

## Task 6: Route REST — Feuille de messe (détail/édition/suppression)

**Files:**
- Create: `src/app/api/messe/[id]/route.ts`
- Create: `doc/features/messe.md`
- Modify: `src/openapi/spec.json`

**Interfaces:**
- Consumes: `getMassSheet(id)`, `getMassSheetSongs(massSheetId)`, `updateMassSheet(id, data)`, `deleteMassSheet(id)` depuis `src/services/messe.ts` (déjà existantes).

- [ ] **Step 1: Créer la route**

Créer `src/app/api/messe/[id]/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { getMassSheet, getMassSheetSongs, updateMassSheet, deleteMassSheet } from "@/services/messe";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [{ data: sheet }, { data: songs }] = await Promise.all([
    getMassSheet(id),
    getMassSheetSongs(id),
  ]);
  if (!sheet) return NextResponse.json({ error: "Feuille introuvable" }, { status: 404 });

  return NextResponse.json({ sheet, songs: songs ?? [] });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { songs, ...sheetData } = await req.json();

  const { data, error } = await updateMassSheet(id, sheetData);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(songs)) {
    const supabase = await createClient();
    await supabase.from("mass_sheet_songs").delete().eq("mass_sheet_id", id);
    if (songs.length > 0) {
      await supabase.from("mass_sheet_songs").insert(
        songs.map((s: { song_id: string; position: number }) => ({ mass_sheet_id: id, song_id: s.song_id, position: s.position }))
      );
    }
  }

  return NextResponse.json({ sheet: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { error } = await deleteMassSheet(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Vérifier compilation et lint**

```bash
npx tsc --noEmit
npx eslint src/app/api/messe/[id]/route.ts
```

- [ ] **Step 3: Vérification manuelle**

Sur `/api-docs` : `GET /api/messe/{id}` avec l'id d'une feuille existante → `200`, `{ sheet, songs }`. `PATCH` avec `{ "notes": "test swagger" }` → `200`. `GET` de nouveau pour confirmer la note. `DELETE` sur une feuille de test → `200`, puis `GET /api/messe` (liste) pour confirmer sa disparition.

- [ ] **Step 4: Ajouter à la spec OpenAPI**

Ajouter sous `paths`, à côté de `/api/messe` :

```json
"/api/messe/{id}": {
  "get": {
    "tags": ["Feuilles de messe"],
    "summary": "Détail d'une feuille de messe (chants programmés inclus)",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "responses": { "200": { "description": "OK" }, "404": { "description": "Introuvable" } }
  },
  "patch": {
    "tags": ["Feuilles de messe"],
    "summary": "Modifier une feuille de messe (remplace la liste des chants si fournie)",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "responses": { "200": { "description": "OK" } }
  },
  "delete": {
    "tags": ["Feuilles de messe"],
    "summary": "Supprimer une feuille de messe",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "responses": { "200": { "description": "OK" } }
  }
}
```

- [ ] **Step 5: Écrire la doc de la feature**

Créer `doc/features/messe.md` :

```markdown
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
```

- [ ] **Step 6: Vérifier le JSON et commiter**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/openapi/spec.json','utf8')); console.log('JSON valide')"
npx tsc --noEmit
git add src/app/api/messe src/openapi/spec.json doc/features/messe.md
git commit -m "feat: route REST détail/édition/suppression feuille de messe + doc feature"
```

---

## Task 7: Route REST — Répétition (détail/édition/suppression)

**Files:**
- Create: `src/app/api/repetitions/[id]/route.ts`
- Create: `doc/features/repetitions.md`
- Modify: `src/openapi/spec.json`

**Interfaces:**
- Consumes: `getRehearsal(id)`, `getRehearsalSongs(rehearsalId)`, `updateRehearsal(id, data)`, `deleteRehearsal(id)` depuis `src/services/repetitions.ts` (déjà existantes).

- [ ] **Step 1: Créer la route**

Créer `src/app/api/repetitions/[id]/route.ts` :

```ts
import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { getRehearsal, getRehearsalSongs, updateRehearsal, deleteRehearsal } from "@/services/repetitions";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [{ data: rehearsal }, { data: songs }] = await Promise.all([
    getRehearsal(id),
    getRehearsalSongs(id),
  ]);
  if (!rehearsal) return NextResponse.json({ error: "Répétition introuvable" }, { status: 404 });

  return NextResponse.json({ rehearsal, songs: songs ?? [] });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { song_ids, ...rehearsalData } = await req.json();

  const { data, error } = await updateRehearsal(id, rehearsalData);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(song_ids)) {
    const supabase = await createClient();
    await supabase.from("rehearsal_songs").delete().eq("rehearsal_id", id);
    if (song_ids.length > 0) {
      await supabase.from("rehearsal_songs").insert(
        song_ids.map((song_id: string, i: number) => ({ rehearsal_id: id, song_id, order_index: i + 1 }))
      );
    }
  }

  return NextResponse.json({ rehearsal: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { error } = await deleteRehearsal(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Vérifier compilation et lint**

```bash
npx tsc --noEmit
npx eslint src/app/api/repetitions/[id]/route.ts
```

- [ ] **Step 3: Vérification manuelle**

Sur `/api-docs` : `GET /api/repetitions/{id}` → `200`, `{ rehearsal, songs }`. `PATCH` avec `{ "notes": "test swagger" }` → `200`. `DELETE` sur une répétition de test → `200`, puis `GET /api/repetitions` pour confirmer sa disparition.

- [ ] **Step 4: Ajouter à la spec OpenAPI**

Ajouter sous `paths`, à côté de `/api/repetitions` :

```json
"/api/repetitions/{id}": {
  "get": {
    "tags": ["Répétitions"],
    "summary": "Détail d'une répétition (chants programmés inclus)",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "responses": { "200": { "description": "OK" }, "404": { "description": "Introuvable" } }
  },
  "patch": {
    "tags": ["Répétitions"],
    "summary": "Modifier une répétition (remplace les chants si song_ids fourni)",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "responses": { "200": { "description": "OK" } }
  },
  "delete": {
    "tags": ["Répétitions"],
    "summary": "Supprimer une répétition",
    "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }],
    "responses": { "200": { "description": "OK" } }
  }
}
```

- [ ] **Step 5: Écrire la doc de la feature**

Créer `doc/features/repetitions.md` :

```markdown
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
```

- [ ] **Step 6: Vérifier le JSON et commiter**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/openapi/spec.json','utf8')); console.log('JSON valide')"
npx tsc --noEmit
git add src/app/api/repetitions src/openapi/spec.json doc/features/repetitions.md
git commit -m "feat: route REST détail/édition/suppression répétition + doc feature"
```

---

## Task 8: Doc feature Chorale + vérification finale

**Files:**
- Create: `doc/features/chorale.md`

**Interfaces:** aucune (documentation pure — `/api/choir` déjà complet et déjà documenté en Task 2).

- [ ] **Step 1: Écrire la doc de la feature**

Créer `doc/features/chorale.md` :

```markdown
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
```

- [ ] **Step 2: Vérification finale complète**

```bash
npx tsc --noEmit
npx eslint src
node -e "JSON.parse(require('fs').readFileSync('src/openapi/spec.json','utf8')); console.log('JSON valide')"
npm run build
```

Attendu : build de production réussi (comme lors des sprints précédents), aucune erreur TypeScript, spec JSON valide.

Sur `/api-docs`, dans le navigateur, vérifier visuellement que les 6 groupes (Chants, Validation, Notifications, Répétitions, Feuilles de messe, Chorale) + YouTube + Transcription sont bien listés avec tous leurs endpoints.

- [ ] **Step 3: Mettre à jour `doc/ARCHITECTURE.md`**

Ajouter une ligne dans la section "Structure du projet" ou "Surface API interne" mentionnant `/api-docs` et `doc/features/`, et retirer toute mention de "validation/notifications non exposées en REST" si une telle mention existe.

- [ ] **Step 4: Commit final**

```bash
git add doc/features/chorale.md doc/ARCHITECTURE.md
git commit -m "docs: doc feature chorale + mise à jour du dossier d'architecture (API-docs, features)"
```
