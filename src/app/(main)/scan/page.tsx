"use client";

import { useRef, useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useScanContext } from "@/contexts/ScanContext";
import PageHeader from "@/components/layout/PageHeader";
import SolutionStream from "@/components/scan/SolutionStream";
import StepByStep from "@/components/scan/StepByStep";
import KnowledgePopover from "@/components/knowledge/KnowledgePopover";
import MathRenderer from "@/components/scan/MathRenderer";
import { cn } from "@/lib/utils";
import { compressAndEnhanceImage } from "@/lib/image-capture";

const GeometryPlayer = lazy(() => import("@/components/geometry/GeometryPlayer"));

const SUBJECT_LABEL: Record<string, string> = {
  MATH: "数学", PHYSICS: "物理", CHEMISTRY: "化学",
  ENGLISH: "英语", CHINESE: "语文", BIOLOGY: "生物",
  HISTORY: "历史", GEOGRAPHY: "地理", POLITICS: "政治",
};

export default function ScanPage() {
  const {
    stage, imageData,
    ocrResult, ocrLoading, ocrError,
    solver, geometrySolution,
    captureImage, retryOcr, startSolve, handleReset,
  } = useScanContext();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [grade, setGrade] = useState<string | undefined>();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) return;
        const text = await res.text();
        if (!text) return;
        const d = JSON.parse(text);
        if (d.data?.grade) setGrade(d.data.grade);
      } catch {
        // 静默失败 — grade 只是可选辅助信息
      }
    })();
  }, []);

  const handleReshoot = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    }
  }, []);

  const handlePhotoTaken = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await compressAndEnhanceImage(file);
      captureImage(dataUrl);
    } catch (err) {
      alert((err as Error).message);
    }
  }, [captureImage]);

  const handleStartSolve = useCallback(() => {
    startSolve(grade);
  }, [startSolve, grade]);

  const handleSaveToNotebook = useCallback(async () => {
    if (!ocrResult) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/scan/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ocrResult.subject,
          questionType: ocrResult.questionType || "OTHER",
          questionText: ocrResult.questionText,
          questionLatex: ocrResult.questionLatex,
          solution: solver.structuredData || {},
          solutionText: solver.streamText,
          steps: solver.structuredData?.steps || [],
          keyFormulas: solver.structuredData?.keyFormulas || [],
          userAnswer: null,
          isCorrect: null,
          errorReason: solver.structuredData?.errorAnalysis?.reason || null,
          errorType: solver.structuredData?.errorAnalysis?.errorType || null,
          difficulty: solver.structuredData?.difficulty || "MEDIUM",
          knowledgePoints: solver.structuredData?.knowledgePoints || [],
          isInNotebook: true,
        }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 2500);
      }
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }, [ocrResult, solver]);

  const cameraInputEl = (
    <input
      ref={cameraInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={handlePhotoTaken}
    />
  );

  // 空状态：还没拍照（用户从底部 nav 直接进来但未从首页拍过）
  if (stage === "empty" || !imageData) {
    return (
      <div>
        <PageHeader title="拍照解题" showBack />
        {cameraInputEl}
        <div className="px-4 pt-16 pb-8 flex flex-col items-center text-center gap-5 animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-nebula-50 flex items-center justify-center text-5xl">
            📸
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">开始拍题</h2>
            <p className="text-sm text-[var(--color-text-tertiary)]">对准题目，一键识别解答</p>
          </div>
          <button
            onClick={handleReshoot}
            className="w-full max-w-xs h-12 rounded-2xl bg-nebula-gradient text-white font-semibold shadow-lg shadow-nebula-500/25 active:scale-[0.98] transition-transform"
          >
            📷 立即拍照
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="拍照解题"
        subtitle={
          stage === "ocr" ? (ocrError ? "识别失败" : "AI 正在识别...")
            : stage === "confirm" ? "确认识别结果"
            : stage === "solving" ? "AI 正在解题..."
            : "解题完成"
        }
        showBack
        rightAction={
          stage !== "solving" ? (
            <button onClick={handleReset} className="text-xs text-nebula-500 font-medium">取消</button>
          ) : undefined
        }
      />
      {cameraInputEl}

      <div className="px-4 pt-4 pb-8 space-y-4 animate-fade-in">
        {/* 图片预览（始终显示） */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-100 border border-[var(--color-border-light)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageData} alt="题目" className="w-full object-contain max-h-56" />
        </div>

        {/* OCR 加载 */}
        {stage === "ocr" && ocrLoading && (
          <div className="bg-nebula-50 rounded-2xl p-5 border border-nebula-100/60 text-center">
            <div className="animate-pulse-soft text-3xl mb-2">🔍</div>
            <p className="text-sm font-medium text-nebula-800">正在识别题目...</p>
            <p className="text-xs text-nebula-600/70 mt-1">AI 分析图片中的文字和公式</p>
          </div>
        )}

        {/* OCR 失败 */}
        {stage === "ocr" && !ocrLoading && ocrError && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100/60 space-y-3">
            <p className="text-sm text-red-700">识别失败：{ocrError}</p>
            <div className="flex gap-2">
              <button onClick={retryOcr} className="flex-1 h-10 rounded-lg bg-white border border-[var(--color-border)] text-sm font-medium">
                重试识别
              </button>
              <button onClick={handleReshoot} className="flex-1 h-10 rounded-lg bg-nebula-gradient text-white text-sm font-medium">
                重新拍照
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM：识别完成，等待用户确认 */}
        {stage === "confirm" && ocrResult && (
          <>
            <div className="bg-white rounded-2xl p-4 border border-[var(--color-border-light)] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-tertiary)]">识别结果</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-nebula-50 text-nebula-600 font-medium">
                    {SUBJECT_LABEL[ocrResult.subject] || "自动"}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md",
                  ocrResult.confidence > 0.8 ? "bg-emerald-50 text-correct"
                    : ocrResult.confidence > 0.5 ? "bg-amber-50 text-partial"
                    : "bg-red-50 text-wrong"
                )}>
                  置信度 {Math.round(ocrResult.confidence * 100)}%
                </span>
              </div>
              {ocrResult.questionLatex ? (
                <div className="text-sm leading-relaxed">
                  <MathRenderer content={ocrResult.questionLatex} />
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{ocrResult.questionText}</p>
              )}
              {ocrResult.options && ocrResult.options.length > 0 && (
                <div className="space-y-0.5 pt-1 border-t border-gray-50">
                  {ocrResult.options.map((opt) => (
                    <p key={opt} className="text-sm text-gray-700">{opt}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={handleReshoot}
                className="h-12 px-5 rounded-xl bg-white border border-[var(--color-border)] font-medium text-sm active:scale-[0.97] transition-transform"
              >
                📷 重拍
              </button>
              <button
                onClick={handleStartSolve}
                className="flex-1 h-12 rounded-xl bg-nebula-gradient text-white font-semibold text-sm shadow-lg shadow-nebula-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                开始解题
              </button>
            </div>
          </>
        )}

        {/* SOLVING / RESULT */}
        {(stage === "solving" || stage === "result") && ocrResult && (
          <>
            <div className="bg-gray-50 rounded-xl p-3 border border-[var(--color-border-light)]">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">
                题目 · {SUBJECT_LABEL[ocrResult.subject] || ocrResult.subject}
              </p>
              <p className="text-sm font-medium line-clamp-3">{ocrResult.questionText}</p>
            </div>

            {/* 几何题动画 */}
            {solver.status === "done" && geometrySolution && (
              <Suspense fallback={<div className="text-center py-8 text-sm text-gray-400">加载几何引擎...</div>}>
                <GeometryPlayer solution={geometrySolution} />
              </Suspense>
            )}

            {/* 非几何题流式解答 */}
            {!geometrySolution && (
              <SolutionStream
                text={solver.streamText}
                status={solver.status === "idle" ? "loading" : solver.status}
                error={solver.error}
              />
            )}

            {!geometrySolution && solver.status === "done" && solver.structuredData?.steps && (
              <StepByStep steps={solver.structuredData.steps} />
            )}

            {solver.status === "done" && solver.structuredData?.knowledgePoints && solver.structuredData.knowledgePoints.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span>🃏</span> 涉及知识点
                </h3>
                <div className="flex flex-wrap gap-2">
                  {solver.structuredData.knowledgePoints.map((kp) => (
                    <KnowledgePopover key={kp.name} name={kp.name} isMain={kp.isMain} />
                  ))}
                </div>
              </div>
            )}

            {solver.status === "done" && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveToNotebook}
                  disabled={saveStatus === "saving" || saveStatus === "saved"}
                  className={cn(
                    "flex-1 h-11 rounded-xl font-medium text-sm border transition-all flex items-center justify-center gap-1.5",
                    saveStatus === "saved" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : saveStatus === "error" ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-aurora-50 text-aurora-700 border-aurora-200/60 hover:bg-aurora-100"
                  )}
                >
                  {saveStatus === "saving" ? "保存中..."
                    : saveStatus === "saved" ? "✅ 已保存"
                    : saveStatus === "error" ? "❌ 保存失败"
                    : "📝 加入错题本"}
                </button>
                <button
                  onClick={handleReshoot}
                  className="flex-1 h-11 rounded-xl bg-nebula-gradient text-white font-medium text-sm shadow-sm flex items-center justify-center gap-1.5"
                >
                  📸 再来一题
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
