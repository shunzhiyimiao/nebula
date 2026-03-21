"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import MathRenderer from "./MathRenderer";
import type { SolutionStep } from "@/types/question";

interface StepByStepProps {
  steps: SolutionStep[];
  className?: string;
}

export default function StepByStep({ steps, className }: StepByStepProps) {
  const [expandedStep, setExpandedStep] = useState<number>(0);

  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <span className="text-base">📝</span>
        分步解题 ({steps.length}步)
      </h3>

      <div className="space-y-2">
        {steps.map((step, i) => {
          const isExpanded = expandedStep >= i;
          const isCurrent = expandedStep === i;

          return (
            <div
              key={step.order || i}
              className={cn(
                "rounded-xl border transition-all overflow-hidden",
                isExpanded
                  ? "border-nebula-200 bg-white shadow-[var(--shadow-sm)]"
                  : "border-[var(--color-border-light)] bg-gray-50/50 opacity-60",
                isCurrent && "ring-2 ring-nebula-200"
              )}
              style={{
                animationDelay: `${i * 150}ms`,
                animationFillMode: "backwards",
              }}
            >
              {/* Step header */}
              <button
                onClick={() => setExpandedStep(i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors",
                    isExpanded
                      ? "bg-nebula-gradient text-white"
                      : "bg-gray-200 text-[var(--color-text-tertiary)]"
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium flex-1",
                    isExpanded ? "text-nebula-800" : "text-[var(--color-text-tertiary)]"
                  )}
                >
                  {step.title}
                </span>
                {isCurrent && (
                  <span className="text-[10px] text-nebula-500 font-medium">当前</span>
                )}
              </button>

              {/* Step content */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in">
                  <div className="ml-10">
                    <MathRenderer
                      content={step.content}
                      className="text-sm leading-relaxed text-[var(--color-text-secondary)]"
                    />
                    {step.latex && (
                      <div className="mt-2 bg-nebula-50/50 rounded-lg p-3 border border-nebula-100/60">
                        <MathRenderer content={`$$${step.latex}$$`} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setExpandedStep(Math.max(0, expandedStep - 1))}
          disabled={expandedStep === 0}
          className={cn(
            "h-9 px-4 rounded-xl text-sm font-medium transition-all",
            expandedStep === 0
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : "bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50"
          )}
        >
          ← 上一步
        </button>

        <span className="text-xs text-[var(--color-text-tertiary)]">
          {expandedStep + 1} / {steps.length}
        </span>

        <button
          onClick={() =>
            setExpandedStep(Math.min(steps.length - 1, expandedStep + 1))
          }
          disabled={expandedStep === steps.length - 1}
          className={cn(
            "h-9 px-4 rounded-xl text-sm font-medium transition-all",
            expandedStep === steps.length - 1
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : "bg-nebula-gradient text-white shadow-sm"
          )}
        >
          下一步 →
        </button>
      </div>
    </div>
  );
}
