"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import MathRenderer, { Formula } from "@/components/scan/MathRenderer";
import { cn } from "@/lib/utils";

const SUBJECT_LABELS: Record<string, string> = {
  MATH: "数学", PHYSICS: "物理", CHEMISTRY: "化学",
  ENGLISH: "英语", CHINESE: "语文", BIOLOGY: "生物",
};

const MASTERY_CONFIG = [
  { min: 0,  max: 30,  label: "需要加强", color: "text-wrong",      bg: "bg-red-50",    ring: "stroke-wrong" },
  { min: 30, max: 60,  label: "部分掌握", color: "text-partial",    bg: "bg-amber-50",  ring: "stroke-partial" },
  { min: 60, max: 80,  label: "基本掌握", color: "text-nebula-600", bg: "bg-nebula-50", ring: "stroke-nebula-500" },
  { min: 80, max: 101, label: "已掌握",   color: "text-correct",    bg: "bg-emerald-50",ring: "stroke-correct" },
];

function getMasteryConfig(m: number) {
  return MASTERY_CONFIG.find((c) => m >= c.min && m < c.max) || MASTERY_CONFIG[0];
}

function MasteryRing({ mastery }: { mastery: number }) {
  const config = getMasteryConfig(mastery);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (mastery / 100) * circumference;
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100" />
        <circle cx="40" cy="40" r="36" fill="none" strokeWidth="6" strokeLinecap="round"
          className={config.ring}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-xl font-bold", config.color)}>{mastery}%</span>
        <span className="text-[9px] text-[var(--color-text-tertiary)]">{config.label}</span>
      </div>
    </div>
  );
}

export default function KnowledgeDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "errors">("card");

  useEffect(() => {
    fetch(`/api/knowledge/${params.id}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/knowledge/${params.id}`, { method: "POST" });
      const result = await res.json();
      if (result.success) setData((prev: any) => ({ ...prev, ...result.data }));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="知识卡片" showBack />
        <div className="px-4 pt-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[var(--color-border-light)] animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="知识卡片" showBack />
        <div className="px-4 pt-16 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">知识点不存在</p>
        </div>
      </div>
    );
  }

  const formulas = Array.isArray(data.formulas) ? data.formulas : [];
  const keyPoints = Array.isArray(data.keyPoints) ? data.keyPoints : [];
  const examples = Array.isArray(data.examples) ? data.examples : [];
  const commonMistakes = Array.isArray(data.commonMistakes) ? data.commonMistakes : [];
  const relatedPoints = Array.isArray(data.relatedPoints) ? data.relatedPoints : [];
  const userErrors = Array.isArray(data.userErrorQuestions) ? data.userErrorQuestions : [];
  const errorCount = data.userErrorCount ?? 0;
  // 粗略用错题数估算掌握度：0错=90，1错=70，2错=50，3+=30
  const mastery = errorCount === 0 ? 90 : errorCount === 1 ? 70 : errorCount === 2 ? 50 : 30;

  return (
    <div>
      <PageHeader title={data.name} subtitle={data.chapter || SUBJECT_LABELS[data.subject] || data.subject} showBack />

      <div className="px-4 pt-5 space-y-5 animate-fade-in">
        {/* Hero Card */}
        <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <div className="flex items-center gap-5">
            <MasteryRing mastery={mastery} />
            <div className="flex-1">
              <h2 className="font-bold text-lg">{data.name}</h2>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                {data.chapter ? `${data.chapter} · ` : ""}{SUBJECT_LABELS[data.subject] || data.subject}
              </p>
              <div className="flex gap-4 mt-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-wrong">{errorCount}</div>
                  <div className="text-[9px] text-[var(--color-text-tertiary)]">错题数</div>
                </div>
                <div className="w-px bg-[var(--color-border-light)]" />
                <div className="text-center">
                  <div className="text-lg font-bold text-nebula-600">{formulas.length}</div>
                  <div className="text-[9px] text-[var(--color-text-tertiary)]">核心公式</div>
                </div>
                <div className="w-px bg-[var(--color-border-light)]" />
                <div className="text-center">
                  <div className="text-lg font-bold text-aurora-600">{relatedPoints.length}</div>
                  <div className="text-[9px] text-[var(--color-text-tertiary)]">关联知识</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { value: "card" as const, label: "📘 知识卡片" },
            { value: "errors" as const, label: `❌ 相关错题 ${errorCount > 0 ? `(${errorCount})` : ""}` },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex-1 h-9 rounded-lg text-xs font-medium transition-all",
                activeTab === tab.value
                  ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-tertiary)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: 知识卡片 */}
        {activeTab === "card" && (
          <div className="space-y-4">
            {/* AI 生成按钮（无内容时显示） */}
            {!data.definition && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-nebula-50 rounded-2xl p-6 border border-nebula-100/60 text-center disabled:opacity-60"
              >
                <div className="text-2xl mb-2">{generating ? "⏳" : "✨"}</div>
                <p className="text-sm font-medium text-nebula-700">
                  {generating ? "AI 正在生成知识卡片..." : "AI 生成知识卡片"}
                </p>
                <p className="text-xs text-nebula-500/70 mt-1">自动生成定义、公式、例题、常见错误</p>
              </button>
            )}

            {/* Definition */}
            {data.definition && (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase">定义</h3>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="text-[10px] text-nebula-500 disabled:opacity-50"
                  >
                    {generating ? "生成中..." : "✨ 重新生成"}
                  </button>
                </div>
                <MathRenderer content={data.definition} className="text-sm leading-relaxed" />
              </section>
            )}

            {/* Formulas */}
            {formulas.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">核心公式</h3>
                <div className="space-y-3">
                  {formulas.map((f: string, i: number) => (
                    <div key={i} className="bg-nebula-50/50 rounded-xl p-4 border border-nebula-100/40 text-center">
                      <Formula latex={f} display />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Key Points */}
            {keyPoints.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">重点</h3>
                <div className="space-y-2.5">
                  {keyPoints.map((p: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-nebula-100 flex items-center justify-center text-[10px] font-bold text-nebula-600 flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <MathRenderer content={p} className="text-sm leading-relaxed flex-1" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Examples */}
            {examples.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">典型例题</h3>
                <div className="space-y-4">
                  {examples.map((ex: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-[var(--color-border-light)]">
                      <p className="text-sm font-medium">
                        <span className="text-nebula-500 mr-1.5">例{i + 1}.</span>
                        {ex.question}
                      </p>
                      <div className="mt-2 pl-3 border-l-2 border-nebula-200">
                        <p className="text-sm text-[var(--color-text-secondary)]">{ex.solution}</p>
                        {ex.latex && <div className="mt-2"><Formula latex={ex.latex} display /></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Common Mistakes */}
            {commonMistakes.length > 0 && (
              <section className="bg-red-50/50 rounded-2xl p-5 border border-red-100/60">
                <h3 className="text-xs font-semibold text-wrong/80 uppercase mb-3">⚠️ 常见错误</h3>
                <div className="space-y-2">
                  {commonMistakes.map((m: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-wrong/50 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-sm text-red-800/80">{m}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Related */}
            {relatedPoints.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">关联知识点</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedPoints.map((rp: any) => (
                    <Link
                      key={rp.id}
                      href={`/knowledge/${rp.id}`}
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-nebula-50 text-nebula-700 border border-nebula-100/60"
                    >
                      <span className="text-xs">📘</span>{rp.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Tab: 相关错题 */}
        {activeTab === "errors" && (
          <div className="space-y-3">
            {userErrors.length > 0 ? userErrors.map((err: any) => (
              <Link
                key={err.id}
                href={`/notebook/${err.id}`}
                className="block bg-white rounded-xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] card-hover"
              >
                <p className="text-sm font-medium line-clamp-2">{err.questionText}</p>
                <div className="flex items-center gap-2 mt-2">
                  {err.masteryLevel && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md",
                      err.masteryLevel === "NOT_MASTERED" ? "bg-red-50 text-wrong" :
                      err.masteryLevel === "PARTIAL" ? "bg-amber-50 text-partial" : "bg-emerald-50 text-correct"
                    )}>
                      {err.masteryLevel === "NOT_MASTERED" ? "未掌握" : err.masteryLevel === "PARTIAL" ? "部分掌握" : "已掌握"}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
                    {new Date(err.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </Link>
            )) : (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-sm text-[var(--color-text-secondary)]">该知识点暂无错题</p>
              </div>
            )}
          </div>
        )}

        {/* Bottom Action */}
        <div className="pt-2">
          <Link
            href={`/practice?type=targeted&kp=${encodeURIComponent(data.name)}`}
            className="w-full h-11 rounded-xl bg-nebula-gradient text-white font-medium text-sm shadow-sm flex items-center justify-center gap-1.5"
          >
            📋 开始专项练习
          </Link>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
