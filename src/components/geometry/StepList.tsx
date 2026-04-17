"use client";

import { cn } from "@/lib/utils";
import type { GeometryStep } from "@/types/geometry";

interface StepListProps {
  steps: GeometryStep[];
  currentStep: number;
  onStepClick: (idx: number) => void;
}

export default function StepList({ steps, currentStep, onStepClick }: StepListProps) {
  return (
    <div className="space-y-1.5">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isDone = idx < currentStep;
        return (
          <button
            key={step.id}
            onClick={() => onStepClick(idx)}
            className={cn(
              "w-full text-left rounded-xl px-3 py-2.5 transition-all border",
              isActive
                ? "border-nebula-400 bg-nebula-50/60 shadow-sm"
                : isDone
                  ? "border-transparent bg-emerald-50/40"
                  : "border-transparent bg-gray-50 hover:bg-gray-100/60"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                isActive
                  ? "bg-nebula-500 text-white"
                  : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-500"
              )}>
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isActive ? "text-nebula-700" : isDone ? "text-emerald-700" : "text-gray-600"
                )}>
                  {step.title}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{step.desc}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
