import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs/promises';

function localCrudPlugin() {
  return {
    name: 'local-crud-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api/local-crud/list')) {
          res.setHeader('Content-Type', 'application/json');
          if (req.method === 'GET') {
            try {
              const dataPath = path.resolve(__dirname, 'src/data');
              const files: string[] = [];
              const walk = async (dir: string) => {
                const list = await fs.readdir(dir, { withFileTypes: true });
                for (const item of list) {
                  const fullPath = path.join(dir, item.name);
                  if (item.isDirectory()) {
                    await walk(fullPath);
                  } else if (item.name.endsWith('.json')) {
                    files.push(fullPath.replace(path.resolve(__dirname) + path.sep, '').replace(/\\/g, '/'));
                  }
                }
              };
              await walk(dataPath);
              return res.end(JSON.stringify({ files }));
            } catch (err: any) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          }
          return;
        }

        if (req.url?.startsWith('/api/local-crud')) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const fileParam = url.searchParams.get('file');
          if (!fileParam) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: "Missing file parameter" }));
          }

          const targetPath = path.resolve(__dirname, fileParam);
          if (!targetPath.startsWith(__dirname)) {
            res.statusCode = 403;
            return res.end(JSON.stringify({ error: "Access denied" }));
          }

          res.setHeader('Content-Type', 'application/json');

          if (req.method === 'GET') {
            try {
              const content = await fs.readFile(targetPath, 'utf-8');
              return res.end(content);
            } catch (err: any) {
              if (err.code === 'ENOENT') {
                 res.statusCode = 404;
                 return res.end(JSON.stringify({ error: "File not found" }));
              }
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          }

          if (req.method === 'PUT' || req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk.toString();
            });
            req.on('end', async () => {
              try {
                // Ensure directory exists
                const dir = path.dirname(targetPath);
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(targetPath, body, 'utf-8');
                return res.end(JSON.stringify({ success: true }));
              } catch (err: any) {
                res.statusCode = 500;
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localCrudPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'all-data.json'],
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
            urlPattern: ({ url }) => url.pathname.startsWith('/adminadit') || url.hostname.includes('supabase'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/all-data.json'),
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
