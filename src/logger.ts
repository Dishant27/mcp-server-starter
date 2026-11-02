/**
 * Minimal stderr logger.
 *
 * With the stdio transport, stdout carries the JSON-RPC protocol stream.
 * Anything else written to stdout (a stray console.log, a banner, a debug
 * dump) corrupts that stream and the client drops the connection. So every
 * log line goes to stderr via console.error, which MCP clients surface in
 * their own logs.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const envLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as Level;
const threshold = order[envLevel] ?? order.info;

function write(level: Level, message: string, meta?: unknown): void {
  if (order[level] < threshold) return;
  const line = `[${new Date().toISOString()}] [${level}] ${message}`;
  if (meta === undefined) {
    console.error(line);
  } else {
    console.error(line, meta);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => write('debug', msg, meta),
  info: (msg: string, meta?: unknown) => write('info', msg, meta),
  warn: (msg: string, meta?: unknown) => write('warn', msg, meta),
  error: (msg: string, meta?: unknown) => write('error', msg, meta)
};
