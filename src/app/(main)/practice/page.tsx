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

const CHAPTER_COLORS = [
  "from-nebula-400 to-nebula-600",
  "from-solar-400 to-amber-400",
  "from-aurora-500 to-aurora-600",
  "from-emerald-400 to-teal-500",
  "from-pink-400 to-rose-500",
  "from-blue-400 to-indigo-500",
  "from-violet-400 to-purple-500",
  "from-orange-400 to-red-400",
];

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
  semester: string;
  chapters: CurriculumChapter[];
}

function parseCurriculumBlocks(text: string): CurriculumBlock[] {
  const lines = text.split("\n").map((l) => l.trimEnd());
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
    if (!line || line.startsWith("【")) continue;
    if (line.startsWith("▌")) {
      pushBlock();
      currentBlock = { semester: line.slice(1).trim(), chapters: [] };
      continue;
    }
    if (line.match(/^第\d/) || line.startsWith("重点") || line.startsWith("难度")) {
      if (!currentBlock) currentBlock = { semester: "", chapters: [] };
      pushChapter();
      currentChapter = { title: line, items: [], forbidden: [] };
      continue;
    }
    if (line.startsWith("✗")) {
      const txt = line.replace(/^✗\s*禁止[：:]?\s*/, "").trim();
      if (currentChapter) currentChapter.forbidden.push(txt);
      continue;
    }
    if (line.startsWith("-") && currentChapter) {
      currentChapter.items.push(line.slice(1).trim());
    }
  }
  pushBlock();
  return blocks;
}

export default function PracticePage() {
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [curriculumBlocks, setCurriculumBlocks] = useState<CurriculumBlock[]>([]);
  const [gradeLabel, setGradeLabel] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("MATH");
  const [userSubjects, setUserSubjects] = useState<string[]>(["MATH"]);
  const [showAllChapters, setShowAllChapters] = useState(false);

  const loadCurriculum = async (subject: string) => {
    try {
      const res = await fetch(`/api/curriculum?subject=${subject}`);
      const data = await res.json();
      if (data.success) {
        setCurriculumBlocks(parseCurriculumBlocks(data.data.text));
        const gradeMap: Record<string, string> = {
          PRIMARY_1: "小学一年级", PRIMARY_2: "小学二年级", PRIMARY_3: "小学三年级",
          PRIMARY_4: "小学四年级", PRIMARY_5: "小学五年级", PRIMARY_6: "小学六年级",
          JUNIOR_1: "初一", JUNIOR_2: "初二", JUNIOR_3: "初三",
          SENIOR_1: "高一", SENIOR_2: "高二", SENIOR_3: "高三",
        };
        setGradeLabel(gradeMap[data.data.grade] || "");
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setWeakPoints(
            (res.data as WeakPoint[])
              .filter((kp) => kp.errorCount > 0)
              .sort((a, b) => b.errorCount - a.errorCount)
              .slice(0, 6)
          );
        }
      })
      .finally(() => setLoading(false));

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const subs: string[] = res.data.subjects?.length ? res.data.subjects : ["MATH"];
          setUserSubjects(subs);
          setSelectedSubject(subs[0]);
          loadCurriculum(subs[0]);
        } else {
          loadCurriculum("MATH");
        }
      })
      .catch(() => loadCurriculum("MATH"));
  }, []);

  // 所有章节展平
  const allChapters = curriculumBlocks.flatMap((b) =>
    b.chapters.map((ch) => ({ ...ch, semester: b.semester }))
  );
  const visibleChapters = showAllChapters ? allChapters : allChapters.slice(0, 3);

  return (
    <div>
      <PageHeader title="练习中心" subtitle="AI智能出题，针对性强化" />

      <div className="px-4 pt-5 space-y-6 animate-fade-in">

        {/* 课纲范围 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-sm">课纲范围</h2>
              {gradeLabel && (
                <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{gradeLabel} · AI出题严格在此范围内</p>
              )}
            </div>
            {/* 学科切换 */}
            {userSubjects.length > 1 && (
              <div className="flex gap-1">
                {userSubjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSelectedSubject(s); setShowAllChapters(false); loadCurriculum(s); }}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-lg font-medium transition-colors",
                      selectedSubject === s
                        ? "bg-nebula-gradient text-white"
                        : "bg-gray-100 text-[var(--color-text-secondary)]"
                    )}
                  >
                    {SUBJECT_ICONS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {allChapters.length === 0 && (
            <div className="bg-white rounded-2xl p-5 text-center shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
              <p className="text-sm text-[var(--color-text-secondary)]">请先在设置中选择年级</p>
              <Link href="/settings" className="text-xs text-nebula-500 font-medium mt-1 block">去设置 →</Link>
            </div>
          )}

          <div className="space-y-2.5">
            {visibleChapters.map((ch, i) => {
              const color = CHAPTER_COLORS[i % CHAPTER_COLORS.length];
              const numMatch = ch.title.match(/\d+/);
              const chNum = numMatch ? numMatch[0] : String(i + 1);
              const preview = ch.items[0] || "";

              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]"
                >
                  <div className="flex items-center p-4 gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md",
                      color
                    )}>
                      <span className="text-white font-bold text-lg">{chNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm leading-snug">{ch.title}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-[var(--color-text-secondary)] font-medium flex-shrink-0">
                          {ch.items.length}个知识点
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 line-clamp-1">{preview}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {allChapters.length > 3 && (
            <button
              onClick={() => setShowAllChapters((v) => !v)}
              className="w-full mt-2 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-white text-xs text-[var(--color-text-secondary)] font-medium"
            >
              {showAllChapters ? "收起 ↑" : `查看全部 ${allChapters.length} 个章节 ↓`}
            </button>
          )}
        </section>

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
            <Link href="/knowledge" className="text-xs text-nebula-500 font-medium">查看全部 →</Link>
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
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-wrong" style={{ width: `${Math.min(wp.errorCount * 15, 100)}%` }} />
                  </div>
                </div>
                <span className="text-xs text-nebula-500 font-medium flex-shrink-0">专项 →</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}
