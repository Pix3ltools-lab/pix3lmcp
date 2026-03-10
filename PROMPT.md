# Prompt: Build pix3lmcp — MCP Server for Pix3lboard

## Obiettivo

Crea un **MCP server** (Model Context Protocol) chiamato `pix3lmcp` che espone come tools le operazioni CRUD di **Pix3lboard** tramite la sua REST API v1. Il server deve poter essere registrato in Claude Code e Claude.ai come MCP server remoto via HTTPS.

Il progetto si trova in `../pix3lmcp` (allo stesso livello di `pix3lboard` e `pix3ltools-deploy`).

---

## Scelta del Deploy: Docker o Vercel

Il server supporta **due modalità di deploy**. La scelta dipende da dove gira pix3lboard:

| | Docker (pix3ltools-deploy) | Vercel |
|---|---|---|
| **Quando usarlo** | pix3lboard self-hosted su VPS | pix3lboard su Vercel |
| **Auth supportata** | API Key + Email/Password | **Solo API Key** |
| **Framework** | Node.js + Express | Next.js (App Router) |
| **Infrastruttura** | Traefik + Let's Encrypt | Gestita da Vercel |

> **Importante**: la modalità Vercel richiede obbligatoriamente le **API keys** di pix3lboard. Vercel è serverless — non esiste un processo persistente in cui cachare il JWT, quindi login + token refresh non funzionano in modo affidabile. Con email+password ogni cold start farebbe un login, rischiando di innescare il rate limiting (5 tentativi, lockout 15 min).

Implementa entrambe le varianti nello stesso progetto. La struttura è condivisa per la maggior parte; le differenze sono nel layer di deploy.

---

## Stack Tecnologico Comune

- **Linguaggio**: TypeScript (strict mode)
- **MCP SDK**: `@modelcontextprotocol/sdk` (ultima versione disponibile)
- **Transport MCP**: Streamable HTTP
- **Validazione**: `zod`
- **Package manager**: npm

### Variante Docker
- **Runtime**: Node.js 22 (LTS)
- **HTTP framework**: `express`
- **Build**: `tsc` (output in `dist/`)

### Variante Vercel
- **Framework**: Next.js 15 (App Router) — stesso stack di pix3lboard
- **HTTP framework**: Next.js API Route (`app/api/mcp/route.ts`)
- **Build**: gestita da Vercel

---

## Struttura del Progetto

```
pix3lmcp/
├── src/
│   ├── auth.ts           # Gestione autenticazione (API Key e Email+Password)
│   ├── api.ts            # Client HTTP per la REST API v1 di pix3lboard
│   └── tools/
│       ├── boards.ts     # Tools per boards
│       ├── lists.ts      # Tools per lists
│       └── cards.ts      # Tools per cards
│
├── # --- Variante Docker ---
├── server.ts             # Entry point Express + MCP (solo Docker)
├── Dockerfile
│
├── # --- Variante Vercel ---
├── app/
│   └── api/
│       └── mcp/
│           └── route.ts  # POST handler MCP (solo Vercel)
├── vercel.json
│
├── package.json          # Dipendenze comuni + script per entrambe le varianti
├── tsconfig.json
└── .env.example
```

---

## Autenticazione con Pix3lboard — Due Modalità

Il modulo `auth.ts` supporta due modalità di autenticazione, selezionate automaticamente in base alle variabili d'ambiente presenti. La modalità **API Key è preferita** perché più sicura.

---

### Modalità 1 (preferita): API Key

> Disponibile quando pix3lboard implementerà il supporto per API keys. In questa modalità non è necessario memorizzare la password nel container.

**Come funziona:**
L'utente genera una API key dalla UI di pix3lboard (es. nelle impostazioni del profilo). La key è un token opaco a lunga durata, revocabile senza cambiare la password.

**Variabili d'ambiente (modalità API Key):**
```env
PIX3LBOARD_URL=http://pix3lboard:3000
PIX3LBOARD_API_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORKSPACE_IDS=ws_abc123,ws_def456
PORT=3010
```

**Come viene usata:**
La API key viene inviata direttamente come Bearer token in ogni richiesta:
```
Authorization: Bearer pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Nessun login, nessun refresh, nessuna scadenza da gestire.

---

### Modalità 2 (fallback): Email + Password

> Da usare solo se pix3lboard non supporta ancora le API keys.
> **Solo per deploy Docker** — non usare su Vercel (serverless, nessun processo persistente per cachare il JWT).
> **Limitazione di sicurezza**: la password viene salvata in plain text nelle variabili d'ambiente del container (visibile tramite `docker inspect`). Accettabile solo in ambienti controllati.

**Variabili d'ambiente (modalità Email + Password):**
```env
PIX3LBOARD_URL=http://pix3lboard:3000
PIX3LBOARD_EMAIL=user@example.com
PIX3LBOARD_PASSWORD=password
WORKSPACE_IDS=ws_abc123,ws_def456
PORT=3010
```

**Endpoint di autenticazione:**
```
POST /api/auth/token
Content-Type: application/json

{ "email": "...", "password": "..." }

→ { "token": "...", "expires_in": "2h", "user": { "id", "email", "name" } }
```

Il modulo `auth.ts` in questa modalità deve:
1. Al primo avvio fare login e salvare il token JWT in memoria
2. Prima di ogni chiamata API, controllare se il token è prossimo alla scadenza (< 10 min) e rinnovarlo con un nuovo login
3. In caso di risposta 401, fare re-login e riprovare la chiamata una volta sola

---

### Logica di selezione in `auth.ts`

```typescript
// Priorità: API Key > Email+Password
if (process.env.PIX3LBOARD_API_KEY) {
  // Modalità API Key: usa la key direttamente come Bearer token, nessun refresh necessario
} else if (process.env.PIX3LBOARD_EMAIL && process.env.PIX3LBOARD_PASSWORD) {
  // Modalità Email+Password: login iniziale + refresh automatico
} else {
  throw new Error('Missing auth config: set PIX3LBOARD_API_KEY or PIX3LBOARD_EMAIL+PIX3LBOARD_PASSWORD');
}
```

---

## Variabili d'Ambiente (riepilogo)

### Variante Docker (`.env`)
```env
# URL base di pix3lboard (rete interna Docker)
PIX3LBOARD_URL=http://pix3lboard:3000

# Autenticazione — scegliere UNA delle due opzioni:

# Opzione 1 (preferita): API Key
PIX3LBOARD_API_KEY=

# Opzione 2 (fallback): Email + Password — solo Docker, non Vercel
PIX3LBOARD_EMAIL=
PIX3LBOARD_PASSWORD=

# Workspace IDs disponibili (comma-separated)
WORKSPACE_IDS=

# Porta HTTP del server MCP
PORT=3010
```

### Variante Vercel (Environment Variables nel dashboard Vercel)
```env
# URL base di pix3lboard su Vercel
PIX3LBOARD_URL=https://pix3lboard.tuodominio.vercel.app

# API Key obbligatoria — email+password non supportati su Vercel
PIX3LBOARD_API_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Workspace IDs disponibili (comma-separated)
WORKSPACE_IDS=ws_abc123,ws_def456
```

---

## REST API v1 di Pix3lboard — Endpoint Disponibili

Tutte le chiamate usano `Authorization: Bearer <token>`.
Le risposte hanno sempre la struttura `{ "data": ... }` o `{ "error": "..." }`.

### Boards

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/api/v1/boards` | Lista boards (opz. `?workspace_id=...`) |
| GET | `/api/v1/boards/:boardId` | Dettaglio board con lists e cards annidate |
| POST | `/api/v1/boards` | Crea board |
| PATCH | `/api/v1/boards/:boardId` | Aggiorna board |
| DELETE | `/api/v1/boards/:boardId` | Elimina board (solo owner) |

**POST /api/v1/boards** — body:
```json
{
  "workspace_id": "string (required)",
  "name": "string (required, max 200)",
  "description": "string (optional, max 2000)",
  "background": "string (optional, max 500)",
  "allowed_card_types": ["string"] or null,
  "is_public": false
}
```

**GET /api/v1/boards/:boardId** — risposta `data`:
```json
{
  "id", "workspace_id", "name", "description", "background",
  "allowed_card_types", "is_public", "role",
  "created_at", "updated_at",
  "lists": [
    {
      "id", "board_id", "name", "position", "color",
      "created_at", "updated_at",
      "cards": [ { ...card fields... } ]
    }
  ]
}
```

**Role** può essere: `owner`, `editor`, `commenter`, `viewer`

### Lists

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/api/v1/boards/:boardId/lists` | Lista lists di una board |
| POST | `/api/v1/boards/:boardId/lists` | Crea list |
| PATCH | `/api/v1/lists/:listId` | Aggiorna list |
| DELETE | `/api/v1/lists/:listId` | Elimina list |

**POST /api/v1/boards/:boardId/lists** — body:
```json
{
  "name": "string (required, max 200)",
  "position": 0,
  "color": "string (optional, max 50)"
}
```

### Cards

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/api/v1/boards/:boardId/cards` | Lista tutte le cards di una board |
| GET | `/api/v1/cards/:cardId` | Dettaglio card |
| POST | `/api/v1/cards` | Crea card |
| PATCH | `/api/v1/cards/:cardId` | Aggiorna card |
| DELETE | `/api/v1/cards/:cardId` | Elimina card |
| PATCH | `/api/v1/cards/:cardId/move` | Sposta card in altra list/posizione |
| POST | `/api/v1/cards/:cardId/archive` | Archivia card |

**POST /api/v1/cards** — body (tutti opzionali eccetto `list_id` e `title`):
```json
{
  "list_id": "string (required)",
  "title": "string (required, max 500)",
  "description": "string (max 10000)",
  "position": 0,
  "type": "string (max 50)",
  "prompt": "string (max 10000)",
  "rating": 1-5,
  "ai_tool": "string (max 100)",
  "tags": ["string"],
  "due_date": "string",
  "links": ["url"],
  "responsible": "string (max 100)",
  "responsible_user_id": "string",
  "job_number": "string",
  "severity": "string",
  "priority": "string",
  "effort": "string",
  "attendees": ["string"],
  "meeting_date": "string",
  "checklist": [{ "id": "string", "text": "string", "checked": false }]
}
```

**PATCH /api/v1/cards/:cardId/move** — body:
```json
{
  "list_id": "string (required)",
  "position": 0
}
```

---

## Tools MCP da Implementare

### Boards

**`list_boards`**
- Parametri: `workspace_id` (string, opzionale)
- Descrizione: "List all boards accessible by the authenticated user. Optionally filter by workspace_id."
- Chiama: `GET /api/v1/boards?workspace_id=...`

**`get_board`**
- Parametri: `board_id` (string, required)
- Descrizione: "Get full board details including all lists and their cards."
- Chiama: `GET /api/v1/boards/:boardId`

**`create_board`**
- Parametri: `workspace_id` (required), `name` (required), `description`, `is_public`
- Descrizione: "Create a new board in a workspace."
- Chiama: `POST /api/v1/boards`

**`update_board`**
- Parametri: `board_id` (required), `name`, `description`, `is_public`
- Descrizione: "Update an existing board."
- Chiama: `PATCH /api/v1/boards/:boardId`

**`delete_board`**
- Parametri: `board_id` (required)
- Descrizione: "Delete a board (only the owner can do this)."
- Chiama: `DELETE /api/v1/boards/:boardId`

### Lists

**`list_lists`**
- Parametri: `board_id` (required)
- Descrizione: "List all lists in a board."
- Chiama: `GET /api/v1/boards/:boardId/lists`

**`create_list`**
- Parametri: `board_id` (required), `name` (required), `color` (optional, CSS color string)
- Descrizione: "Create a new list in a board."
- Chiama: `POST /api/v1/boards/:boardId/lists`

**`update_list`**
- Parametri: `list_id` (required), `name`, `color`
- Descrizione: "Update an existing list."
- Chiama: `PATCH /api/v1/lists/:listId`

**`delete_list`**
- Parametri: `list_id` (required)
- Descrizione: "Delete a list and all its cards."
- Chiama: `DELETE /api/v1/lists/:listId`

### Cards

**`list_cards`**
- Parametri: `board_id` (required)
- Descrizione: "List all non-archived cards in a board, grouped by list."
- Chiama: `GET /api/v1/boards/:boardId/cards`

**`get_card`**
- Parametri: `card_id` (required)
- Descrizione: "Get full details of a card."
- Chiama: `GET /api/v1/cards/:cardId`

**`create_card`**
- Parametri: `list_id` (required), `title` (required), `description`, `type`, `priority`, `severity`, `effort`, `tags` (array), `due_date`, `responsible`, `prompt`, `ai_tool`, `checklist` (array of `{id, text, checked}`)
- Descrizione: "Create a new card in a list."
- Chiama: `POST /api/v1/cards`

**`update_card`**
- Parametri: `card_id` (required), più tutti i campi aggiornabili (stessi di create_card eccetto `list_id`)
- Descrizione: "Update an existing card. Pass null to clear a field."
- Chiama: `PATCH /api/v1/cards/:cardId`

**`move_card`**
- Parametri: `card_id` (required), `list_id` (required), `position` (required, integer >= 0)
- Descrizione: "Move a card to a different list or position."
- Chiama: `PATCH /api/v1/cards/:cardId/move`

**`archive_card`**
- Parametri: `card_id` (required)
- Descrizione: "Archive a card (it will be hidden from the board but not deleted)."
- Chiama: `POST /api/v1/cards/:cardId/archive`

**`delete_card`**
- Parametri: `card_id` (required)
- Descrizione: "Permanently delete a card."
- Chiama: `DELETE /api/v1/cards/:cardId`

### Workspace Info (read-only, da env)

**`list_workspaces`**
- Parametri: nessuno
- Descrizione: "List the configured workspace IDs. Since the API v1 does not expose a workspace endpoint, workspace IDs are pre-configured via the WORKSPACE_IDS environment variable."
- Restituisce: array di `{ id: string }` parsati da `WORKSPACE_IDS`

---

## Implementazione del Server MCP

### Transport: Streamable HTTP

Usa il transport **Streamable HTTP** dell'SDK MCP in entrambe le varianti. Non usare SSE legacy.

### Registrazione Tools

Ogni tool viene registrato con `server.tool(name, description, zodSchema, handler)`.
Gli handler fanno chiamate all'API di pix3lboard tramite `api.ts` e restituiscono il risultato come testo JSON formattato.

In caso di errore API (4xx, 5xx), il tool deve restituire un messaggio di errore chiaro invece di lanciare un'eccezione.

---

## Variante Docker — `server.ts`

Entry point Express che espone il transport MCP su `/mcp`:

```typescript
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
// Registra tutti i tools
// GET /health → { status: 'ok' }
// POST /mcp → StreamableHTTPServerTransport handler
// Avvia su process.env.PORT || 3010
```

---

## Variante Vercel — `app/api/mcp/route.ts`

Next.js API Route che gestisce le richieste MCP. Poiché Vercel è serverless, il `McpServer` viene istanziato ad ogni invocazione (stateless by design — con API Key non c'è stato da mantenere).

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const server = new McpServer({ name: 'pix3lmcp', version: '1.0.0' });
  // Registra tutti i tools (stessi della variante Docker)
  const transport = new StreamableHTTPServerTransport({ ... });
  await server.connect(transport);
  // Gestisci la request e restituisci la Response
}
```

Aggiungere anche `app/api/health/route.ts` che risponde `{ status: 'ok' }` per il monitoring.

### `vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

### Registrazione in Claude Code (variante Vercel)

```bash
claude mcp add --transport http pix3lboard -- https://pix3lmcp.vercel.app/api/mcp
```

---

## Dockerfile (solo variante Docker)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3010
CMD ["node", "dist/index.js"]
```

---

## Integrazione con pix3ltools-deploy

Il server MCP si aggiunge al docker-compose stack esistente in `../pix3ltools-deploy`.

### Modifiche a `../pix3ltools-deploy/docker-compose.yml`

Aggiungere il servizio:
```yaml
  pix3lmcp:
    image: ghcr.io/pix3ltools-lab/pix3lmcp:latest
    ports:
      - "3010:3010"
    depends_on:
      - pix3lboard
    environment:
      - NODE_ENV=production
      - PIX3LBOARD_URL=http://pix3lboard:3000
      # Opzione 1 (preferita): API Key — decommentare quando pix3lboard la supporta
      # - PIX3LBOARD_API_KEY=${PIX3LBOARD_MCP_API_KEY}
      # Opzione 2 (fallback): Email + Password
      - PIX3LBOARD_EMAIL=${PIX3LBOARD_MCP_EMAIL}
      - PIX3LBOARD_PASSWORD=${PIX3LBOARD_MCP_PASSWORD}
      - WORKSPACE_IDS=${PIX3LBOARD_WORKSPACE_IDS}
      - PORT=3010
```

### Modifiche a `setup-https.sh`

Lo script deve chiedere anche il dominio MCP:
```
Pix3lMCP domain (e.g. mcp.example.com):
```

E aggiungere al `docker-compose.override.yml` generato:
```yaml
  pix3lmcp:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mcp.rule=Host(`$MCP_DOMAIN`)"
      - "traefik.http.routers.mcp.entrypoints=websecure"
      - "traefik.http.routers.mcp.tls.certresolver=letsencrypt"
      - "traefik.http.routers.mcp.middlewares=ratelimit"
      - "traefik.http.services.mcp.loadbalancer.server.port=3010"
```

---

## Registrazione in Claude Code

Una volta deployato con HTTPS, l'utente può registrarlo in Claude Code con:

```bash
claude mcp add --transport http pix3lboard -- https://mcp.tuodominio.com/mcp
```

---

## Note Implementative

1. **Workspace**: L'API v1 non espone endpoint per i workspace. Il tool `list_workspaces` legge da `WORKSPACE_IDS` env var. L'utente deve configurarla con i propri workspace ID (visibili nell'URL della board pix3lboard).

2. **Token refresh**: Solo nella modalità Email+Password (Docker). Il token JWT scade in 2h. Salvare `tokenExpiresAt = Date.now() + (2 * 60 * 60 * 1000) - (10 * 60 * 1000)` (con 10 min di margine). In modalità API Key non scade e non serve refresh — questo rende la modalità API Key l'unica compatibile con Vercel.

3. **Vercel è stateless**: nella variante Vercel ogni invocazione crea un nuovo `McpServer`. Questo non è un problema con API Key (nessuno stato da mantenere), ma rende impossibile la modalità Email+Password (il JWT cachato in memoria non sopravvive al cold start).

4. **Errori API**: Mappare gli errori HTTP in messaggi leggibili per Claude (es. 403 → "Access denied: you don't have permission to perform this action on this board").

5. **Singleton token (solo Docker)**: nella variante Docker, il token Bearer viene condiviso a livello di modulo (singleton del processo Express), non per sessione MCP.

6. **package.json scripts**:
   - `build`: `tsc && next build` (entrambe le varianti)
   - `start:docker`: `node dist/server.js`
   - `start:vercel`: `next start`
   - `dev`: `tsx watch server.ts` oppure `next dev`

7. **Health check**:
   - Docker: `GET /health` su Express
   - Vercel: `GET /api/health` come API Route
