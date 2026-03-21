"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "全部" },
  { value: "NOT_MASTERED", label: "未掌握" },
  { value: "PARTIAL", label: "部分掌握" },
  { value: "MASTERED", label: "已掌握" },
];

const SUBJECT_FILTERS = [
  { value: "all", label: "全部学科" },
  { value: "MATH", label: "📐 数学" },
  { value: "PHYSICS", label: "⚡ 物理" },
  { value: "CHEMISTRY", label: "🧪 化学" },
  { value: "ENGLISH", label: "🔤 英语" },
];

const MOCK_ERRORS = [
  {
    id: "1",
    subject: "MATH",
    questionText: "解方程: x² - 5x + 6 = 0",
    errorType: "FORMULA_ERROR",
    errorReason: "只找到了一个根，遗漏了因式分解的另一个因子",
    masteryLevel: "NOT_MASTERED",
    difficulty: "MEDIUM",
    knowledgePoints: ["一元二次方程", "因式分解"],
    reviewCount: 0,
    createdAt: "2026-03-09",
  },
  {
    id: "2",
    subject: "PHYSICS",
    questionText: "一物体从高处自由落体，求第3秒末的速度（g=10m/s²）",
    errorType: "FORMULA_ERROR",
    errorReason: "混淆了 v=gt 和 h=½gt²",
    masteryLevel: "PARTIAL",
    difficulty: "MEDIUM",
    knowledgePoints: ["自由落体", "匀加速运动"],
    reviewCount: 1,
    createdAt: "2026-03-08",
  },
  {
    id: "3",
    subject: "MATH",
    questionText: "已知函数f(x) = 2x + 1，求f(f(x))",
    errorType: "CALCULATION_MISTAKE",
    errorReason: "复合函数代入时计算错误",
    masteryLevel: "NOT_MASTERED",
    difficulty: "EASY",
    knowledgePoints: ["复合函数", "函数运算"],
    reviewCount: 0,
    createdAt: "2026-03-08",
  },
  {
    id: "4",
    subject: "CHEMISTRY",
    questionText: "配平化学方程式: Fe + O₂ → Fe₃O₄",
    errorType: "CARELESS",
    errorReason: "氧原子数目没有配平",
    masteryLevel: "MASTERED",
    difficulty: "EASY",
    knowledgePoints: ["化学方程式配平"],
    reviewCount: 3,
    createdAt: "2026-03-07",
  },
];

const SUBJECT_ICONS: Record<string, string> = {
  MATH: "📐", PHYSICS: "⚡", CHEMISTRY: "🧪", ENGLISH: "🔤", CHINESE: "📖",
};

const MASTERY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  NOT_MASTERED: { bg: "bg-red-50", text: "text-wrong", label: "未掌握" },
  PARTIAL: { bg: "bg-amber-50", text: "text-partial", label: "部分掌握" },
  MASTERED: { bg: "bg-emerald-50", text: "text-correct", label: "已掌握" },
};

const ERROR_TYPE_LABELS: Record<string, string> = {
  CONCEPT_CONFUSION: "概念混淆",
  FORMULA_ERROR: "公式记错",
  CALCULATION_MISTAKE: "计算失误",
  LOGIC_ERROR: "逻辑错误",
  MISSING_CONDITION: "遗漏条件",
  METHOD_WRONG: "方法错误",
  CARELESS: "粗心大意",
  NOT_UNDERSTOOD: "完全不会",
};

export default function NotebookPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSubject, setActiveSubject] = useState("all");

  const filtered = MOCK_ERRORS.filter((e) => {
    if (activeFilter !== "all" && e.masteryLevel !== activeFilter) return false;
    if (activeSubject !== "all" && e.subject !== activeSubject) return false;
    return true;
  });

  const stats = {
    total: MOCK_ERRORS.length,
    notMastered: MOCK_ERRORS.filter((e) => e.masteryLevel === "NOT_MASTERED").length,
    partial: MOCK_ERRORS.filter((e) => e.masteryLevel === "PARTIAL").length,
    mastered: MOCK_ERRORS.filter((e) => e.masteryLevel === "MASTERED").length,
  };

  return (
    <div>
      <PageHeader
        title="错题本"
        subtitle={`共 ${stats.total} 道错题`}
        rightAction={
          <div className="flex gap-2">
            <Link
              href="/notebook/analysis"
              className="h-8 px-3 rounded-lg bg-aurora-50 text-aurora-600 text-xs font-medium flex items-center gap-1"
            >
              📊 分析
            </Link>
            <Link
              href="/print?type=notebook"
              className="h-8 px-3 rounded-lg bg-gray-100 text-[var(--color-text-secondary)] text-xs font-medium flex items-center gap-1"
            >
              🖨️ 打印
            </Link>
          </div>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100/60">
            <div className="text-xl font-display font-700 text-wrong">{stats.notMastered}</div>
            <div className="text-[10px] text-red-500/80 mt-0.5">未掌握</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100/60">
            <div className="text-xl font-display font-700 text-partial">{stats.partial}</div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">部分掌握</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100/60">
            <div className="text-xl font-display font-700 text-correct">{stats.mastered}</div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">已掌握</div>
          </div>
        </div>

        {/* Mastery Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "h-8 px-4 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                activeFilter === f.value
                  ? "bg-nebula-600 text-white shadow-sm"
                  : "bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Subject Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {SUBJECT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveSubject(f.value)}
              className={cn(
                "h-7 px-3 rounded-md text-[11px] font-medium whitespace-nowrap transition-all",
                activeSubject === f.value
                  ? "bg-nebula-100 text-nebula-700"
                  : "bg-gray-50 text-[var(--color-text-tertiary)] hover:bg-gray-100"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Error List */}
        <div className="space-y-2.5">
          {filtered.map((error, i) => {
            const mastery = MASTERY_STYLE[error.masteryLevel];
            return (
              <Link
                key={error.id}
                href={`/notebook/${error.id}`}
                className="block bg-white rounded-2xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] card-hover animate-slide-up"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                    {SUBJECT_ICONS[error.subject] || "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                      {error.questionText}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1 line-clamp-1">
                      {error.errorReason}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", mastery.bg, mastery.text)}>
                        {mastery.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-[var(--color-text-tertiary)]">
                        {ERROR_TYPE_LABELS[error.errorType] || error.errorType}
                      </span>
                      {error.knowledgePoints.map((kp) => (
                        <span key={kp} className="text-[10px] px-1.5 py-0.5 rounded-md bg-nebula-50 text-nebula-600">
                          {kp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 flex-shrink-0 mt-1">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-sm text-[var(--color-text-secondary)]">没有符合条件的错题</p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
