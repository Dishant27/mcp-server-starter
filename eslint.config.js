import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // stdout is reserved for the MCP protocol. Use the logger (stderr) instead.
      'no-console': ['error', { allow: ['error'] }]
    }
  }
);
