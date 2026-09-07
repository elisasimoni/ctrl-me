import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The GitHub Pages demo lives at /ctrl-me/; `npm run dev` and the Capacitor
// Android build both serve from the root. BASE_PATH lets CI override it.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'CTRL+Me',
        short_name: 'CTRL+Me',
        description: 'The buddy who notices. Reminders that read the room.',
        theme_color: '#0a0a0a',
        background_color: '#f4f1ec',
        display: 'standalone',
        orientation: 'portrait',
        // Relative so the PWA also installs correctly from a subpath.
        start_url: '.',
        scope: base,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
