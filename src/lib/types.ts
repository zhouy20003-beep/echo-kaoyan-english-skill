export type Choice = "A" | "B" | "C" | "D";

export interface ClozeQuestion {
  no: number;
  options: Record<string, string>;
  answer: Choice | null;
}

export interface ClozeSection {
  passage: string;
  questions: ClozeQuestion[];
}

export interface ReadingQuestion {
  no: number;
  stem: string;
  options: Record<string, string>;
  answer: Choice | null;
}

export interface ReadingText {
  textNo: number;
  paragraphs: string[];
  questions: ReadingQuestion[];
}

export interface NewQuestionType {
  kind: "true-false" | "matching" | "other";
  directions: string;
  content: string;
  items: { no: number; text: string }[];
  answers: Record<string, string>;
}

export interface TranslationSection {
  source: string;
  reference: string;
}

export interface WritingTask {
  text: string;
  material: string;
}

export interface WritingSection {
  partA: WritingTask;
  partB: WritingTask;
}

export interface Paper {
  year: number;
  cloze: ClozeSection;
  readings: ReadingText[];
  newQuestionType: NewQuestionType;
  translation: TranslationSection;
  writing: WritingSection;
  stats: { cloze: number; reading: number; newQuestionType: number };
}

export interface PaperMeta {
  exam: string;
  examLabel: string;
  years: number[];
  latestYear: number;
  earliestYear: number;
  perYear: { year: number; cloze: number; reading: number; newQuestionType: number }[];
  generatedAt: string;
  totals: {
    years: number;
    clozeQuestions: number;
    readingQuestions: number;
    nqtQuestions: number;
  };
  warnings: string[];
}

export type AttemptKind = "reading" | "cloze" | "translation" | "writing" | "mock" | "ask";

export interface Attempt {
  id: string;
  userId: string;
  kind: AttemptKind;
  paperYear: number | null;
  itemKey: string;
  score: number | null;
  maxScore: number | null;
  correct: number | null;
  total: number | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface WrongItem {
  id: string;
  userId: string;
  kind: AttemptKind;
  paperYear: number;
  itemKey: string;
  questionNo: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  kind: AttemptKind;
  paperYear: number;
  itemKey: string;
  questionNo: number | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
