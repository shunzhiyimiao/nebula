"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SUBJECT_ICONS: Record<string, string> = {
  MATH: "📐", CHINESE: "📖", ENGLISH: "🔤",
  PHYSICS: "⚡", CHEMISTRY: "🧪", BIOLOGY: "🧬",
  HISTORY: "📜", GEOGRAPHY: "🌍", POLITICS: "⚖️",
};

const MASTERY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  NOT_MASTERED: { bg: "bg-red-50",    text: "text-wrong",   label: "未掌握" },
  PARTIAL:      { bg: "bg-amber-50",  text: "text-partial", label: "部分掌握" },
  MASTERED:     { bg: "bg-emerald-50",text: "text-correct", label: "已掌握" },
};

const ERROR_TYPE_LABELS: Record<string, string> = {
  CONCEPT_CONFUSION: "概念混淆", FORMULA_ERROR: "公式错误",
  CALCULATION_MISTAKE: "计算失误", LOGIC_ERROR: "逻辑错误",
  MISSING_CONDITION: "漏看条件", METHOD_WRONG: "方法错误",
  CARELESS: "粗心", NOT_UNDERSTOOD: "不理解", OTHER: "其他",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "刚刚" : `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "昨天";
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return "夜深了 🌙";
  if (h < 12) return "早上好 ☀️";
  if (h < 14) return "中午好 🌤️";
  if (h < 18) return "下午好 🌈";
  return "晚上好 🌙";
}

interface Stats {
  streak: number;
  todayQuestions: number;
  pendingReview: number;
  weekAccuracy: number;
}

interface RecentError {
  id: string;
  subject: string;
  questionText: string;
  errorType: string | null;
  masteryLevel: string;
  createdAt: string;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/report/overview").then((r) => r.json()),
      fetch("/api/notebook?limit=3").then((r) => r.json()),
      fetch("/api/user/profile").then((r) => r.json()),
    ]).then(([overview, notebook, profile]) => {
      if (overview.success && overview.data) {
        setStats({
          streak:         overview.data.streak         ?? 0,
          todayQuestions: overview.data.todayQuestions ?? 0,
          pendingReview:  overview.data.pendingReview  ?? 0,
          weekAccuracy:   overview.data.weekAccuracy   ?? 0,
        });
      }
      if (notebook.success && Array.isArray(notebook.data)) {
        setRecentErrors(
          notebook.data.slice(0, 3).map((q: any) => ({
            id:           q.id,
            subject:      q.subject,
            questionText: q.questionText,
            errorType:    q.errorType ?? null,
            masteryLevel: q.masteryLevel ?? "NOT_MASTERED",
            createdAt:    q.createdAt,
          }))
        );
      }
      if (profile.data?.name) setUserName(profile.data.name);
    }).finally(() => setLoading(false));
  }, []);

  const statItems = [
    { value: stats?.todayQuestions ?? "—", label: "今日解题", color: "text-nebula-600" },
    { value: stats?.pendingReview  ?? "—", label: "待复习",   color: "text-aurora-600" },
    { value: stats ? `${stats.weekAccuracy}%` : "—", label: "本周正确率", color: "text-correct" },
  ];

  return (
    <div className="px-4 pt-6 space-y-6 animate-fade-in">

      {/* Greeting */}
      <section>
        <h1 className="font-display text-2xl font-700 tracking-tight">
          {userName ? `${userName}，${greeting()}` : greeting()}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {loading ? (
            <span className="inline-block w-32 h-4 bg-gray-100 rounded animate-pulse" />
          ) : stats?.streak && stats.streak > 0 ? (
            <>已连续学习 <span className="font-semibold text-solar-500">{stats.streak}</span> 天，继续保持！</>
          ) : (
            "今天也要加油哦 💪"
          )}
        </p>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-4 gap-3">
        {[
          { href: "/scan",      icon: "📸", label: "拍照解题", color: "from-nebula-500 to-nebula-600" },
          { href: "/notebook",  icon: "📝", label: "错题本",   color: "from-aurora-500 to-aurora-600" },
          { href: "/practice",  icon: "📋", label: "每日练习", color: "from-solar-400 to-solar-500" },
          { href: "/knowledge", icon: "🃏", label: "知识卡片", color: "from-emerald-400 to-emerald-500" },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="flex flex-col items-center gap-2 group">
            <div className={cn(
              "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center",
              "shadow-md group-hover:shadow-lg group-active:scale-95 transition-all",
              action.color
            )}>
              <span className="text-2xl">{action.icon}</span>
            </div>
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">{action.label}</span>
          </Link>
        ))}
      </section>

      {/* Today Stats */}
      <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">今日概览</h2>
          <Link href="/report" className="text-xs text-nebula-500 font-medium">详细报告 →</Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {statItems.map((s) => (
            <div key={s.label} className="text-center">
              {loading ? (
                <div className="w-10 h-7 bg-gray-100 rounded-lg animate-pulse mx-auto mb-1" />
              ) : (
                <div className={cn("text-2xl font-display font-700", s.color)}>{s.value}</div>
              )}
              <div className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Review Banner */}
      {!loading && (stats?.pendingReview ?? 0) > 0 && (
        <Link
          href="/practice?type=review"
          className="block bg-gradient-to-r from-solar-50 to-amber-50 border border-solar-200/60 rounded-2xl p-4 card-hover"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-solar-100 flex items-center justify-center text-xl">🔔</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-solar-800">
                {stats!.pendingReview} 道错题待复习
              </div>
              <div className="text-xs text-solar-600/80 mt-0.5">根据遗忘曲线，现在是最佳复习时间</div>
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
          <Link href="/notebook" className="text-xs text-nebula-500 font-medium">查看全部 →</Link>
        </div>

        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[var(--color-border-light)] animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && recentErrors.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
            <div className="text-3xl mb-2">📖</div>
            <p className="text-sm text-[var(--color-text-secondary)]">还没有错题记录</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">拍照解题后，错题会显示在这里</p>
          </div>
        )}

        <div className="space-y-2.5">
          {recentErrors.map((error, i) => {
            const mastery = MASTERY_STYLE[error.masteryLevel] ?? MASTERY_STYLE.NOT_MASTERED;
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
                    <p className="text-sm font-medium leading-snug line-clamp-2">{error.questionText}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={cn("text-[11px] px-1.5 py-0.5 rounded-md font-medium", mastery.bg, mastery.text)}>
                        {mastery.label}
                      </span>
                      {error.errorType && (
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">
                          {ERROR_TYPE_LABELS[error.errorType] ?? error.errorType}
                        </span>
                      )}
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">
                        · {timeAgo(error.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="h-4" />
    </div>
  );
}
