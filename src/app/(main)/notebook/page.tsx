"use client";

import { useState, useEffect } from "react";
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
  { value: "CHINESE", label: "📖 语文" },
];

const SUBJECT_ICONS: Record<string, string> = {
  MATH: "📐", PHYSICS: "⚡", CHEMISTRY: "🧪", ENGLISH: "🔤", CHINESE: "📖",
  BIOLOGY: "🧬", HISTORY: "📜", GEOGRAPHY: "🌍", POLITICS: "🏛️",
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

interface Question {
  id: string;
  subject: string;
  questionText: string;
  errorType: string | null;
  errorReason: string | null;
  masteryLevel: string;
  difficulty: string;
  reviewCount: number;
  createdAt: string;
  knowledgePoints: { knowledgePoint: { id: string; name: string } }[];
}

interface Stats {
  total: number;
  NOT_MASTERED: number;
  PARTIAL: number;
  MASTERED: number;
}

export default function NotebookPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSubject, setActiveSubject] = useState("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, NOT_MASTERED: 0, PARTIAL: 0, MASTERED: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilter !== "all") params.set("mastery", activeFilter);
    if (activeSubject !== "all") params.set("subject", activeSubject);

    setLoading(true);
    fetch(`/api/notebook?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setQuestions(res.data);
          setStats(res.stats);
        }
      })
      .finally(() => setLoading(false));
  }, [activeFilter, activeSubject]);

  return (
    <div>
      <PageHeader
        title="错题本"
        subtitle={`共 ${stats.total} 道错题`}
        rightAction={
          <Link
            href="/notebook/analysis"
            className="h-8 px-3 rounded-lg bg-aurora-50 text-aurora-600 text-xs font-medium flex items-center gap-1"
          >
            📊 分析
          </Link>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100/60">
            <div className="text-xl font-bold text-wrong">{stats.NOT_MASTERED}</div>
            <div className="text-[10px] text-red-500/80 mt-0.5">未掌握</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100/60">
            <div className="text-xl font-bold text-partial">{stats.PARTIAL}</div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">部分掌握</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100/60">
            <div className="text-xl font-bold text-correct">{stats.MASTERED}</div>
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
                  : "bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)]"
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
                  : "bg-gray-50 text-[var(--color-text-tertiary)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[var(--color-border-light)] animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                    <div className="h-3 bg-gray-100 rounded w-3/5" />
                    <div className="flex gap-1 mt-2">
                      <div className="h-4 bg-gray-100 rounded w-12" />
                      <div className="h-4 bg-gray-100 rounded w-16" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error List */}
        {!loading && (
          <div className="space-y-2.5">
            {questions.map((q, i) => {
              const mastery = MASTERY_STYLE[q.masteryLevel] || MASTERY_STYLE.NOT_MASTERED;
              return (
                <Link
                  key={q.id}
                  href={`/notebook/${q.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] card-hover animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                      {SUBJECT_ICONS[q.subject] || "📚"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-2">{q.questionText}</p>
                      {q.errorReason && (
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1 line-clamp-1">{q.errorReason}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", mastery.bg, mastery.text)}>
                          {mastery.label}
                        </span>
                        {q.errorType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-[var(--color-text-tertiary)]">
                            {ERROR_TYPE_LABELS[q.errorType] || q.errorType}
                          </span>
                        )}
                        {q.knowledgePoints.slice(0, 2).map(({ knowledgePoint: kp }) => (
                          <span key={kp.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-nebula-50 text-nebula-600">
                            {kp.name}
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

            {questions.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📖</div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">还没有错题</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">拍照解题后点击"保存到错题本"</p>
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
