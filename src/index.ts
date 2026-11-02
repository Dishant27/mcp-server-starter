#!/usr/bin/env node
/**
 * MCP server starter
 *
 * @author Dishant Kumar
 *
 * Stdio MCP server: stdout carries the JSON-RPC protocol, so all logging goes
 * to stderr (see logger.ts). Never write to stdout from this process.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { maskSecret } from './config.js';
import { logger } from './logger.js';
import { registerTools } from './tools/index.js';

const SERVER_NAME = 'mcp-server-starter';
const SERVER_VERSION = '0.1.0';

async function main(): Promise<void> {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerTools(server);

  const key = process.env.EXAMPLE_API_KEY?.trim();
  if (key) {
    logger.info(`EXAMPLE_API_KEY configured (${maskSecret(key)})`);
  } else {
    logger.warn('EXAMPLE_API_KEY is not set; example-search will return an error until it is.');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);

  const shutdown = async (signal: string) => {
    logger.info(`received ${signal}, shutting down`);
    await server.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled promise rejection', reason);
});

main().catch((error) => {
  logger.error('fatal error during startup', error);
  process.exit(1);
});
