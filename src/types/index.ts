export interface KotobaItem {
  id: string;
  kanji: string;
  kana: string;
  romaji: string;
  meaning: string;
  level: string;
  isExtra: boolean;
  priority: number;
  chapter: string;
  type: string;
  transitivity: string | null;
  semantic: string;
}

export interface KanjiItem {
  id: string;
  kanji: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  level: string;
}

export interface BunpouItem {
  id: string;
  chapter: string;
  level: string;
  title: string;
  meaning: string;
  formula_template: string;
  variables: Record<string, any>;
  examples: { jp: string; id: string }[];
  tags: string[];
}

export interface JFTQuestion {
  id: number;
  type: "dokkai" | "choukai" | "gambar" | "standard";
  category: string;
  story: string;
  image: string;
  audio: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

// Database schema types
export interface FSRSProgress {
  card_id: string;      // ID dari kotoba/kanji (contoh: 'ir-a1-01-001')
  type: "kotoba" | "kanji";
  state: number;        // 0=New, 1=Learning, 2=Review, 3=Relearning
  due: Date;            // Tanggal jadwal review selanjutnya
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  last_review: Date | null;
  unmastered?: boolean;
}

export interface ReviewHistory {
  id?: number;          // Auto-increment
  card_id: string;
  rating: number;       // 1=Again, 2=Hard, 3=Good, 4=Easy
  review_duration_ms: number;
  reviewed_at: Date;
}
