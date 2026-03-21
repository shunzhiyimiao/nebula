"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Formula } from "@/components/scan/MathRenderer";

interface KnowledgePopoverProps {
  name: string;
  isMain?: boolean;
  /** 如果已有数据直接传入，否则点击时触发加载 */
  data?: {
    definition: string;
    formulas?: string[];
    keyPoints?: string[];
    commonMistakes?: string[];
    relatedPoints?: string[];
  };
  onLoadData?: (name: string) => Promise<KnowledgePopoverProps["data"]>;
}

export default function KnowledgePopover({
  name,
  isMain,
  data: initialData,
  onLoadData,
}: KnowledgePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setIsOpen(!isOpen);

    // 如果没有数据且有加载函数，尝试加载
    if (!data && onLoadData && !loading) {
      setLoading(true);
      try {
        const result = await onLoadData(name);
        if (result) setData(result);
      } catch {
        // 加载失败
      }
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tag */}
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-all",
          isMain
            ? "bg-nebula-100 text-nebula-700 hover:bg-nebula-200"
            : "bg-gray-100 text-[var(--color-text-secondary)] hover:bg-gray-200"
        )}
      >
        <span className="text-[10px]">📘</span>
        {name}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[var(--color-border-light)] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📘</span>
                <h2 className="font-semibold text-base">{name}</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-5">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse-soft text-3xl mb-3">📘</div>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    正在生成知识卡片...
                  </p>
                </div>
              ) : data ? (
                <>
                  {/* Definition */}
                  <section>
                    <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-2">
                      定义
                    </h3>
                    <p className="text-sm leading-relaxed">{data.definition}</p>
                  </section>

                  {/* Formulas */}
                  {data.formulas && data.formulas.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-2">
                        核心公式
                      </h3>
                      <div className="space-y-2 bg-nebula-50/50 rounded-xl p-3 border border-nebula-100/60">
                        {data.formulas.map((f, i) => (
                          <Formula key={i} latex={f} display className="text-center" />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Key Points */}
                  {data.keyPoints && data.keyPoints.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-2">
                        重点
                      </h3>
                      <div className="space-y-1.5">
                        {data.keyPoints.map((p, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-nebula-400 mt-0.5 flex-shrink-0">•</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Common Mistakes */}
                  {data.commonMistakes && data.commonMistakes.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-wrong/80 uppercase mb-2">
                        ⚠️ 常见错误
                      </h3>
                      <div className="space-y-1.5 bg-red-50/50 rounded-xl p-3 border border-red-100/60">
                        {data.commonMistakes.map((m, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-red-700/80">
                            <span className="text-wrong/50 mt-0.5 flex-shrink-0">•</span>
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Related */}
                  {data.relatedPoints && data.relatedPoints.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-2">
                        关联知识点
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {data.relatedPoints.map((rp) => (
                          <span
                            key={rp}
                            className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-[var(--color-text-secondary)]"
                          >
                            {rp}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    暂无详细数据，点击下方按钮生成
                  </p>
                  <button
                    onClick={() => onLoadData?.(name)}
                    className="mt-3 h-9 px-5 rounded-xl bg-nebula-gradient text-white text-sm font-medium"
                  >
                    AI 生成知识卡片
                  </button>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-[var(--color-border-light)] px-5 py-3 flex gap-2">
              <button className="flex-1 h-10 rounded-xl bg-nebula-50 text-nebula-600 text-sm font-medium hover:bg-nebula-100 transition-colors">
                查看相关错题
              </button>
              <button className="flex-1 h-10 rounded-xl bg-nebula-gradient text-white text-sm font-medium shadow-sm">
                专项练习
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
