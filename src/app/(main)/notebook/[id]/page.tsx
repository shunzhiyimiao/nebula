"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import MathRenderer from "@/components/scan/MathRenderer";
import SolutionDemo from "@/components/notebook/SolutionDemo";
import KnowledgePopover from "@/components/knowledge/KnowledgePopover";
import { cn } from "@/lib/utils";

// 模拟数据（后续替换为API）
const MOCK_DETAIL: Record<string, any> = {
  "1": {
    id: "1",
    subject: "MATH",
    questionType: "CALCULATION",
    questionText: "解方程: x² - 5x + 6 = 0",
    questionLatex: "x^2 - 5x + 6 = 0",
    userAnswer: "x = 2",
    correctAnswer: "x = 2 或 x = 3",
    isCorrect: false,
    errorType: "MISSING_CONDITION",
    errorReason: "只找到了一个根 x=2，但一元二次方程通常有两个根。因式分解后需要对每个因式分别令其等于零，不能遗漏。",
    difficulty: "MEDIUM",
    masteryLevel: "NOT_MASTERED",
    reviewCount: 0,
    steps: [
      { order: 1, title: "识别方程类型", content: "这是一个标准的一元二次方程 $ax^2+bx+c=0$，其中 $a=1, b=-5, c=6$", latex: "x^2 - 5x + 6 = 0" },
      { order: 2, title: "选择解法 — 因式分解", content: "我们需要找到两个数，它们的乘积为 $c=6$，和为 $b=-5$。这两个数是 $-2$ 和 $-3$", latex: "-2 \\times (-3) = 6, \\quad -2 + (-3) = -5" },
      { order: 3, title: "写出因式分解", content: "将方程分解为两个一次因式的乘积", latex: "(x - 2)(x - 3) = 0" },
      { order: 4, title: "应用零乘法则", content: "如果两个因式的乘积为0，那么至少有一个因式等于0。因此我们分别令每个因式为0：", latex: "x - 2 = 0 \\quad \\text{或} \\quad x - 3 = 0" },
      { order: 5, title: "求解并写出答案", content: "分别解出两个方程，得到两个根。**注意不能遗漏任何一个根**。", latex: "x_1 = 2, \\quad x_2 = 3" },
    ],
    knowledgePoints: [
      { name: "一元二次方程", isMain: true, id: "kp1" },
      { name: "因式分解", isMain: false, id: "kp2" },
      { name: "零乘法则", isMain: false, id: "kp3" },
    ],
    keyFormulas: [
      "ax^2 + bx + c = 0",
      "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
    ],
    createdAt: "2026-03-09T10:30:00",
  },
  "2": {
    id: "2",
    subject: "PHYSICS",
    questionType: "CALCULATION",
    questionText: "一物体从高处自由落体，求第3秒末的速度（g=10m/s²）",
    userAnswer: "v = 45m/s",
    correctAnswer: "v = 30m/s",
    isCorrect: false,
    errorType: "FORMULA_ERROR",
    errorReason: "混淆了速度公式 v=gt 和位移公式 h=½gt²。第3秒末的速度应该用 v=gt=10×3=30m/s，而不是 h=½×10×3²=45m。",
    difficulty: "MEDIUM",
    masteryLevel: "PARTIAL",
    reviewCount: 1,
    steps: [
      { order: 1, title: "审题 — 明确已知条件", content: "自由落体运动，初速度 $v_0=0$，加速度 $g=10m/s^2$，时间 $t=3s$。求第3秒末（即 $t=3s$ 时刻）的速度。", latex: "v_0 = 0, \\quad g = 10\\text{m/s}^2, \\quad t = 3\\text{s}" },
      { order: 2, title: "选择正确的公式", content: "求**速度**用速度公式，不是位移公式！\n\n速度公式：$v = v_0 + gt$\n位移公式：$h = v_0t + \\frac{1}{2}gt^2$（这个是求距离的）", latex: "v = v_0 + gt" },
      { order: 3, title: "代入计算", content: "将已知条件代入速度公式", latex: "v = 0 + 10 \\times 3 = 30 \\text{ m/s}" },
      { order: 4, title: "写出答案", content: "第3秒末的速度为 30m/s，方向竖直向下", latex: "v = 30 \\text{ m/s}" },
    ],
    knowledgePoints: [
      { name: "自由落体运动", isMain: true, id: "kp7" },
      { name: "匀加速直线运动", isMain: false, id: "kp8" },
    ],
    keyFormulas: ["v = v_0 + gt", "h = v_0 t + \\frac{1}{2}gt^2"],
    createdAt: "2026-03-08T15:20:00",
  },
};

const ERROR_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  CONCEPT_CONFUSION: { label: "概念混淆", icon: "🔀" },
  FORMULA_ERROR: { label: "公式记错", icon: "📝" },
  CALCULATION_MISTAKE: { label: "计算失误", icon: "🔢" },
  LOGIC_ERROR: { label: "逻辑错误", icon: "🧩" },
  MISSING_CONDITION: { label: "遗漏条件", icon: "🔍" },
  METHOD_WRONG: { label: "方法错误", icon: "🚫" },
  CARELESS: { label: "粗心大意", icon: "😅" },
  NOT_UNDERSTOOD: { label: "完全不会", icon: "❓" },
};

const MASTERY_OPTIONS = [
  { value: "NOT_MASTERED", label: "未掌握", color: "bg-red-50 text-wrong border-red-200" },
  { value: "PARTIAL", label: "部分掌握", color: "bg-amber-50 text-partial border-amber-200" },
  { value: "MASTERED", label: "已掌握", color: "bg-emerald-50 text-correct border-emerald-200" },
];

export default function NotebookDetailPage({ params }: { params: { id: string } }) {
  const data = MOCK_DETAIL[params.id] || MOCK_DETAIL["1"];
  const [mastery, setMastery] = useState(data.masteryLevel);
  const [showDemo, setShowDemo] = useState(false);

  const errorTypeInfo = ERROR_TYPE_LABELS[data.errorType] || { label: data.errorType, icon: "⚠️" };

  return (
    <div>
      <PageHeader
        title="错题详情"
        showBack
        rightAction={
          <button className="text-xs text-[var(--color-text-tertiary)]">
            🖨️ 打印
          </button>
        }
      />

      <div className="px-4 pt-5 space-y-4 animate-fade-in">

        {/* Original Question */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">📄 原题</h3>
          <MathRenderer
            content={data.questionText}
            className="text-base font-medium leading-relaxed"
          />
          {data.questionLatex && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 text-center border border-[var(--color-border-light)]">
              <MathRenderer content={`$$${data.questionLatex}$$`} />
            </div>
          )}
        </section>

        {/* Answer Comparison */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-red-50/70 rounded-xl p-4 border border-red-100/60">
            <div className="text-[10px] font-medium text-wrong/70 uppercase mb-1.5">❌ 你的答案</div>
            <MathRenderer content={data.userAnswer || "未作答"} className="text-sm font-semibold text-red-800" />
          </div>
          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-100/60">
            <div className="text-[10px] font-medium text-correct/70 uppercase mb-1.5">✅ 正确答案</div>
            <MathRenderer content={data.correctAnswer || data.steps?.[data.steps.length - 1]?.latex || "—"} className="text-sm font-semibold text-emerald-800" />
          </div>
        </section>

        {/* Error Analysis */}
        <section className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100/60">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{errorTypeInfo.icon}</span>
            <h3 className="text-sm font-semibold text-orange-800">错因分析</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 font-medium">
              {errorTypeInfo.label}
            </span>
          </div>
          <MathRenderer
            content={data.errorReason}
            className="text-sm leading-relaxed text-orange-900/80"
          />
        </section>

        {/* Solution Demo Toggle */}
        <button
          onClick={() => setShowDemo(!showDemo)}
          className={cn(
            "w-full h-12 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
            showDemo
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-correct text-white shadow-lg shadow-emerald-500/20"
          )}
        >
          {showDemo ? "收起解法演示 ▲" : "▶ 查看正确解法演示"}
        </button>

        {/* Solution Demo */}
        {showDemo && data.steps && (
          <SolutionDemo steps={data.steps} autoPlay />
        )}

        {/* Key Formulas */}
        {data.keyFormulas?.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
            <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">📐 关键公式</h3>
            <div className="space-y-2.5">
              {data.keyFormulas.map((f: string, i: number) => (
                <div key={i} className="bg-nebula-50/50 rounded-xl p-3 border border-nebula-100/40 text-center">
                  <MathRenderer content={`$$${f}$$`} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Knowledge Points */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">🃏 涉及知识点</h3>
          <div className="flex flex-wrap gap-2">
            {data.knowledgePoints?.map((kp: any) => (
              <KnowledgePopover key={kp.name} name={kp.name} isMain={kp.isMain} />
            ))}
          </div>
        </section>

        {/* Mastery Self-Assessment */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">📊 掌握度评估</h3>
          <div className="flex gap-2">
            {MASTERY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMastery(opt.value)}
                className={cn(
                  "flex-1 h-10 rounded-xl text-sm font-medium border-2 transition-all",
                  mastery === opt.value
                    ? opt.color + " shadow-sm"
                    : "bg-white border-[var(--color-border-light)] text-[var(--color-text-tertiary)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2 text-center">
            已复习 {data.reviewCount} 次 · 点击标记你的掌握程度
          </p>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Link
            href={`/practice?type=targeted&kp=${encodeURIComponent(data.knowledgePoints?.[0]?.name || "")}`}
            className="flex-1 h-11 rounded-xl bg-nebula-gradient text-white font-medium text-sm shadow-sm flex items-center justify-center gap-1.5"
          >
            📋 做变式练习
          </Link>
          <button className="flex-1 h-11 rounded-xl bg-white border border-[var(--color-border)] font-medium text-sm flex items-center justify-center gap-1.5">
            🔄 AI重新讲解
          </button>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
