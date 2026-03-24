export const dynamic = "force-dynamic";
import { isDatabaseAvailable } from "@/lib/db-available";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/knowledge/graph — 知识图谱数据 */
export async function GET(request: NextRequest) {
  if (!isDatabaseAvailable()) return NextResponse.json({ data: [], success: true });
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const userId = searchParams.get("userId") || "demo-user";

  try {
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: subject ? { subject: subject as any } : {},
      include: {
        questions: {
          where: { question: { userId } },
          select: {
            question: {
              select: { isInNotebook: true, isCorrect: true },
            },
          },
        },
      },
    });

    // 构建节点
    const nodes = knowledgePoints.map((kp) => {
      const total = kp.questions.length;
      const errors = kp.questions.filter((q) => q.question.isInNotebook).length;
      const correct = kp.questions.filter((q) => q.question.isCorrect === true).length;
      const mastery = total > 0 ? Math.round((correct / total) * 100) : 50;

      return {
        id: kp.id,
        name: kp.name,
        subject: kp.subject,
        chapter: kp.chapter,
        mastery,
        errorCount: errors,
        totalCount: total,
        // 节点大小基于接触次数
        size: Math.max(20, Math.min(60, 20 + total * 5)),
      };
    });

    // 构建边
    const edges: { source: string; target: string; type: "parent" | "related" }[] = [];

    for (const kp of knowledgePoints) {
      // 父子关系
      if (kp.parentId) {
        edges.push({ source: kp.parentId, target: kp.id, type: "parent" });
      }
      // 关联关系
      for (const relId of kp.relatedIds) {
        // 避免重复边
        if (!edges.some((e) => (e.source === kp.id && e.target === relId) || (e.source === relId && e.target === kp.id))) {
          edges.push({ source: kp.id, target: relId, type: "related" });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { nodes, edges },
    });
  } catch (error) {
    console.error("Knowledge graph error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
