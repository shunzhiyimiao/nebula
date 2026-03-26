"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import MathRenderer from "@/components/scan/MathRenderer";
import type { SolutionStep } from "@/types/question";

interface SolutionDemoProps {
  steps: SolutionStep[];
  autoPlay?: boolean;
  className?: string;
}

/**
 * 解法演示组件 — 逐步动画展示正确解法
 * 支持自动播放和手动控制
 */
export default function SolutionDemo({ steps, autoPlay = false, className }: SolutionDemoProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = 还没开始
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying || currentStep >= steps.length - 1) {
      if (currentStep >= steps.length - 1) setIsPlaying(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  const handlePlay = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(-1);
    }
    setIsPlaying(true);
    setCurrentStep(0);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStepClick = (index: number) => {
    setIsPlaying(false);
    setCurrentStep(index);
  };

  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn("bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-emerald-50/50 border-b border-emerald-100/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-correct/20 flex items-center justify-center">
            <span className="text-xs">✅</span>
          </div>
          <span className="text-sm font-semibold text-emerald-800">正确解法演示</span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center hover:bg-emerald-50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="w-8 h-8 rounded-lg bg-correct text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-correct transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="p-4 space-y-3">
        {steps.map((step, i) => {
          const isVisible = i <= currentStep;
          const isCurrent = i === currentStep;

          return (
            <button
              key={step.order || i}
              onClick={() => handleStepClick(i)}
              className={cn(
                "w-full text-left rounded-xl border p-4 transition-all duration-500",
                isVisible
                  ? isCurrent
                    ? "border-correct/40 bg-emerald-50/50 shadow-sm scale-[1.01]"
                    : "border-[var(--color-border-light)] bg-white opacity-80"
                  : "border-transparent bg-gray-50 opacity-30 scale-[0.98]"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Step number */}
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors duration-500",
                  isVisible
                    ? isCurrent
                      ? "bg-correct text-white"
                      : "bg-emerald-100 text-correct"
                    : "bg-gray-200 text-gray-400"
                )}>
                  {isVisible ? (i < currentStep ? "✓" : i + 1) : i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "text-sm font-semibold transition-colors",
                    isVisible ? "text-[var(--color-text-primary)]" : "text-gray-400"
                  )}>
                    {step.title}
                  </h4>

                  {isVisible && (
                    <div className="mt-1.5 animate-fade-in">
                      <MathRenderer
                        content={step.content}
                        className="text-sm leading-relaxed text-[var(--color-text-secondary)]"
                      />
                      {step.latex && (
                        <div className="mt-2 bg-white rounded-lg p-2.5 border border-emerald-100/60 text-center">
                          <MathRenderer content={
                            step.latex.includes("$") ? step.latex : `$$${step.latex}$$`
                          } />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* Completion message */}
        {currentStep >= steps.length - 1 && (
          <div className="text-center py-3 animate-scale-in">
            <div className="text-2xl mb-1">🎯</div>
            <p className="text-sm font-medium text-correct">解题完成！</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">理解了吗？试试做一道类似的题</p>
          </div>
        )}
      </div>
    </div>
  );
}
