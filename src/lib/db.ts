import Dexie, { type Table } from "dexie";
import type { FSRSProgress, ReviewHistory } from "@/types";

export class MyKaadoDatabase extends Dexie {
  progress!: Table<FSRSProgress, string>;
  history!: Table<ReviewHistory, number>;

  constructor() {
    super("MyKaadoDB");
    
    // Schema
    this.version(1).stores({
      progress: "card_id, type, state, due", 
      history: "++id, card_id, reviewed_at"
    });

    this.version(2).stores({
      history: "++id, card_id, rating, reviewed_at"
    });
  }
}

export const db = new MyKaadoDatabase();
