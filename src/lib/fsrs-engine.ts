import { fsrs, generatorParameters, Rating, State, Card } from "ts-fsrs";
import { db } from "./db";
import type { KotobaItem, KanjiItem, FSRSProgress } from "@/types";

// Initialize FSRS engine with standard parameters
const params = generatorParameters({ enable_fuzz: true, maximum_interval: 36500 });
const f = fsrs(params);

export interface ReviewCard {
  card: KotobaItem | KanjiItem;
  progress: FSRSProgress;
  type: "kotoba" | "kanji";
}

export class FSRSEngine {
  /**
   * Mengambil list kartu yang siap direview hari ini (Due <= sekarang)
   * atau kartu baru jika belum mencapai batas harian.
   */
  static async getDueCards(sourceData: (KotobaItem | KanjiItem)[], type: "kotoba" | "kanji", limit = 50): Promise<ReviewCard[]> {
    const now = new Date();
    const sourceIds = sourceData.map(c => c.id);
    
    // Ambil progress untuk kartu-kartu dalam deck yang dipilih
    const progressList = await db.progress.where('card_id').anyOf(sourceIds).toArray();
    const progressMap = new Map(progressList.map(p => [p.card_id, p]));
    
    const reviewCards: ReviewCard[] = [];
    
    for (const card of sourceData) {
      let progress = progressMap.get(card.id);
      
      if (!progress) {
        // Kartu baru (New)
        progress = {
          card_id: card.id,
          type,
          state: State.New,
          due: now,
          stability: 0,
          difficulty: 0,
          elapsed_days: 0,
          scheduled_days: 0,
          reps: 0,
          lapses: 0,
          last_review: null
        };
      }
      
      // Jika kartu sudah jatuh tempo (due <= now) atau masih baru
      if (progress.due <= now) {
        reviewCards.push({ card, progress, type });
      }
      
      if (reviewCards.length >= limit) break;
    }
    
    // Sort: Relearning -> Review -> Learning -> New
    return reviewCards.sort((a, b) => {
      if (a.progress.state !== b.progress.state) {
        // Prioritas state: Relearning (3) > Review (2) > Learning (1) > New (0)
        const priority = { [State.Relearning]: 0, [State.Review]: 1, [State.Learning]: 2, [State.New]: 3 };
        return priority[a.progress.state as State] - priority[b.progress.state as State];
      }
      return a.progress.due.getTime() - b.progress.due.getTime();
    });
  }

  /**
   * Menilai kartu (Again=1, Hard=2, Good=3, Easy=4) dan menyimpan ke database
   */
  static async rateCard(reviewCard: ReviewCard, rating: Rating, durationMs: number = 0): Promise<FSRSProgress> {
    const now = new Date();
    
    // Convert FSRSProgress to ts-fsrs Card format
    const fsrsCard: Card = {
      due: reviewCard.progress.due,
      stability: reviewCard.progress.stability,
      difficulty: reviewCard.progress.difficulty,
      elapsed_days: reviewCard.progress.elapsed_days,
      scheduled_days: reviewCard.progress.scheduled_days,
      reps: reviewCard.progress.reps,
      lapses: reviewCard.progress.lapses,
      state: reviewCard.progress.state as State,
      last_review: reviewCard.progress.last_review || undefined
    };

    // Calculate next state
    const schedulingInfo = f.repeat(fsrsCard, now);
    const nextLog = schedulingInfo[rating];

    // Build updated progress
    const updatedProgress: FSRSProgress = {
      card_id: reviewCard.card.id,
      type: reviewCard.type,
      state: nextLog.card.state,
      due: nextLog.card.due,
      stability: nextLog.card.stability,
      difficulty: nextLog.card.difficulty,
      elapsed_days: nextLog.card.elapsed_days,
      scheduled_days: nextLog.card.scheduled_days,
      reps: nextLog.card.reps,
      lapses: nextLog.card.lapses,
      last_review: nextLog.card.last_review || now
    };

    // Save to IndexedDB (Transaction for safety)
    await db.transaction('rw', db.progress, db.history, async () => {
      await db.progress.put(updatedProgress);
      await db.history.add({
        card_id: reviewCard.card.id,
        rating: rating,
        review_duration_ms: durationMs,
        reviewed_at: now
      });
    });

    return updatedProgress;
  }
}
