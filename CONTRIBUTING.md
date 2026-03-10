# Contributing to Pix3lMCP

Thank you for your interest in contributing to Pix3lMCP! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, inclusive, and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the issue template** with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs or error messages
   - Node.js and OS version

### Suggesting Features

1. **Open an issue** with the `enhancement` label
2. **Describe the feature** and its use case
3. **Explain why** it would benefit users
4. **Consider alternatives** you've thought about

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following our code style
4. **Test thoroughly** — ensure the MCP tools work correctly against a running pix3lboard instance
5. **Commit with clear messages**: Use conventional commits (feat:, fix:, docs:, etc.)
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Open a Pull Request** with:
   - Clear title and description
   - Reference to related issues

## Development Setup

### Prerequisites

- Node.js 22+ and npm
- A running [pix3lboard](https://github.com/Pix3ltools-lab/pix3lboard) instance (local or remote)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Pix3ltools-lab/pix3lmcp.git
cd pix3lmcp

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your pix3lboard URL and credentials
```

### Running in development

```bash
# MCP server (Docker mode) — recommended for testing MCP tools
npm run dev:docker

# Next.js dev server (Vercel mode)
npm run dev:vercel
```

The MCP server will be available at `http://localhost:3010`.

### Build

```bash
# Build both targets
npm run build

# Build only for Docker
npm run build:docker

# Build only for Vercel
npm run build:vercel
```

## Project Architecture

### Key Technologies

- **Node.js 22**: Runtime
- **TypeScript**: Type-safe development
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **Express.js**: HTTP server (Docker mode)
- **Next.js 15**: Vercel deployment target
- **esbuild**: Bundler for Docker build
- **Zod**: Schema validation

### File Structure

```
pix3lmcp/
├── app/                        # Next.js app (Vercel mode)
│   ├── api/
│   │   ├── health/route.ts     # Health check endpoint
│   │   └── mcp/route.ts        # MCP endpoint (Vercel)
│   ├── layout.tsx
│   └── page.tsx
├── src/
│   ├── api.ts                  # pix3lboard REST API client
│   ├── auth.ts                 # Authentication (API key or email+password)
│   └── tools/
│       ├── index.ts            # MCP server + tool registration
│       ├── boards.ts           # Board-related MCP tools
│       ├── lists.ts            # List-related MCP tools
│       └── cards.ts            # Card-related MCP tools
├── server.ts                   # Express entry point (Docker mode)
├── Dockerfile
└── .env.example
```

### Adding a New MCP Tool

1. Choose the appropriate file in `src/tools/` (or create a new one)
2. Define the tool using the MCP SDK with a Zod input schema
3. Implement the handler by calling the pix3lboard REST API via `src/api.ts`
4. Register the tool in `src/tools/index.ts`

## Code Style Guidelines

### TypeScript

- Use **TypeScript** strict mode
- Use **descriptive variable names**
- Keep functions **focused and small**
- Validate inputs with **Zod schemas**

### Naming Conventions

- **Files**: camelCase (`api.ts`, `boards.ts`)
- **Variables**: camelCase (`boardId`, `workspaceIds`)
- **Types**: PascalCase (`Board`, `Card`)
- **Constants**: UPPER_CASE (`MAX_RETRIES`)

### Git Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New MCP tool or feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Example:
```
feat: add card search tool
fix: refresh JWT token before expiry
docs: update CONTRIBUTING with tool guide
```

## Questions?

- Open an issue with the `question` label
- Check existing discussions
- Review the [README.md](README.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Pix3lMCP!**

Part of the [Pix3lTools](https://github.com/Pix3ltools-lab) suite.
