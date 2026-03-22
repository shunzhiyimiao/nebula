"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import MathRenderer, { Formula } from "@/components/scan/MathRenderer";
import { cn } from "@/lib/utils";

// 模拟数据 (后续替换为API调用)
const MOCK_KNOWLEDGE: Record<string, any> = {
  kp1: {
    id: "kp1",
    name: "一元二次方程",
    subject: "MATH",
    chapter: "方程与不等式",
    definition: "形如 ax²+bx+c=0（a≠0）的方程叫做一元二次方程。其中 a 是二次项系数，b 是一次项系数，c 是常数项。",
    formulas: [
      "ax^2 + bx + c = 0 \\quad (a \\neq 0)",
      "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      "\\Delta = b^2 - 4ac",
      "x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}",
    ],
    keyPoints: [
      "a≠0 是一元二次方程的前提条件",
      "判别式 Δ=b²-4ac 决定了根的情况：Δ>0 两个不等实根，Δ=0 两个相等实根，Δ<0 无实根",
      "解题方法有三种：因式分解法（最常用）、公式法（万能）、配方法",
      "韦达定理（根与系数关系）可以不解方程直接求根的和与积",
    ],
    examples: [
      {
        question: "解方程：x² - 5x + 6 = 0",
        solution: "因式分解：(x-2)(x-3)=0，所以 x=2 或 x=3",
        latex: "(x-2)(x-3) = 0",
      },
      {
        question: "解方程：2x² + 3x - 1 = 0",
        solution: "用求根公式：x = (-3 ± √(9+8)) / 4 = (-3 ± √17) / 4",
        latex: "x = \\frac{-3 \\pm \\sqrt{17}}{4}",
      },
    ],
    commonMistakes: [
      "忘记检查 a≠0 的条件",
      "求根公式中 ±√ 只取了一个值，漏掉另一个根",
      "因式分解时遗漏一个因子",
      "配方法移项时符号出错",
      "把 Δ<0 时误以为有实数根",
    ],
    relatedPoints: [
      { id: "kp2", name: "因式分解" },
      { id: "kp10", name: "根与系数的关系(韦达定理)" },
      { id: "kp11", name: "判别式" },
      { id: "kp5", name: "二次函数" },
    ],
    userErrorCount: 6,
    userMastery: 30,
    userErrors: [
      { id: "e1", questionText: "解方程: x² - 5x + 6 = 0", errorType: "遗漏解", createdAt: "3月9日" },
      { id: "e2", questionText: "若 x²+bx+9=0 有两个相等实根，求 b", errorType: "公式记错", createdAt: "3月7日" },
      { id: "e3", questionText: "解方程: 3x² - 7x + 2 = 0", errorType: "计算失误", createdAt: "3月5日" },
    ],
  },
  kp2: {
    id: "kp2",
    name: "因式分解",
    subject: "MATH",
    chapter: "方程与不等式",
    definition: "把一个多项式化成几个整式的积的形式，叫做因式分解（也叫分解因式）。它是整式乘法的逆运算。",
    formulas: [
      "a^2 - b^2 = (a+b)(a-b)",
      "a^2 \\pm 2ab + b^2 = (a \\pm b)^2",
      "x^2 + (p+q)x + pq = (x+p)(x+q)",
    ],
    keyPoints: [
      "因式分解是乘法展开的逆过程",
      "常用方法：提公因式法、公式法（平方差、完全平方）、十字相乘法",
      "分解要彻底，直到每个因式不能再分解为止",
    ],
    examples: [
      { question: "分解因式：x² - 9", solution: "(x+3)(x-3)", latex: "(x+3)(x-3)" },
    ],
    commonMistakes: ["提公因式不彻底", "符号错误", "十字相乘法凑数错误"],
    relatedPoints: [{ id: "kp1", name: "一元二次方程" }],
    userErrorCount: 4,
    userMastery: 45,
    userErrors: [],
  },
};

const MASTERY_CONFIG = [
  { min: 0, max: 30, label: "需要加强", color: "text-wrong", bg: "bg-red-50", ring: "stroke-wrong" },
  { min: 30, max: 60, label: "部分掌握", color: "text-partial", bg: "bg-amber-50", ring: "stroke-partial" },
  { min: 60, max: 80, label: "基本掌握", color: "text-nebula-600", bg: "bg-nebula-50", ring: "stroke-nebula-500" },
  { min: 80, max: 101, label: "已掌握", color: "text-correct", bg: "bg-emerald-50", ring: "stroke-correct" },
];

function getMasteryConfig(mastery: number) {
  return MASTERY_CONFIG.find((c) => mastery >= c.min && mastery < c.max) || MASTERY_CONFIG[0];
}

function MasteryRing({ mastery }: { mastery: number }) {
  const config = getMasteryConfig(mastery);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (mastery / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100" />
        <circle cx="40" cy="40" r="36" fill="none" strokeWidth="6" strokeLinecap="round"
          className={config.ring}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-xl font-display font-700", config.color)}>{mastery}%</span>
        <span className="text-[9px] text-[var(--color-text-tertiary)]">{config.label}</span>
      </div>
    </div>
  );
}

export default function KnowledgeDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "errors" | "practice">("card");

  useEffect(() => {
    // 模拟数据加载
    const mock = MOCK_KNOWLEDGE[params.id];
    if (mock) {
      setData(mock);
    } else {
      // 生成一个基础的
      setData({
        id: params.id,
        name: "知识点",
        definition: "",
        subject: "MATH",
        formulas: [],
        keyPoints: [],
        examples: [],
        commonMistakes: [],
        relatedPoints: [],
        userMastery: 50,
        userErrorCount: 0,
        userErrors: [],
      });
    }
  }, [params.id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse-soft text-4xl">📘</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={data.name} subtitle={data.chapter} showBack />

      <div className="px-4 pt-5 space-y-5 animate-fade-in">
        {/* Hero Card */}
        <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <div className="flex items-center gap-5">
            <MasteryRing mastery={data.userMastery || 50} />
            <div className="flex-1">
              <h2 className="font-display text-lg font-700">{data.name}</h2>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{data.chapter} · {data.subject === "MATH" ? "数学" : data.subject}</p>
              <div className="flex gap-3 mt-3">
                <div className="text-center">
                  <div className="text-lg font-display font-700 text-wrong">{data.userErrorCount}</div>
                  <div className="text-[9px] text-[var(--color-text-tertiary)]">错题数</div>
                </div>
                <div className="w-px bg-[var(--color-border-light)]" />
                <div className="text-center">
                  <div className="text-lg font-display font-700 text-nebula-600">{data.formulas?.length || 0}</div>
                  <div className="text-[9px] text-[var(--color-text-tertiary)]">核心公式</div>
                </div>
                <div className="w-px bg-[var(--color-border-light)]" />
                <div className="text-center">
                  <div className="text-lg font-display font-700 text-aurora-600">{data.relatedPoints?.length || 0}</div>
                  <div className="text-[9px] text-[var(--color-text-tertiary)]">关联知识</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { value: "card" as const, label: "📘 知识卡片" },
            { value: "errors" as const, label: "❌ 相关错题" },
            { value: "practice" as const, label: "📋 专项练习" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex-1 h-9 rounded-lg text-xs font-medium transition-all",
                activeTab === tab.value
                  ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: 知识卡片 */}
        {activeTab === "card" && (
          <div className="space-y-4">
            {/* Definition */}
            {data.definition ? (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-2.5">定义</h3>
                <MathRenderer content={data.definition} className="text-sm leading-relaxed" />
              </section>
            ) : (
              <button
                onClick={() => setGenerating(true)}
                className="w-full bg-nebula-50 rounded-2xl p-6 border border-nebula-100/60 text-center"
              >
                <div className="text-2xl mb-2">✨</div>
                <p className="text-sm font-medium text-nebula-700">AI 生成知识卡片</p>
                <p className="text-xs text-nebula-500/70 mt-1">点击自动生成完整的知识点内容</p>
              </button>
            )}

            {/* Formulas */}
            {data.formulas?.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">核心公式</h3>
                <div className="space-y-3">
                  {data.formulas.map((f: string, i: number) => (
                    <div key={i} className="bg-nebula-50/50 rounded-xl p-4 border border-nebula-100/40 text-center">
                      <Formula latex={f} display />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Key Points */}
            {data.keyPoints?.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">重点</h3>
                <div className="space-y-2.5">
                  {data.keyPoints.map((p: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-nebula-100 flex items-center justify-center text-[10px] font-bold text-nebula-600 flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <MathRenderer content={p} className="text-sm leading-relaxed flex-1" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Examples */}
            {data.examples?.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">典型例题</h3>
                <div className="space-y-4">
                  {data.examples.map((ex: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 border border-[var(--color-border-light)]">
                      <p className="text-sm font-medium">
                        <span className="text-nebula-500 mr-1.5">例{i + 1}.</span>
                        {ex.question}
                      </p>
                      <div className="mt-2 pl-3 border-l-2 border-nebula-200">
                        <p className="text-sm text-[var(--color-text-secondary)]">{ex.solution}</p>
                        {ex.latex && (
                          <div className="mt-2">
                            <Formula latex={ex.latex} display />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Common Mistakes */}
            {data.commonMistakes?.length > 0 && (
              <section className="bg-red-50/50 rounded-2xl p-5 border border-red-100/60">
                <h3 className="text-xs font-semibold text-wrong/80 uppercase mb-3">⚠️ 常见错误</h3>
                <div className="space-y-2">
                  {data.commonMistakes.map((m: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-wrong/50 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-sm text-red-800/80">{m}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Related Knowledge Points */}
            {data.relatedPoints?.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
                <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-3">关联知识点</h3>
                <div className="flex flex-wrap gap-2">
                  {data.relatedPoints.map((rp: any) => (
                    <Link
                      key={rp.id || rp.name}
                      href={`/knowledge/${rp.id || rp.name}`}
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-nebula-50 text-nebula-700 hover:bg-nebula-100 transition-colors border border-nebula-100/60"
                    >
                      <span className="text-xs">📘</span>
                      {rp.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Tab: 相关错题 */}
        {activeTab === "errors" && (
          <div className="space-y-3">
            {data.userErrors?.length > 0 ? (
              data.userErrors.map((err: any) => (
                <Link
                  key={err.id}
                  href={`/notebook/${err.id}`}
                  className="block bg-white rounded-xl p-4 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] card-hover"
                >
                  <p className="text-sm font-medium line-clamp-2">{err.questionText}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-50 text-wrong">{err.errorType}</span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">{err.createdAt}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-sm text-[var(--color-text-secondary)]">该知识点暂无错题</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: 专项练习 */}
        {activeTab === "practice" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-sm font-medium mb-1">「{data.name}」专项练习</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
                AI根据你的薄弱点智能出题
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href={`/practice?type=targeted&kp=${encodeURIComponent(data.name)}&count=5`}
                  className="h-10 px-5 rounded-xl bg-nebula-gradient text-white text-sm font-medium shadow-sm flex items-center gap-1.5"
                >
                  快速5题
                </Link>
                <Link
                  href={`/practice?type=targeted&kp=${encodeURIComponent(data.name)}&count=15`}
                  className="h-10 px-5 rounded-xl bg-white border border-[var(--color-border)] text-sm font-medium flex items-center gap-1.5"
                >
                  全面15题
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex gap-3 pt-2">
          <Link
            href={`/practice?type=targeted&kp=${encodeURIComponent(data.name)}`}
            className="flex-1 h-11 rounded-xl bg-nebula-gradient text-white font-medium text-sm shadow-sm flex items-center justify-center gap-1.5"
          >
            📋 开始专项练习
          </Link>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
