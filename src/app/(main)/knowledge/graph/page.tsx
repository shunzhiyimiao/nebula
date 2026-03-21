"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import KnowledgeGraph from "@/components/knowledge/KnowledgeGraph";
import { cn } from "@/lib/utils";

// 模拟图谱数据
const MOCK_NODES = [
  { id: "kp1", name: "一元二次方程", subject: "MATH", chapter: "方程", mastery: 30, errorCount: 6, size: 50, totalCount: 8 },
  { id: "kp2", name: "因式分解", subject: "MATH", chapter: "方程", mastery: 45, errorCount: 4, size: 45, totalCount: 6 },
  { id: "kp3", name: "不等式求解", subject: "MATH", chapter: "方程", mastery: 70, errorCount: 2, size: 35, totalCount: 5 },
  { id: "kp4", name: "一次函数", subject: "MATH", chapter: "函数", mastery: 80, errorCount: 1, size: 30, totalCount: 4 },
  { id: "kp5", name: "二次函数", subject: "MATH", chapter: "函数", mastery: 55, errorCount: 3, size: 45, totalCount: 5 },
  { id: "kp6", name: "复合函数", subject: "MATH", chapter: "函数", mastery: 25, errorCount: 4, size: 40, totalCount: 5 },
  { id: "kp7", name: "自由落体", subject: "PHYSICS", chapter: "力学", mastery: 40, errorCount: 3, size: 40, totalCount: 4 },
  { id: "kp8", name: "牛顿第二定律", subject: "PHYSICS", chapter: "力学", mastery: 60, errorCount: 2, size: 35, totalCount: 3 },
  { id: "kp9", name: "化学方程式配平", subject: "CHEMISTRY", chapter: "基础", mastery: 85, errorCount: 1, size: 30, totalCount: 3 },
  { id: "kp10", name: "韦达定理", subject: "MATH", chapter: "方程", mastery: 35, errorCount: 3, size: 38, totalCount: 4 },
  { id: "kp11", name: "判别式", subject: "MATH", chapter: "方程", mastery: 50, errorCount: 2, size: 35, totalCount: 3 },
  { id: "kp12", name: "完全平方公式", subject: "MATH", chapter: "方程", mastery: 65, errorCount: 1, size: 32, totalCount: 3 },
];

const MOCK_EDGES = [
  { source: "kp1", target: "kp2", type: "related" as const },
  { source: "kp1", target: "kp10", type: "related" as const },
  { source: "kp1", target: "kp11", type: "related" as const },
  { source: "kp1", target: "kp5", type: "related" as const },
  { source: "kp2", target: "kp12", type: "related" as const },
  { source: "kp5", target: "kp4", type: "parent" as const },
  { source: "kp6", target: "kp4", type: "parent" as const },
  { source: "kp6", target: "kp5", type: "related" as const },
  { source: "kp7", target: "kp8", type: "related" as const },
  { source: "kp10", target: "kp11", type: "related" as const },
];

const SUBJECT_FILTERS = [
  { value: "all", label: "全部" },
  { value: "MATH", label: "📐 数学" },
  { value: "PHYSICS", label: "⚡ 物理" },
  { value: "CHEMISTRY", label: "🧪 化学" },
];

export default function KnowledgeGraphPage() {
  const router = useRouter();
  const [subjectFilter, setSubjectFilter] = useState("all");

  const filteredNodes = subjectFilter === "all"
    ? MOCK_NODES
    : MOCK_NODES.filter((n) => n.subject === subjectFilter);

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = MOCK_EDGES.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  const stats = {
    total: filteredNodes.length,
    mastered: filteredNodes.filter((n) => n.mastery >= 70).length,
    partial: filteredNodes.filter((n) => n.mastery >= 40 && n.mastery < 70).length,
    weak: filteredNodes.filter((n) => n.mastery < 40).length,
  };

  return (
    <div>
      <PageHeader title="知识图谱" subtitle="可视化知识点关系" showBack />

      <div className="px-4 pt-4 space-y-4 animate-fade-in">
        {/* Subject Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {SUBJECT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSubjectFilter(f.value)}
              className={cn(
                "h-8 px-4 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                subjectFilter === f.value
                  ? "bg-nebula-600 text-white shadow-sm"
                  : "bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-xl p-2.5 text-center border border-[var(--color-border-light)]">
            <div className="text-lg font-display font-700">{stats.total}</div>
            <div className="text-[9px] text-[var(--color-text-tertiary)]">总计</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100/60">
            <div className="text-lg font-display font-700 text-correct">{stats.mastered}</div>
            <div className="text-[9px] text-correct/70">已掌握</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-2.5 text-center border border-amber-100/60">
            <div className="text-lg font-display font-700 text-partial">{stats.partial}</div>
            <div className="text-[9px] text-partial/70">部分</div>
          </div>
          <div className="bg-red-50 rounded-xl p-2.5 text-center border border-red-100/60">
            <div className="text-lg font-display font-700 text-wrong">{stats.weak}</div>
            <div className="text-[9px] text-wrong/70">薄弱</div>
          </div>
        </div>

        {/* Graph */}
        <KnowledgeGraph
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodeClick={(id) => router.push(`/knowledge/${id}`)}
          className="shadow-[var(--shadow-sm)]"
        />

        {/* Legend */}
        <div className="bg-white rounded-xl p-3 border border-[var(--color-border-light)]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--color-text-tertiary)]">图例：</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-correct" />
                <span>≥70%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-partial" />
                <span>40-69%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-wrong" />
                <span>&lt;40%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-nebula-300" />
                <span>关联</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1.5">
            节点大小 = 接触次数 · 拖拽移动节点 · 点击查看详情
          </p>
        </div>

        {/* Weak Points Quick List */}
        {stats.weak > 0 && (
          <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100/60">
            <h3 className="text-xs font-semibold text-wrong/80 mb-2.5">⚠️ 需要重点攻克</h3>
            <div className="space-y-2">
              {filteredNodes
                .filter((n) => n.mastery < 40)
                .sort((a, b) => a.mastery - b.mastery)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => router.push(`/knowledge/${n.id}`)}
                    className="w-full flex items-center gap-3 bg-white/80 rounded-xl p-3 text-left hover:bg-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-xs font-bold text-wrong">
                      {n.mastery}%
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{n.name}</span>
                      <span className="text-[10px] text-wrong/70 ml-2">错{n.errorCount}题</span>
                    </div>
                    <span className="text-xs text-nebula-500 font-medium">练习 →</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
