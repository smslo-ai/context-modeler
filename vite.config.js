import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// CSP plugin: inject only in production builds
function cspPlugin() {
  return {
    name: 'csp-plugin',
    transformIndexHtml(html, ctx) {
      if (ctx.server) return html // skip in dev (Vite HMR needs inline scripts)
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';">`
      )
    },
  }
}

export default defineConfig({
  base: '/context-modeler/',
  plugins: [tailwindcss(), cspPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
