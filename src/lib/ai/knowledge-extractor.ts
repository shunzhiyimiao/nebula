import { callAI } from "./client";
import type { Subject } from "@/types/question";

const KNOWLEDGE_SYSTEM_PROMPT = `你是一个教育知识点专家。
根据给定的知识点名称和学科，生成一份完整的知识卡片内容。

严格按以下 JSON 格式输出：
{
  "name": "知识点名称",
  "definition": "简洁清晰的定义（1-3句话）",
  "formulas": ["相关公式的LaTeX表示（如有）"],
  "keyPoints": ["重点注意事项1", "重点注意事项2"],
  "examples": [
    {
      "question": "一道典型例题",
      "solution": "简要解答过程",
      "latex": "关键公式（可选）"
    }
  ],
  "commonMistakes": ["常见错误1", "常见错误2"],
  "relatedPoints": ["关联知识点1", "关联知识点2"]
}

要求:
- 内容要适合中小学生理解
- 公式使用 LaTeX 格式
- 例题要典型且有代表性
- 常见错误要具体实用`;

export interface KnowledgeCardContent {
  name: string;
  definition: string;
  formulas: string[];
  keyPoints: string[];
  examples: { question: string; solution: string; latex?: string }[];
  commonMistakes: string[];
  relatedPoints: string[];
}

/** 为知识点生成卡片内容 */
export async function generateKnowledgeCard(
  pointName: string,
  subject: Subject,
  grade?: string
): Promise<KnowledgeCardContent> {
  const raw = await callAI({
    system: KNOWLEDGE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `学科: ${subject}\n${grade ? `年级: ${grade}\n` : ""}知识点: ${pointName}\n\n请生成该知识点的完整知识卡片内容。`,
      },
    ],
    maxTokens: 2048,
  });

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("知识卡片生成失败");
  }

  return JSON.parse(jsonMatch[0]) as KnowledgeCardContent;
}
