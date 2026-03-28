import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: [
      // Most specific first to avoid prefix collisions
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
