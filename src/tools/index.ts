import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerExampleSearch } from './exampleSearch.js';

/** Register every tool on the server. Add new tools here. */
export function registerTools(server: McpServer): void {
  registerExampleSearch(server);
}
