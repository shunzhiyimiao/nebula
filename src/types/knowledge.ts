import type { Subject, Grade } from "./question";

/** 知识点卡片 */
export interface KnowledgeCardData {
  id: string;
  name: string;
  subject: Subject;
  gradeLevel?: Grade;
  chapter?: string;
  definition: string;
  formulas?: string[];       // LaTeX
  keyPoints?: string[];
  examples?: KnowledgeExample[];
  commonMistakes?: string[];
  relatedPoints?: {
    id: string;
    name: string;
  }[];
  // 用户维度
  userErrorCount?: number;
  userMastery?: number;      // 0-100
}

export interface KnowledgeExample {
  question: string;
  solution: string;
  latex?: string;
}

/** 知识图谱节点 */
export interface KnowledgeGraphNode {
  id: string;
  name: string;
  subject: Subject;
  masteryLevel: number;      // 0-100
  errorCount: number;
  size: number;
}

/** 知识图谱边 */
export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  type: "parent" | "related";
}
