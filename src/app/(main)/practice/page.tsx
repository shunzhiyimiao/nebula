"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

const PRACTICE_TYPES = [
  {
    type: "daily",
    icon: "☀️",
    title: "每日练习",
    desc: "根据薄弱知识点，每日智能推荐10题",
    color: "from-solar-400 to-amber-400",
    bgLight: "bg-solar-50",
    count: 10,
  },
  {
    type: "review",
    icon: "🔄",
    title: "错题复习",
    desc: "从错题本中抽题，重新练习巩固",
    color: "from-aurora-500 to-aurora-600",
    bgLight: "bg-aurora-50",
    count: 10,
  },
];

const SUBJECT_ICONS: Record<string, string> = {
  MATH: "📐", PHYSICS: "⚡", CHEMISTRY: "🧪",
  ENGLISH: "🔤", CHINESE: "📖", BIOLOGY: "🧬",
};

interface WeakPoint {
  id: string;
  name: string;
  subject: string;
  errorCount: number;
}

export default function PracticePage() {
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从知识卡片 API 取出有错题的知识点，按错题数排序
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const withErrors = (res.data as WeakPoint[])
            .filter((kp) => kp.errorCount > 0)
            .sort((a, b) => b.errorCount - a.errorCount)
            .slice(0, 6);
          setWeakPoints(withErrors);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="练习中心" subtitle="AI智能出题，针对性强化" />

      <div className="px-4 pt-5 space-y-6 animate-fade-in">

        {/* 练习类型 */}
        <section className="space-y-3">
          {PRACTICE_TYPES.map((p, i) => (
            <Link
              key={p.type}
              href={`/practice/session?type=${p.type}`}
              className="block bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] card-hover animate-slide-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-center p-4 gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0 shadow-md",
                  p.color
                )}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{p.title}</h3>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", p.bgLight, "text-[var(--color-text-secondary)]")}>
                      {p.count}题
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{p.desc}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-nebula-50 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-nebula-500">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* 薄弱知识点专项 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">薄弱知识点专项</h2>
            <Link href="/knowledge" className="text-xs text-nebula-500 font-medium">
              查看全部 →
            </Link>
          </div>

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-3.5 border border-[var(--color-border-light)] animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="h-2 bg-gray-100 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && weakPoints.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <div className="text-3xl mb-2">📖</div>
              <p className="text-sm text-[var(--color-text-secondary)]">还没有错题记录</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">拍照解题并保存后，这里会显示薄弱知识点</p>
            </div>
          )}

          <div className="space-y-2">
            {weakPoints.map((wp, i) => (
              <Link
                key={wp.id}
                href={`/practice/session?type=targeted&kp=${encodeURIComponent(wp.name)}&kpId=${wp.id}`}
                className="flex items-center gap-3 bg-white rounded-xl p-3.5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] card-hover animate-slide-up"
                style={{ animationDelay: `${(i + 2) * 60}ms`, animationFillMode: "backwards" }}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0">
                  {SUBJECT_ICONS[wp.subject] || "📚"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{wp.name}</span>
                    <span className="text-[10px] text-wrong">错{wp.errorCount}次</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-wrong"
                        style={{ width: `${Math.min(wp.errorCount * 15, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-nebula-500 font-medium flex-shrink-0">专项 →</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}
