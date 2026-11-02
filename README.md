# MCP Server Starter (TypeScript)

[![CI](https://github.com/Dishant27/mcp-server-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/Dishant27/mcp-server-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A small TypeScript template for building [Model Context Protocol](https://modelcontextprotocol.io) (MCP) servers that you can run in production. It follows the pattern used in my LinkedIn, Twitter, Medium and Kaggle MCP servers:

- **`@modelcontextprotocol/sdk` 1.x** with the high-level `McpServer` API
- **stdio transport**, so it works with Claude Desktop, Cursor and any MCP client
- **Logs go only to stderr**. stdout is left for the protocol (see [why](#why-logs-go-to-stderr)).
- **zod input validation** on every tool
- **Reads the API key safely from an env var**: the key is never logged, and if it's missing you get a clear error instead of a crash
- **Error handling** that turns failures into MCP tool errors (`isError: true`) instead of crashing the server
- **GitHub Actions CI** that installs, typechecks, lints and builds on Node 20 and 22
- **MIT licensed**

## Quick start

Requires Node.js 20 or newer.

```bash
# use this repo as a template (or clone it)
git clone https://github.com/Dishant27/mcp-server-starter.git my-mcp-server
cd my-mcp-server

npm install
npm run build

# try it in the MCP Inspector
EXAMPLE_API_KEY=your-key npm run inspect
```

Scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Compile `src/` to `dist/` |
| `npm run dev` | Recompile on every change |
| `npm start` | Run the server on stdio |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint (it also blocks `console.log`) |
| `npm run inspect` | Open the server in the MCP Inspector |

## Project layout

```
src/
  index.ts              # entry point: creates the server, registers tools, connects stdio
  logger.ts             # stderr-only logger (LOG_LEVEL=debug|info|warn|error)
  config.ts             # env var access (API key, base URL) and secret masking
  errors.ts             # runTool() wrapper and ok() helper for tool results
  tools/
    index.ts            # registers every tool
    exampleSearch.ts    # example tool: zod inputs, API key, fetch, error handling
```

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `EXAMPLE_API_KEY` | for `example-search` | API key for the upstream service |
| `EXAMPLE_API_BASE_URL` | no | Override the upstream base URL (default `https://api.example.com`) |
| `LOG_LEVEL` | no | `debug`, `info` (default), `warn` or `error` |

Set these in the `env` block of your MCP client config (below). For local experiments, copy `.env.example` to `.env`. It's in `.gitignore`, so never commit real keys.

## Use it with Claude Desktop or Cursor

Build first (`npm run build`), then point your client at `dist/index.js` using an **absolute path**.

**Claude Desktop** (`claude_desktop_config.json`; on macOS it's at `~/Library/Application Support/Claude/`, and on Windows at `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "mcp-server-starter": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-starter/dist/index.js"],
      "env": {
        "EXAMPLE_API_KEY": "your-key-here"
      }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json` for all projects, or `.cursor/mcp.json` in one project) uses the same shape:

```json
{
  "mcpServers": {
    "mcp-server-starter": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-starter/dist/index.js"],
      "env": {
        "EXAMPLE_API_KEY": "your-key-here"
      }
    }
  }
}
```

Restart the client after editing the config. The server's stderr shows up in the client's MCP logs.

## How to add a tool

1. **Create** `src/tools/myTool.ts`:

   ```ts
   import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
   import { z } from 'zod';
   import { ok, runTool } from '../errors.js';

   export function registerMyTool(server: McpServer): void {
     server.registerTool(
       'my-tool',
       {
         title: 'My tool',
         description: 'One clear sentence the model can use to decide when to call this.',
         inputSchema: {
           id: z.string().min(1).describe('ID of the thing to fetch')
         }
       },
       async ({ id }) =>
         runTool('my-tool', async () => {
           // inputs are already validated by zod here
           const result = { id, status: 'ok' };
           return ok(result);
         })
     );
   }
   ```

2. **Register** it in `src/tools/index.ts`:

   ```ts
   import { registerMyTool } from './myTool.js';
   // ...
   registerMyTool(server);
   ```

3. **Rebuild** with `npm run build` and restart your MCP client.

Tips:
- Write `description` and each `.describe()` for the model, since that's how it picks tools and fills in arguments.
- Throw inside `runTool()`. It logs the details to stderr and gives the model a short `isError` message, so one failed call never takes the server down.
- Keep secrets in `config.ts`. Read them lazily and never log them (use `maskSecret()` if you need to show that a key is set).
- Use relative imports ending in `.js` (`'./myTool.js'`). This is ESM with `NodeNext` resolution.

## Why logs go to stderr

With the stdio transport, **stdout is the protocol**: every byte on it must be a JSON-RPC message for the client. A single `console.log('starting...')` puts non-JSON into that stream. Depending on the client, you'll see parse errors, a server that "connects" but shows no tools, or a connection that drops without explanation. It's the most common reason a new MCP server doesn't work.

This template guards against that in three ways:
- `src/logger.ts` writes everything with `console.error` (stderr), which clients capture as logs.
- ESLint's `no-console` rule allows only `console.error`, so a stray `console.log` fails `npm run lint` and CI.
- The secret is never printed. Startup logs show only a masked form like `sk-t…7890`.

## My other MCP servers

- [linkedin-mcp-server](https://github.com/Dishant27/linkedin-mcp-server): LinkedIn API integration
- [twitter-mcp](https://github.com/Dishant27/twitter-mcp): Twitter/X, with CRUD-style operations through the Twitter API
- [medium-mcp-server](https://github.com/Dishant27/medium-mcp-server): read your Medium profile and publications, and publish drafts
- [kaggle-MCP](https://github.com/Dishant27/kaggle-MCP): work with Kaggle competitions

## License

[MIT](LICENSE) © 2026 Dishant Kumar
