"use client";

import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

const PRACTICE_TYPES = [
  {
    type: "daily",
    icon: "☀️",
    title: "每日练习",
    desc: "根据你的薄弱知识点，每日智能推荐",
    color: "from-solar-400 to-amber-400",
    bgLight: "bg-solar-50",
    count: 10,
    status: "ready", // ready | completed | locked
  },
  {
    type: "weekly",
    icon: "📅",
    title: "每周练习册",
    desc: "本周错题知识点全覆盖，系统化巩固",
    color: "from-nebula-500 to-nebula-600",
    bgLight: "bg-nebula-50",
    count: 25,
    status: "ready",
  },
  {
    type: "review",
    icon: "🔄",
    title: "错题复习",
    desc: "挑出所有错题，逐个讲解并重新练习",
    color: "from-aurora-500 to-aurora-600",
    bgLight: "bg-aurora-50",
    count: 5,
    status: "ready",
  },
];

const WEAK_POINTS = [
  { name: "一元二次方程", errorRate: 75, errorCount: 6, subject: "MATH" },
  { name: "自由落体运动", errorRate: 60, errorCount: 3, subject: "PHYSICS" },
  { name: "复合函数", errorRate: 50, errorCount: 4, subject: "MATH" },
  { name: "化学方程式配平", errorRate: 33, errorCount: 2, subject: "CHEMISTRY" },
];

const SUBJECT_ICONS: Record<string, string> = {
  MATH: "📐", PHYSICS: "⚡", CHEMISTRY: "🧪",
};

export default function PracticePage() {
  return (
    <div>
      <PageHeader
        title="练习中心"
        rightAction={
          <Link
            href="/print?type=practice"
            className="h-8 px-3 rounded-lg bg-gray-100 text-[var(--color-text-secondary)] text-xs font-medium flex items-center gap-1"
          >
            🖨️ 打印练习册
          </Link>
        }
      />

      <div className="px-4 pt-5 space-y-6 animate-fade-in">
        {/* Practice Types */}
        <section className="space-y-3">
          {PRACTICE_TYPES.map((p, i) => (
            <Link
              key={p.type}
              href={`/practice?type=${p.type}`}
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
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {p.desc}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-nebula-50 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-nebula-500">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Weak Points - Targeted Practice */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">薄弱知识点专项</h2>
            <Link href="/notebook/analysis" className="text-xs text-nebula-500 font-medium">
              完整分析 →
            </Link>
          </div>

          <div className="space-y-2">
            {WEAK_POINTS.map((wp, i) => (
              <Link
                key={wp.name}
                href={`/practice?type=targeted&kp=${encodeURIComponent(wp.name)}`}
                className="flex items-center gap-3 bg-white rounded-xl p-3.5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] card-hover animate-slide-up"
                style={{ animationDelay: `${(i + 3) * 60}ms`, animationFillMode: "backwards" }}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0">
                  {SUBJECT_ICONS[wp.subject] || "📚"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{wp.name}</span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">
                      错{wp.errorCount}题
                    </span>
                  </div>
                  {/* Error rate bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          wp.errorRate > 60 ? "bg-wrong" : wp.errorRate > 40 ? "bg-partial" : "bg-correct"
                        )}
                        style={{ width: `${wp.errorRate}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium",
                      wp.errorRate > 60 ? "text-wrong" : wp.errorRate > 40 ? "text-partial" : "text-correct"
                    )}>
                      {wp.errorRate}%错误率
                    </span>
                  </div>
                </div>
                <div className="text-xs text-nebula-500 font-medium flex-shrink-0">
                  练习 →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Practice History */}
        <section>
          <h2 className="font-semibold text-sm mb-3">最近练习</h2>
          <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                开始第一次练习吧！
              </p>
            </div>
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}
