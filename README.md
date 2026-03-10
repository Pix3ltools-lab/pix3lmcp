# pix3lmcp

MCP server for [Pix3lboard](https://github.com/Pix3ltools-lab/pix3lboard) — exposes board, list, and card management as tools for Claude Code and Claude.ai via the [Model Context Protocol](https://modelcontextprotocol.io/).

## Available Tools

| Tool | Description |
|------|-------------|
| `list_workspaces` | List configured workspace IDs |
| `list_boards` | List boards (optionally filter by workspace) |
| `get_board` | Get board details with lists and cards |
| `create_board` | Create a new board |
| `update_board` | Update a board |
| `delete_board` | Delete a board |
| `list_lists` | List all lists in a board |
| `create_list` | Create a new list |
| `update_list` | Update a list |
| `delete_list` | Delete a list |
| `list_cards` | List all cards in a board |
| `get_card` | Get card details |
| `create_card` | Create a new card (see [Card fields](#card-fields)) |
| `update_card` | Update a card (see [Card fields](#card-fields)) |
| `move_card` | Move a card to a different list/position |
| `archive_card` | Archive a card |
| `delete_card` | Delete a card |

---

## Card fields

`create_card` and `update_card` support the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Card title |
| `description` | string | Card description |
| `type` | string | Card type (`task`, `bug`, `feature`, `meeting`, `text`) |
| `priority` | string | Priority level |
| `severity` | string | Severity level |
| `effort` | string | Effort estimate |
| `tags` | string[] | List of tags |
| `due_date` | string | Due date in ISO 8601 format |
| `responsible` | string | Responsible person |
| `job_number` | string | Job number (e.g. `C-20-0001`) |
| `rating` | number | Rating from 1 to 5 |
| `links` | `string[]` | Links associated with the card (array of URLs) |
| `checklist` | `{ id: string, text: string, checked: boolean }[]` | Checklist items |
| `prompt` | string | AI prompt associated with the card |
| `ai_tool` | string | AI tool used |

---

## Prerequisites

- A running [Pix3lboard](https://github.com/Pix3ltools-lab/pix3lboard) instance
- An API key generated from Pix3lboard (UserMenu → API Keys)

---

## Option 1: Vercel (recommended)

Deploy your own instance on Vercel.

### Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Pix3ltools-lab/pix3lmcp)

### Environment Variables

Set these in the Vercel dashboard (Settings → Environment Variables):

| Variable | Required | Description |
|----------|----------|-------------|
| `PIX3LBOARD_URL` | ✅ | Base URL of your Pix3lboard instance (e.g. `https://board.pix3ltools.com`) |
| `PIX3LBOARD_API_KEY` | ✅ | API key generated from Pix3lboard |
| `WORKSPACE_IDS` | ✅ | Comma-separated workspace IDs (visible in the Pix3lboard URL: `/workspace/<id>`) |

### Register in Claude Code

```bash
claude mcp add --transport http --scope user pix3lboard -- https://<your-deployment>.vercel.app/api/mcp
```

### Register in Claude.ai

Go to **Settings → Integrations → Add MCP Server** and enter:
```
https://<your-deployment>.vercel.app/api/mcp
```

---

## Option 2: Docker

For self-hosted Pix3lboard deployments.

### Environment Variables

Create a `.env` file:

```env
PIX3LBOARD_URL=http://pix3lboard:3000
PIX3LBOARD_API_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORKSPACE_IDS=ws_abc123,ws_def456
PORT=3010
```

> **Note:** Email+Password authentication is also supported as a fallback (set `PIX3LBOARD_EMAIL` and `PIX3LBOARD_PASSWORD` instead of `PIX3LBOARD_API_KEY`), but API Key is strongly recommended — especially if Pix3lboard is deployed on Vercel where JWT caching is not possible.

### Run with Docker

```bash
docker build -t pix3lmcp .
docker run --env-file .env -p 3010:3010 pix3lmcp
```

### Add to docker-compose

```yaml
pix3lmcp:
  image: pix3lmcp
  ports:
    - "3010:3010"
  depends_on:
    - pix3lboard
  env_file:
    - .env
```

### Register in Claude Code

```bash
claude mcp add --transport http --scope user pix3lboard -- https://<your-domain>/mcp
```

---

## Development

```bash
npm install

# Vercel variant
npm run dev:vercel     # next dev

# Docker variant
npm run dev:docker     # tsx watch server.ts
```

### Build

```bash
npm run build:vercel   # next build
npm run build:docker   # esbuild → dist/server.js
```

---

## Architecture

```
src/
├── auth.ts          # API Key or Email+Password authentication
├── api.ts           # HTTP client for Pix3lboard REST API v1
└── tools/
    ├── boards.ts    # Board tools
    ├── lists.ts     # List tools
    ├── cards.ts     # Card tools
    └── index.ts     # Tool registration + list_workspaces

app/api/mcp/         # Vercel: Next.js API route (Streamable HTTP)
server.ts            # Docker: Express entry point
```

Transport: [Streamable HTTP](https://modelcontextprotocol.io/docs/concepts/transports) (stateless, one McpServer instance per request).
