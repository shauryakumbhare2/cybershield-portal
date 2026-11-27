import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function resolveFromRoot(relPath: string): string {
  const url = new URL(relPath, import.meta.url);
  return decodeURIComponent(url.pathname).replace(/^\/([A-Za-z]:)/, '$1');
}

const PRODUCTION_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self' blob:; img-src 'self' data: blob:; media-src 'self' mediastream: blob:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none';";

function productionCspPlugin(): Plugin {
  return {
    name: 'inject-production-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`
      );
    },
  };
}

export default defineConfig({
  base: './',
  root: resolveFromRoot('./frontend'),
  publicDir: resolveFromRoot('./other-files/public'),
  resolve: {
    alias: {
      '@backend': resolveFromRoot('./backend'),
    },
  },
  build: {
    outDir: resolveFromRoot('./dist'),
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss(), productionCspPlugin()],
  worker: {
    format: 'es',
  },
  test: {
    root: resolveFromRoot('./'),
    environment: 'node',
    include: ['other-files/tests/**/*.test.ts'],
  },
});
