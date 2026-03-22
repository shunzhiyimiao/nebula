"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import type { Subject, SolutionStep } from "@/types/question";
import { clientCallAIStream, clientCallAIWithImage } from "@/lib/ai/client-caller";

type Stage = "upload" | "text-input" | "preview" | "ocr" | "solving" | "result";

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

interface OcrResult {
  questionText: string;
  questionLatex: string | null;
  questionType: string;
  subject: Subject;
  options: string[] | null;
  confidence: number;
}

interface ScanContextValue {
  // 页面阶段
  stage: Stage;
  setStage: (s: Stage) => void;
  // 图片
  imageData: string | null;
  setImageData: (d: string | null) => void;
  // OCR
  ocrResult: OcrResult | null;
  ocrLoading: boolean;
  ocrError: string | null;
  // 题目
  selectedSubject: Subject;
  setSelectedSubject: (s: Subject) => void;
  userAnswer: string;
  setUserAnswer: (a: string) => void;
  editedQuestion: string;
  setEditedQuestion: (q: string) => void;
  // Solver
  solver: SolverState & { solve: (params: SolveParams) => Promise<void>; reset: () => void };
  // 操作
  handleOcr: () => Promise<void>;
  handleReset: () => void;
}

interface SolveParams {
  questionText: string;
  questionLatex?: string;
  questionType?: string;
  subject: Subject;
  grade?: string;
  userAnswer?: string;
  options?: string[];
}

function buildSystemPrompt(subject: string, hasError: boolean, grade?: string): string {
  const nonAcademicRule = `首先判断用户输入是否为学科作业题目（数学、物理、化学、语文、英语、生物、历史、地理、政治等）。
如果不是学科题目（如闲聊、违规内容、与学习无关的问题），请拒绝回答，输出：
===JSON_START===
{"notAcademic":true,"message":"这不是一道学科题目，我只能帮助解答数学、物理、化学等学科的作业题哦～"}
===JSON_END===
不要输出其他任何内容。

如果是学科题目，继续按以下要求解答：`;

  if (hasError) {
    return `你是一位经验丰富的${subject}老师，专门辅导中小学生。${grade ? `学生年级: ${grade}` : ""}
${nonAcademicRule}
学生做了这道题但答错了，请先分析错误原因，再给出正确解法。
数学公式用 $...$ 或 $$...$$ LaTeX格式，分步讲解标注 **Step N: 标题**。
最后在末尾输出：
===JSON_START===
{"errorAnalysis":{"errorType":"...","reason":"...","correction":"..."},"steps":[{"order":1,"title":"...","content":"...","latex":"..."}],"knowledgePoints":[{"name":"...","isMain":true}],"keyFormulas":["..."],"difficulty":"EASY|MEDIUM|HARD","answer":"..."}
===JSON_END===`;
  }
  return `你是一位经验丰富的${subject}老师，专门辅导中小学生。${grade ? `学生年级: ${grade}` : ""}
${nonAcademicRule}
请详细解答题目，数学公式用 $...$ 或 $$...$$ LaTeX格式，分步讲解标注 **Step N: 标题**。
最后在末尾输出：
===JSON_START===
{"steps":[{"order":1,"title":"...","content":"...","latex":"..."}],"knowledgePoints":[{"name":"...","isMain":true}],"keyFormulas":["..."],"difficulty":"EASY|MEDIUM|HARD","answer":"..."}
===JSON_END===`;
}

const ScanContext = createContext<ScanContextValue | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>("upload");
  const [imageData, setImageData] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject>("MATH");
  const [userAnswer, setUserAnswer] = useState("");
  const [editedQuestion, setEditedQuestion] = useState("");

  const [solverState, setSolverState] = useState<SolverState>({
    status: "idle",
    streamText: "",
    structuredData: null,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const handleOcr = useCallback(async () => {
    if (!imageData) return;
    setOcrLoading(true);
    setOcrError(null);
    setStage("ocr");

    try {
      const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
      const raw = await clientCallAIWithImage({
        system: `你是题目识别系统，从图片中提取题目内容，严格按JSON格式输出，不要输出其他内容。
注意：questionText必须是纯文本，不含任何LaTeX或$符号；数学公式只放在questionLatex字段中。
{"questionText":"题目纯文本无公式符号","questionLatex":"完整LaTeX版本(无公式则null)","questionType":"CHOICE|FILL_BLANK|SHORT_ANSWER|CALCULATION|OTHER","subject":"MATH|CHINESE|ENGLISH|PHYSICS|CHEMISTRY|BIOLOGY|HISTORY|GEOGRAPHY|POLITICS","options":["A...."]或null,"confidence":0.95}`,
        prompt: "请识别图片中的题目，按JSON格式输出。questionText只能是纯文本。",
        imageBase64: base64,
        mediaType: "image/jpeg",
        maxTokens: 4096,
      });

      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("识别结果解析失败，请重试");
      const data = JSON.parse(match[0]);

      setOcrResult(data);
      setEditedQuestion(data.questionText || "");
      if (data.subject) setSelectedSubject(data.subject as Subject);
      setStage("preview");
    } catch (err) {
      setOcrError((err as Error).message);
      setStage("preview");
    } finally {
      setOcrLoading(false);
    }
  }, [imageData]);

  const solve = useCallback(async (params: SolveParams) => {
    abortRef.current?.abort();
    setSolverState({ status: "loading", streamText: "", structuredData: null, error: null });

    try {
      let userMessage = `请解答以下题目：\n\n${params.questionText}`;
      if (params.questionLatex) userMessage += `\n\nLaTeX格式：${params.questionLatex}`;
      if (params.options) userMessage += `\n\n选项：\n${params.options.join("\n")}`;
      if (params.userAnswer) userMessage += `\n\n学生的答案：${params.userAnswer}`;

      const stream = clientCallAIStream({
        system: buildSystemPrompt(params.subject, !!params.userAnswer, params.grade),
        messages: [{ role: "user", content: userMessage }],
        maxTokens: 4096,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      setSolverState((prev) => ({ ...prev, status: "streaming" }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setSolverState((prev) => ({ ...prev, streamText: fullText }));
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch {}
        }
      }

      const jsonMatch = fullText.match(/===JSON_START===([\s\S]*?)===JSON_END===/);
      let structured = null;
      if (jsonMatch?.[1]) {
        try { structured = JSON.parse(jsonMatch[1].trim()); } catch {}
      }

      // 非学科题目：直接返回提示信息作为错误
      if (structured?.notAcademic) {
        setSolverState({ status: "error", streamText: "", structuredData: null, error: structured.message });
        return;
      }

      const cleanText = fullText.replace(/===JSON_START===[\s\S]*?===JSON_END===/, "").trim();
      setSolverState({ status: "done", streamText: cleanText, structuredData: structured, error: null });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setSolverState((prev) => ({ ...prev, status: "error", error: (err as Error).message || "解题失败" }));
    }
  }, []);

  const resetSolver = useCallback(() => {
    abortRef.current?.abort();
    setSolverState({ status: "idle", streamText: "", structuredData: null, error: null });
  }, []);

  const handleReset = useCallback(() => {
    setStage("upload");
    setImageData(null);
    setOcrResult(null);
    setOcrError(null);
    setUserAnswer("");
    setEditedQuestion("");
    resetSolver();
  }, [resetSolver]);

  return (
    <ScanContext.Provider value={{
      stage, setStage,
      imageData, setImageData,
      ocrResult, ocrLoading, ocrError,
      selectedSubject, setSelectedSubject,
      userAnswer, setUserAnswer,
      editedQuestion, setEditedQuestion,
      solver: { ...solverState, solve, reset: resetSolver },
      handleOcr,
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
