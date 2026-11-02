/**
 * Configuration read from environment variables.
 *
 * Secrets are read lazily and never logged. A missing key does not crash the
 * server at startup: the server still connects, lists its tools, and the tool
 * that needs the key returns a clear error explaining how to set it.
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Return the API key, or throw a ConfigError with setup instructions. */
export function getApiKey(): string {
  const key = process.env.EXAMPLE_API_KEY?.trim();
  if (!key) {
    throw new ConfigError(
      'EXAMPLE_API_KEY is not set. Add it to the "env" block of your MCP client config (see README).'
    );
  }
  return key;
}

/** Base URL of the upstream API. Override with EXAMPLE_API_BASE_URL. */
export function getApiBaseUrl(): string {
  return (process.env.EXAMPLE_API_BASE_URL ?? 'https://api.example.com').replace(/\/+$/, '');
}

/** Show that a key is configured without revealing it, e.g. "sk-1…9f2c". */
export function maskSecret(secret: string): string {
  if (secret.length <= 8) return '****';
  return `${secret.slice(0, 4)}…${secret.slice(-4)}`;
}
