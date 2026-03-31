"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import MathRenderer from "@/components/scan/MathRenderer";
import { cn } from "@/lib/utils";

interface PracticeQuestion {
  id: string;
  questionText: string;
  questionLatex?: string;
  questionType: "CHOICE" | "FILL_BLANK" | "SHORT_ANSWER" | "CALCULATION";
  options?: string[];
  answer: string;
  explanation: string;
  knowledgePoint?: string;
  difficulty?: string;
}

interface AnswerRecord {
  questionId: string;   // DB PracticeQuestion id
  userAnswer: string;
  isCorrect: boolean;
}

type SessionStage = "loading" | "question" | "summary";

function PracticeSessionInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = searchParams.get("type") || "daily";
  const kp = searchParams.get("kp") || "";
  const count = parseInt(searchParams.get("count") || "5");

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [stage, setStage] = useState<SessionStage>("loading");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [error, setError] = useState("");

  // DB session tracking
  const sessionIdRef = useRef<string | null>(null);
  const questionIdsRef = useRef<string[]>([]);
  const answersRef = useRef<AnswerRecord[]>([]);

  // 创建 DB session（后台静默，不阻塞答题）
  const startDbSession = useCallback(async (qs: PracticeQuestion[]) => {
    try {
      const res = await fetch("/api/practice/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: qs, type, kp }),
      });
      const data = await res.json();
      if (data.success) {
        sessionIdRef.current = data.sessionId;
        questionIdsRef.current = data.questionIds;
      }
    } catch {
      // 静默失败，不影响答题体验
    }
  }, [type, kp]);

  // 保存结果到 DB
  const completeDbSession = useCallback(async () => {
    if (!sessionIdRef.current || answersRef.current.length === 0) return;
    try {
      await fetch("/api/practice/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          answers: answersRef.current,
        }),
      });
    } catch {
      // 静默失败
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setStage("loading");
    setError("");
    sessionIdRef.current = null;
    questionIdsRef.current = [];
    answersRef.current = [];

    try {
      const params = new URLSearchParams({
        type,
        ...(kp ? { kp } : {}),
        count: String(count),
      });
      const res = await fetch(`/api/practice/generate?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "生成失败");

      setQuestions(data.questions);
      setCurrent(0);
      setUserAnswer("");
      setShowResult(false);
      setIsCorrect(null);
      setScore({ correct: 0, total: 0 });
      setStage("question");

      // 后台创建 DB session
      startDbSession(data.questions);
    } catch (e: any) {
      setError(e.message || "生成题目失败，请重试");
    }
  }, [type, kp, count, startDbSession]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    const q = questions[current];

    // 选择题：只比较字母前缀（"A. 文字" → "A"，兼容 AI 返回 "A"/"A."/"选A" 等格式）
    const extractChoice = (s: string) =>
      s.trim().match(/^([A-Da-d])[.\s。、]?/)?.[1]?.toUpperCase() ?? s.trim().toUpperCase();

    const correct =
      q.questionType === "CHOICE"
        ? extractChoice(userAnswer) === extractChoice(q.answer)
        : userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    // 记录答案
    const qId = questionIdsRef.current[current];
    if (qId) {
      answersRef.current.push({ questionId: qId, userAnswer: userAnswer.trim(), isCorrect: correct });
    }
  };

  const handleNext = () => {
    if (current >= questions.length - 1) {
      setStage("summary");
      completeDbSession();
    } else {
      setCurrent((c) => c + 1);
      setUserAnswer("");
      setShowResult(false);
      setIsCorrect(null);
    }
  };

  const q = questions[current];
  const TITLE_MAP: Record<string, string> = {
    daily: "每日练习",
    review: "错题复习",
    targeted: kp ? `「${kp}」专项` : "专项练习",
  };

  // ===== Loading / Error =====
  if (stage === "loading") {
    return (
      <div>
        <PageHeader title={TITLE_MAP[type] || "练习"} showBack />
        <div className="flex flex-col items-center justify-center py-24 px-6 gap-4">
          {error ? (
            <>
              <div className="text-4xl">😕</div>
              <p className="text-sm text-[var(--color-text-secondary)] text-center">{error}</p>
              <button
                onClick={loadQuestions}
                className="h-10 px-6 rounded-xl bg-nebula-gradient text-white text-sm font-medium"
              >
                重试
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-nebula-gradient flex items-center justify-center shadow-lg shadow-nebula-500/20 animate-pulse">
                <span className="text-2xl">✨</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">AI 正在生成题目...</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  {kp ? `针对「${kp}」智能出题` : "根据你的薄弱点智能出题"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ===== Summary =====
  if (stage === "summary") {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div>
        <PageHeader title="练习结果" showBack />
        <div className="px-4 pt-8 space-y-5 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] text-center">
            <div className="text-5xl mb-3">{pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "💪"}</div>
            <h2 className="text-2xl font-bold mb-1">{pct}%</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              共 {score.total} 题，答对 {score.correct} 题
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              {pct >= 80 ? "掌握得很好！" : pct >= 60 ? "继续加油！" : "需要多加练习"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadQuestions}
              className="flex-1 h-12 rounded-xl bg-nebula-gradient text-white font-semibold text-sm shadow-lg shadow-nebula-500/20"
            >
              🔄 再练一组
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-xl bg-white border border-[var(--color-border)] font-semibold text-sm"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Question =====
  return (
    <div>
      <PageHeader
        title={TITLE_MAP[type] || "练习"}
        showBack
        rightAction={
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {current + 1} / {questions.length}
          </span>
        }
      />

      <div className="px-4 pt-4 space-y-4 animate-fade-in">
        {/* Progress */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-nebula-gradient rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Score */}
        <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
          <span>✅ 答对 {score.correct} 题</span>
          {q.knowledgePoint && <span>📌 {q.knowledgePoint}</span>}
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]">
          <div className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase mb-2.5">
            {q.questionType === "CHOICE" ? "选择题" :
             q.questionType === "FILL_BLANK" ? "填空题" :
             q.questionType === "CALCULATION" ? "计算题" : "简答题"}
          </div>
          <MathRenderer content={q.questionText} className="text-sm font-medium leading-relaxed" />
          {q.questionLatex && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 text-center border border-[var(--color-border-light)]">
              <MathRenderer content={q.questionLatex} />
            </div>
          )}
        </div>

        {/* Options (选择题) */}
        {q.questionType === "CHOICE" && q.options && !showResult && (
          <div className="space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setUserAnswer(opt)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                  userAnswer === opt
                    ? "border-nebula-400 bg-nebula-50 text-nebula-800 font-medium"
                    : "border-[var(--color-border)] bg-white hover:bg-gray-50"
                )}
              >
                <MathRenderer content={opt} />
              </button>
            ))}
          </div>
        )}

        {/* Text input */}
        {q.questionType !== "CHOICE" && !showResult && (
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="在这里写出你的答案..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all"
          />
        )}

        {/* Result */}
        {showResult && (
          <div className={cn(
            "rounded-2xl p-5 border",
            isCorrect ? "bg-emerald-50/70 border-emerald-100" : "bg-red-50/70 border-red-100"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{isCorrect ? "✅" : "❌"}</span>
              <span className={cn("font-semibold text-sm", isCorrect ? "text-correct" : "text-wrong")}>
                {isCorrect ? "回答正确！" : "回答错误"}
              </span>
            </div>
            {!isCorrect && (
              <div className="mb-3">
                <span className="text-xs font-medium text-[var(--color-text-tertiary)]">正确答案：</span>
                <MathRenderer content={q.answer} className="text-sm font-semibold text-emerald-800 mt-0.5" />
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-[var(--color-text-tertiary)]">解析：</span>
              <MathRenderer content={q.explanation} className="text-sm text-[var(--color-text-secondary)] mt-0.5 leading-relaxed" />
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-sm transition-all",
              userAnswer.trim()
                ? "bg-nebula-gradient text-white shadow-lg shadow-nebula-500/25 active:scale-[0.98]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            提交答案
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full h-12 rounded-xl bg-nebula-gradient text-white font-semibold text-sm shadow-lg shadow-nebula-500/25 active:scale-[0.98]"
          >
            {current >= questions.length - 1 ? "查看结果 🎯" : "下一题 →"}
          </button>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-3xl">✨</div>
      </div>
    }>
      <PracticeSessionInner />
    </Suspense>
  );
}
