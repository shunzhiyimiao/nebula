export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { solveQuestion, type SolveRequest } from "@/lib/ai/solver";

/** GET /api/notebook/[id] — 错题详情 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        knowledgePoints: {
          include: { knowledgePoint: true },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "错题不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error("Notebook detail error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/** PATCH /api/notebook/[id] — 更新掌握状态/复习计数 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { masteryLevel, reviewCount, nextReviewAt } = body;

    const data: any = {};
    if (masteryLevel) data.masteryLevel = masteryLevel;
    if (reviewCount !== undefined) data.reviewCount = reviewCount;
    if (nextReviewAt) data.nextReviewAt = new Date(nextReviewAt);

    // 如果标记为已掌握，清除复习时间
    if (masteryLevel === "MASTERED") {
      data.nextReviewAt = null;
    }

    // 复习计数自增
    if (body.incrementReview) {
      data.reviewCount = { increment: 1 };
      // 根据SM-2算法设置下次复习时间
      const current = await prisma.question.findUnique({
        where: { id: params.id },
        select: { reviewCount: true },
      });
      const count = (current?.reviewCount || 0) + 1;
      const intervals = [1, 3, 7, 15, 30, 60]; // 天数
      const nextDay = intervals[Math.min(count - 1, intervals.length - 1)];
      data.nextReviewAt = new Date(Date.now() + nextDay * 86400000);
    }

    const updated = await prisma.question.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Notebook update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

/** POST /api/notebook/[id] — AI重新讲解错题 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
    });

    if (!question) {
      return NextResponse.json({ error: "错题不存在" }, { status: 404 });
    }

    const result = await solveQuestion({
      questionText: question.questionText,
      questionLatex: question.questionLatex || undefined,
      questionType: question.questionType,
      subject: question.subject as any,
      userAnswer: question.userAnswer || undefined,
    } as SolveRequest);

    // 更新数据库
    if (result.structured) {
      await prisma.question.update({
        where: { id: params.id },
        data: {
          solution: result.structured as any,
          solutionText: result.text,
          steps: (result.structured as any).steps || question.steps,
          errorReason: (result.structured as any).errorAnalysis?.reason || question.errorReason,
          errorType: (result.structured as any).errorAnalysis?.errorType || question.errorType,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { text: result.text, structured: result.structured },
    });
  } catch (error) {
    console.error("Re-explain error:", error);
    return NextResponse.json({ error: "讲解失败" }, { status: 500 });
  }
}

/** DELETE /api/notebook/[id] — 从错题本移除 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.question.update({
      where: { id: params.id },
      data: {
        isInNotebook: false,
        masteryLevel: "MASTERED",
        nextReviewAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notebook remove error:", error);
    return NextResponse.json({ error: "移除失败" }, { status: 500 });
  }
}

export function generateStaticParams() { return [{ id: "_" }]; }
