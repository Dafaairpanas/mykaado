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

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCache,
});

serwist.addEventListeners();
