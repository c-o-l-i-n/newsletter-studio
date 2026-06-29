import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-192.png',
        'icon-maskable-512.png',
        'apple-touch-icon.png',
        'screenshots/desktop.png',
        'screenshots/mobile.png',
      ],
      manifest: {
        name: 'Newsletter Studio',
        short_name: 'Newsletter',
        description:
          'Write and print a vintage-style paper newsletter for family and friends, fully offline',
        theme_color: '#2c1a0e',
        background_color: '#1f1209',
        display: 'standalone',
        start_url: '/',
        launch_handler: {
          client_mode: 'focus-existing',
        },
        file_handlers: [
          {
            action: '/',
            accept: {
              'application/x-newsletter+zip': ['.newsletter'],
            },
          },
        ],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/desktop.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Newsletter Studio',
          },
          {
            src: '/screenshots/mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Newsletter Studio',
          },
        ],
      },
      workbox: {
        // Cache all app assets including fonts, textures, cursors, sounds
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff,woff2,otf,mp3}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
