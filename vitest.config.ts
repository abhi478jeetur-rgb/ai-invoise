import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/tests/e2e/**', // Playwright handles these
      '**/tests/security/**', // Playwright handles these
      '**/tests/*.spec.ts' // Exclude root-level Playwright specs
    ],
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
})
