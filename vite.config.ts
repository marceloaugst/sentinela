import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import pkg from './package.json' with { type: 'json' }

// A API autentica por cookie de sessão SameSite=Lax, então em desenvolvimento
// o frontend e a API precisam parecer a mesma origem: o Vite faz proxy de /api.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_DEV_PROXY_TARGET || 'https://162.35.24.245'
  const proxy = { target, secure: false, changeOrigin: false }

  return {
    plugins: [react(), tailwindcss()],
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    server: { proxy: { '/api': proxy, '/healthz': proxy, '/readyz': proxy } },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
