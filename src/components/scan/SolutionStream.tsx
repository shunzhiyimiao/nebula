"use client";

import { cn } from "@/lib/utils";
import MathRenderer from "./MathRenderer";

interface SolutionStreamProps {
  text: string;
  status: "loading" | "streaming" | "done" | "error";
  error?: string | null;
}

export default function SolutionStream({ text, status, error }: SolutionStreamProps) {
  if (status === "loading" || status === "streaming") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-nebula-gradient opacity-20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-nebula-gradient flex items-center justify-center shadow-lg shadow-nebula-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="animate-pulse">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">AI 正在分析题目...</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            正在理解题意并构建解题思路
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bg-red-50 rounded-2xl p-5 border border-red-100/60 text-center">
        <div className="text-3xl mb-2">😕</div>
        <p className="text-sm font-medium text-red-800">解题出错了</p>
        <p className="text-xs text-red-600/80 mt-1">{error || "请重试"}</p>
      </div>
    );
  }

  if (!text) return null;

  return (
    <div className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-nebula-50/50 border-b border-[var(--color-border-light)] flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-nebula-gradient flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-nebula-800">AI 解答</span>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <MathRenderer
          content={text}
          className={cn(
            "text-sm leading-relaxed prose-sm",
            "[&_strong]:text-nebula-700 [&_strong]:font-semibold",
            "[&_br]:my-1"
          )}
        />
      </div>
    </div>
  );
}
