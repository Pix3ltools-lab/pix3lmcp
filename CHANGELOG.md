# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-10

### Added

- **`job_number` field** — `create_card` and `update_card` now accept a job number (e.g. `C-20-0001`)
- **`rating` field** — `create_card` and `update_card` now accept a rating from 1 to 5
- **`links` field** — `create_card` and `update_card` now accept an array of `{ label, url }` objects
- **`checklist` field** — `create_card` and `update_card` now accept an array of `{ id, text, checked }` checklist items
- **Card fields documentation** — README now includes a complete table of all fields supported by `create_card` and `update_card`

### Fixed

- **`delete_card`, `delete_list`, `delete_board`, `archive_card`** — MCP response was malformed when pix3lboard returned `{ success: true }` without a `data` wrapper; `apiRequest` now falls back to the full response body when `data` is undefined

---

## [1.0.0] - 2026-03-10

### Added

#### MCP Tools — Boards
- `list_boards` — list all boards, optionally filtered by workspace ID
- `get_board` — get a board by ID including its lists and cards
- `create_board` — create a new board in a workspace
- `update_board` — update name, description, or visibility of a board
- `delete_board` — delete a board by ID

#### MCP Tools — Lists
- `list_lists` — list all lists in a board
- `create_list` — create a new list in a board with optional color
- `update_list` — update name or color of a list
- `delete_list` — delete a list by ID

#### MCP Tools — Cards
- `list_cards` — list all cards in a board
- `get_card` — get a card by ID
- `create_card` — create a new card with full field support (title, description, type, priority, severity, effort, tags, due date, responsible, AI prompt, AI tool)
- `update_card` — update any field of an existing card
- `move_card` — move a card to a different list and/or position
- `archive_card` — archive a card
- `delete_card` — delete a card by ID

#### Authentication
- API key authentication (`PIX3LBOARD_API_KEY`) — preferred method
- Email + password authentication (`PIX3LBOARD_EMAIL` + `PIX3LBOARD_PASSWORD`) with automatic JWT refresh

#### Deployment
- Docker mode: Express HTTP server on port 3010, built with esbuild
- Vercel mode: Next.js 15 app with MCP endpoint at `/api/mcp`
- Health check endpoint at `/api/health`
- Workspace filtering via `WORKSPACE_IDS` env var
