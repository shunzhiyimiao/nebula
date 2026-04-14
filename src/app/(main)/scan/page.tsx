"use client";

import { useRef, useCallback, useState } from "react";
import { useScanContext } from "@/contexts/ScanContext";
import PageHeader from "@/components/layout/PageHeader";
import SolutionStream from "@/components/scan/SolutionStream";
import StepByStep from "@/components/scan/StepByStep";
import KnowledgePopover from "@/components/knowledge/KnowledgePopover";
import MathRenderer from "@/components/scan/MathRenderer";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/question";

const SUBJECTS = [
  { value: "MATH" as Subject, label: "📐 数学" },
  { value: "PHYSICS" as Subject, label: "⚡ 物理" },
  { value: "CHEMISTRY" as Subject, label: "🧪 化学" },
  { value: "ENGLISH" as Subject, label: "🔤 英语" },
  { value: "CHINESE" as Subject, label: "📖 语文" },
  { value: "BIOLOGY" as Subject, label: "🧬 生物" },
];

export default function ScanPage() {
  const {
    stage, setStage,
    imageData, setImageData,
    ocrResult, ocrLoading, ocrError,
    selectedSubject, setSelectedSubject,
    userAnswer, setUserAnswer,
    editedQuestion, setEditedQuestion,
    solver,
    handleOcr,
    handleReset,
  } = useScanContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1280;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);

          // Enhance for handwriting: increase contrast and sharpen
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // Increase contrast (factor 1.4) to make handwritten strokes stand out
          const factor = 1.4;
          const intercept = 128 * (1 - factor);
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
          }
          ctx.putImageData(imageData, 0, 0);

          // Unsharp mask: sharpen text edges
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext("2d")!;
          tempCtx.filter = "blur(1px)";
          tempCtx.drawImage(canvas, 0, 0);
          const blurred = tempCtx.getImageData(0, 0, width, height);
          const sharp = ctx.getImageData(0, 0, width, height);
          const amount = 0.5;
          for (let i = 0; i < sharp.data.length; i += 4) {
            sharp.data[i] = Math.min(255, Math.max(0, sharp.data[i] + amount * (sharp.data[i] - blurred.data[i])));
            sharp.data[i + 1] = Math.min(255, Math.max(0, sharp.data[i + 1] + amount * (sharp.data[i + 1] - blurred.data[i + 1])));
            sharp.data[i + 2] = Math.min(255, Math.max(0, sharp.data[i + 2] + amount * (sharp.data[i + 2] - blurred.data[i + 2])));
          }
          ctx.putImageData(sharp, 0, 0);

          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    compressImage(file).then((compressed) => {
      setImageData(compressed);
      setStage("preview");
    });
  }, [compressImage, setImageData, setStage]);

  const handleSolve = useCallback(async () => {
    const question = editedQuestion || ocrResult?.questionText;
    if (!question) return;
    setStage("solving");

    await solver.solve({
      questionText: question,
      questionLatex: ocrResult?.questionLatex || undefined,
      questionType: ocrResult?.questionType,
      subject: selectedSubject,
      userAnswer: userAnswer || undefined,
      options: ocrResult?.options || undefined,
    });

    setStage("result");
  }, [editedQuestion, ocrResult, selectedSubject, userAnswer, solver, setStage]);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleSaveToNotebook = useCallback(async () => {
    const question = editedQuestion || ocrResult?.questionText;
    if (!question) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/scan/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject,
          questionType: ocrResult?.questionType || "OTHER",
          questionText: question,
          questionLatex: ocrResult?.questionLatex,
          solution: solver.structuredData || {},
          solutionText: solver.streamText,
          steps: solver.structuredData?.steps || [],
          keyFormulas: solver.structuredData?.keyFormulas || [],
          userAnswer: userAnswer || null,
          isCorrect: userAnswer ? false : null,
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
  }, [editedQuestion, ocrResult, selectedSubject, userAnswer, solver]);

  return (
    <div>
      <PageHeader
        title="拍照解题"
        subtitle={
          stage === "upload" ? "拍照或输入题目"
            : stage === "text-input" ? "输入题目文字"
            : stage === "solving" ? "AI 正在解题..."
            : stage === "result" ? "解题完成"
            : "确认题目信息"
        }
        showBack={stage !== "upload"}
        rightAction={stage !== "upload" && stage !== "text-input" ? (
          <button onClick={handleReset} className="text-xs text-nebula-500 font-medium">重新拍照</button>
        ) : undefined}
      />

      <div className="px-4 pt-5 space-y-5 animate-fade-in">

        {/* ===== UPLOAD ===== */}
        {stage === "upload" && (
          <>
            <div className="flex gap-3">
              <button
                onClick={() => { if (cameraInputRef.current) { cameraInputRef.current.value = ""; cameraInputRef.current.click(); } }}
                className="flex-1 rounded-2xl border-2 border-dashed border-nebula-200 bg-white/50 p-6 flex flex-col items-center gap-3 hover:border-nebula-400 hover:bg-nebula-50/40 active:scale-[0.97] transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-nebula-50 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-nebula-500">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">拍照上传</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">拍题目图片识别</p>
                </div>
              </button>

              <button
                onClick={() => { setStage("text-input"); setEditedQuestion(""); }}
                className="flex-1 rounded-2xl border-2 border-dashed border-aurora-200 bg-white/50 p-6 flex flex-col items-center gap-3 hover:border-aurora-400 hover:bg-aurora-50/40 active:scale-[0.97] transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-aurora-50 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-aurora-500">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">直接输入</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">手动输入题目文字</p>
                </div>
              </button>
            </div>

            <button onClick={() => fileInputRef.current?.click()} className="w-full h-11 rounded-xl bg-white border border-[var(--color-border)] font-medium text-sm active:scale-[0.97] transition-all text-[var(--color-text-secondary)]">
              📁 从相册选择
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />

            <div className="bg-nebula-50/50 rounded-2xl p-4 border border-nebula-100/60">
              <h3 className="text-sm font-semibold text-nebula-800 mb-2">📌 拍照技巧</h3>
              <div className="space-y-1.5 text-xs text-nebula-700/80">
                {["保持题目完整不截断", "光线充足避免阴影", "手写题保持字迹清晰", "填写答案可获得错因分析"].map((t) => (
                  <div key={t} className="flex items-start gap-2"><span className="text-nebula-400 mt-0.5">•</span>{t}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ===== TEXT INPUT ===== */}
        {stage === "text-input" && (
          <>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">题目内容</label>
              <textarea
                value={editedQuestion}
                onChange={(e) => setEditedQuestion(e.target.value)}
                placeholder="在这里输入题目..."
                rows={6}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">学科</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button key={s.value} onClick={() => setSelectedSubject(s.value)}
                    className={cn("h-9 px-4 rounded-xl text-sm font-medium border transition-all",
                      selectedSubject === s.value ? "bg-nebula-600 text-white border-nebula-600 shadow-sm" : "bg-white border-[var(--color-border)] hover:border-nebula-300"
                    )}>{s.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">你的答案（可选）</label>
              <textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="输入你写的答案..." rows={2}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all" />
            </div>

            <button
              onClick={async () => {
                if (!editedQuestion.trim()) return;
                setStage("solving");
                await solver.solve({ questionText: editedQuestion, subject: selectedSubject, userAnswer: userAnswer || undefined });
                setStage("result");
              }}
              disabled={!editedQuestion.trim()}
              className={cn("w-full h-12 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                editedQuestion.trim() ? "bg-nebula-gradient text-white shadow-lg shadow-nebula-500/25 active:scale-[0.98]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
              AI 解题
            </button>
          </>
        )}

        {/* ===== PREVIEW / OCR ===== */}
        {(stage === "preview" || stage === "ocr") && imageData && (
          <>
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 border border-[var(--color-border-light)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageData} alt="题目" className="w-full object-contain max-h-64" />
            </div>

            {ocrLoading && (
              <div className="bg-nebula-50 rounded-2xl p-5 border border-nebula-100/60 text-center">
                <div className="animate-pulse-soft text-3xl mb-2">🔍</div>
                <p className="text-sm font-medium text-nebula-800">正在识别题目...</p>
                <p className="text-xs text-nebula-600/70 mt-1">AI正在分析图片中的文字和公式</p>
              </div>
            )}

            {ocrError && (
              <div className="bg-red-50 rounded-2xl p-4 border border-red-100/60">
                <p className="text-sm text-red-700">识别失败: {ocrError}</p>
                <button onClick={handleOcr} className="mt-2 text-sm text-nebula-600 font-medium">重试</button>
              </div>
            )}

            {!ocrLoading && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">题目内容</label>
                    {ocrResult && (
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-md", ocrResult.confidence > 0.8 ? "bg-emerald-50 text-correct" : "bg-amber-50 text-partial")}>
                        置信度 {Math.round(ocrResult.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <textarea
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    placeholder="输入题目内容，或点击下方按钮 AI 识别..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all"
                  />
                  {ocrResult?.questionLatex && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-nebula-50 border border-nebula-100 text-sm">
                      <MathRenderer content={ocrResult.questionLatex} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">学科</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => (
                      <button key={s.value} onClick={() => setSelectedSubject(s.value)}
                        className={cn("h-9 px-4 rounded-xl text-sm font-medium border transition-all",
                          selectedSubject === s.value ? "bg-nebula-600 text-white border-nebula-600 shadow-sm" : "bg-white border-[var(--color-border)] hover:border-nebula-300"
                        )}>{s.label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">你的答案（可选）</label>
                  <textarea value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="输入你写的答案..." rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-nebula-400/40 focus:border-nebula-400 transition-all" />
                </div>

                <div className="flex gap-3">
                  {!ocrResult ? (
                    <button onClick={handleOcr}
                      className="flex-1 h-12 rounded-xl bg-nebula-gradient text-white font-semibold text-sm shadow-lg shadow-nebula-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      🔍 AI 识别图片内容
                    </button>
                  ) : (
                    <button onClick={handleSolve} disabled={!editedQuestion && !ocrResult?.questionText}
                      className={cn("flex-1 h-12 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                        (editedQuestion || ocrResult?.questionText) ? "bg-nebula-gradient text-white shadow-lg shadow-nebula-500/25 active:scale-[0.98]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      )}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                      AI 解题
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ===== SOLVING / RESULT ===== */}
        {(stage === "solving" || stage === "result") && (
          <>
            <div className="bg-gray-50 rounded-xl p-3 border border-[var(--color-border-light)]">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">题目</p>
              <p className="text-sm font-medium line-clamp-3">{editedQuestion || ocrResult?.questionText}</p>
              {userAnswer && <p className="text-xs text-wrong mt-1.5">你的答案: {userAnswer}</p>}
            </div>

            <SolutionStream text={solver.streamText} status={solver.status === "idle" ? "loading" : solver.status} error={solver.error} />

            {solver.status === "done" && solver.structuredData?.steps && (
              <StepByStep steps={solver.structuredData.steps} />
            )}

            {solver.status === "done" && solver.structuredData?.knowledgePoints && solver.structuredData.knowledgePoints.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><span>🃏</span> 涉及知识点</h3>
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
                    saveStatus === "saved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    saveStatus === "error" ? "bg-red-50 text-red-600 border-red-200" :
                    "bg-aurora-50 text-aurora-700 border-aurora-200/60 hover:bg-aurora-100"
                  )}
                >
                  {saveStatus === "saving" ? "保存中..." : saveStatus === "saved" ? "✅ 已保存" : saveStatus === "error" ? "❌ 保存失败" : "📝 加入错题本"}
                </button>
                <button onClick={handleReset} className="flex-1 h-11 rounded-xl bg-nebula-gradient text-white font-medium text-sm shadow-sm flex items-center justify-center gap-1.5">
                  📸 再来一题
                </button>
              </div>
            )}
          </>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
