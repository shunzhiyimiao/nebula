"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import RadarChart from "@/components/report/RadarChart";
import ActivityHeatmap from "@/components/report/ActivityHeatmap";
import { cn } from "@/lib/utils";

// ===== 常量 =====

const SUBJECT_META: Record<string, { icon: string; label: string; color: string }> = {
  MATH:      { icon: "📐", label: "数学",   color: "from-blue-500 to-indigo-500" },
  PHYSICS:   { icon: "⚡", label: "物理",   color: "from-amber-500 to-orange-500" },
  CHEMISTRY: { icon: "🧪", label: "化学",   color: "from-emerald-500 to-teal-500" },
  ENGLISH:   { icon: "🔤", label: "英语",   color: "from-violet-500 to-purple-500" },
  CHINESE:   { icon: "📖", label: "语文",   color: "from-rose-500 to-pink-500" },
  BIOLOGY:   { icon: "🧬", label: "生物",   color: "from-lime-500 to-green-500" },
  HISTORY:   { icon: "📜", label: "历史",   color: "from-yellow-500 to-amber-500" },
  GEOGRAPHY: { icon: "🌍", label: "地理",   color: "from-cyan-500 to-blue-500" },
  POLITICS:  { icon: "🏛️", label: "政治",  color: "from-slate-500 to-gray-500" },
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

const WEEK_DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// ===== 子组件 =====

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase">{label}</span>
      </div>
      <div className={cn("text-2xl font-bold", color)}>{value}</div>
      {sub && <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{sub}</div>}
    </div>
  );
}

function DonutChart({ segments }: {
  segments: { value: number; color: string; label: string }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = 30;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-border-light)" strokeWidth="10" />
        {total > 0 && segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashLength = pct * circumference;
          const currentOffset = offset;
          offset += dashLength;
          return (
            <circle key={i} cx="40" cy="40" r={r} fill="none"
              stroke={seg.color} strokeWidth="10"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-currentOffset}
              transform="rotate(-90 40 40)" strokeLinecap="butt"
            />
          );
        })}
        <text x="40" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-text-primary)">{total}</text>
        <text x="40" y="50" textAnchor="middle" fontSize="8" fill="var(--color-text-tertiary)">错题</text>
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

function SkeletonBlock({ h = "h-32" }: { h?: string }) {
  return <div className={cn("bg-white rounded-2xl border border-[var(--color-border-light)] animate-pulse", h)} />;
}

// ===== 主页面 =====

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "weekly" | "subjects">("overview");

  // 数据状态
  const [overview, setOverview] = useState<any>(null);
  const [weekly, setWeekly] = useState<any>(null);       // weeks=1 当前周
  const [heatmapWeekly, setHeatmapWeekly] = useState<any>(null); // weeks=16 热力图
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/report/overview").then((r) => r.json()),
      fetch("/api/report/weekly?weeks=1").then((r) => r.json()),
      fetch("/api/report/weekly?weeks=16").then((r) => r.json()),
      fetch("/api/notebook/analysis").then((r) => r.json()),
    ]).then(([ov, wk, hm, an]) => {
      if (ov.success) setOverview(ov.data);
      if (wk.success) setWeekly(wk.data);
      if (hm.success) setHeatmapWeekly(hm.data);
      if (an.success) setAnalysis(an.data);
    }).finally(() => setLoading(false));
  }, []);

  // 热力图数据：16周每日题目数
  const heatmapData: Record<string, number> = {};
  if (heatmapWeekly?.daily) {
    for (const d of heatmapWeekly.daily) {
      if (d.questions > 0) heatmapData[d.date] = d.questions;
    }
  }

  // 当前周（周一到今天）的每日数据
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // 周一
  const weekDailyData = WEEK_DAYS.map((day, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    const found = weekly?.daily?.find((d: any) => d.date === key);
    return { day, questions: found?.questions || 0, correct: found?.correct || 0 };
  });
  const maxDaily = Math.max(...weekDailyData.map((d) => d.questions), 1);

  // 月度趋势（从16周数据按月聚合）
  const monthlyMap = new Map<string, { questions: number; correct: number }>();
  if (heatmapWeekly?.daily) {
    for (const d of heatmapWeekly.daily) {
      const month = d.date.slice(0, 7);
      const existing = monthlyMap.get(month) || { questions: 0, correct: 0 };
      existing.questions += d.questions;
      existing.correct += d.correct;
      monthlyMap.set(month, existing);
    }
  }
  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-4)
    .map(([month, data]) => ({
      month: `${parseInt(month.slice(5))}月`,
      questions: data.questions,
      accuracy: data.questions > 0 ? Math.round((data.correct / data.questions) * 100) : 0,
    }));
  const maxMonthly = Math.max(...monthlyTrend.map((m) => m.questions), 1);

  // 薄弱知识点
  const weakPoints = analysis?.weakPoints?.slice(0, 5) || [];

  // 错误类型统计
  const errorTypeStats = analysis?.errorTypeStats || [];
  const totalErrorTypes = errorTypeStats.reduce((s: number, t: any) => s + t.count, 0);

  // 掌握度分布
  const masteryStats = analysis?.masteryStats || [];
  const notMastered = masteryStats.find((s: any) => s.level === "NOT_MASTERED")?.count || 0;
  const partial = masteryStats.find((s: any) => s.level === "PARTIAL")?.count || 0;
  const mastered = masteryStats.find((s: any) => s.level === "MASTERED")?.count || 0;

  // 学科雷达图数据
  const subjectStats: any[] = heatmapWeekly?.subjectStats || [];
  const radarData = subjectStats.map((s: any) => ({
    label: SUBJECT_META[s.subject]?.label || s.subject,
    value: s.accuracy,
  }));

  return (
    <div>
      <PageHeader title="学习报告" />

      <div className="px-4 pt-4 space-y-5 animate-fade-in">

        {/* Streak Banner */}
        <div className="bg-gradient-to-r from-solar-400 to-amber-400 rounded-2xl p-5 text-white shadow-lg shadow-solar-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <span className="text-3xl font-bold">{overview?.streak ?? "—"}天</span>
              </div>
              <p className="text-white/80 text-xs mt-1">连续学习</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{overview?.todayQuestions ?? "—"}</div>
              <p className="text-white/80 text-xs">今日解题</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{overview?.pendingReview ?? "—"}</div>
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
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={cn("flex-1 h-9 rounded-lg text-xs font-medium transition-all",
                activeTab === tab.value ? "bg-white text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-text-tertiary)]"
              )}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW ===== */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {loading ? (
              <>
                <div className="grid grid-cols-2 gap-3"><SkeletonBlock h="h-24" /><SkeletonBlock h="h-24" /><SkeletonBlock h="h-24" /><SkeletonBlock h="h-24" /></div>
                <SkeletonBlock h="h-36" /><SkeletonBlock h="h-48" />
              </>
            ) : (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="累计解题" value={overview?.totalQuestions ?? 0}
                    sub={`本周 +${overview?.weekQuestions ?? 0}`} icon="📚" color="text-nebula-600" />
                  <StatCard label="本周正确率" value={`${overview?.weekAccuracy ?? 0}%`}
                    sub={`正确 ${overview?.weekCorrect ?? 0} 题`} icon="🎯" color="text-correct" />
                  <StatCard label="错题总数" value={overview?.totalErrors ?? 0}
                    sub={`${(overview?.totalErrors ?? 0) - (overview?.totalMastered ?? 0)} 待攻克`} icon="📝" color="text-aurora-600" />
                  <StatCard label="知识点" value={overview?.totalKnowledgePoints ?? 0}
                    sub={`${overview?.totalMastered ?? 0} 已掌握`} icon="🧠" color="text-solar-500" />
                </div>

                {/* Activity Heatmap */}
                <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                  <h3 className="text-sm font-semibold mb-3">学习记录</h3>
                  <ActivityHeatmap data={heatmapData} weeks={16} />
                </section>

                {/* Mastery Donut + Error Types */}
                <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                  <h3 className="text-sm font-semibold mb-4">错题掌握分布</h3>
                  <div className="flex justify-center mb-4">
                    <DonutChart segments={[
                      { value: notMastered, color: "#ef4444", label: "未掌握" },
                      { value: partial,     color: "#f59e0b", label: "部分掌握" },
                      { value: mastered,    color: "#10b981", label: "已掌握" },
                    ]} />
                  </div>
                  {errorTypeStats.length > 0 && (
                    <>
                      <h4 className="text-xs font-semibold text-[var(--color-text-tertiary)] mb-2.5">错误类型</h4>
                      <div className="space-y-2">
                        {errorTypeStats.slice(0, 5).map((s: any) => (
                          <div key={s.type} className="flex items-center gap-3">
                            <span className="text-xs w-16 text-[var(--color-text-secondary)] truncate">
                              {ERROR_TYPE_LABELS[s.type] || s.type || "其他"}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-nebula-400"
                                style={{ width: `${totalErrorTypes > 0 ? Math.round((s.count / totalErrorTypes) * 100) : 0}%` }} />
                            </div>
                            <span className="text-[10px] text-[var(--color-text-tertiary)] w-10 text-right">{s.count}题</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                {/* Monthly Trend */}
                {monthlyTrend.length > 0 && (
                  <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                    <h3 className="text-sm font-semibold mb-4">月度趋势</h3>
                    <div className="flex items-end justify-between gap-3 h-28">
                      {monthlyTrend.map((m) => (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <div className="text-[10px] font-semibold text-correct">{m.accuracy}%</div>
                          <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                            <div className="w-full rounded-t-lg bg-gradient-to-t from-nebula-500 to-nebula-300"
                              style={{ height: `${(m.questions / maxMonthly) * 100}%`, minHeight: "8px" }} />
                          </div>
                          <span className="text-[10px] text-[var(--color-text-tertiary)]">{m.month}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Weak Points */}
                {weakPoints.length > 0 && (
                  <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold">薄弱知识点</h3>
                      <Link href="/notebook/analysis" className="text-[10px] text-nebula-500 font-medium">完整分析 →</Link>
                    </div>
                    <div className="space-y-2.5">
                      {weakPoints.map((wp: any, i: number) => (
                        <Link key={wp.id} href={`/knowledge/${wp.id}`}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          <span className={cn("w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold",
                            i < 2 ? "bg-wrong/10 text-wrong" : "bg-gray-100 text-[var(--color-text-tertiary)]"
                          )}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate">{wp.name}</span>
                              <span className="text-[9px] text-[var(--color-text-tertiary)]">
                                {SUBJECT_META[wp.subject]?.label || wp.subject}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-wrong"
                                style={{ width: `${Math.min(wp.errorCount * 15, 100)}%` }} />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-wrong flex-shrink-0">
                            错{wp.errorCount}次
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Empty state */}
                {!overview?.totalQuestions && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-sm text-[var(--color-text-secondary)]">还没有学习数据</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">开始拍照解题后，报告将自动生成</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== WEEKLY ===== */}
        {activeTab === "weekly" && (
          <div className="space-y-5">
            {loading ? (
              <><SkeletonBlock h="h-20" /><SkeletonBlock h="h-48" /></>
            ) : (
              <>
                {/* Week Summary */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-nebula-50 rounded-xl p-3 text-center border border-nebula-100/60">
                    <div className="text-xl font-bold text-nebula-600">{weekly?.summary?.totalQuestions ?? 0}</div>
                    <div className="text-[9px] text-nebula-500/70">解题数</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100/60">
                    <div className="text-xl font-bold text-correct">{weekly?.summary?.totalCorrect ?? 0}</div>
                    <div className="text-[9px] text-correct/70">正确数</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100/60">
                    <div className="text-xl font-bold text-partial">{weekly?.summary?.accuracy ?? 0}%</div>
                    <div className="text-[9px] text-partial/70">正确率</div>
                  </div>
                </div>

                {/* Daily Bar Chart */}
                <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                  <h3 className="text-sm font-semibold mb-4">本周每日做题</h3>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {weekDailyData.map((d) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        {d.questions > 0 && (
                          <div className="text-[9px] font-medium text-[var(--color-text-tertiary)]">{d.questions}</div>
                        )}
                        <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                          <div className="w-full rounded-t-md bg-nebula-100 relative overflow-hidden"
                            style={{ height: `${(d.questions / maxDaily) * 100}%`, minHeight: d.questions > 0 ? "6px" : "0" }}>
                            {d.questions > 0 && (
                              <div className="absolute bottom-0 w-full bg-nebula-500 rounded-t-md"
                                style={{ height: `${(d.correct / d.questions) * 100}%` }} />
                            )}
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

                {/* This week's new errors */}
                {weekly?.summary?.newErrors > 0 && (
                  <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">本周新增错题</h3>
                      <span className="text-xs text-wrong font-medium">{weekly.summary.newErrors} 题</span>
                    </div>
                    <Link href="/notebook" className="text-xs text-nebula-500 font-medium">
                      查看全部错题 →
                    </Link>
                  </section>
                )}

                {weekly?.summary?.totalQuestions === 0 && (
                  <div className="text-center py-10">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-sm text-[var(--color-text-secondary)]">本周还没有解题记录</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== SUBJECTS ===== */}
        {activeTab === "subjects" && (
          <div className="space-y-5">
            {loading ? (
              <><SkeletonBlock h="h-64" /><SkeletonBlock h="h-32" /></>
            ) : subjectStats.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📐</div>
                <p className="text-sm text-[var(--color-text-secondary)]">暂无学科数据</p>
              </div>
            ) : (
              <>
                {/* Radar */}
                {radarData.length >= 3 && (
                  <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                    <h3 className="text-sm font-semibold mb-2">学科正确率雷达</h3>
                    <div className="flex justify-center">
                      <RadarChart data={radarData} size={260} />
                    </div>
                  </section>
                )}

                {/* Subject Cards */}
                <div className="space-y-3">
                  {subjectStats
                    .sort((a: any, b: any) => b.total - a.total)
                    .map((s: any) => {
                      const meta = SUBJECT_META[s.subject] || { icon: "📚", label: s.subject, color: "from-gray-400 to-gray-500" };
                      return (
                        <div key={s.subject} className="bg-white rounded-2xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl flex-shrink-0", meta.color)}>
                              {meta.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{meta.label}</span>
                                <span className={cn("text-sm font-bold",
                                  s.accuracy >= 70 ? "text-correct" : s.accuracy >= 50 ? "text-partial" : "text-wrong"
                                )}>{s.accuracy}%</span>
                              </div>
                              <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all",
                                  s.accuracy >= 70 ? "bg-correct" : s.accuracy >= 50 ? "bg-partial" : "bg-wrong"
                                )} style={{ width: `${s.accuracy}%` }} />
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--color-text-tertiary)]">
                                <span>解题 {s.total}</span>
                                <span>正确 {s.correct}</span>
                                <span>正确率 {s.accuracy}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
