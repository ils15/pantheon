import { defineConfig } from 'tsdown'
import solid from 'rolldown-plugin-solid'

export default defineConfig({
  entry: { tui: 'src/index.tsx' },
  format: ['esm'],
  platform: 'node',
  outDir: 'dist',
  clean: true,
  outExtensions: () => ({ js: '.js' }),
  plugins: [
    solid({
      solid: {
        moduleName: '@opentui/solid',
        generate: 'universal',
      },
    }),
  ],
  deps: {
    neverBundle: [/^@opencode-ai\//, /^@opentui\//, /^solid-js/],
  },
})
