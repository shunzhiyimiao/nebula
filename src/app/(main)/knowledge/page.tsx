"use client";

import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

const KNOWLEDGE_CATEGORIES = [
  {
    subject: "MATH",
    icon: "📐",
    label: "数学",
    color: "from-blue-500 to-indigo-500",
    chapters: [
      {
        name: "方程与不等式",
        points: [
          { id: "kp1", name: "一元二次方程", mastery: 30, errorCount: 6 },
          { id: "kp2", name: "因式分解", mastery: 45, errorCount: 4 },
          { id: "kp3", name: "不等式求解", mastery: 70, errorCount: 2 },
        ],
      },
      {
        name: "函数",
        points: [
          { id: "kp4", name: "一次函数", mastery: 80, errorCount: 1 },
          { id: "kp5", name: "二次函数", mastery: 55, errorCount: 3 },
          { id: "kp6", name: "复合函数", mastery: 25, errorCount: 4 },
        ],
      },
    ],
  },
  {
    subject: "PHYSICS",
    icon: "⚡",
    label: "物理",
    color: "from-amber-500 to-orange-500",
    chapters: [
      {
        name: "力学",
        points: [
          { id: "kp7", name: "自由落体运动", mastery: 40, errorCount: 3 },
          { id: "kp8", name: "牛顿第二定律", mastery: 60, errorCount: 2 },
        ],
      },
    ],
  },
  {
    subject: "CHEMISTRY",
    icon: "🧪",
    label: "化学",
    color: "from-emerald-500 to-teal-500",
    chapters: [
      {
        name: "化学基础",
        points: [
          { id: "kp9", name: "化学方程式配平", mastery: 85, errorCount: 1 },
        ],
      },
    ],
  },
];

function MasteryDot({ mastery }: { mastery: number }) {
  const color = mastery >= 70 ? "bg-correct" : mastery >= 40 ? "bg-partial" : "bg-wrong";
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className={cn(
        "text-[11px] font-medium",
        mastery >= 70 ? "text-correct" : mastery >= 40 ? "text-partial" : "text-wrong"
      )}>
        {mastery}%
      </span>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <div>
      <PageHeader title="知识卡片" subtitle="点击知识点查看详细卡片" />

      <div className="px-4 pt-5 space-y-6 animate-fade-in">
        {/* Knowledge Graph Entry */}
        <Link
          href="/knowledge/graph"
          className="block bg-gradient-to-r from-nebula-500 to-aurora-500 rounded-2xl p-5 text-white shadow-lg shadow-nebula-500/20 card-hover"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
              🕸️
            </div>
            <div>
              <h3 className="font-semibold">知识图谱</h3>
              <p className="text-sm text-white/80 mt-0.5">可视化查看知识点关系网络</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto text-white/60">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>

        {/* Subject Categories */}
        {KNOWLEDGE_CATEGORIES.map((cat, ci) => (
          <section
            key={cat.subject}
            className="animate-slide-up"
            style={{ animationDelay: `${ci * 100}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{cat.icon}</span>
              <h2 className="font-semibold text-sm">{cat.label}</h2>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                {cat.chapters.reduce((sum, ch) => sum + ch.points.length, 0)} 个知识点
              </span>
            </div>

            <div className="space-y-3">
              {cat.chapters.map((chapter) => (
                <div
                  key={chapter.name}
                  className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] overflow-hidden"
                >
                  <div className="px-4 py-2.5 bg-gray-50/80 border-b border-[var(--color-border-light)]">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                      {chapter.name}
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--color-border-light)]">
                    {chapter.points.map((kp) => (
                      <Link
                        key={kp.id}
                        href={`/knowledge/${kp.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{kp.name}</span>
                          {kp.errorCount > 0 && (
                            <span className="ml-2 text-[10px] text-wrong/80">
                              错{kp.errorCount}次
                            </span>
                          )}
                        </div>
                        <MasteryDot mastery={kp.mastery} />
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
        ))}

        <div className="h-4" />
      </div>
    </div>
  );
}
