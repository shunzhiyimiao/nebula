export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNotebookHTML, type NotebookPrintData } from "@/lib/print/pdf-generator";

/** POST /api/print/notebook — 生成错题本打印HTML */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId = "demo-user",
      subject,
      masteryLevel,
      dateFrom,
      dateTo,
      questionIds,
      studentName,
    } = body;

    // 构建查询条件
    const where: any = {
      userId,
      isInNotebook: true,
      ...(subject && subject !== "all" ? { subject } : {}),
      ...(masteryLevel && masteryLevel !== "all" ? { masteryLevel } : {}),
      ...(questionIds?.length ? { id: { in: questionIds } } : {}),
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      } : {}),
    };

    const errors = await prisma.question.findMany({
      where,
      include: {
        knowledgePoints: {
          include: { knowledgePoint: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 统计
    const stats = {
      total: errors.length,
      notMastered: errors.filter((e) => e.masteryLevel === "NOT_MASTERED").length,
      partial: errors.filter((e) => e.masteryLevel === "PARTIAL").length,
      mastered: errors.filter((e) => e.masteryLevel === "MASTERED").length,
    };

    // 组装打印数据
    const printData: NotebookPrintData = {
      title: "我的错题本",
      subtitle: subject ? `${subject} 专题` : "全部学科",
      studentName,
      date: new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }),
      errors: errors.map((err, i) => ({
        id: err.id,
        index: i + 1,
        subject: err.subject,
        questionText: err.questionText,
        questionLatex: err.questionLatex || undefined,
        userAnswer: err.userAnswer || undefined,
        correctAnswer: (err.steps as any[])?.slice(-1)?.[0]?.latex || undefined,
        errorReason: err.errorReason || undefined,
        errorType: err.errorType || undefined,
        steps: err.steps as any[] || undefined,
        knowledgePoints: err.knowledgePoints.map((kp) => kp.knowledgePoint.name),
        difficulty: err.difficulty,
      })),
      stats,
    };

    const html = generateNotebookHTML(printData);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Print notebook error:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
