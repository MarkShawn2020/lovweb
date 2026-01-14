import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  dts: false,
  shims: true,
  outExtension: () => ({ js: '.mjs' }),
  banner: {
    js: '#!/usr/bin/env node',
  },
})
