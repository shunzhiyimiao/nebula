"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

// 模拟数据 — 后续接入真实API
const MOCK_STATS = {
  streak: 7,
  todayQuestions: 3,
  notebookCount: 28,
  weeklyAccuracy: 72,
  pendingReview: 5,
};

const MOCK_RECENT_ERRORS = [
  {
    id: "1",
    subject: "MATH",
    questionText: "解方程: x² - 5x + 6 = 0",
    errorType: "遗漏解",
    masteryLevel: "NOT_MASTERED",
    createdAt: "2小时前",
  },
  {
    id: "2",
    subject: "PHYSICS",
    questionText: "一物体从高处自由落体，求第3秒末的速度",
    errorType: "公式记错",
    masteryLevel: "PARTIAL",
    createdAt: "昨天",
  },
  {
    id: "3",
    subject: "MATH",
    questionText: "已知函数f(x) = 2x+1，求f(f(x))",
    errorType: "计算失误",
    masteryLevel: "NOT_MASTERED",
    createdAt: "昨天",
  },
];

const SUBJECT_ICONS: Record<string, string> = {
  MATH: "📐",
  CHINESE: "📖",
  ENGLISH: "🔤",
  PHYSICS: "⚡",
  CHEMISTRY: "🧪",
  BIOLOGY: "🧬",
  HISTORY: "📜",
  GEOGRAPHY: "🌍",
  POLITICS: "⚖️",
};

const MASTERY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  NOT_MASTERED: { bg: "bg-red-50", text: "text-wrong", label: "未掌握" },
  PARTIAL: { bg: "bg-amber-50", text: "text-partial", label: "部分掌握" },
  MASTERED: { bg: "bg-emerald-50", text: "text-correct", label: "已掌握" },
};

export default function HomePage() {
  return (
    <div className="px-4 pt-6 space-y-6 animate-fade-in">
      {/* Greeting */}
      <section>
        <h1 className="font-display text-2xl font-700 tracking-tight">
          你好 👋
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          今天也要加油哦，已连续学习 <span className="font-semibold text-solar-500">{MOCK_STATS.streak}</span> 天
        </p>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-4 gap-3">
        {[
          { href: "/scan", icon: "📸", label: "拍照解题", color: "from-nebula-500 to-nebula-600" },
          { href: "/notebook", icon: "📝", label: "错题本", color: "from-aurora-500 to-aurora-600" },
          { href: "/practice", icon: "📋", label: "每日练习", color: "from-solar-400 to-solar-500" },
          { href: "/knowledge", icon: "🃏", label: "知识卡片", color: "from-emerald-400 to-emerald-500" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={cn(
              "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center",
              "shadow-md group-hover:shadow-lg group-active:scale-95 transition-all",
              action.color
            )}>
              <span className="text-2xl">{action.icon}</span>
            </div>
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {action.label}
            </span>
          </Link>
        ))}
      </section>

      {/* Today Stats */}
      <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">今日概览</h2>
          <Link href="/report" className="text-xs text-nebula-500 font-medium">
            详细报告 →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-display font-700 text-nebula-600">
              {MOCK_STATS.todayQuestions}
            </div>
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">今日解题</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display font-700 text-aurora-600">
              {MOCK_STATS.pendingReview}
            </div>
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">待复习</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display font-700 text-correct">
              {MOCK_STATS.weeklyAccuracy}%
            </div>
            <div className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">本周正确率</div>
          </div>
        </div>
      </section>

      {/* Pending Review Banner */}
      {MOCK_STATS.pendingReview > 0 && (
        <Link
          href="/practice?type=review"
          className="block bg-gradient-to-r from-solar-50 to-amber-50 border border-solar-200/60 rounded-2xl p-4 card-hover"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-solar-100 flex items-center justify-center text-xl">
              🔔
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-solar-800">
                {MOCK_STATS.pendingReview} 道错题待复习
              </div>
              <div className="text-xs text-solar-600/80 mt-0.5">
                根据遗忘曲线，现在是最佳复习时间
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-solar-400">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
      )}

      {/* Recent Errors */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">最近错题</h2>
          <Link href="/notebook" className="text-xs text-nebula-500 font-medium">
            查看全部 →
          </Link>
        </div>

        <div className="space-y-2.5">
          {MOCK_RECENT_ERRORS.map((error, i) => {
            const mastery = MASTERY_STYLE[error.masteryLevel];
            return (
              <Link
                key={error.id}
                href={`/notebook/${error.id}`}
                className="block bg-white rounded-2xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] card-hover animate-slide-up"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                    {SUBJECT_ICONS[error.subject] || "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-1">
                      {error.questionText}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn("text-[11px] px-1.5 py-0.5 rounded-md font-medium", mastery.bg, mastery.text)}>
                        {mastery.label}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">
                        {error.errorType}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">
                        · {error.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Spacer for bottom nav */}
      <div className="h-4" />
    </div>
  );
}
