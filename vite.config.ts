import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Production-only Content Security Policy injector plugin
const productionCspPlugin = (): Plugin => ({
  name: 'production-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self' https://api.emailjs.com; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">`;
    return html.replace('</head>', `  ${cspMeta}\n  </head>`);
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    productionCspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*', 'manifest.webmanifest'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^https:\/\/api\.emailjs\.com/],
      },
      manifest: {
        name: 'Buddy',
        short_name: 'Buddy',
        description: 'Your private everyday space.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F4F8F8',
        theme_color: '#2F6F73',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
