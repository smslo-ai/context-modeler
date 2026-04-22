/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function cspPlugin() {
  return {
    name: 'csp-plugin',
    transformIndexHtml(html: string, ctx: { server?: unknown }) {
      if (ctx.server) return html
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://context-modeler-api.vercel.app; font-src 'self' https://fonts.gstatic.com;">`
      )
    },
  }
}

export default defineConfig({
  base: '/context-modeler/',
  plugins: [react(), tailwindcss(), cspPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
})
