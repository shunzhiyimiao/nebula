import { callAIStream, callAI } from "./client";
import type { Subject } from "@/types/question";

/** 构建解题 System Prompt */
function buildSolveSystemPrompt(subject: string, grade?: string): string {
  return `你是一位经验丰富、循循善诱的${subject}老师，专门辅导中小学生。
${grade ? `学生当前年级: ${grade}` : ""}

你的任务是详细解答学生提出的题目。

## 输出规则

你的回答分为两个部分，用 ===JSON_START=== 和 ===JSON_END=== 包裹结构化数据：

**第一部分**: 自然语言解题过程（流式输出给学生看）
- 使用简洁清晰的语言
- 数学公式使用 $...$ (行内) 或 $$...$$ (独立行) 的 LaTeX 格式
- 分步骤讲解，每步标注 **Step N: 标题**
- 每步后用通俗语言解释"为什么这样做"
- 最后给出完整答案

**第二部分**: 结构化 JSON（放在最后）
===JSON_START===
{
  "steps": [
    {
      "order": 1,
      "title": "步骤标题",
      "content": "步骤内容（纯文本）",
      "latex": "步骤中的关键公式（LaTeX，可选）"
    }
  ],
  "knowledgePoints": [
    { "name": "知识点名称", "isMain": true },
    { "name": "关联知识点", "isMain": false }
  ],
  "keyFormulas": ["关键公式的LaTeX表示"],
  "difficulty": "EASY | MEDIUM | HARD | CHALLENGE",
  "answer": "最终答案的简洁表示"
}
===JSON_END===

## 注意事项
- 语言要适合中小学生理解
- 不要跳过中间步骤
- 涉及公式时务必给出LaTeX格式
- 知识点命名要标准，便于后续匹配知识库`;
}

/** 构建包含错因分析的 System Prompt */
function buildSolveWithErrorSystemPrompt(subject: string, grade?: string): string {
  return `你是一位经验丰富、循循善诱的${subject}老师，专门辅导中小学生。
${grade ? `学生当前年级: ${grade}` : ""}

学生做了这道题但答错了，你的任务是：
1. 先分析学生的错误原因
2. 再给出正确的详细解法

## 输出规则

你的回答分为两部分：

**第一部分**: 自然语言（流式输出）
- 先用 **⚠️ 错因分析** 标题，分析学生为什么错
- 指出具体的错误类型（概念混淆/公式记错/计算失误/逻辑错误/遗漏条件/方法错误/粗心大意/完全不会）
- 然后用 **✅ 正确解法** 标题，分步讲解正确做法
- 数学公式使用 $...$ 或 $$...$$ LaTeX格式
- 每步标注 **Step N: 标题**
- 最后给出答案

**第二部分**: 结构化 JSON
===JSON_START===
{
  "errorAnalysis": {
    "errorType": "CONCEPT_CONFUSION | FORMULA_ERROR | CALCULATION_MISTAKE | LOGIC_ERROR | MISSING_CONDITION | METHOD_WRONG | CARELESS | NOT_UNDERSTOOD",
    "reason": "错误原因的简要描述",
    "correction": "针对性的纠正建议"
  },
  "steps": [
    { "order": 1, "title": "...", "content": "...", "latex": "..." }
  ],
  "knowledgePoints": [
    { "name": "...", "isMain": true }
  ],
  "keyFormulas": ["..."],
  "difficulty": "EASY | MEDIUM | HARD | CHALLENGE",
  "answer": "正确答案"
}
===JSON_END===`;
}

/** 解题请求参数 */
export interface SolveRequest {
  questionText: string;
  questionLatex?: string;
  questionType?: string;
  subject: Subject;
  grade?: string;
  userAnswer?: string;
  options?: string[];
}

/** 流式解题 — 返回 SSE ReadableStream */
export function solveQuestionStream(req: SolveRequest): ReadableStream<Uint8Array> {
  const hasError = !!req.userAnswer;
  const systemPrompt = hasError
    ? buildSolveWithErrorSystemPrompt(req.subject, req.grade)
    : buildSolveSystemPrompt(req.subject, req.grade);

  let userMessage = `请解答以下题目：\n\n${req.questionText}`;
  if (req.questionLatex) {
    userMessage += `\n\nLaTeX格式：${req.questionLatex}`;
  }
  if (req.options) {
    userMessage += `\n\n选项：\n${req.options.join("\n")}`;
  }
  if (req.userAnswer) {
    userMessage += `\n\n学生的答案：${req.userAnswer}`;
  }

  return callAIStream({
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 4096,
  });
}

/** 非流式解题 — 返回完整结果 */
export async function solveQuestion(req: SolveRequest): Promise<{
  text: string;
  structured: Record<string, unknown> | null;
}> {
  const hasError = !!req.userAnswer;
  const systemPrompt = hasError
    ? buildSolveWithErrorSystemPrompt(req.subject, req.grade)
    : buildSolveSystemPrompt(req.subject, req.grade);

  let userMessage = `请解答以下题目：\n\n${req.questionText}`;
  if (req.questionLatex) {
    userMessage += `\n\nLaTeX格式：${req.questionLatex}`;
  }
  if (req.options) {
    userMessage += `\n\n选项：\n${req.options.join("\n")}`;
  }
  if (req.userAnswer) {
    userMessage += `\n\n学生的答案：${req.userAnswer}`;
  }

  const raw = await callAI({
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 4096,
  });

  // 提取结构化 JSON
  const jsonMatch = raw.match(/===JSON_START===([\s\S]*?)===JSON_END===/);
  let structured: Record<string, unknown> | null = null;
  if (jsonMatch?.[1]) {
    try {
      structured = JSON.parse(jsonMatch[1].trim());
    } catch {
      // JSON 解析失败，忽略
    }
  }

  // 提取自然语言部分（去掉 JSON 块）
  const text = raw.replace(/===JSON_START===[\s\S]*?===JSON_END===/, "").trim();

  return { text, structured };
}
