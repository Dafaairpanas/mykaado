import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png', 'all-data.json'],
            manifest: {
                name: 'MyKaado - Japanese Flashcards',
                short_name: 'MyKaado',
                description: 'Belajar bahasa Jepang dengan Spaced Repetition',
                theme_color: '#0A0A0A',
                background_color: '#FAF9F5',
                display: 'standalone',
                orientation: 'portrait-primary',
                icons: [
                    {
                        src: '/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: '/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json,ttf,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: function (_a) {
                            var url = _a.url;
                            return url.pathname.startsWith('/adminadit') || url.hostname.includes('supabase');
                        },
                        handler: 'NetworkOnly',
                    },
                    {
                        urlPattern: function (_a) {
                            var url = _a.url;
                            return url.pathname.includes('/all-data.json');
                        },
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'mykaado-data-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                        },
                    },
                ],
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
