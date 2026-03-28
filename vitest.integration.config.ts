/**
 * vitest.integration.config.ts
 *
 * Configuração separada para testes de integração.
 * Diferença do vitest.config.ts: aponta para arquivos *.integration.test.ts
 * e roda com timeout maior (leituras de disco, chamadas HTTP mockadas).
 *
 * Executar: npm run test:integration
 */
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 15_000,
    hookTimeout: 10_000,
    reporters: ['verbose'],
  },
  resolve: {
    alias: [
      { find: '@config/sites/br', replacement: path.resolve(__dirname, './config/sites/br') },
      { find: '@config/sites/it', replacement: path.resolve(__dirname, './config/sites/it') },
      { find: '@config/sites/en', replacement: path.resolve(__dirname, './config/sites/en') },
      { find: '@config/types', replacement: path.resolve(__dirname, './config/types') },
      { find: '@config/content', replacement: path.resolve(__dirname, './config/content') },
      { find: '@config', replacement: path.resolve(__dirname, './config/index') },
      { find: '@content', replacement: path.resolve(__dirname, './content') },
      { find: '@/', replacement: path.resolve(__dirname, './src') + '/' },
    ],
  },
})
