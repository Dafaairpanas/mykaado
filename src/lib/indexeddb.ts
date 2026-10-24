import Dexie, { type Table } from 'dexie';

export interface ChapterData {
  path: string; // e.g., kotoba/irodori-migrated/a1/bab-01.json
  data: any[];
}

export class AppDatabase extends Dexie {
  chapters!: Table<ChapterData, string>;

  constructor() {
    super('mykaado_data');
    this.version(1).stores({
      chapters: 'path' // Primary key is the relative path
    });
  }
}

export const appDb = new AppDatabase();

let syncPromise: Promise<void> | null = null;

const CURRENT_DATA_VERSION = "v2_data4";

// Call this on app load or when internet is available
export async function syncAllData(force = false) {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      const savedVersion = localStorage.getItem('mykaado_data_version');
      const count = await appDb.chapters.count();
      if (!force && count > 0 && savedVersion === CURRENT_DATA_VERSION) {
        console.log('Data already synced to IndexedDB');
        return;
      }

      console.log('Fetching all-data.json for offline usage...');
      const res = await fetch('/all-data.json');
      if (!res.ok) throw new Error('Failed to fetch all-data.json');
      
      const allData = await res.json();
      
      const entries: ChapterData[] = Object.entries(allData).map(([path, data]) => ({
        path,
        data: Array.isArray(data) ? data : (data as any).default || data
      }));

      await appDb.chapters.clear();
      await appDb.chapters.bulkPut(entries);
      localStorage.setItem('mykaado_data_version', CURRENT_DATA_VERSION);
      console.log('Successfully synced all data to IndexedDB with data4!');
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  })();

  return syncPromise;
}
