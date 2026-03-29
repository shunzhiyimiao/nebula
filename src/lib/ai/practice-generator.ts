/**
 * 智能练习题生成器
 *
 * 基于课纲约束 + 用户薄弱知识点，调用 AI 生成结构化练习题。
 */

import type { Grade, Subject } from "@prisma/client";
import { callAI } from "./client";
import { getCurriculumScope } from "@/lib/curriculum";

export interface GeneratedQuestion {
  questionText: string;
  questionLatex?: string;
  questionType: "CHOICE" | "FILL_BLANK" | "SHORT_ANSWER" | "CALCULATION";
  options?: string[];
  answer: string;
  explanation: string;
  knowledgePoint?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

interface GenerateOptions {
  type: "daily" | "review" | "targeted";
  grade: Grade | null | undefined;
  subject: Subject;
  count: number;
  /** 针对某知识点的专项练习 */
  targetKnowledgePoint?: string;
  /** 用户薄弱知识点列表（来自错题本） */
  weakPoints?: string[];
  /** 错题样本（用于 review 模式提供上下文） */
  errorSamples?: string[];
}

/** 生成练习题，返回题目数组 */
export async function generatePracticeQuestions(
  opts: GenerateOptions
): Promise<GeneratedQuestion[]> {
  const curriculumScope = getCurriculumScope(opts.grade, opts.subject);

  const typeDesc =
    opts.type === "daily"
      ? "每日综合练习（难度均衡，涵盖最近学习内容）"
      : opts.type === "review"
      ? "错题复习（针对用户的薄弱知识点，帮助巩固）"
      : `专项练习（聚焦于「${opts.targetKnowledgePoint || "指定知识点"}」）`;

  const weakPointsSection =
    opts.weakPoints && opts.weakPoints.length > 0
      ? `\n用户薄弱知识点（优先从这些点出题）：\n${opts.weakPoints.map((w) => `- ${w}`).join("\n")}`
      : "";

  const errorSamplesSection =
    opts.errorSamples && opts.errorSamples.length > 0
      ? `\n用户近期错题示例（参考题型和难度，不要重复原题）：\n${opts.errorSamples.slice(0, 5).map((e, i) => `${i + 1}. ${e}`).join("\n")}`
      : "";

  const system = `你是一名专业的中学数学/学科出题教师。你的任务是为学生生成练习题。

【严格约束】
1. 所有题目必须严格在以下课纲范围内，不得出现超纲内容：
${curriculumScope}

2. 题目类型分配建议：
   - CHOICE（单选）：占30%，设置4个选项（A/B/C/D），选项用"A. xxx"格式
   - FILL_BLANK（填空）：占30%，答案精确（数字/表达式）
   - CALCULATION（计算/解题）：占40%，要求写出完整解题步骤

3. 难度分布：EASY 20%，MEDIUM 60%，HARD 20%

4. 所有数学表达式必须用 $...$ 包裹（行内）或 $$...$$ 包裹（独立行）。
   例如：$x^2 - 3x + 2 = 0$，不写 x^2-3x+2=0

5. 选项字段：只有 CHOICE 题才填写 options 数组，其他类型 options 为 null

【输出格式】
返回严格的 JSON 数组，不包含任何其他文字说明：
[
  {
    "questionText": "题目文字描述（含 $LaTeX$）",
    "questionLatex": "独立公式块（可选，如题目有大型公式）",
    "questionType": "CHOICE|FILL_BLANK|SHORT_ANSWER|CALCULATION",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"] 或 null,
    "answer": "正确答案（CHOICE题填A/B/C/D，其他填具体答案含LaTeX）",
    "explanation": "详细解题过程（含 $LaTeX$，步骤清晰）",
    "knowledgePoint": "本题考查的核心知识点",
    "difficulty": "EASY|MEDIUM|HARD"
  }
]`;

  const userPrompt = `练习类型：${typeDesc}
题目数量：${opts.count} 题
${weakPointsSection}${errorSamplesSection}

请生成 ${opts.count} 道符合以上要求的练习题，以 JSON 数组格式返回。`;

  const raw = await callAI({
    system,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 6000,
  });

  return parseQuestions(raw, opts.count);
}

/** 解析 AI 返回的 JSON，带容错 */
function parseQuestions(raw: string, expectedCount: number): GeneratedQuestion[] {
  // 提取 JSON 数组部分（AI 可能会在前后加说明文字）
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("AI 返回格式错误：未找到 JSON 数组");

  let questions: GeneratedQuestion[];
  try {
    questions = JSON.parse(match[0]);
  } catch {
    throw new Error("AI 返回 JSON 解析失败");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("AI 未返回有效题目");
  }

  // 基本校验：过滤掉缺少必填字段的题目
  const valid = questions.filter(
    (q) =>
      q.questionText &&
      q.questionType &&
      ["CHOICE", "FILL_BLANK", "SHORT_ANSWER", "CALCULATION"].includes(q.questionType) &&
      q.answer &&
      q.explanation
  );

  if (valid.length === 0) throw new Error("AI 返回的题目格式不符合要求");

  return valid.slice(0, expectedCount);
}
