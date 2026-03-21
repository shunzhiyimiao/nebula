"use client";

import { useState, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import PrintPreview from "@/components/print/PrintPreview";
import { cn } from "@/lib/utils";

type PrintType = "notebook" | "practice" | "report";

const SUBJECTS = [
  { value: "all", label: "全部学科" },
  { value: "MATH", label: "📐 数学" },
  { value: "PHYSICS", label: "⚡ 物理" },
  { value: "CHEMISTRY", label: "🧪 化学" },
  { value: "ENGLISH", label: "🔤 英语" },
];

const MASTERY_FILTERS = [
  { value: "all", label: "全部" },
  { value: "NOT_MASTERED", label: "未掌握" },
  { value: "PARTIAL", label: "部分掌握" },
];

const TIME_RANGES = [
  { value: "week", label: "最近一周" },
  { value: "month", label: "最近一月" },
  { value: "all", label: "全部时间" },
];

export default function PrintPage() {
  const [printType, setPrintType] = useState<PrintType>("notebook");
  const [subject, setSubject] = useState("all");
  const [mastery, setMastery] = useState("all");
  const [timeRange, setTimeRange] = useState("month");
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [studentName, setStudentName] = useState("");

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = useCallback(async () => {
    setPreviewLoading(true);
    setShowPreview(true);

    try {
      // 计算日期范围
      let dateFrom: string | undefined;
      const now = new Date();
      if (timeRange === "week") {
        const d = new Date(now); d.setDate(d.getDate() - 7);
        dateFrom = d.toISOString();
      } else if (timeRange === "month") {
        const d = new Date(now); d.setMonth(d.getMonth() - 1);
        dateFrom = d.toISOString();
      }

      if (printType === "notebook") {
        const res = await fetch("/api/print/notebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: subject !== "all" ? subject : undefined,
            masteryLevel: mastery !== "all" ? mastery : undefined,
            dateFrom,
            studentName: studentName || undefined,
          }),
        });
        const html = await res.text();
        setPreviewHtml(html);
      } else if (printType === "practice") {
        const res = await fetch("/api/print/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "latest", // TODO: 选择练习
            includeAnswers,
            studentName: studentName || undefined,
          }),
        });
        const html = await res.text();
        setPreviewHtml(html);
      }
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setPreviewLoading(false);
    }
  }, [printType, subject, mastery, timeRange, includeAnswers, studentName]);

  const PRINT_TYPES = [
    {
      type: "notebook" as PrintType,
      icon: "📝",
      title: "错题本",
      desc: "错因分析 + 正确解法 + 知识点标注",
      color: "from-aurora-500 to-aurora-600",
    },
    {
      type: "practice" as PrintType,
      icon: "📋",
      title: "练习册",
      desc: "按题型分组 + 可撕答案页",
      color: "from-nebula-500 to-nebula-600",
    },
    {
      type: "report" as PrintType,
      icon: "📊",
      title: "学习报告",
      desc: "统计图表 + 薄弱点分析",
      color: "from-solar-400 to-solar-500",
    },
  ];

  return (
    <div>
      <PageHeader title="打印中心" showBack />

      <div className="px-4 pt-5 space-y-5 animate-fade-in">

        {/* Print Type Selection */}
        <section>
          <label className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-2.5 block">选择打印内容</label>
          <div className="grid grid-cols-3 gap-2.5">
            {PRINT_TYPES.map((pt) => (
              <button
                key={pt.type}
                onClick={() => setPrintType(pt.type)}
                className={cn(
                  "rounded-2xl p-4 text-center transition-all border-2",
                  printType === pt.type
                    ? "border-nebula-400 bg-nebula-50/50 shadow-sm"
                    : "border-transparent bg-white shadow-[var(--shadow-sm)]"
                )}
              >
                <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br mx-auto flex items-center justify-center text-2xl mb-2", pt.color)}>
                  {pt.icon}
                </div>
                <div className="text-sm font-semibold">{pt.title}</div>
                <div className="text-[9px] text-[var(--color-text-tertiary)] mt-0.5 leading-snug">{pt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Configuration */}
        <section className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] space-y-4">
          <h3 className="text-sm font-semibold">打印设置</h3>

          {/* Student Name */}
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">学生姓名（可选）</label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="填写后会显示在封面"
              className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400"
            />
          </div>

          {/* Subject Filter */}
          {printType !== "report" && (
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">学科</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSubject(s.value)}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-medium transition-all",
                      subject === s.value
                        ? "bg-nebula-600 text-white"
                        : "bg-gray-100 text-[var(--color-text-secondary)]"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mastery Filter (notebook only) */}
          {printType === "notebook" && (
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">掌握度筛选</label>
              <div className="flex gap-2">
                {MASTERY_FILTERS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMastery(m.value)}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-medium transition-all",
                      mastery === m.value
                        ? "bg-nebula-600 text-white"
                        : "bg-gray-100 text-[var(--color-text-secondary)]"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Range */}
          {printType !== "report" && (
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">时间范围</label>
              <div className="flex gap-2">
                {TIME_RANGES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTimeRange(t.value)}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-medium transition-all",
                      timeRange === t.value
                        ? "bg-nebula-600 text-white"
                        : "bg-gray-100 text-[var(--color-text-secondary)]"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Include Answers (practice only) */}
          {printType === "practice" && (
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--color-text-secondary)]">包含答案与解析</label>
              <button
                onClick={() => setIncludeAnswers(!includeAnswers)}
                className={cn(
                  "w-10 h-6 rounded-full transition-all relative",
                  includeAnswers ? "bg-nebula-500" : "bg-gray-300"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                  includeAnswers ? "left-5" : "left-1"
                )} />
              </button>
            </div>
          )}
        </section>

        {/* Preview Hints */}
        <div className="bg-nebula-50/50 rounded-2xl p-4 border border-nebula-100/60">
          <h4 className="text-xs font-semibold text-nebula-800 mb-2">💡 打印说明</h4>
          <div className="space-y-1 text-[11px] text-nebula-700/80">
            <p>• 点击「生成预览」后可在线预览排版效果</p>
            <p>• 在预览页点击「打印/导出PDF」，然后选择「另存为PDF」</p>
            <p>• 推荐使用 Chrome 浏览器，打印效果最佳</p>
            <p>• 纸张默认 A4 大小，边距已优化</p>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="w-full h-12 rounded-xl bg-nebula-gradient text-white font-semibold text-sm shadow-lg shadow-nebula-500/25 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          🖨️ 生成预览
        </button>

        <div className="h-8" />
      </div>

      {/* Print Preview Modal */}
      {showPreview && (
        <PrintPreview
          html={previewHtml}
          loading={previewLoading}
          onClose={() => { setShowPreview(false); setPreviewHtml(null); }}
        />
      )}
    </div>
  );
}
