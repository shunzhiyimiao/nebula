"use client";

import { useState, useCallback } from "react";

export function useNotebook() {
  const [loading, setLoading] = useState(false);

  /** 更新掌握状态 */
  const updateMastery = useCallback(async (id: string, masteryLevel: string) => {
    try {
      const res = await fetch(`/api/notebook/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masteryLevel }),
      });
      return (await res.json()).success;
    } catch {
      return false;
    }
  }, []);

  /** 记录一次复习 */
  const recordReview = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notebook/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementReview: true }),
      });
      return (await res.json()).success;
    } catch {
      return false;
    }
  }, []);

  /** AI 重新讲解 */
  const reExplain = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notebook/${id}`, { method: "POST" });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** 从错题本移除 */
  const removeFromNotebook = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notebook/${id}`, { method: "DELETE" });
      return (await res.json()).success;
    } catch {
      return false;
    }
  }, []);

  return { loading, updateMastery, recordReview, reExplain, removeFromNotebook };
}
