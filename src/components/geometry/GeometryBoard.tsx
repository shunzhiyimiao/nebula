"use client";

import { useEffect, useRef } from "react";

interface GeometryBoardProps {
  containerId: string;
  onReady?: (id: string) => void;
}

/** JSXGraph 画布容器，加载 JSXGraph 脚本后回调 */
export default function GeometryBoard({ containerId, onReady }: GeometryBoardProps) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) {
      onReady?.(containerId);
      return;
    }

    // 检查是否已加载
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).JXG) {
      loadedRef.current = true;
      onReady?.(containerId);
      return;
    }

    // 动态加载 JSXGraph CSS + JS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraph.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraphcore.js";
    script.onload = () => {
      loadedRef.current = true;
      onReady?.(containerId);
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove scripts on unmount — they're cached globally
    };
  }, [containerId, onReady]);

  return (
    <div
      id={containerId}
      className="w-full aspect-square rounded-xl overflow-hidden bg-white border border-[var(--color-border-light)]"
      style={{ minHeight: 280 }}
    />
  );
}
