/**
 * Example tool: search an upstream HTTP API that needs an API key.
 *
 * Copy this file to add a new tool:
 *   1. Describe the inputs with zod (the SDK validates them before your handler runs).
 *   2. Do the work inside runTool() so errors become clean MCP tool errors.
 *   3. Register it in src/tools/index.ts.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getApiBaseUrl, getApiKey } from '../config.js';
import { UpstreamError, ok, runTool } from '../errors.js';

const REQUEST_TIMEOUT_MS = 15_000;

export const exampleSearchInput = {
  query: z.string().trim().min(1, 'query must not be empty').max(200).describe('Text to search for'),
  limit: z.number().int().min(1).max(50).default(10).describe('Maximum number of results (1-50)')
};

export function registerExampleSearch(server: McpServer): void {
  server.registerTool(
    'example-search',
    {
      title: 'Example search',
      description:
        'Search the example API and return matching items. Replace this with a real tool for your service.',
      inputSchema: exampleSearchInput
    },
    async ({ query, limit }) =>
      runTool('example-search', async () => {
        const apiKey = getApiKey();
        const url = new URL(`${getApiBaseUrl()}/search`);
        url.searchParams.set('q', query);
        url.searchParams.set('limit', String(limit));

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });

        if (!response.ok) {
          // Keep the body short: it may be large or contain HTML.
          const body = (await response.text()).slice(0, 300);
          throw new UpstreamError(body || response.statusText, response.status);
        }

        return ok(await response.json());
      })
  );
}
