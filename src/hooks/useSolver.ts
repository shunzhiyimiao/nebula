"use client";

import { useState, useCallback, useRef } from "react";
import type { Subject, SolutionStep } from "@/types/question";

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
      // 取消之前的请求
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      setState({
        status: "loading",
        streamText: "",
        structuredData: null,
        error: null,
      });

      try {
        const response = await fetch("/api/scan/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
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
