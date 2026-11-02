import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ConfigError } from './config.js';
import { logger } from './logger.js';

/** Error raised by an upstream HTTP API. */
export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

/** Successful tool result as pretty-printed JSON text. */
export function ok(data: unknown): CallToolResult {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: 'text', text }] };
}

/**
 * Run a tool body and turn any thrown error into an MCP tool error
 * (isError: true) instead of crashing the server or leaking a stack trace.
 * The model sees a short, actionable message; full details go to stderr.
 */
export async function runTool(name: string, fn: () => Promise<CallToolResult>): Promise<CallToolResult> {
  logger.debug(`tool ${name} called`);
  try {
    return await fn();
  } catch (error) {
    let message: string;
    if (error instanceof ConfigError) {
      message = error.message;
    } else if (error instanceof UpstreamError) {
      message = `Upstream API error${error.status ? ` (HTTP ${error.status})` : ''}: ${error.message}`;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }
    logger.error(`tool ${name} failed: ${message}`, error instanceof Error ? error.stack : undefined);
    return { isError: true, content: [{ type: 'text', text: `${name} failed: ${message}` }] };
  }
}
