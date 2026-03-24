export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateKnowledgeCard } from "@/lib/ai/knowledge-extractor";

/** GET /api/knowledge/[id] — 获取知识点详情 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const kp = await prisma.knowledgePoint.findUnique({
      where: { id: params.id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, definition: true } },
      },
    });

    if (!kp) {
      return NextResponse.json({ error: "知识点不存在" }, { status: 404 });
    }

    // 获取关联知识点
    let relatedPoints: { id: string; name: string }[] = [];
    if (kp.relatedIds.length > 0) {
      relatedPoints = await prisma.knowledgePoint.findMany({
        where: { id: { in: kp.relatedIds } },
        select: { id: true, name: true },
      });
    }

    // 获取用户相关错题数
    const userId = new URL(request.url).searchParams.get("userId") || "demo-user";
    const errorQuestions = await prisma.question.findMany({
      where: {
        userId,
        isInNotebook: true,
        knowledgePoints: { some: { knowledgePointId: kp.id } },
      },
      select: {
        id: true,
        questionText: true,
        masteryLevel: true,
        errorType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...kp,
        relatedPoints,
        userErrorQuestions: errorQuestions,
        userErrorCount: errorQuestions.length,
      },
    });
  } catch (error) {
    console.error("Knowledge detail error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/** POST /api/knowledge/[id] — AI生成/更新知识卡片内容 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const kp = await prisma.knowledgePoint.findUnique({
      where: { id: params.id },
    });

    if (!kp) {
      return NextResponse.json({ error: "知识点不存在" }, { status: 404 });
    }

    // AI 生成知识卡片内容
    const card = await generateKnowledgeCard(
      kp.name,
      kp.subject as any,
      kp.gradeLevel || undefined
    );

    // 更新数据库
    const updated = await prisma.knowledgePoint.update({
      where: { id: params.id },
      data: {
        definition: card.definition,
        formulas: card.formulas,
        keyPoints: card.keyPoints,
        examples: card.examples,
        commonMistakes: card.commonMistakes,
        // 更新关联知识点（如果有新的）
        relatedIds: card.relatedPoints?.length
          ? await resolveRelatedIds(card.relatedPoints, kp.subject as any)
          : kp.relatedIds,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Knowledge generate error:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}

/** 将关联知识点名称解析为ID */
async function resolveRelatedIds(names: string[], subject: string): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const found = await prisma.knowledgePoint.findFirst({
      where: { name, subject: subject as any },
      select: { id: true },
    });
    if (found) ids.push(found.id);
  }
  return ids;
}

