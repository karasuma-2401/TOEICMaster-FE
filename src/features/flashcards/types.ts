export type CardMastery = "new" | "learning" | "review" | "mastered";

export type FlashcardCategory =
  "office" | "contracts" | "finance" | "travel" | "marketing" | "hr" | "custom";

export type CefrLevel = "B1" | "B2" | "C1";

export interface FlashcardItem {
  id: string;
  term: string;
  phonetic: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  collocations: readonly string[];
  toeicPart: string;
  level: CefrLevel;
}

export interface FlashcardDeck {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: FlashcardCategory;
  targetScore: string;
  estimatedMinutes: number;
  isCustom?: boolean;
  cards: readonly FlashcardItem[];
}

export interface CardProgressRecord {
  status: CardMastery;
  starred: boolean;
  reviewCount: number;
  updatedAt: string;
}

export interface FlashcardStoreState {
  progress: Record<string, CardProgressRecord>;
  customDecks: FlashcardDeck[];
}

export interface DeckProgressSummary {
  total: number;
  mastered: number;
  review: number;
  learning: number;
  unseen: number;
  starred: number;
  completionPercent: number;
}

export type StudyMode = "flip" | "quiz" | "match" | "list";

export type CardFilter =
  "all" | "unmastered" | "review" | "mastered" | "starred";

export interface QuizQuestion {
  card: FlashcardItem;
  options: readonly {
    id: string;
    meaningVi: string;
    isCorrect: boolean;
  }[];
}

export interface MatchRecord {
  bestTimeMs: number;
  bestCombo: number;
  playCount: number;
  updatedAt: string;
  isNewRecord?: boolean;
}
