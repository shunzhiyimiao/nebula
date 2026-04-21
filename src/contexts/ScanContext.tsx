"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import type { Subject, SolutionStep } from "@/types/question";
import type { GeometrySolution } from "@/types/geometry";
import { clientCallAIStream, clientCallAIWithImage } from "@/lib/ai/client-caller";
import { GEOMETRY_SYSTEM_PROMPT, isGeometryQuestion } from "@/lib/geometry-prompt";

const ACTION_TYPE_TITLE: Record<string, string> = {
  midpoint: "取中点",
  perpendicular_foot: "作垂足",
  intersection: "求交点",
  angle_bisector: "角平分线",
  parallel: "作平行线",
  segment: "画线段",
  mark_equal: "标记等量",
  fill_polygon: "高亮区域",
  right_angle: "标直角",
  mark_angle: "标记角",
  emphasize: "强调",
  label: "添加标注",
};

/**
 * 修复 LLM 返回的不合法 JSON 字符串，常见问题：
 * - 字符串里有裸换行/制表符（应该是 \n / \t）
 * - 字符串里 LaTeX 反斜杠没 double-escape（\triangle 应该是 \\triangle，\( 应该是 \\( ）
 * 策略：走一遍字符，遇到字符串内的裸控制字符或裸反斜杠（且下一个不是合法 JSON 转义字符）就补一个反斜杠。
 * 这样牺牲了 "LLM 正确输出 \t 作为 tab" 的能力（极罕见），换取 LaTeX 场景的稳健性。
 */
function repairLLMJson(raw: string): string {
  let out = "";
  let inString = false;
  let i = 0;
  while (i < raw.length) {
    const c = raw[i];
    if (!inString) {
      out += c;
      if (c === '"') inString = true;
      i++;
      continue;
    }
    // inside string
    if (c === '"') {
      out += c;
      inString = false;
      i++;
      continue;
    }
    if (c === "\n") { out += "\\n"; i++; continue; }
    if (c === "\r") { out += "\\r"; i++; continue; }
    if (c === "\t") { out += "\\t"; i++; continue; }
    if (c === "\\") {
      const next = raw[i + 1];
      // \" 和 \\ 认为是 LLM 正确转义，保留
      if (next === '"' || next === "\\") {
        out += c + next;
        i += 2;
        continue;
      }
      // 其他全部视作 LLM 忘了转义，补一个反斜杠
      out += "\\\\";
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** 兼容 LLM 把 action 字段平铺到 step 上的情况，规范化为标准 schema */
function normalizeGeometrySolution(raw: unknown): GeometrySolution | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!obj.base || !Array.isArray(obj.steps)) return null;

  const normalizedSteps = (obj.steps as unknown[]).map((rawStep, idx) => {
    if (!rawStep || typeof rawStep !== "object") {
      return { id: idx + 1, title: `步骤 ${idx + 1}`, desc: "", explanation: "", actions: [] };
    }
    const step = rawStep as Record<string, unknown>;

    if (Array.isArray(step.actions)) {
      return {
        id: typeof step.id === "number" ? step.id : idx + 1,
        title: typeof step.title === "string" ? step.title : `步骤 ${idx + 1}`,
        desc: typeof step.desc === "string" ? step.desc : "",
        explanation: typeof step.explanation === "string" ? step.explanation : "",
        actions: step.actions,
      };
    }

    if (typeof step.type === "string") {
      const { explanation, title, desc, ...actionFields } = step;
      return {
        id: idx + 1,
        title: typeof title === "string" ? title : ACTION_TYPE_TITLE[step.type] ?? `步骤 ${idx + 1}`,
        desc: typeof desc === "string" ? desc : "",
        explanation: typeof explanation === "string" ? explanation : "",
        actions: [actionFields],
      };
    }

    return { id: idx + 1, title: `步骤 ${idx + 1}`, desc: "", explanation: "", actions: [] };
  });

  return { ...(obj as object), steps: normalizedSteps } as GeometrySolution;
}

/** 拍照 → OCR → 确认 → 解题 → 结果 */
export type Stage = "empty" | "ocr" | "confirm" | "solving" | "result";

type SolverStatus = "idle" | "loading" | "streaming" | "done" | "error";

interface SolverState {
  status: SolverStatus;
  streamText: string;
  structuredData: {
    steps?: SolutionStep[];
    knowledgePoints?: { name: string; isMain: boolean }[];
    keyFormulas?: string[];
    difficulty?: string;
    answer?: string;
    errorAnalysis?: { errorType: string; reason: string; correction: string };
  } | null;
  error: string | null;
}

export interface OcrResult {
  questionText: string;
  questionLatex: string | null;
  questionType: string;
  subject: Subject;
  options: string[] | null;
  confidence: number;
}

interface ScanContextValue {
  stage: Stage;
  imageData: string | null;
  ocrResult: OcrResult | null;
  ocrLoading: boolean;
  ocrError: string | null;
  solver: SolverState & { reset: () => void };
  geometrySolution: GeometrySolution | null;

  /** 新拍的一张照片（base64 data URL），自动启动 OCR */
  captureImage: (dataUrl: string) => void;
  /** OCR 识别失败时重试（不需要重拍） */
  retryOcr: () => void;
  /** 用户确认 OCR 结果后点"开始解题" */
  startSolve: (grade?: string) => Promise<void>;
  /** 重置所有状态回到初始（用于"重新拍照"） */
  handleReset: () => void;
}

const OCR_SYSTEM_PROMPT = `你是专业的题目识别系统，精确提取图片中的题目内容，严格按JSON格式输出，不输出任何其他内容。

你需要同时支持印刷体和手写体识别。

手写体识别要点：
- 仔细辨认手写笔迹，注意易混淆字符：0与O、1与l与I、2与Z、5与S、6与b、9与q、x与×
- 手写数学符号注意区分：负号(-)与减号(-)与分数线、点乘(·)与小数点(.)、逗号(,)与句号(.)
- 对于潦草字迹，结合上下文和数学逻辑推断正确内容
- 注意手写体中的上下标位置可能不够精确，根据数学语义判断
- 如果图片中同时有印刷题目和手写答案/解题过程，请分别识别并在questionText中标注

字段说明：
- questionText：题目的纯文本描述，公式用自然语言表达（如"1/2 x - 1 = 4/5 - y"），不含$符号
- questionLatex：题目的完整LaTeX版本，【所有】数学表达式（包括简单的方程、多项式、数字运算）都必须用$...$包裹；如题目完全无数学内容则为null
- questionType：CHOICE（选择）|FILL_BLANK（填空）|SHORT_ANSWER（简答）|CALCULATION（计算/解答）|OTHER
- subject：MATH|CHINESE|ENGLISH|PHYSICS|CHEMISTRY|BIOLOGY|HISTORY|GEOGRAPHY|POLITICS
- options：选择题选项数组如["A. ...", "B. ..."]，非选择题为null
- confidence：识别置信度0-1（手写体模糊时适当降低置信度）

LaTeX规范：
- 分数用\\frac{分子}{分母}
- 上标用^{}，下标用_{}
- 根号用\\sqrt{}
- 乘号用\\times，除号用\\div
- 方程组用\\begin{cases}...\\end{cases}

输出格式（严格JSON）：
{"questionText":"...","questionLatex":"...","questionType":"...","subject":"...","options":null,"confidence":0.95}`;

function buildSystemPrompt(subject: string, grade?: string): string {
  const nonAcademicRule = `首先判断用户输入是否为学科作业题目（数学、物理、化学、语文、英语、生物、历史、地理、政治等）。
如果不是学科题目（如闲聊、违规内容、与学习无关的问题），请拒绝回答，输出：
===JSON_START===
{"notAcademic":true,"message":"这不是一道学科题目，我只能帮助解答数学、物理、化学等学科的作业题哦～"}
===JSON_END===
不要输出其他任何内容。

如果是学科题目，继续按以下要求解答：`;

  const mathRule = `所有数学表达式（变量、方程、公式）必须用 $...$ 包裹（行内）或 $$...$$ 包裹（独立行），包括JSON的content字段内也要这样写。例如：content里写"代入得 $x^2-5x+6=0$"而不是"代入得 x^2-5x+6=0"。`;

  return `你是一位经验丰富的${subject}老师，专门辅导中小学生。${grade ? `学生年级: ${grade}` : ""}
${nonAcademicRule}
请详细解答题目，分步讲解标注 **Step N: 标题**。
${mathRule}
最后在末尾输出：
===JSON_START===
{"steps":[{"order":1,"title":"...","content":"content里数学表达式用$...$","latex":"该步骤的核心公式（纯LaTeX无$符号）"}],"knowledgePoints":[{"name":"...","isMain":true}],"keyFormulas":["纯LaTeX"],"difficulty":"EASY|MEDIUM|HARD","answer":"..."}
===JSON_END===`;
}

const SUBJECT_LABEL: Record<string, string> = {
  MATH: "数学", PHYSICS: "物理", CHEMISTRY: "化学",
  ENGLISH: "英语", CHINESE: "语文", BIOLOGY: "生物",
  HISTORY: "历史", GEOGRAPHY: "地理", POLITICS: "政治",
};

const ScanContext = createContext<ScanContextValue | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>("empty");
  const [imageData, setImageData] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const [geometrySolution, setGeometrySolution] = useState<GeometrySolution | null>(null);

  const [solverState, setSolverState] = useState<SolverState>({
    status: "idle",
    streamText: "",
    structuredData: null,
    error: null,
  });

  // 竞态守卫：每次 OCR/solve 分配一个 token，完成时如果 token 过期则忽略结果
  const ocrTokenRef = useRef(0);
  const solveTokenRef = useRef(0);

  const runOcr = useCallback(async (dataUrl: string) => {
    const myToken = ++ocrTokenRef.current;
    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);

    try {
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      const raw = await clientCallAIWithImage({
        system: OCR_SYSTEM_PROMPT,
        prompt: "请仔细识别图片中的全部题目内容。注意：图片可能包含手写文字，请仔细辨认笔迹，结合数学逻辑和上下文推断模糊字符。特别注意数学公式的准确性，按JSON格式输出。",
        imageBase64: base64,
        mediaType: "image/jpeg",
        maxTokens: 4096,
      });

      // 如果在 OCR 过程中用户又拍了新照片，丢弃此次结果
      if (ocrTokenRef.current !== myToken) return;

      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("识别结果解析失败，请重试");
      const data = JSON.parse(match[0]);

      setOcrResult(data);
      setStage("confirm");
    } catch (err) {
      if (ocrTokenRef.current !== myToken) return;
      setOcrError((err as Error).message || "识别失败");
      // 不切换到其他 stage — 留在 "ocr" 让 UI 显示错误 + 重试按钮
    } finally {
      if (ocrTokenRef.current === myToken) {
        setOcrLoading(false);
      }
    }
  }, []);

  const captureImage = useCallback((dataUrl: string) => {
    // 让正在跑的 OCR/solve 失效
    ocrTokenRef.current++;
    solveTokenRef.current++;
    // 重置所有后续 state
    setOcrResult(null);
    setOcrError(null);
    setGeometrySolution(null);
    setSolverState({ status: "idle", streamText: "", structuredData: null, error: null });
    // 设置新图片 + 启动 OCR
    setImageData(dataUrl);
    setStage("ocr");
    runOcr(dataUrl);
  }, [runOcr]);

  const retryOcr = useCallback(() => {
    if (!imageData) return;
    setStage("ocr");
    runOcr(imageData);
  }, [imageData, runOcr]);

  const startSolve = useCallback(async (grade?: string) => {
    if (!ocrResult) return;
    const myToken = ++solveTokenRef.current;

    setStage("solving");
    setSolverState({ status: "loading", streamText: "", structuredData: null, error: null });
    setGeometrySolution(null);

    const isGeometry = isGeometryQuestion(ocrResult.questionText);
    const subjectLabel = SUBJECT_LABEL[ocrResult.subject] || "学科";

    try {
      let userMessage = `请解答以下题目：\n\n${ocrResult.questionText}`;
      if (ocrResult.questionLatex) userMessage += `\n\nLaTeX格式：${ocrResult.questionLatex}`;
      if (ocrResult.options) userMessage += `\n\n选项：\n${ocrResult.options.join("\n")}`;

      const systemPrompt = isGeometry
        ? GEOMETRY_SYSTEM_PROMPT
        : buildSystemPrompt(subjectLabel, grade);

      const stream = clientCallAIStream({
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
        maxTokens: isGeometry ? 8192 : 4096,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      setSolverState((prev) => ({ ...prev, status: "streaming" }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (solveTokenRef.current !== myToken) {
          reader.cancel();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              if (solveTokenRef.current === myToken) {
                setSolverState((prev) => ({ ...prev, streamText: fullText }));
              }
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch {}
        }
      }

      if (solveTokenRef.current !== myToken) return;

      // 几何题：尝试解析为 GeometrySolution
      if (isGeometry) {
        try {
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const rawGeo = JSON.parse(repairLLMJson(jsonMatch[0]));
            const geoData = normalizeGeometrySolution(rawGeo);
            if (geoData?.base?.points && geoData.steps) {
              setGeometrySolution(geoData);
              setSolverState({ status: "done", streamText: fullText, structuredData: null, error: null });
              setStage("result");
              return;
            }
          }
        } catch {
          console.warn("Geometry JSON parse failed, falling back to text solution");
        }
      }

      const jsonMatch = fullText.match(/===JSON_START===([\s\S]*?)===JSON_END===/);
      let structured = null;
      if (jsonMatch?.[1]) {
        try { structured = JSON.parse(repairLLMJson(jsonMatch[1].trim())); } catch {}
      }

      if (structured?.notAcademic) {
        setSolverState({ status: "error", streamText: "", structuredData: null, error: structured.message });
        setStage("result");
        return;
      }

      const cleanText = fullText.replace(/===JSON_START===[\s\S]*?===JSON_END===/, "").trim();
      setSolverState({ status: "done", streamText: cleanText, structuredData: structured, error: null });
      setStage("result");
    } catch (err) {
      if (solveTokenRef.current !== myToken) return;
      if ((err as Error).name === "AbortError") return;
      setSolverState((prev) => ({ ...prev, status: "error", error: (err as Error).message || "解题失败" }));
      setStage("result");
    }
  }, [ocrResult]);

  const resetSolver = useCallback(() => {
    solveTokenRef.current++;
    setSolverState({ status: "idle", streamText: "", structuredData: null, error: null });
  }, []);

  const handleReset = useCallback(() => {
    ocrTokenRef.current++;
    solveTokenRef.current++;
    setStage("empty");
    setImageData(null);
    setOcrResult(null);
    setOcrError(null);
    setGeometrySolution(null);
    setSolverState({ status: "idle", streamText: "", structuredData: null, error: null });
  }, []);

  return (
    <ScanContext.Provider value={{
      stage,
      imageData,
      ocrResult,
      ocrLoading,
      ocrError,
      solver: { ...solverState, reset: resetSolver },
      geometrySolution,
      captureImage,
      retryOcr,
      startSolve,
      handleReset,
    }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScanContext() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScanContext must be used within ScanProvider");
  return ctx;
}
