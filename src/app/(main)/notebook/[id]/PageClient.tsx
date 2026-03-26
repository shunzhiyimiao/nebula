"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import MathRenderer from "@/components/scan/MathRenderer";
import SolutionDemo from "@/components/notebook/SolutionDemo";
import KnowledgePopover from "@/components/knowledge/KnowledgePopover";
import { cn } from "@/lib/utils";

const ERROR_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  CONCEPT_CONFUSION: { label: "概念混淆", icon: "🔀" },
  FORMULA_ERROR: { label: "公式记错", icon: "📝" },
  CALCULATION_MISTAKE: { label: "计算失误", icon: "🔢" },
  LOGIC_ERROR: { label: "逻辑错误", icon: "🧩" },
  MISSING_CONDITION: { label: "遗漏条件", icon: "🔍" },
  METHOD_WRONG: { label: "方法错误", icon: "🚫" },
  CARELESS: { label: "粗心大意", icon: "😅" },
  NOT_UNDERSTOOD: { label: "完全不会", icon: "❓" },
};

const MASTERY_OPTIONS = [
  { value: "NOT_MASTERED", label: "未掌握", color: "bg-red-50 text-wrong border-red-200" },
  { value: "PARTIAL", label: "部分掌握", color: "bg-amber-50 text-partial border-amber-200" },
  { value: "MASTERED", label: "已掌握", color: "bg-emerald-50 text-correct border-emerald-200" },
];

export default function NotebookDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mastery, setMastery] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [savingMastery, setSavingMastery] = useState(false);

  useEffect(() => {
    fetch(`/api/notebook/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setMastery(res.data.masteryLevel);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleMasteryChange = async (value: string) => {
    setMastery(value);
    setSavingMastery(true);
    await fetch(`/api/notebook/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masteryLevel: value, incrementReview: true }),
    });
    setSavingMastery(false);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="错题详情" showBack />
        <div className="px-4 pt-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[var(--color-border-light)] animate-pulse">
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="错题详情" showBack />
        <div className="px-4 pt-16 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">错题不存在</p>
        </div>
      </div>
    );
  }

  const errorTypeInfo = ERROR_TYPE_LABELS[data.errorType] || { label: data.errorType || "未知", icon: "⚠️" };
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const keyFormulas = Array.isArray(data.keyFormulas) ? data.keyFormulas : [];
  const knowledgePoints = data.knowledgePoints || [];
  const correctAnswer = (data.solution as any)?.answer || steps[steps.length - 1]?.latex || "—";

  return (
    <div>
      <PageHeader title="错题详情" showBack />

      <div className="px-4 pt-5 space-y-4 animate-fade-in">

        {/* Original Question */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">📄 原题</h3>
          <MathRenderer content={data.questionText} className="text-base font-medium leading-relaxed" />
          {data.questionLatex && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 text-center border border-[var(--color-border-light)]">
              <MathRenderer content={data.questionLatex} />
            </div>
          )}
        </section>

        {/* Answer Comparison */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-red-50/70 rounded-xl p-4 border border-red-100/60">
            <div className="text-[10px] font-medium text-wrong/70 uppercase mb-1.5">❌ 你的答案</div>
            <MathRenderer content={data.userAnswer || "未作答"} className="text-sm font-semibold text-red-800" />
          </div>
          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-100/60">
            <div className="text-[10px] font-medium text-correct/70 uppercase mb-1.5">✅ 正确答案</div>
            <MathRenderer content={correctAnswer} className="text-sm font-semibold text-emerald-800" />
          </div>
        </section>

        {/* Error Analysis */}
        {data.errorReason && (
          <section className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100/60">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{errorTypeInfo.icon}</span>
              <h3 className="text-sm font-semibold text-orange-800">错因分析</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 font-medium">
                {errorTypeInfo.label}
              </span>
            </div>
            <MathRenderer content={data.errorReason} className="text-sm leading-relaxed text-orange-900/80" />
          </section>
        )}

        {/* Solution Demo Toggle */}
        {steps.length > 0 && (
          <>
            <button
              onClick={() => setShowDemo(!showDemo)}
              className={cn(
                "w-full h-12 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                showDemo
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-correct text-white shadow-lg shadow-emerald-500/20"
              )}
            >
              {showDemo ? "收起解法演示 ▲" : "▶ 查看正确解法演示"}
            </button>
            {showDemo && <SolutionDemo steps={steps} autoPlay />}
          </>
        )}

        {/* Key Formulas */}
        {keyFormulas.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
            <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">📐 关键公式</h3>
            <div className="space-y-2.5">
              {keyFormulas.map((f: string, i: number) => (
                <div key={i} className="bg-nebula-50/50 rounded-xl p-3 border border-nebula-100/40 text-center">
                  <MathRenderer content={`$$${f}$$`} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Knowledge Points */}
        {knowledgePoints.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
            <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">🃏 涉及知识点</h3>
            <div className="flex flex-wrap gap-2">
              {knowledgePoints.map((qkp: any) => (
                <KnowledgePopover
                  key={qkp.knowledgePoint?.id || qkp.knowledgePointId}
                  name={qkp.knowledgePoint?.name || ""}
                  isMain={qkp.isMainPoint}
                />
              ))}
            </div>
          </section>
        )}

        {/* Mastery Self-Assessment */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">📊 掌握度评估</h3>
          <div className="flex gap-2">
            {MASTERY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleMasteryChange(opt.value)}
                disabled={savingMastery}
                className={cn(
                  "flex-1 h-10 rounded-xl text-sm font-medium border-2 transition-all",
                  mastery === opt.value
                    ? opt.color + " shadow-sm"
                    : "bg-white border-[var(--color-border-light)] text-[var(--color-text-tertiary)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2 text-center">
            已复习 {data.reviewCount ?? 0} 次 · 点击标记你的掌握程度
          </p>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Link
            href={`/practice?type=targeted&kp=${encodeURIComponent(knowledgePoints[0]?.knowledgePoint?.name || "")}`}
            className="flex-1 h-11 rounded-xl bg-nebula-gradient text-white font-medium text-sm shadow-sm flex items-center justify-center gap-1.5"
          >
            📋 做变式练习
          </Link>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
