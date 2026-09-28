import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

// Custom caching strategy
const customCache: RuntimeCaching[] = [
  {
    // Bypass cache (selalu ambil dari jaringan) untuk rute dan API tertentu
    matcher: ({ url }) => {
      return url.pathname.startsWith('/adminadit') || 
             url.hostname.includes('supabase');
    },
    handler: new NetworkOnly(),
  },
  // Untuk yang lainnya (Flashcard, Bunpou, Kotoba, Kanji, Settings, file statis), gunakan default caching
  ...defaultCache,
];

const precacheUrls = [
  '/', 
  '/flashcard/setup', 
  '/flashcard',
  '/kanji',
  '/kotoba',
  '/bunpou',
  '/ringkasan',
  '/renshuu',
  '/settings',
  '/all-data.json'
].map(url => ({ url, revision: process.env.NEXT_PUBLIC_APP_VERSION || 'v2' }));

// Precache the offline page
precacheUrls.push({ url: '/~offline', revision: process.env.NEXT_PUBLIC_APP_VERSION || 'v2' });

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST || []), ...precacheUrls],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
