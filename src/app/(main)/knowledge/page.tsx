"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

const SUBJECT_META: Record<string, { icon: string; label: string }> = {
  MATH:      { icon: "📐", label: "数学" },
  PHYSICS:   { icon: "⚡", label: "物理" },
  CHEMISTRY: { icon: "🧪", label: "化学" },
  ENGLISH:   { icon: "🔤", label: "英语" },
  CHINESE:   { icon: "📖", label: "语文" },
  BIOLOGY:   { icon: "🧬", label: "生物" },
  HISTORY:   { icon: "📜", label: "历史" },
  GEOGRAPHY: { icon: "🌍", label: "地理" },
  POLITICS:  { icon: "🏛️", label: "政治" },
};

interface KnowledgePoint {
  id: string;
  name: string;
  subject: string;
  chapter: string | null;
  definition: string;
  errorCount: number;
}

function MasteryDot({ count }: { count: number }) {
  const color = count === 0 ? "bg-correct" : count <= 2 ? "bg-partial" : "bg-wrong";
  const label = count === 0 ? "无错题" : `错${count}次`;
  const textColor = count === 0 ? "text-correct" : count <= 2 ? "text-partial" : "text-wrong";
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className={cn("text-[11px] font-medium", textColor)}>{label}</span>
    </div>
  );
}

export default function KnowledgePage() {
  const [points, setPoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPoints(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // 按学科分组
  const grouped = points.reduce<Record<string, KnowledgePoint[]>>((acc, kp) => {
    if (!acc[kp.subject]) acc[kp.subject] = [];
    acc[kp.subject].push(kp);
    return acc;
  }, {});

  // 按 chapter 再分组
  const groupedByChapter = (list: KnowledgePoint[]) =>
    list.reduce<Record<string, KnowledgePoint[]>>((acc, kp) => {
      const ch = kp.chapter || "其他";
      if (!acc[ch]) acc[ch] = [];
      acc[ch].push(kp);
      return acc;
    }, {});

  return (
    <div>
      <PageHeader
        title="知识卡片"
        subtitle={loading ? "加载中..." : `共 ${points.length} 个知识点`}
      />

      <div className="px-4 pt-5 space-y-6 animate-fade-in">
        {/* Knowledge Graph Entry */}
        <Link
          href="/knowledge/graph"
          className="block bg-gradient-to-r from-nebula-500 to-aurora-500 rounded-2xl p-5 text-white shadow-lg shadow-nebula-500/20 card-hover"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">🕸️</div>
            <div>
              <h3 className="font-semibold">知识图谱</h3>
              <p className="text-sm text-white/80 mt-0.5">可视化查看知识点关系网络</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto text-white/60">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[var(--color-border-light)] overflow-hidden animate-pulse">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-[var(--color-border-light)]">
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-light)] last:border-0">
                    <div className="h-3 bg-gray-100 rounded flex-1" />
                    <div className="h-3 bg-gray-100 rounded w-12" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && points.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📘</div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">还没有知识点</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">拍照解题后会自动提取知识点</p>
          </div>
        )}

        {/* Subject sections */}
        {!loading && Object.entries(grouped).map(([subject, kps], ci) => {
          const meta = SUBJECT_META[subject] || { icon: "📚", label: subject };
          const byChapter = groupedByChapter(kps);

          return (
            <section
              key={subject}
              className="animate-slide-up"
              style={{ animationDelay: `${ci * 80}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{meta.icon}</span>
                <h2 className="font-semibold text-sm">{meta.label}</h2>
                <span className="text-[11px] text-[var(--color-text-tertiary)]">{kps.length} 个知识点</span>
              </div>

              <div className="space-y-3">
                {Object.entries(byChapter).map(([chapter, chKps]) => (
                  <div
                    key={chapter}
                    className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-gray-50/80 border-b border-[var(--color-border-light)]">
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">{chapter}</span>
                    </div>
                    <div className="divide-y divide-[var(--color-border-light)]">
                      {chKps.map((kp) => (
                        <Link
                          key={kp.id}
                          href={`/knowledge/${kp.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{kp.name}</span>
                            {!kp.definition && (
                              <span className="ml-2 text-[10px] text-nebula-400">待生成</span>
                            )}
                          </div>
                          <MasteryDot count={kp.errorCount} />
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <div className="h-4" />
      </div>
    </div>
  );
}
