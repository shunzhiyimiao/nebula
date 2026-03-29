"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

const PRACTICE_TYPES = [
  {
    type: "daily",
    icon: "☀️",
    title: "每日练习",
    desc: "根据薄弱知识点，每日智能推荐10题",
    color: "from-solar-400 to-amber-400",
    bgLight: "bg-solar-50",
    count: 10,
  },
  {
    type: "review",
    icon: "🔄",
    title: "错题复习",
    desc: "从错题本中抽题，重新练习巩固",
    color: "from-aurora-500 to-aurora-600",
    bgLight: "bg-aurora-50",
    count: 10,
  },
];

const SUBJECT_ICONS: Record<string, string> = {
  MATH: "📐", PHYSICS: "⚡", CHEMISTRY: "🧪",
  ENGLISH: "🔤", CHINESE: "📖", BIOLOGY: "🧬",
  HISTORY: "🏛️", GEOGRAPHY: "🌍", POLITICS: "📜",
};

const SUBJECT_LABELS: Record<string, string> = {
  MATH: "数学", PHYSICS: "物理", CHEMISTRY: "化学",
  ENGLISH: "英语", CHINESE: "语文", BIOLOGY: "生物",
  HISTORY: "历史", GEOGRAPHY: "地理", POLITICS: "政治",
};

interface WeakPoint {
  id: string;
  name: string;
  subject: string;
  errorCount: number;
}

interface CurriculumChapter {
  title: string;
  items: string[];
  forbidden: string[];
}

interface CurriculumBlock {
  semester: string;   // e.g. "上册" / "" (高中无上下册)
  chapters: CurriculumChapter[];
}

// 将课纲文本解析为结构化章节列表
function parseCurriculumBlocks(text: string): { header: string; blocks: CurriculumBlock[] } {
  const lines = text.split("\n").map((l) => l.trimEnd());

  let header = "";
  const blocks: CurriculumBlock[] = [];
  let currentBlock: CurriculumBlock | null = null;
  let currentChapter: CurriculumChapter | null = null;

  const pushChapter = () => {
    if (currentChapter && currentBlock) currentBlock.chapters.push(currentChapter);
    currentChapter = null;
  };
  const pushBlock = () => {
    pushChapter();
    if (currentBlock) blocks.push(currentBlock);
    currentBlock = null;
  };

  for (const line of lines) {
    if (!line) continue;

    // 大标题 【...】
    if (line.startsWith("【")) {
      header = line.replace(/[【】]/g, "").trim();
      continue;
    }
    // 上下册/学期分隔 ▌
    if (line.startsWith("▌")) {
      pushBlock();
      currentBlock = { semester: line.slice(1).trim(), chapters: [] };
      continue;
    }
    // 章节标题（第X章 / 第X节 / 重点综合考查 等）
    if (line.match(/^第\d/) || line.startsWith("重点") || line.startsWith("难度")) {
      if (!currentBlock) currentBlock = { semester: "", chapters: [] };
      pushChapter();
      currentChapter = { title: line, items: [], forbidden: [] };
      continue;
    }
    // 禁止项
    if (line.startsWith("✗")) {
      const txt = line.replace(/^✗\s*禁止[：:]?\s*/, "").trim();
      if (currentChapter) currentChapter.forbidden.push(txt);
      continue;
    }
    // 知识点条目
    if (line.startsWith("-")) {
      if (currentChapter) currentChapter.items.push(line.slice(1).trim());
      continue;
    }
    // 其他行（说明文字）附加到当前章节
    if (currentChapter) currentChapter.items.push(line);
  }

  pushBlock();
  // 如果没有▌分隔（高中直接是章节），确保有一个 block
  if (blocks.length === 0 && currentBlock) blocks.push(currentBlock);

  return { header, blocks };
}

export default function PracticePage() {
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // 课纲抽屉
  const [sheetOpen, setSheetOpen] = useState(false);
  const [curriculumText, setCurriculumText] = useState("");
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("MATH");
  const [userSubjects, setUserSubjects] = useState<string[]>(["MATH"]);
  const [gradeLabel, setGradeLabel] = useState("");

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const withErrors = (res.data as WeakPoint[])
            .filter((kp) => kp.errorCount > 0)
            .sort((a, b) => b.errorCount - a.errorCount)
            .slice(0, 6);
          setWeakPoints(withErrors);
        }
      })
      .finally(() => setLoading(false));

    // 获取用户学科列表
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.subjects?.length) setUserSubjects(res.data.subjects);
      })
      .catch(() => {});
  }, []);

  const openCurriculum = async (subject = selectedSubject) => {
    setSheetOpen(true);
    setCurriculumLoading(true);
    setCurriculumText("");
    try {
      const res = await fetch(`/api/curriculum?subject=${subject}`);
      const data = await res.json();
      if (data.success) {
        setCurriculumText(data.data.text);
        const gradeMap: Record<string, string> = {
          PRIMARY_1: "小学一年级", PRIMARY_2: "小学二年级", PRIMARY_3: "小学三年级",
          PRIMARY_4: "小学四年级", PRIMARY_5: "小学五年级", PRIMARY_6: "小学六年级",
          JUNIOR_1: "初一", JUNIOR_2: "初二", JUNIOR_3: "初三",
          SENIOR_1: "高一", SENIOR_2: "高二", SENIOR_3: "高三",
        };
        setGradeLabel(gradeMap[data.data.grade] || "");
      }
    } finally {
      setCurriculumLoading(false);
    }
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    openCurriculum(subject);
  };

  const parsed = parseCurriculumBlocks(curriculumText);

  return (
    <div>
      <PageHeader
        title="练习中心"
        subtitle="AI智能出题，针对性强化"
        rightAction={
          <button
            onClick={() => openCurriculum(selectedSubject)}
            className="flex items-center gap-1 text-xs text-nebula-500 font-medium px-2.5 py-1.5 rounded-lg bg-nebula-50 active:scale-95 transition-transform"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            课纲
          </button>
        }
      />

      <div className="px-4 pt-5 space-y-6 animate-fade-in">

        {/* 练习类型 */}
        <section className="space-y-3">
          {PRACTICE_TYPES.map((p, i) => (
            <Link
              key={p.type}
              href={`/practice/session?type=${p.type}`}
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
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{p.desc}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-nebula-50 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-nebula-500">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* 薄弱知识点专项 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">薄弱知识点专项</h2>
            <Link href="/knowledge" className="text-xs text-nebula-500 font-medium">
              查看全部 →
            </Link>
          </div>

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-3.5 border border-[var(--color-border-light)] animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="h-2 bg-gray-100 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && weakPoints.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <div className="text-3xl mb-2">📖</div>
              <p className="text-sm text-[var(--color-text-secondary)]">还没有错题记录</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">拍照解题并保存后，这里会显示薄弱知识点</p>
            </div>
          )}

          <div className="space-y-2">
            {weakPoints.map((wp, i) => (
              <Link
                key={wp.id}
                href={`/practice/session?type=targeted&kp=${encodeURIComponent(wp.name)}&kpId=${wp.id}`}
                className="flex items-center gap-3 bg-white rounded-xl p-3.5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] card-hover animate-slide-up"
                style={{ animationDelay: `${(i + 2) * 60}ms`, animationFillMode: "backwards" }}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm flex-shrink-0">
                  {SUBJECT_ICONS[wp.subject] || "📚"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{wp.name}</span>
                    <span className="text-[10px] text-wrong">错{wp.errorCount}次</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-wrong"
                        style={{ width: `${Math.min(wp.errorCount * 15, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-nebula-500 font-medium flex-shrink-0">专项 →</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="h-4" />
      </div>

      {/* 课纲抽屉 */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />

          {/* 抽屉主体 */}
          <div className="relative bg-[var(--color-bg)] rounded-t-3xl overflow-hidden flex flex-col"
            style={{ maxHeight: "88vh" }}>

            {/* 拖拽指示条 */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-200" />
            </div>

            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border-light)] flex-shrink-0">
              <div>
                <h3 className="font-semibold text-sm">课纲范围</h3>
                {gradeLabel && (
                  <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{gradeLabel} · AI出题仅在此范围内</p>
                )}
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* 学科切换 Tab */}
            {userSubjects.length > 1 && (
              <div className="flex gap-1.5 px-4 py-2.5 border-b border-[var(--color-border-light)] overflow-x-auto flex-shrink-0">
                {userSubjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSubjectChange(s)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                      selectedSubject === s
                        ? "bg-nebula-gradient text-white"
                        : "bg-gray-100 text-[var(--color-text-secondary)]"
                    )}
                  >
                    <span>{SUBJECT_ICONS[s]}</span>
                    {SUBJECT_LABELS[s]}
                  </button>
                ))}
              </div>
            )}

            {/* 课纲内容 */}
            <div className="overflow-y-auto overflow-x-hidden flex-1 px-4 py-3">
              {curriculumLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-nebula-400 border-t-transparent animate-spin" />
                  <p className="text-xs text-[var(--color-text-tertiary)]">加载课纲中...</p>
                </div>
              )}

              {!curriculumLoading && !curriculumText && (
                <div className="text-center py-16">
                  <div className="text-3xl mb-3">📋</div>
                  <p className="text-sm text-[var(--color-text-secondary)]">暂无课纲数据</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">请先在设置中选择年级</p>
                  <Link
                    href="/settings"
                    onClick={() => setSheetOpen(false)}
                    className="inline-block mt-4 px-4 py-2 rounded-xl bg-nebula-50 text-xs text-nebula-600 font-medium"
                  >
                    去设置选择年级 →
                  </Link>
                </div>
              )}

              {!curriculumLoading && parsed.blocks.length > 0 && (
                <div className="space-y-3 pb-8">
                  {/* 标题说明 */}
                  {parsed.header && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex-1 h-px bg-[var(--color-border-light)]" />
                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium px-2">{parsed.header}</span>
                      <div className="flex-1 h-px bg-[var(--color-border-light)]" />
                    </div>
                  )}

                  {parsed.blocks.map((block, bi) => (
                    <div key={bi}>
                      {/* 上下册/学期标签 */}
                      {block.semester && (
                        <div className="flex items-center gap-2 mb-2 mt-1">
                          <div className="h-px flex-1 bg-[var(--color-border-light)]" />
                          <span className="text-[11px] font-semibold text-nebula-500 bg-nebula-50 px-2.5 py-0.5 rounded-full">
                            {block.semester}
                          </span>
                          <div className="h-px flex-1 bg-[var(--color-border-light)]" />
                        </div>
                      )}

                      {/* 章节卡片 */}
                      <div className="space-y-2">
                        {block.chapters.map((ch, ci) => (
                          <div
                            key={ci}
                            className="bg-white rounded-2xl border border-[var(--color-border-light)] shadow-[var(--shadow-sm)] overflow-hidden"
                          >
                            {/* 章节标题 */}
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-50/80 border-b border-[var(--color-border-light)]">
                              <div className="w-1.5 h-4 rounded-full bg-nebula-gradient flex-shrink-0" />
                              <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-snug min-w-0 break-words">
                                {ch.title}
                              </span>
                            </div>

                            {/* 知识点列表 */}
                            {ch.items.length > 0 && (
                              <ul className="px-3.5 py-2 space-y-1.5">
                                {ch.items.map((item, ii) => (
                                  <li key={ii} className="flex items-start gap-2 min-w-0">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-nebula-300 flex-shrink-0" />
                                    <span className="text-xs text-[var(--color-text-secondary)] leading-relaxed break-words min-w-0 flex-1">
                                      {item}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* 禁止项 */}
                            {ch.forbidden.length > 0 && (
                              <div className="mx-3.5 mb-2.5 mt-1 bg-red-50 rounded-xl px-3 py-2">
                                <p className="text-[10px] font-semibold text-red-400 mb-1">✗ 本章不考查</p>
                                {ch.forbidden.map((f, fi) => (
                                  <p key={fi} className="text-[11px] text-red-400/80 leading-relaxed break-words">{f}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
