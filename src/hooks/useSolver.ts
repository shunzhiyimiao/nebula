"use client";

import { useState, useCallback, useRef } from "react";
import type { Subject, SolutionStep } from "@/types/question";
import { clientCallAIStream } from "@/lib/ai/client-caller";

function buildSystemPrompt(subject: string, hasError: boolean, grade?: string): string {
  if (hasError) {
    return `你是一位经验丰富的${subject}老师，专门辅导中小学生。${grade ? `学生年级: ${grade}` : ""}
学生做了这道题但答错了，请先分析错误原因，再给出正确解法。
数学公式用 $...$ 或 $$...$$ LaTeX格式，分步讲解标注 **Step N: 标题**。
最后在末尾输出：
===JSON_START===
{"errorAnalysis":{"errorType":"...","reason":"...","correction":"..."},"steps":[{"order":1,"title":"...","content":"...","latex":"..."}],"knowledgePoints":[{"name":"...","isMain":true}],"keyFormulas":["..."],"difficulty":"EASY|MEDIUM|HARD","answer":"..."}
===JSON_END===`;
  }
  return `你是一位经验丰富的${subject}老师，专门辅导中小学生。${grade ? `学生年级: ${grade}` : ""}
请详细解答题目，数学公式用 $...$ 或 $$...$$ LaTeX格式，分步讲解标注 **Step N: 标题**。
最后在末尾输出：
===JSON_START===
{"steps":[{"order":1,"title":"...","content":"...","latex":"..."}],"knowledgePoints":[{"name":"...","isMain":true}],"keyFormulas":["..."],"difficulty":"EASY|MEDIUM|HARD","answer":"..."}
===JSON_END===`;
}

export interface SolverState {
  status: "idle" | "loading" | "streaming" | "done" | "error";
  streamText: string;
  structuredData: {
    steps?: SolutionStep[];
    knowledgePoints?: { name: string; isMain: boolean }[];
    keyFormulas?: string[];
    difficulty?: string;
    answer?: string;
    errorAnalysis?: {
      errorType: string;
      reason: string;
      correction: string;
    };
  } | null;
  error: string | null;
}

export function useSolver() {
  const [state, setState] = useState<SolverState>({
    status: "idle",
    streamText: "",
    structuredData: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const solve = useCallback(
    async (params: {
      questionText: string;
      questionLatex?: string;
      questionType?: string;
      subject: Subject;
      grade?: string;
      userAnswer?: string;
      options?: string[];
    }) => {
      abortRef.current?.abort();

      setState({
        status: "loading",
        streamText: "",
        structuredData: null,
        error: null,
      });

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
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let fullText = "";

        setState((prev) => ({ ...prev, status: "streaming" }));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setState((prev) => ({
                  ...prev,
                  streamText: fullText,
                }));
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // 可能是不完整的JSON，忽略
              if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                // 真正的错误
              }
            }
          }
        }

        // 流结束后提取结构化数据
        const jsonMatch = fullText.match(
          /===JSON_START===([\s\S]*?)===JSON_END===/
        );
        let structured = null;
        if (jsonMatch?.[1]) {
          try {
            structured = JSON.parse(jsonMatch[1].trim());
          } catch {
            // 忽略
          }
        }

        // 清理显示文本（移除 JSON 块）
        const cleanText = fullText
          .replace(/===JSON_START===[\s\S]*?===JSON_END===/, "")
          .trim();

        setState({
          status: "done",
          streamText: cleanText,
          structuredData: structured,
          error: null,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          status: "error",
          error: (err as Error).message || "解题失败",
        }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      status: "idle",
      streamText: "",
      structuredData: null,
      error: null,
    });
  }, []);

  return { ...state, solve, reset };
}
