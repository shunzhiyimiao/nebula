export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePracticeQuestions } from "@/lib/ai/practice-generator";
import type { Subject } from "@prisma/client";

/**
 * GET /api/practice/generate
 *
 * 参数：
 *   type    - "daily" | "review" | "targeted"
 *   kp      - 知识点名称（targeted 模式）
 *   count   - 题目数量（默认 5，最多 20）
 *   subject - 学科（可选，默认取用户第一个学科）
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "daily") as "daily" | "review" | "targeted";
  const kp = searchParams.get("kp") || "";
  const count = Math.min(parseInt(searchParams.get("count") || "5"), 20);
  const subjectParam = searchParams.get("subject");
  const userId = session.user.id;

  try {
    // 获取用户年级和学科
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { grade: true, subjects: true },
    });

    const subject: Subject =
      (subjectParam as Subject) ||
      (user?.subjects?.[0]) ||
      "MATH";

    // 获取用户错题（薄弱点上下文）
    const notebookQuestions = await prisma.question.findMany({
      where: { userId, isInNotebook: true, subject },
      include: {
        knowledgePoints: {
          include: { knowledgePoint: { select: { name: true } } },
        },
      },
      orderBy: [
        { masteryLevel: "asc" },  // 未掌握的优先
        { reviewCount: "asc" },
      ],
      take: 30,
    });

    // 提取薄弱知识点（去重，按出现次数排序）
    const kpCountMap = new Map<string, number>();
    for (const q of notebookQuestions) {
      for (const qkp of q.knowledgePoints) {
        const name = qkp.knowledgePoint.name;
        kpCountMap.set(name, (kpCountMap.get(name) || 0) + 1);
      }
    }
    const weakPoints = Array.from(kpCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);

    // review 模式：提供错题题目文本作为上下文
    const errorSamples =
      type === "review"
        ? notebookQuestions.slice(0, 5).map((q) => q.questionText)
        : [];

    // 调用 AI 生成题目
    const questions = await generatePracticeQuestions({
      type,
      grade: user?.grade,
      subject,
      count,
      targetKnowledgePoint: kp || undefined,
      weakPoints: type === "daily" ? weakPoints.slice(0, 4) : weakPoints,
      errorSamples,
    });

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    console.error("Practice generate error:", error);
    return NextResponse.json(
      { error: error?.message || "生成失败，请重试" },
      { status: 500 }
    );
  }
}
