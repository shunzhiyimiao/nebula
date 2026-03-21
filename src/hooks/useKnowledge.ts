"use client";

import { useState, useCallback } from "react";
import type { KnowledgeCardData } from "@/types/knowledge";

export function useKnowledge() {
  const [loading, setLoading] = useState(false);

  /** 获取知识点详情 */
  const fetchDetail = useCallback(async (id: string): Promise<KnowledgeCardData | null> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge/${id}`);
      const json = await res.json();
      if (!json.success) return null;
      return json.data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** AI生成知识卡片内容 */
  const generateCard = useCallback(async (id: string): Promise<KnowledgeCardData | null> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "POST" });
      const json = await res.json();
      if (!json.success) return null;
      // 再次获取完整详情
      return fetchDetail(id);
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDetail]);

  /** 根据知识点名称获取弹窗数据（用于 KnowledgePopover） */
  const fetchByName = useCallback(async (name: string, subject?: string) => {
    try {
      const params = new URLSearchParams({ name });
      if (subject) params.set("subject", subject);
      const res = await fetch(`/api/knowledge?${params}`);
      const json = await res.json();
      if (!json.success || !json.data?.[0]) return null;

      const kp = json.data[0];
      return {
        definition: kp.definition || "暂无定义",
        formulas: kp.formulas as string[] | undefined,
        keyPoints: kp.keyPoints as string[] | undefined,
        commonMistakes: kp.commonMistakes as string[] | undefined,
        relatedPoints: kp.relatedPoints as string[] | undefined,
      };
    } catch {
      return null;
    }
  }, []);

  return { loading, fetchDetail, generateCard, fetchByName };
}
