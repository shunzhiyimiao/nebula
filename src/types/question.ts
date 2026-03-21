export type Subject =
  | "MATH" | "CHINESE" | "ENGLISH"
  | "PHYSICS" | "CHEMISTRY" | "BIOLOGY"
  | "HISTORY" | "GEOGRAPHY" | "POLITICS";

export type Grade =
  | "PRIMARY_1" | "PRIMARY_2" | "PRIMARY_3"
  | "PRIMARY_4" | "PRIMARY_5" | "PRIMARY_6"
  | "JUNIOR_1"  | "JUNIOR_2"  | "JUNIOR_3"
  | "SENIOR_1"  | "SENIOR_2"  | "SENIOR_3";

export type QuestionType =
  | "CHOICE" | "MULTI_CHOICE" | "FILL_BLANK"
  | "SHORT_ANSWER" | "CALCULATION" | "PROOF"
  | "APPLICATION" | "TRUE_FALSE" | "OTHER";

export type ErrorType =
  | "CONCEPT_CONFUSION" | "FORMULA_ERROR" | "CALCULATION_MISTAKE"
  | "LOGIC_ERROR" | "MISSING_CONDITION" | "METHOD_WRONG"
  | "CARELESS" | "NOT_UNDERSTOOD" | "OTHER";

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "CHALLENGE";

export type MasteryLevel = "NOT_MASTERED" | "PARTIAL" | "MASTERED";

/** 解题步骤 */
export interface SolutionStep {
  order: number;
  title: string;
  content: string;
  latex?: string;
}

/** AI解题结果 */
export interface AISolution {
  solution: string;
  steps: SolutionStep[];
  knowledgePoints: {
    name: string;
    isMain: boolean;
  }[];
  keyFormulas?: string[];
  difficulty: Difficulty;
  errorAnalysis?: {
    errorType: ErrorType;
    reason: string;
    correction: string;
  };
  similarQuestion?: string;
}

/** 题目记录（前端用） */
export interface QuestionRecord {
  id: string;
  subject: Subject;
  gradeLevel?: Grade;
  questionType: QuestionType;
  originalImage?: string;
  questionText: string;
  questionLatex?: string;
  solution: AISolution;
  solutionText: string;
  steps: SolutionStep[];
  keyFormulas?: string[];
  userAnswer?: string;
  isCorrect?: boolean;
  isInNotebook: boolean;
  errorReason?: string;
  errorType?: ErrorType;
  masteryLevel: MasteryLevel;
  reviewCount: number;
  nextReviewAt?: string;
  difficulty: Difficulty;
  source?: string;
  chapter?: string;
  knowledgePoints: {
    id: string;
    name: string;
    isMainPoint: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}
