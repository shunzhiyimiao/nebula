import { callAIWithImage } from "./client";

const OCR_SYSTEM_PROMPT = `你是一个专业的题目识别系统，专门为中小学教育服务。
你的任务是从图片中准确提取题目内容。

输出要求：
1. 准确识别文字，包括手写体和印刷体
2. 数学公式用 LaTeX 格式表示
3. 保持题目的原始结构（选项、小题等）
4. 识别题目类型
5. 推断学科

严格按以下 JSON 格式输出，不要输出其他内容：
{
  "questionText": "题目的纯文本版本（数学符号用文字描述）",
  "questionLatex": "题目的 LaTeX 版本（如果包含数学公式）",
  "questionType": "CHOICE | MULTI_CHOICE | FILL_BLANK | SHORT_ANSWER | CALCULATION | PROOF | APPLICATION | TRUE_FALSE | OTHER",
  "subject": "MATH | CHINESE | ENGLISH | PHYSICS | CHEMISTRY | BIOLOGY | HISTORY | GEOGRAPHY | POLITICS",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "hasMultipleQuestions": false,
  "confidence": 0.95
}

注意：
- options 仅在选择题时提供，否则为 null
- confidence 表示识别置信度（0-1）
- 如果图片模糊或无法识别，confidence 设为较低值，并在 questionText 中标注不确定的部分用 [?] 表示`;

export interface OcrResult {
  questionText: string;
  questionLatex: string | null;
  questionType: string;
  subject: string;
  options: string[] | null;
  hasMultipleQuestions: boolean;
  confidence: number;
}

export async function recognizeQuestion(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg"
): Promise<OcrResult> {
  console.log("[OCR] 开始识别, mediaType:", mediaType, "base64长度:", imageBase64.length);
  const raw = await callAIWithImage({
    system: OCR_SYSTEM_PROMPT,
    prompt: "请识别图片中的题目内容，按要求的JSON格式输出。",
    imageBase64,
    mediaType,
    maxTokens: 8192,
  });

  console.log("[OCR] AI原始回复:", raw.slice(0, 500));
  // 提取 JSON
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("OCR 结果解析失败: 无法提取 JSON");
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as OcrResult;
    return parsed;
  } catch {
    throw new Error("OCR 结果解析失败: JSON 格式错误");
  }
}
