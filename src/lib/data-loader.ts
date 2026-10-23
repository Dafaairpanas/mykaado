import { appDb } from "./indexeddb";

export interface DeckSource {
  id: string;
  title: string;
  type: "kotoba" | "kanji" | "bunpou" | "renshuu";
  chapters: { id: string; label: string; pathKey: string; file: () => Promise<any> }[];
}

export const KOTOBA_SOURCES: DeckSource[] = [
  {
    id: "irodori_a1",
    title: "Irodori A1",
    type: "kotoba",
    chapters: Array.from({ length: 18 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `ir_a1_${num}`,
        label: `Bab ${num}`,
        pathKey: `kotoba/irodori-migrated/a1/bab-${num}.json`,
        file: () => import(`@/data/kotoba/irodori-migrated/a1/bab-${num}.json`)
      };
    })
  },
  {
    id: "irodori_a2_1",
    title: "Irodori A2-1",
    type: "kotoba",
    chapters: Array.from({ length: 18 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `ir_a2_1_${num}`,
        label: `Bab ${num}`,
        pathKey: `kotoba/irodori-migrated/a2-1/bab-${num}.json`,
        file: () => import(`@/data/kotoba/irodori-migrated/a2-1/bab-${num}.json`)
      };
    })
  },
  {
    id: "irodori_a2_2",
    title: "Irodori A2-2",
    type: "kotoba",
    chapters: Array.from({ length: 18 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `ir_a2_2_${num}`,
        label: `Bab ${num}`,
        pathKey: `kotoba/irodori-migrated/a2-2/bab-${num}.json`,
        file: () => import(`@/data/kotoba/irodori-migrated/a2-2/bab-${num}.json`)
      };
    })
  },
  {
    id: "minna",
    title: "Minna no Nihongo",
    type: "kotoba",
    chapters: Array.from({ length: 50 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `minna_${num}`,
        label: `Bab ${num}`,
        pathKey: `kotoba/minna-migrated/bab-${num}.json`,
        file: () => import(`@/data/kotoba/minna-migrated/bab-${num}.json`)
      };
    })
  },
  {
    id: "n3",
    title: "Sou N3",
    type: "kotoba",
    chapters: Array.from({ length: 35 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `n3_${num}`,
        label: `Bab ${num}`,
        pathKey: `kotoba/n3-migrated/bab-${num}.json`,
        file: () => import(`@/data/kotoba/n3-migrated/bab-${num}.json`)
      };
    })
  }
];

export const KANJI_SOURCES: DeckSource[] = [
  {
    id: "kanji_level",
    title: "Kanji by Level",
    type: "kanji",
    chapters: [
      { id: "kj_n5", label: "JLPT N5", pathKey: "kanji/n5.json", file: () => import(`@/data/kanji/n5.json`) },
      { id: "kj_n4", label: "JLPT N4", pathKey: "kanji/n4.json", file: () => import(`@/data/kanji/n4.json`) },
      { id: "kj_n3", label: "JLPT N3", pathKey: "kanji/n3.json", file: () => import(`@/data/kanji/n3.json`) },
      { id: "kj_n2", label: "JLPT N2", pathKey: "kanji/n2.json", file: () => import(`@/data/kanji/n2.json`) },
      { id: "kj_n1", label: "JLPT N1", pathKey: "kanji/n1.json", file: () => import(`@/data/kanji/n1.json`) },
      { id: "kj_n3_n2", label: "JLPT N3-N2", pathKey: "kanji/n3_n2.json", file: () => import(`@/data/kanji/n3_n2.json`) },
      { id: "kj_irodori", label: "Irodori Dasar", pathKey: "kanji/irodorikanjidasar.json", file: () => import(`@/data/kanji/irodorikanjidasar.json`) },
      { id: "kj_iroa1", label: "Irodori A1", pathKey: "kanji/iroa1.json", file: () => import(`@/data/kanji/iroa1.json`) },
      { id: "kj_iroa2_1", label: "Irodori A2-1", pathKey: "kanji/iroa2-1.json", file: () => import(`@/data/kanji/iroa2-1.json`) },
      { id: "kj_iroa2_2", label: "Irodori A2-2", pathKey: "kanji/iroa2_2.json", file: () => import(`@/data/kanji/iroa2_2.json`) },
      { id: "kj_kanjirodori", label: "Kanji Irodori", pathKey: "kanji/kanjirodori.json", file: () => import(`@/data/kanji/kanjirodori.json`) },
      { id: "kj_marugoto", label: "Marugoto", pathKey: "kanji/marugoto.json", file: () => import(`@/data/kanji/marugoto.json`) },
      { id: "kj_jfta2", label: "JFT A2 Kanji", pathKey: "renshuu/jfta2kanji.json", file: () => import(`@/data/renshuu/jfta2kanji.json`) },
      { id: "kj_jft_1", label: "Kanji for JFT 1", pathKey: "kanji/kanjiforjft_1.json", file: () => import(`@/data/kanji/kanjiforjft_1.json`) },
      { id: "kj_kotobalatsol1", label: "Kotoba Latsol 1", pathKey: "kanji/kotobalatsol1.json", file: () => import(`@/data/kanji/kotobalatsol1.json`) }
    ]
  }
];

export const BUNPOU_SOURCES: DeckSource[] = [
  {
    id: "bunpou_irodori_a1",
    title: "Irodori A1",
    type: "bunpou",
    chapters: Array.from({ length: 18 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `bp_irodori_a1_${num}`,
        label: `A1 Bab ${num}`,
        pathKey: `bunpou-migrated/irodori/a1/bab${num}.json`,
        file: () => import(`@/data/bunpou-migrated/irodori/a1/bab${num}.json`)
      };
    })
  },
  {
    id: "bunpou_irodori_a2_1",
    title: "Irodori A2-1",
    type: "bunpou",
    chapters: Array.from({ length: 18 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `bp_irodori_a2_1_${num}`,
        label: `A2-1 Bab ${num}`,
        pathKey: `bunpou-migrated/irodori/a2.1/bab${num}.json`,
        file: () => import(`@/data/bunpou-migrated/irodori/a2.1/bab${num}.json`)
      };
    })
  },
  {
    id: "bunpou_irodori_a2_2",
    title: "Irodori A2-2",
    type: "bunpou",
    chapters: Array.from({ length: 18 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `bp_irodori_a2_2_${num}`,
        label: `A2-2 Bab ${num}`,
        pathKey: `bunpou-migrated/irodori/a2.2/bab${num}.json`,
        file: () => import(`@/data/bunpou-migrated/irodori/a2.2/bab${num}.json`)
      };
    })
  },
  {
    id: "bunpou_minna",
    title: "Minna no Nihongo",
    type: "bunpou",
    chapters: Array.from({ length: 50 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `bp_minna_${num}`,
        label: `Bab ${num}`,
        pathKey: `bunpou-migrated/minna/bab${num}.json`,
        file: () => import(`@/data/bunpou-migrated/minna/bab${num}.json`)
      };
    })
  },
  {
    id: "bunpou_n3",
    title: "Sou N3",
    type: "bunpou",
    chapters: Array.from({ length: 35 }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      return {
        id: `bp_n3_${num}`,
        label: `Bab ${num}`,
        pathKey: `bunpou-migrated/n3/bab${num}.json`,
        file: () => import(`@/data/bunpou-migrated/n3/bab${num}.json`)
      };
    })
  }
];

export const RENSHUU_SOURCES: DeckSource[] = [
  {
    id: "renshuu_jft",
    title: "JFT-Basic Simulations",
    type: "renshuu",
    chapters: [
      { id: "batch-01", label: "Paket 01 (Demo)", pathKey: "renshuu/jft-paket-01.json", file: () => import(`@/data/renshuu/jft-paket-01.json`) },
      { id: "n4-paket-01", label: "Tes Level N4", pathKey: "renshuu/n4-paket-01.json", file: () => import(`@/data/renshuu/n4-paket-01.json`) },
      { id: "n5-paket-01", label: "Tes Level N5", pathKey: "renshuu/n5-paket-01.json", file: () => import(`@/data/renshuu/n5-paket-01.json`) }
    ]
  }
];

// Helper to fetch cards for selected decks
export async function fetchSelectedDecks(selectedChapterIds: string[]) {
  const allChapters = [...KOTOBA_SOURCES, ...KANJI_SOURCES, ...BUNPOU_SOURCES, ...RENSHUU_SOURCES].flatMap(s => s.chapters);
  const toFetch = allChapters.filter(c => selectedChapterIds.includes(c.id));
  
  const results = [];
  for (const chapter of toFetch) {
    try {
      // 1. Try fetching from IndexedDB first
      let items = null;
      try {
        const fromDb = await appDb.chapters.get(chapter.pathKey);
        if (fromDb && fromDb.data) {
          items = fromDb.data;
        }
      } catch (e) {
        console.warn("Failed to read from IndexedDB, falling back to dynamic import");
      }

      // 2. Fallback to Dynamic Import
      if (!items) {
        const data = await chapter.file();
        items = data.default || data;
      }

      results.push(...items);
    } catch (e) {
      console.error(`Failed to load chapter ${chapter.id}`, e);
    }
  }
  return results;
}

let cachedAllCardsMap: Map<string, any> | null = null;

// Helper to fetch all cards as a map (useful for history lookups)
export async function fetchAllCardsMap(): Promise<Map<string, any>> {
  if (cachedAllCardsMap && cachedAllCardsMap.size > 0) {
    return cachedAllCardsMap;
  }

  const map = new Map<string, any>();

  // 1. Try fast path: read from appDb if already populated
  try {
    const count = await appDb.chapters.count();
    if (count > 0) {
      const allEntries = await appDb.chapters.toArray();
      for (const entry of allEntries) {
        if (Array.isArray(entry.data)) {
          for (const item of entry.data) {
            if (item && item.id) map.set(item.id, item);
          }
        }
      }
      if (map.size > 0) {
        cachedAllCardsMap = map;
        return map;
      }
    }
  } catch (e) {}

  // 2. Try fetching /all-data.json directly (single fast bundle)
  try {
    const res = await fetch('/all-data.json');
    if (res.ok) {
      const allData = await res.json();
      for (const [, chapterData] of Object.entries(allData)) {
        const items = Array.isArray(chapterData) ? chapterData : (chapterData as any)?.default;
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item && item.id) map.set(item.id, item);
          }
        }
      }
      if (map.size > 0) {
        cachedAllCardsMap = map;
        return map;
      }
    }
  } catch (e) {}

  // 3. Fallback: dynamic imports in parallel batches
  const allChapters = [...KOTOBA_SOURCES, ...KANJI_SOURCES, ...BUNPOU_SOURCES, ...RENSHUU_SOURCES].flatMap(s => s.chapters);
  const results = await Promise.allSettled(allChapters.map(c => c.file()));
  for (const res of results) {
    if (res.status === 'fulfilled') {
      const items = res.value?.default || res.value;
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item.id) map.set(item.id, item);
        }
      }
    }
  }

  cachedAllCardsMap = map;
  return map;
}
