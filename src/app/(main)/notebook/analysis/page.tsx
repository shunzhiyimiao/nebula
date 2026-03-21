"use client";

import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

// 模拟分析数据
const MOCK_ANALYSIS = {
  totalErrors: 28,
  errorTypeStats: [
    { type: "FORMULA_ERROR", label: "公式记错", count: 9, icon: "📝" },
    { type: "CALCULATION_MISTAKE", label: "计算失误", count: 7, icon: "🔢" },
    { type: "MISSING_CONDITION", label: "遗漏条件", count: 5, icon: "🔍" },
    { type: "CONCEPT_CONFUSION", label: "概念混淆", count: 4, icon: "🔀" },
    { type: "CARELESS", label: "粗心大意", count: 3, icon: "😅" },
  ],
  subjectStats: [
    { subject: "MATH", label: "数学", count: 18, icon: "📐", color: "bg-blue-500" },
    { subject: "PHYSICS", label: "物理", count: 6, icon: "⚡", color: "bg-amber-500" },
    { subject: "CHEMISTRY", label: "化学", count: 4, icon: "🧪", color: "bg-emerald-500" },
  ],
  masteryStats: [
    { level: "NOT_MASTERED", label: "未掌握", count: 12, color: "bg-wrong" },
    { level: "PARTIAL", label: "部分掌握", count: 10, color: "bg-partial" },
    { level: "MASTERED", label: "已掌握", count: 6, color: "bg-correct" },
  ],
  weakPoints: [
    { name: "一元二次方程", subject: "MATH", errorCount: 6, notMasteredCount: 4, topError: "遗漏解" },
    { name: "复合函数", subject: "MATH", errorCount: 4, notMasteredCount: 3, topError: "代入错误" },
    { name: "因式分解", subject: "MATH", errorCount: 4, notMasteredCount: 2, topError: "符号错误" },
    { name: "自由落体运动", subject: "PHYSICS", errorCount: 3, notMasteredCount: 2, topError: "公式混淆" },
    { name: "二次函数", subject: "MATH", errorCount: 3, notMasteredCount: 2, topError: "顶点坐标" },
    { name: "牛顿第二定律", subject: "PHYSICS", errorCount: 2, notMasteredCount: 1, topError: "受力分析" },
    { name: "化学方程式配平", subject: "CHEMISTRY", errorCount: 2, notMasteredCount: 0, topError: "原子配平" },
  ],
  weeklyTrend: [
    { week: "第1周", newErrors: 8, mastered: 2 },
    { week: "第2周", newErrors: 10, mastered: 3 },
    { week: "第3周", newErrors: 6, mastered: 5 },
    { week: "第4周", newErrors: 4, mastered: 6 },
  ],
};

function HorizontalBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex-1">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}

export default function NotebookAnalysisPage() {
  const data = MOCK_ANALYSIS;
  const maxErrorType = Math.max(...data.errorTypeStats.map((s) => s.count));
  const maxWeakPoint = Math.max(...data.weakPoints.map((s) => s.errorCount));

  return (
    <div>
      <PageHeader title="错题分析报告" showBack />

      <div className="px-4 pt-5 space-y-5 animate-fade-in">

        {/* Overview */}
        <div className="bg-gradient-to-br from-aurora-500 to-nebula-600 rounded-2xl p-5 text-white shadow-lg">
          <h2 className="font-display text-lg font-700">错题总览</h2>
          <p className="text-white/70 text-xs mt-0.5">基于你所有的错题数据分析</p>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-display font-800">{data.totalErrors}</div>
              <div className="text-[10px] text-white/70">总错题数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-800">{data.masteryStats.find((s) => s.level === "NOT_MASTERED")?.count || 0}</div>
              <div className="text-[10px] text-white/70">待攻克</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-800">{data.weakPoints.length}</div>
              <div className="text-[10px] text-white/70">薄弱知识点</div>
            </div>
          </div>
        </div>

        {/* Mastery Distribution */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <h3 className="text-sm font-semibold mb-4">掌握度分布</h3>
          <div className="flex items-center gap-2 h-8 rounded-xl overflow-hidden">
            {data.masteryStats.map((s) => (
              <div
                key={s.level}
                className={cn("h-full flex items-center justify-center text-[10px] font-bold text-white transition-all", s.color)}
                style={{ width: `${(s.count / data.totalErrors) * 100}%`, minWidth: s.count > 0 ? "32px" : "0" }}
              >
                {s.count}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-5 mt-3">
            {data.masteryStats.map((s) => (
              <div key={s.level} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-sm", s.color)} />
                <span className="text-[10px] text-[var(--color-text-tertiary)]">{s.label} ({s.count})</span>
              </div>
            ))}
          </div>
        </section>

        {/* Error Type Analysis */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <h3 className="text-sm font-semibold mb-4">错误类型分布</h3>
          <div className="space-y-3">
            {data.errorTypeStats.map((s, i) => (
              <div key={s.type} className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}>
                <span className="text-lg w-7 text-center">{s.icon}</span>
                <span className="text-sm w-20 flex-shrink-0">{s.label}</span>
                <HorizontalBar value={s.count} max={maxErrorType} color={i === 0 ? "bg-wrong" : i === 1 ? "bg-orange-400" : "bg-amber-400"} />
                <span className="text-sm font-semibold w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-3 text-center">
            你最常犯的错误是「{data.errorTypeStats[0].label}」，建议重点关注公式的记忆和理解
          </p>
        </section>

        {/* Subject Distribution */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <h3 className="text-sm font-semibold mb-4">学科分布</h3>
          <div className="flex items-center gap-3 h-6 rounded-lg overflow-hidden mb-3">
            {data.subjectStats.map((s) => (
              <div
                key={s.subject}
                className={cn("h-full flex items-center justify-center text-[10px] font-bold text-white rounded", s.color)}
                style={{ width: `${(s.count / data.totalErrors) * 100}%`, minWidth: "40px" }}
              >
                {s.icon} {s.count}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4">
            {data.subjectStats.map((s) => (
              <span key={s.subject} className="text-[10px] text-[var(--color-text-tertiary)]">
                {s.icon} {s.label}: {s.count}题 ({Math.round((s.count / data.totalErrors) * 100)}%)
              </span>
            ))}
          </div>
        </section>

        {/* Weak Points Ranking */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">薄弱知识点排行</h3>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">按错题数排序</span>
          </div>
          <div className="space-y-2.5">
            {data.weakPoints.map((wp, i) => (
              <Link
                key={wp.name}
                href={`/practice?type=targeted&kp=${encodeURIComponent(wp.name)}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors animate-slide-up"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold",
                  i < 3 ? "bg-wrong/10 text-wrong" : "bg-gray-100 text-[var(--color-text-tertiary)]"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{wp.name}</span>
                    <span className="text-[9px] text-[var(--color-text-tertiary)]">{wp.subject === "MATH" ? "数学" : wp.subject === "PHYSICS" ? "物理" : "化学"}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <HorizontalBar value={wp.errorCount} max={maxWeakPoint} color={wp.notMasteredCount > 2 ? "bg-wrong" : "bg-amber-400"} />
                    <span className="text-[10px] text-wrong flex-shrink-0">{wp.errorCount}题</span>
                  </div>
                </div>
                <span className="text-[10px] text-nebula-500 font-medium flex-shrink-0">练习 →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Weekly Trend */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <h3 className="text-sm font-semibold mb-4">近4周趋势</h3>
          <div className="flex items-end justify-between gap-3 h-24">
            {data.weeklyTrend.map((w) => {
              const maxVal = Math.max(...data.weeklyTrend.map((t) => Math.max(t.newErrors, t.mastered)));
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 justify-center" style={{ height: "80px" }}>
                    <div className="flex flex-col justify-end w-5">
                      <div className="bg-wrong/70 rounded-t" style={{ height: `${(w.newErrors / maxVal) * 100}%`, minHeight: "4px" }} />
                    </div>
                    <div className="flex flex-col justify-end w-5">
                      <div className="bg-correct/70 rounded-t" style={{ height: `${(w.mastered / maxVal) * 100}%`, minHeight: "4px" }} />
                    </div>
                  </div>
                  <span className="text-[9px] text-[var(--color-text-tertiary)]">{w.week}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-5 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-wrong/70" />
              <span className="text-[10px] text-[var(--color-text-tertiary)]">新增错题</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-correct/70" />
              <span className="text-[10px] text-[var(--color-text-tertiary)]">已掌握</span>
            </div>
          </div>
          <p className="text-[10px] text-correct text-center mt-2 font-medium">
            📈 好消息！掌握速度正在提升，新增错题数在减少
          </p>
        </section>

        {/* CTA */}
        <div className="flex gap-3">
          <Link
            href="/practice?type=review"
            className="flex-1 h-11 rounded-xl bg-nebula-gradient text-white font-medium text-sm shadow-sm flex items-center justify-center gap-1.5"
          >
            🔄 复习所有错题
          </Link>
          <Link
            href="/print?type=notebook"
            className="flex-1 h-11 rounded-xl bg-white border border-[var(--color-border)] font-medium text-sm flex items-center justify-center gap-1.5"
          >
            🖨️ 打印错题本
          </Link>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
