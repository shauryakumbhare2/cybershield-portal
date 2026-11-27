import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function r(relPath: string): string {
  return path.resolve(__dirname, relPath);
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
  root: r('./frontend'),
  publicDir: r('./public'),
  resolve: {
    alias: {
      '@backend': r('./backend'),
    },
  },
  build: {
    outDir: r('./dist'),
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss(), productionCspPlugin()],
  worker: {
    format: 'es',
  },
  test: {
    root: r('./'),
    environment: 'node',
    include: ['other-files/tests/**/*.test.ts'],
  },
});
