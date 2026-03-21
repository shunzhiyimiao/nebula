"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface PrintPreviewProps {
  html: string | null;
  loading: boolean;
  onClose: () => void;
  className?: string;
}

export default function PrintPreview({ html, loading, onClose, className }: PrintPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.5);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownload = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nebula-print.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-[var(--color-border-light)] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span className="text-sm font-semibold">打印预览</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setScale(Math.max(0.3, scale - 0.1))} className="w-7 h-7 rounded-md hover:bg-white text-xs font-bold flex items-center justify-center">−</button>
            <span className="text-[10px] w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(Math.min(1, scale + 0.1))} className="w-7 h-7 rounded-md hover:bg-white text-xs font-bold flex items-center justify-center">+</button>
          </div>

          <button
            onClick={handleDownload}
            className="h-8 px-4 rounded-lg bg-white border border-[var(--color-border)] text-xs font-medium flex items-center gap-1.5"
          >
            💾 下载HTML
          </button>
          <button
            onClick={handlePrint}
            className="h-8 px-4 rounded-lg bg-nebula-gradient text-white text-xs font-medium shadow-sm flex items-center gap-1.5"
          >
            🖨️ 打印/导出PDF
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-gray-200 p-6 flex justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="animate-pulse-soft text-4xl">🖨️</div>
            <p className="text-sm text-white/80">正在生成打印内容...</p>
          </div>
        ) : html ? (
          <div
            className="bg-white shadow-2xl rounded-lg overflow-hidden origin-top"
            style={{
              transform: `scale(${scale})`,
              width: "210mm",
              minHeight: "297mm",
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={html}
              className="w-full border-0"
              style={{ minHeight: "297mm", height: "auto" }}
              onLoad={() => {
                // 自适应iframe高度
                if (iframeRef.current?.contentDocument) {
                  const h = iframeRef.current.contentDocument.body.scrollHeight;
                  iframeRef.current.style.height = `${h}px`;
                }
              }}
            />
          </div>
        ) : (
          <div className="text-sm text-white/60">暂无预览内容</div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="bg-white border-t px-4 py-2 text-center text-[10px] text-[var(--color-text-tertiary)] flex-shrink-0">
        提示：点击「打印/导出PDF」后，在打印对话框中选择「另存为PDF」即可导出PDF文件
      </div>
    </div>
  );
}
