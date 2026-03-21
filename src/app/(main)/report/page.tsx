"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import RadarChart from "@/components/report/RadarChart";
import ActivityHeatmap from "@/components/report/ActivityHeatmap";
import { cn } from "@/lib/utils";

// ===== 模拟数据 =====
const OVERVIEW = {
  totalQuestions: 128,
  totalErrors: 28,
  totalMastered: 6,
  weekQuestions: 12,
  weekCorrect: 9,
  weekAccuracy: 75,
  todayQuestions: 3,
  streak: 7,
  pendingReview: 5,
  totalKnowledgePoints: 42,
};

const SUBJECT_MASTERY = [
  { label: "数学", value: 52 },
  { label: "物理", value: 60 },
  { label: "化学", value: 78 },
  { label: "英语", value: 85 },
  { label: "语文", value: 70 },
];

const HEATMAP_DATA: Record<string, number> = (() => {
  const d: Record<string, number> = {};
  const today = new Date();
  for (let i = 0; i < 112; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    // 模拟：最近的天活跃度更高
    const prob = i < 7 ? 0.9 : i < 30 ? 0.6 : 0.35;
    if (Math.random() < prob) {
      d[key] = Math.floor(Math.random() * (i < 14 ? 10 : 6)) + 1;
    }
  }
  return d;
})();

const WEEK_DAILY = [
  { day: "周一", questions: 5, correct: 3 },
  { day: "周二", questions: 8, correct: 6 },
  { day: "周三", questions: 3, correct: 2 },
  { day: "周四", questions: 10, correct: 7 },
  { day: "周五", questions: 6, correct: 5 },
  { day: "周六", questions: 12, correct: 9 },
  { day: "周日", questions: 4, correct: 3 },
];

const MONTHLY_TREND = [
  { month: "12月", questions: 35, accuracy: 58 },
  { month: "1月", questions: 48, accuracy: 62 },
  { month: "2月", questions: 42, accuracy: 68 },
  { month: "3月", questions: 28, accuracy: 75 },
];

const WEAK_POINTS = [
  { name: "一元二次方程", errorRate: 75, subject: "数学", trend: "improving" },
  { name: "自由落体运动", errorRate: 60, subject: "物理", trend: "stable" },
  { name: "复合函数", errorRate: 50, subject: "数学", trend: "declining" },
  { name: "牛顿第二定律", errorRate: 40, subject: "物理", trend: "improving" },
  { name: "化学方程式配平", errorRate: 33, subject: "化学", trend: "improving" },
];

const TREND_ICON: Record<string, { icon: string; color: string }> = {
  improving: { icon: "↗", color: "text-correct" },
  stable: { icon: "→", color: "text-partial" },
  declining: { icon: "↘", color: "text-wrong" },
};

const ERROR_TYPE_STATS = [
  { type: "公式记错", count: 9, pct: 32 },
  { type: "计算失误", count: 7, pct: 25 },
  { type: "遗漏条件", count: 5, pct: 18 },
  { type: "概念混淆", count: 4, pct: 14 },
  { type: "其他", count: 3, pct: 11 },
];

// ===== 组件 =====

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase">{label}</span>
      </div>
      <div className={cn("text-2xl font-display font-700", color)}>{value}</div>
      {sub && <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{sub}</div>}
    </div>
  );
}

function DonutChart({ segments, size = 80 }: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = 30;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-border-light)" strokeWidth="10" />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dashLength = pct * circumference;
          const currentOffset = offset;
          offset += dashLength;
          return (
            <circle
              key={i}
              cx="40" cy="40" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-currentOffset}
              transform="rotate(-90 40 40)"
              strokeLinecap="butt"
            />
          );
        })}
        <text x="40" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-text-primary)">
          {total}
        </text>
        <text x="40" y="50" textAnchor="middle" fontSize="8" fill="var(--color-text-tertiary)">
          错题
        </text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] text-[var(--color-text-secondary)]">{seg.label}: {seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== 主页面 =====

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "weekly" | "subjects">("overview");
  const maxDaily = Math.max(...WEEK_DAILY.map((d) => d.questions));
  const maxMonthly = Math.max(...MONTHLY_TREND.map((m) => m.questions));

  return (
    <div>
      <PageHeader title="学习报告" />

      <div className="px-4 pt-4 space-y-5 animate-fade-in">

        {/* Streak + Today Banner */}
        <div className="bg-gradient-to-r from-solar-400 to-amber-400 rounded-2xl p-5 text-white shadow-lg shadow-solar-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <span className="font-display text-3xl font-800">{OVERVIEW.streak}天</span>
              </div>
              <p className="text-white/80 text-xs mt-1">连续学习</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-display font-700">{OVERVIEW.todayQuestions}</div>
              <p className="text-white/80 text-xs">今日解题</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-display font-700">{OVERVIEW.pendingReview}</div>
              <p className="text-white/80 text-xs">待复习</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { value: "overview" as const, label: "总览" },
            { value: "weekly" as const, label: "本周" },
            { value: "subjects" as const, label: "学科" },
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

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="累计解题" value={OVERVIEW.totalQuestions} sub={`+${OVERVIEW.weekQuestions} 本周`} icon="📚" color="text-nebula-600" />
              <StatCard label="本周正确率" value={`${OVERVIEW.weekAccuracy}%`} sub="↑ 比上周+5%" icon="🎯" color="text-correct" />
              <StatCard label="错题总数" value={OVERVIEW.totalErrors} sub={`${OVERVIEW.totalErrors - OVERVIEW.totalMastered} 待攻克`} icon="📝" color="text-aurora-600" />
              <StatCard label="知识点" value={OVERVIEW.totalKnowledgePoints} sub={`${OVERVIEW.totalMastered} 已掌握`} icon="🧠" color="text-solar-500" />
            </div>

            {/* Activity Heatmap */}
            <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <h3 className="text-sm font-semibold mb-3">学习记录</h3>
              <ActivityHeatmap data={HEATMAP_DATA} weeks={16} />
            </section>

            {/* Error Type Donut */}
            <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <h3 className="text-sm font-semibold mb-4">错误类型分布</h3>
              <div className="flex justify-center">
                <DonutChart segments={[
                  { value: 12, color: "#ef4444", label: "未掌握" },
                  { value: 10, color: "#f59e0b", label: "部分掌握" },
                  { value: 6, color: "#10b981", label: "已掌握" },
                ]} />
              </div>
              <div className="mt-4 space-y-2">
                {ERROR_TYPE_STATS.map((s, i) => (
                  <div key={s.type} className="flex items-center gap-3">
                    <span className="text-xs w-16 text-[var(--color-text-secondary)]">{s.type}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-nebula-400" style={{ width: `${s.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] w-12 text-right">{s.count}题 {s.pct}%</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Monthly Trend */}
            <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <h3 className="text-sm font-semibold mb-4">月度趋势</h3>
              <div className="flex items-end justify-between gap-3 h-28">
                {MONTHLY_TREND.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[10px] font-semibold text-correct">{m.accuracy}%</div>
                    <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-nebula-500 to-nebula-300 transition-all"
                        style={{ height: `${(m.questions / maxMonthly) * 100}%`, minHeight: "8px" }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">{m.month}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-correct text-center mt-3 font-medium">
                📈 正确率稳步提升中！保持这个节奏
              </p>
            </section>

            {/* Weak Points */}
            <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">薄弱知识点</h3>
                <Link href="/notebook/analysis" className="text-[10px] text-nebula-500 font-medium">完整分析 →</Link>
              </div>
              <div className="space-y-2.5">
                {WEAK_POINTS.map((wp, i) => {
                  const trend = TREND_ICON[wp.trend];
                  return (
                    <div key={wp.name} className="flex items-center gap-3">
                      <span className={cn("w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold",
                        i < 2 ? "bg-wrong/10 text-wrong" : "bg-gray-100 text-[var(--color-text-tertiary)]"
                      )}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{wp.name}</span>
                          <span className="text-[9px] text-[var(--color-text-tertiary)]">{wp.subject}</span>
                          <span className={cn("text-[10px] font-bold", trend.color)}>{trend.icon}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={cn("h-full rounded-full", wp.errorRate > 60 ? "bg-wrong" : wp.errorRate > 40 ? "bg-partial" : "bg-correct")}
                            style={{ width: `${wp.errorRate}%` }} />
                        </div>
                      </div>
                      <span className={cn("text-xs font-semibold", wp.errorRate > 60 ? "text-wrong" : wp.errorRate > 40 ? "text-partial" : "text-correct")}>
                        {wp.errorRate}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ===== WEEKLY TAB ===== */}
        {activeTab === "weekly" && (
          <div className="space-y-5">
            {/* Week Summary */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-nebula-50 rounded-xl p-3 text-center border border-nebula-100/60">
                <div className="text-xl font-display font-700 text-nebula-600">{OVERVIEW.weekQuestions}</div>
                <div className="text-[9px] text-nebula-500/70">解题数</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100/60">
                <div className="text-xl font-display font-700 text-correct">{OVERVIEW.weekCorrect}</div>
                <div className="text-[9px] text-correct/70">正确数</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100/60">
                <div className="text-xl font-display font-700 text-partial">{OVERVIEW.weekAccuracy}%</div>
                <div className="text-[9px] text-partial/70">正确率</div>
              </div>
            </div>

            {/* Daily Bar Chart */}
            <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <h3 className="text-sm font-semibold mb-4">每日做题情况</h3>
              <div className="flex items-end justify-between gap-2 h-32">
                {WEEK_DAILY.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[9px] font-medium text-[var(--color-text-tertiary)]">{d.questions}</div>
                    <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                      <div className="w-full rounded-t-md bg-nebula-100 relative overflow-hidden"
                        style={{ height: `${(d.questions / maxDaily) * 100}%`, minHeight: "6px" }}>
                        <div className="absolute bottom-0 w-full bg-nebula-500 rounded-t-md"
                          style={{ height: `${(d.correct / d.questions) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-5 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-nebula-100" />
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">总题数</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-nebula-500" />
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">正确数</span>
                </div>
              </div>
            </section>

            {/* This Week's Errors */}
            <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <h3 className="text-sm font-semibold mb-3">本周新增错题</h3>
              <div className="space-y-2">
                {[
                  { text: "解方程: x² - 5x + 6 = 0", type: "遗漏解", subject: "📐" },
                  { text: "自由落体求第3秒末速度", type: "公式混淆", subject: "⚡" },
                  { text: "复合函数 f(f(x)) 求值", type: "计算失误", subject: "📐" },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-[var(--color-border-light)]">
                    <span className="text-sm">{e.subject}</span>
                    <span className="text-xs flex-1 truncate">{e.text}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-wrong">{e.type}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ===== SUBJECTS TAB ===== */}
        {activeTab === "subjects" && (
          <div className="space-y-5">
            {/* Radar Chart */}
            <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <h3 className="text-sm font-semibold mb-2">学科掌握度</h3>
              <div className="flex justify-center">
                <RadarChart data={SUBJECT_MASTERY} size={260} />
              </div>
            </section>

            {/* Subject Detail Cards */}
            <div className="space-y-3">
              {[
                { icon: "📐", name: "数学", mastery: 52, total: 68, errors: 18, color: "from-blue-500 to-indigo-500" },
                { icon: "⚡", name: "物理", mastery: 60, total: 32, errors: 6, color: "from-amber-500 to-orange-500" },
                { icon: "🧪", name: "化学", mastery: 78, total: 18, errors: 4, color: "from-emerald-500 to-teal-500" },
                { icon: "🔤", name: "英语", mastery: 85, total: 8, errors: 0, color: "from-violet-500 to-purple-500" },
                { icon: "📖", name: "语文", mastery: 70, total: 2, errors: 0, color: "from-rose-500 to-pink-500" },
              ].map((s) => (
                <div key={s.name} className="bg-white rounded-2xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl", s.color)}>
                      {s.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{s.name}</span>
                        <span className={cn("text-sm font-display font-700",
                          s.mastery >= 70 ? "text-correct" : s.mastery >= 50 ? "text-partial" : "text-wrong"
                        )}>{s.mastery}%</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all",
                          s.mastery >= 70 ? "bg-correct" : s.mastery >= 50 ? "bg-partial" : "bg-wrong"
                        )} style={{ width: `${s.mastery}%` }} />
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--color-text-tertiary)]">
                        <span>解题 {s.total}</span>
                        <span>错题 {s.errors}</span>
                        <span>正确率 {s.total > 0 ? Math.round(((s.total - s.errors) / s.total) * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
