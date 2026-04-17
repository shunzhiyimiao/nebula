"use client";

import type { GeometryStep } from "@/types/geometry";

interface ExplanationPanelProps {
  step: GeometryStep | null;
}

export default function ExplanationPanel({ step }: ExplanationPanelProps) {
  if (!step) return null;

  return (
    <div className="rounded-xl bg-nebula-50/50 border border-nebula-100/60 p-4">
      <h4 className="text-sm font-semibold text-nebula-800 mb-1.5">{step.title}</h4>
      <div
        className="text-sm text-nebula-700/80 leading-relaxed geo-explanation"
        dangerouslySetInnerHTML={{ __html: step.explanation }}
      />
      <style jsx global>{`
        .geo-explanation .math {
          font-family: 'KaTeX_Math', 'Times New Roman', serif;
          font-style: italic;
          color: #4361ee;
        }
        .geo-explanation .highlight {
          font-weight: 600;
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
          padding: 0 4px;
          border-radius: 4px;
        }
        .geo-label {
          font-family: 'KaTeX_Math', 'Times New Roman', serif;
          font-weight: bold;
          color: #334155;
        }
      `}</style>
    </div>
  );
}
