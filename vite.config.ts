import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The production build is written to /docs so GitHub Pages can serve it
// straight from the main branch. `base: './'` keeps every asset path relative,
// so the app works from any URL (GitHub Pages sub-path, custom domain, local).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    // Recharts is ~550 kB minified (~155 kB gzipped) on its own; that's expected.
    chunkSizeWarningLimit: 650,
    // Charts in their own file, so the browser caches them between releases.
    rollupOptions: { output: { manualChunks: { charts: ['recharts'] } } },
  },
});
