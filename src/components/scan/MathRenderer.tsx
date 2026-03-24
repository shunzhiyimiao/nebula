"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * 渲染包含 LaTeX 的文本
 * 支持 $...$ 行内公式和 $$...$$ 独立行公式
 *
 * 注意: 需要在 layout.tsx 中引入 KaTeX CSS:
 * <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css" />
 */

interface MathRendererProps {
  content: string;
  className?: string;
}

/** 清洗 LaTeX，修复 AI 常见输出问题 */
function sanitizeLatex(latex: string): string {
  return latex
    // Unicode 上下标 → LaTeX
    .replace(/⁰/g, "^0").replace(/¹/g, "^1").replace(/²/g, "^2")
    .replace(/³/g, "^3").replace(/⁴/g, "^4").replace(/⁵/g, "^5")
    .replace(/⁶/g, "^6").replace(/⁷/g, "^7").replace(/⁸/g, "^8")
    .replace(/⁹/g, "^9").replace(/⁻/g, "^-")
    .replace(/₀/g, "_0").replace(/₁/g, "_1").replace(/₂/g, "_2")
    .replace(/₃/g, "_3").replace(/₄/g, "_4").replace(/₅/g, "_5")
    // Unicode 数学符号 → ASCII/LaTeX
    .replace(/−/g, "-")          // Unicode 减号 U+2212
    .replace(/×/g, "\\times")
    .replace(/÷/g, "\\div")
    .replace(/≤/g, "\\leq").replace(/≥/g, "\\geq")
    .replace(/≠/g, "\\neq").replace(/≈/g, "\\approx")
    .replace(/∞/g, "\\infty").replace(/π/g, "\\pi")
    .replace(/√/g, "\\sqrt")
    // 弯引号 → 直引号
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // 导数符号 f' → f^{\prime}（仅处理字母后的单引号）
    .replace(/([a-zA-Z])'(?![\w])/g, "$1^{\\prime}")
    .replace(/\\\s*\n/g, "\\\\")
    .trim();
}

/** 将 LaTeX 字符串转为 HTML（客户端） */
function renderLatexToHtml(latex: string, displayMode: boolean): string {
  if (typeof window === "undefined") return latex;

  const cleaned = sanitizeLatex(latex);
  try {
    const katex = (window as unknown as { katex?: { renderToString: (s: string, o: object) => string } }).katex;
    if (!katex) return `<code>${cleaned}</code>`;
    const html = katex.renderToString(cleaned, {
      displayMode,
      throwOnError: false,
      trust: true,
    });
    // 如果 KaTeX 输出了错误 span，回退到原始文本（去掉反斜杠命令）
    if (html.includes('color:#cc0000')) {
      const fallback = cleaned.replace(/\\[a-zA-Z]+\{?/g, "").replace(/\}/g, "");
      return `<span class="font-mono text-sm">${fallback}</span>`;
    }
    return html;
  } catch {
    return `<code>${cleaned}</code>`;
  }
}

/** 将混合文本（含 $..$ 和 $$..$$）解析为 HTML */
function parseContent(content: string): string {
  // 先处理 $$ (display mode)
  let result = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
    return `<div class="katex-display">${renderLatexToHtml(latex.trim(), true)}</div>`;
  });

  // 再处理 $ (inline mode)
  result = result.replace(/\$((?!\$)[\s\S]*?)\$/g, (_, latex) => {
    return renderLatexToHtml(latex.trim(), false);
  });

  // 处理 **bold** markdown
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 处理换行
  result = result.replace(/\n/g, "<br />");

  return result;
}

export default function MathRenderer({ content, className }: MathRendererProps) {
  const [katexReady, setKatexReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as unknown as { katex?: unknown }).katex) {
      setKatexReady(true);
      return;
    }
    const timer = setInterval(() => {
      if ((window as unknown as { katex?: unknown }).katex) {
        clearInterval(timer);
        setKatexReady(true);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => parseContent(content), [content, katexReady]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** 纯 LaTeX 渲染（单个公式） */
export function Formula({
  latex,
  display = false,
  className,
}: {
  latex: string;
  display?: boolean;
  className?: string;
}) {
  const [katexReady, setKatexReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as unknown as { katex?: unknown }).katex) {
      setKatexReady(true);
      return;
    }
    const timer = setInterval(() => {
      if ((window as unknown as { katex?: unknown }).katex) {
        clearInterval(timer);
        setKatexReady(true);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(
    () => renderLatexToHtml(latex, display),
    [latex, display, katexReady]
  );

  if (display) {
    return (
      <div
        className={className || "katex-display"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
